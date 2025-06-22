import { Component, ElementRef, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { GraphNode } from '../../models/graph-node.model';
import { GraphEdge } from '../../models/graph-edge.model';
import { GraphStateService } from '../../services/graph-state.service';
import { ModeManagerService } from '../../services/mode-manager.service';
import { PinLayoutService } from '../../services/pin-layout.service';
import { GraphMode } from '../../interfaces/graph-mode.interface';
import { NormalMode } from '../../modes/normal.mode';
import { PinEditMode } from '../../modes/pin-edit.mode';
import { ConnectionMode } from '../../modes/connection.mode';

interface AvailableNode {
  type: string;
  label: string;
  width: number;
  height: number;
}

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

@Component({
  selector: 'app-graph-editor',
  standalone: false,
  templateUrl: './graph-editor.component.html',
  styleUrl: './graph-editor.component.scss'
})
export class GraphEditorComponent implements OnInit, OnDestroy {
  @ViewChild('svgCanvas', { static: true }) svgCanvas!: ElementRef<SVGElement>;

  // Expose the nodes and edges observables directly to the template
  nodes$!: Observable<GraphNode[]>;
  edges$!: Observable<GraphEdge[]>;

  // Keep a local copy of nodes and edges for imperative operations
  private currentNodes: GraphNode[] = [];
  private currentEdges: GraphEdge[] = [];
  private nodesSubscription?: Subscription;
  private edgesSubscription?: Subscription;

  availableNodes: AvailableNode[] = [
    { type: 'power', label: '9V Battery', width: 80, height: 60 },
    { type: 'resistor', label: 'Resistor', width: 60, height: 20 },
    { type: 'capacitor', label: 'Capacitor', width: 40, height: 40 },
    { type: 'led', label: 'LED', width: 30, height: 20 },
    { type: 'switch', label: 'Switch', width: 50, height: 30 },
    { type: 'ic', label: 'IC Chip', width: 80, height: 60 },
    { type: 'node', label: 'Generic Node', width: 60, height: 40 }
  ];

  selectedNodes = new Set<string>();
  dragging = false;
  dragOffset = { x: 0, y: 0 };
  selectionBox: SelectionBox | null = null;
  isCtrlPressed = false;
  initialPositions: { [key: string]: { x: number, y: number } } = {};
  
  // Connection creation state
  connectingFrom: { nodeId: string; pinName: string } | null = null;
  
  // Mode system
  currentMode: GraphMode | null = null;
  availableModes: GraphMode[] = [];
  private modeSubscription?: Subscription;
  
  // Pin dialog state
  showPinDialog = false;
  selectedSideForPin = '';
  pendingPinNode: GraphNode | null = null;
  
  // Bulk pin dialog state
  showBulkPinDialog = false;
  selectedSideForBulkPin = '';
  pendingBulkPinNode: GraphNode | null = null;

  Math = Math;

  constructor(
    private graphState: GraphStateService,
    private modeManager: ModeManagerService,
    private pinLayoutService: PinLayoutService
  ) {}

  ngOnInit(): void {
    // Assign the observables for use with the async pipe in the template
    this.nodes$ = this.graphState.nodes$;
    this.edges$ = this.graphState.edges$;

    // Subscribe to keep local copies for imperative operations
    this.nodesSubscription = this.nodes$.subscribe(nodes => {
      this.currentNodes = nodes;
    });
    
    this.edgesSubscription = this.edges$.subscribe(edges => {
      this.currentEdges = edges;
    });
    
    // Initialize mode system
    this.initializeModes();
  }

  ngOnDestroy(): void {
    this.nodesSubscription?.unsubscribe();
    this.edgesSubscription?.unsubscribe();
    this.modeSubscription?.unsubscribe();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // First, let the mode handle the event
    if (this.modeManager.handleKeyDown(event)) {
      // Handle mode-specific shortcuts
      if (event.key === 'p' || event.key === 'P') {
        this.switchMode('pin-edit');
        event.preventDefault();
        return;
      }
      if (event.key === 'Escape') {
        this.switchMode('normal');
        event.preventDefault();
        return;
      }
    }
    
    // Handle global shortcuts
    if (event.key === 'Control' || event.key === 'Meta') {
      this.isCtrlPressed = true;
    }
    if (event.key === 'Delete' && this.selectedNodes.size > 0) {
      this.deleteSelectedNodes();
    }
  }
    
  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control' || event.key === 'Meta') {
      this.isCtrlPressed = false;
    }
  }

  addNode(type: string): void {
    const template = this.availableNodes.find(c => c.type === type);
    if (!template) return;

    const newId = `${type}_${Date.now()}`;
    const newNode: GraphNode = {
      id: newId,
      type: type,
      x: 50 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      width: template.width,
      height: template.height,
      label: template.label
    };

    this.graphState.addNode(newNode);
  }

  clearConnections(): void {
    // Clear all edges
    const currentEdges = this.graphState.getEdges();
    currentEdges.forEach(edge => {
      if (edge.id) {
        this.graphState.removeEdge(edge.id);
      }
    });
  }

  deleteSelectedNodes(): void {
    this.graphState.deleteNodes(Array.from(this.selectedNodes));
    this.selectedNodes.clear();
  }

  onSvgMouseDown(event: MouseEvent): void {
    // Delegate all svg mousedown events to modeManager.handleCanvasClick
    if (this.modeManager.handleCanvasClick(event)) {
      return; // Mode handled the event
    }
    
    // Default logic
    if (event.target === this.svgCanvas.nativeElement || 
        (event.target as Element).id === 'grid-rect') {
      this.handleCanvasMouseDown(event);
    }
  }

  onNodeMouseDown(event: MouseEvent, nodeId: string): void {
    event.stopPropagation();
    const node = this.currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    // Pin-edit mode: first select, then handle edge click on same event
    if (this.currentMode?.name === 'pin-edit') {
      this.modeManager.handleNodeClick(node, event); // select node
      if (this.modeManager.handleCanvasClick(event)) {
        return; // dialog opened
      }
      return; // prevent dragging in pin-edit
    }

    // Normal and other modes: handle canvas clicks first (e.g. pin mid-clicks)
    if (this.modeManager.handleCanvasClick(event)) {
      return;
    }

    // Let modes handle node click (selection in other modes)
    if (this.modeManager.handleNodeClick(node, event)) {
      return;
    }

    const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    if (this.isCtrlPressed) {
      // Toggle selection with Ctrl
      if (this.selectedNodes.has(nodeId)) {
        this.selectedNodes.delete(nodeId);
      } else {
        this.selectedNodes.add(nodeId);
      }
    } else {
      // Regular click - select only this node or start dragging
      if (!this.selectedNodes.has(nodeId)) {
        this.selectedNodes.clear();
        this.selectedNodes.add(nodeId);
      }
      
      // Start dragging
      this.dragging = true;
      
      // Store initial positions of all selected nodes
      this.initialPositions = {};
      this.currentNodes.forEach(n => {
        if (this.selectedNodes.has(n.id)) {
          this.initialPositions[n.id] = { x: n.x, y: n.y };
        }
      });
      
      this.dragOffset = {
        x: mouseX - node.x,
        y: mouseY - node.y
      };
    }
  }

  onMouseMove(event: MouseEvent): void {
    // Let the mode handle mouse move first
    if (this.modeManager.handleMouseMove(event)) {
      // Mode handled the event, trigger overlay re-render
      if (this.svgCanvas?.nativeElement) {
        this.modeManager.renderActiveOverlay(this.svgCanvas.nativeElement);
      }
      return;
    }
    
    const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    if (this.selectionBox) {
      // Update selection box
      this.selectionBox.endX = mouseX;
      this.selectionBox.endY = mouseY;

      // Update selected nodes based on selection box
      this.selectedNodes = new Set<string>();
      this.currentNodes.forEach(node => {
        if (this.isNodeInSelectionBox(node, this.selectionBox!)) {
          this.selectedNodes.add(node.id);
        }
      });
    } else if (this.dragging && this.selectedNodes.size > 0) {
      // Move all selected nodes
      const deltaX = mouseX - this.dragOffset.x;
      const deltaY = mouseY - this.dragOffset.y;

      // Get the first selected node as reference
      const firstSelectedId = Array.from(this.selectedNodes)[0];
      const initialFirst = this.initialPositions[firstSelectedId];

      if (initialFirst) {
        const offsetX = deltaX - initialFirst.x;
        const offsetY = deltaY - initialFirst.y;

        // Create updates map for the service
        const updates = new Map<string, { x: number; y: number }>();
        this.selectedNodes.forEach(nodeId => {
          const initial = this.initialPositions[nodeId];
          if (initial) {
            updates.set(nodeId, {
              x: Math.max(0, initial.x + offsetX),
              y: Math.max(0, initial.y + offsetY)
            });
          }
        });
        this.graphState.updateNodePositions(updates);
      }
    }
  }

  onMouseUp(event?: MouseEvent): void {
    this.dragging = false;
    this.selectionBox = null;
    this.initialPositions = {};
  }

  private handleCanvasMouseDown(event: MouseEvent): void {
    // Let the mode handle canvas clicks first
    if (this.modeManager.handleCanvasClick(event)) {
      return; // Mode handled the event
    }
    
    const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    if (this.isCtrlPressed) {
      // Start selection box
      this.selectionBox = {
        startX: mouseX,
        startY: mouseY,
        endX: mouseX,
        endY: mouseY
      };
    } else {
      // Click on empty space without Ctrl - clear selection
      this.selectedNodes.clear();
    }
  }
  
  // Mode management methods
  private initializeModes(): void {
    // Create and register modes
    const normalMode = new NormalMode(this.graphState);
    const pinEditMode = new PinEditMode(this.graphState);
    const connectionMode = new ConnectionMode(this.graphState);
    
    // Set component reference for pin edit mode
    pinEditMode.setComponentRef(this);
    connectionMode.setComponentRef(this);
    
    this.modeManager.registerMode(normalMode);
    this.modeManager.registerMode(pinEditMode);
    this.modeManager.registerMode(connectionMode);
    
    this.availableModes = this.modeManager.getAvailableModes();
    
    // Subscribe to mode changes
    this.modeSubscription = this.modeManager.activeMode$.subscribe(mode => {
      this.currentMode = mode;
      // Remove pin-edit overlays when exiting pin-edit mode
      if (mode?.name !== 'pin-edit') {
        this.clearOverlay();
      }
      // Update cursor based on mode
      if (this.svgCanvas?.nativeElement) {
        this.svgCanvas.nativeElement.style.cursor = this.modeManager.getActiveCursor();
      }
    });
    
    // Activate normal mode by default
    this.modeManager.activateMode('normal');
  }
  
  private clearOverlay(): void {
    const canvas = this.svgCanvas.nativeElement;
    const overlays = canvas.querySelectorAll('.pin-edit-overlay');
    overlays.forEach(el => el.remove());
  }

  switchMode(modeName: string): void {
    this.modeManager.activateMode(modeName);
    // Remove pin-edit overlays when exiting pin-edit mode
    if (modeName !== 'pin-edit') {
      this.clearOverlay();
    }
  }
  
  // Pin dialog methods
  showPinCreationDialog(node: GraphNode, side: string): void {
    this.pendingPinNode = node;
    this.selectedSideForPin = side;
    this.showPinDialog = true;
  }
  
  onPinCreated(pinName: string): void {
    if (this.pendingPinNode && this.selectedSideForPin) {
      this.createPinOnSide(this.pendingPinNode, this.selectedSideForPin, pinName);
    }
    this.showPinDialog = false;
    this.pendingPinNode = null;
    this.selectedSideForPin = '';
  }
  
  onPinDialogCancelled(): void {
    this.showPinDialog = false;
    this.pendingPinNode = null;
    this.selectedSideForPin = '';
  }

  // Bulk pin dialog methods
  openBulkPinDialog(node: GraphNode, side: string): void {
    this.pendingBulkPinNode = node;
    this.selectedSideForBulkPin = side;
    this.showBulkPinDialog = true;
  }

  onBulkPinsCreated(data: { pinNames: string[]; options: { autoDistribute: boolean; snapToGrid: boolean } }): void {
    if (this.pendingBulkPinNode && this.selectedSideForBulkPin) {
      this.createBulkPinsOnSide(
        this.pendingBulkPinNode, 
        this.selectedSideForBulkPin as 'top' | 'right' | 'bottom' | 'left', 
        data.pinNames, 
        data.options
      );
    }
    this.showBulkPinDialog = false;
    this.pendingBulkPinNode = null;
    this.selectedSideForBulkPin = '';
  }

  onBulkPinDialogCancelled(): void {
    this.showBulkPinDialog = false;
    this.pendingBulkPinNode = null;
    this.selectedSideForBulkPin = '';
  }

  private createBulkPinsOnSide(
    node: GraphNode, 
    side: 'top' | 'right' | 'bottom' | 'left', 
    pinNames: string[], 
    options: { autoDistribute: boolean; snapToGrid: boolean }
  ): void {
    const updatedNode = { ...node };
    if (!updatedNode.pins) updatedNode.pins = [];

    if (options.autoDistribute) {
      // Use the advanced layout service for optimal distribution
      const layout = this.pinLayoutService.distributePinsOnSide(node, side, pinNames, {
        minSpacing: options.snapToGrid ? 10 : 8,
        edgeMargin: 10,
        textPadding: 6,
        estimatedCharWidth: 6
      });

      // Remove existing pins on this side first
      updatedNode.pins = updatedNode.pins.filter(pin => {
        switch (side) {
          case 'top': return pin.y !== 0;
          case 'right': return pin.x !== node.width;
          case 'bottom': return pin.y !== node.height;
          case 'left': return pin.x !== 0;
          default: return true;
        }
      });

      // Add the new optimally positioned pins
      updatedNode.pins.push(...layout.positions);

      console.log(`Created ${layout.positions.length} pins on ${side} side with optimal distribution`);
      if (layout.hasOverlap) {
        console.warn('Warning: Pin labels may overlap due to space constraints');
      }
    } else {
      // Simple even distribution fallback
      const sideLength = (side === 'top' || side === 'bottom') ? node.width : node.height;
      const spacing = sideLength / (pinNames.length + 1);

      pinNames.forEach((pinName, index) => {
        const position = this.calculateSimplePinPosition(node, side, index, spacing);
        updatedNode.pins!.push({
          x: Math.round(position.x),
          y: Math.round(position.y),
          name: pinName
        });
      });

      console.log(`Created ${pinNames.length} pins on ${side} side with simple distribution`);
    }

    // Update the node in the service
    this.graphState.updateNode(node.id, updatedNode);
  }

  private calculateSimplePinPosition(
    node: GraphNode, 
    side: 'top' | 'right' | 'bottom' | 'left', 
    index: number, 
    spacing: number
  ): { x: number; y: number } {
    const offset = spacing * (index + 1);
    
    switch (side) {
      case 'top':
        return { x: offset, y: 0 };
      case 'right':
        return { x: node.width, y: offset };
      case 'bottom':
        return { x: offset, y: node.height };
      case 'left':
        return { x: 0, y: offset };
    }
  }
  
  private createPinOnSide(node: GraphNode, side: string, pinName: string): void {
    const updatedNode = { ...node };
    if (!updatedNode.pins) updatedNode.pins = [];
    
    // Calculate position based on side and existing pins
    const position = this.calculateOptimalPinPosition(updatedNode, side);
    
    updatedNode.pins.push({
      x: Math.round(position.x),
      y: Math.round(position.y),
      name: pinName
    });
    
    // Update the node in the service
    this.graphState.updateNode(node.id, updatedNode);
    
    console.log(`Added pin ${pinName} to node ${node.id} on ${side} side`);
  }
  
  private calculateOptimalPinPosition(node: GraphNode, side: string): { x: number; y: number } {
    const existingPins = node.pins || [];
    const sideId = ['top', 'right', 'bottom', 'left'].indexOf(side);
    
    // Count pins on this side (simplified - assumes pins are distributed evenly)
    const pinsOnSide = Math.floor(existingPins.length / 4) + 1;
    const spacing = 15; // Minimum spacing between pins
    const margin = 10;   // Margin from edges
    
    switch (side) {
      case 'top':
        return { 
          x: margin + (pinsOnSide * spacing), 
          y: 0 
        };
      case 'right':
        return { 
          x: node.width, 
          y: margin + (pinsOnSide * spacing) 
        };
      case 'bottom':
        return { 
          x: margin + (pinsOnSide * spacing), 
          y: node.height 
        };
      case 'left':
        return { 
          x: 0, 
          y: margin + (pinsOnSide * spacing) 
        };
      default:
        return { x: 0, y: 0 };
    }
  }

  private isNodeInSelectionBox(node: GraphNode, box: SelectionBox): boolean {
    const minX = Math.min(box.startX, box.endX);
    const maxX = Math.max(box.startX, box.endX);
    const minY = Math.min(box.startY, box.endY);
    const maxY = Math.max(box.startY, box.endY);
    
    // Check if node rectangle intersects with selection box
    return !(node.x + node.width < minX || 
             node.x > maxX || 
             node.y + node.height < minY || 
             node.y > maxY);
  }

  // Connection methods for template
  onPinMouseDown(event: MouseEvent, nodeId: string, pinName: string): void {
    event.stopPropagation();
    
    const node = this.currentNodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const pin = node.pins?.find(p => p.name === pinName);
    if (!pin) return;
    
    // Let the mode handle the event first
    if (this.modeManager.handlePinClick(node, pin, event)) {
      return; // Mode handled the event
    }
    
    // Default pin behavior (connection creation)
    if (this.connectingFrom === null) {
      // Start a new connection
      this.connectingFrom = { nodeId, pinName };
      console.log(`Starting connection from ${nodeId}.${pinName}`);
    } else {
      // Complete the connection
      const newEdge: GraphEdge = {
        from: `${this.connectingFrom.nodeId}.${this.connectingFrom.pinName}`,
        to: `${nodeId}.${pinName}`
      };
      
      this.graphState.addEdge(newEdge);
      console.log(`Created connection: ${newEdge.from} -> ${newEdge.to}`);
      
      // Reset connection state
      this.connectingFrom = null;
    }
  }

  getConnectionStartX(edge: GraphEdge): number {
    const [nodeId, pinName] = edge.from.split('.');
    const position = this.graphState.getPinPosition(nodeId, pinName);
    return position ? position.x : 0;
  }

  getConnectionStartY(edge: GraphEdge): number {
    const [nodeId, pinName] = edge.from.split('.');
    const position = this.graphState.getPinPosition(nodeId, pinName);
    return position ? position.y : 0;
  }

  getConnectionEndX(edge: GraphEdge): number {
    const [nodeId, pinName] = edge.to.split('.');
    const position = this.graphState.getPinPosition(nodeId, pinName);
    return position ? position.x : 0;
  }

  getConnectionEndY(edge: GraphEdge): number {
    const [nodeId, pinName] = edge.to.split('.');
    const position = this.graphState.getPinPosition(nodeId, pinName);
    return position ? position.y : 0;
  }

  // Connection mode helper methods
  updateConnectionStates(): void {
    // This method is called by ConnectionMode to update connection selection states
    // The UI will automatically reflect changes through the async pipe
    console.log('Connection states updated');
  }

  showConnectionPropertiesDialog(connectionId: string): void {
    // Placeholder for connection properties dialog
    console.log(`Opening properties dialog for connection: ${connectionId}`);
    // TODO: Implement connection properties dialog
  }

  showConnectionBulkEditDialog(connectionIds: string[]): void {
    // Placeholder for bulk connection edit dialog
    console.log(`Opening bulk edit dialog for ${connectionIds.length} connections`);
    // TODO: Implement bulk connection edit dialog
  }
}
