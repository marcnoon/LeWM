import { Component, ElementRef, HostListener, ViewChild, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphNode } from '../../models/graph-node.model';
import { GraphEdge } from '../../models/graph-edge.model';
import { GraphStateService } from '../../services/graph-state.service';
import { ModeManagerService } from '../../services/mode-manager.service';
import { PinStateService } from '../../services/pin-state.service';
import { FileService } from '../../services/file.service';
import { GraphMode } from '../../interfaces/graph-mode.interface';
import { Pin } from '../../interfaces/pin.interface';
import { NormalMode } from '../../modes/normal.mode';
import { PinEditMode } from '../../modes/pin-edit.mode';
import { ConnectionMode } from '../../modes/connection.mode';
import { FileMode } from '../../modes/file.mode';

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
export class GraphEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('svgCanvas', { static: true }) svgCanvas!: ElementRef<SVGElement>;
  @ViewChild('pinDialog', { static: false }) pinDialog: any;

  // Expose the nodes and edges observables directly to the template
  nodes$!: Observable<GraphNode[]>;
  edges$!: Observable<GraphEdge[]>;
  pins$!: Observable<Pin[]>;
  
  // Observable for pins grouped by nodeId for template rendering
  pinsByNode$!: Observable<Map<string, Pin[]>>;

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
  private normalMode: NormalMode;
  private pinEditMode: PinEditMode;
  private fileMode: FileMode;
  public currentMode: GraphMode;
  availableModes: GraphMode[] = [];
  private modeSubscription?: Subscription;
  
  // Pin dialog state
  showPinDialog = false;
  selectedSideForPin = '';
  pendingPinNode: GraphNode | null = null;
  
  // Connection dialog state
  showConnectionDialog = false;
  selectedConnectionForEdit: GraphEdge | null = null;
  
  // Connection bulk edit dialog state
  showConnectionBulkDialog = false;
  selectedConnectionsForBulkEdit: GraphEdge[] = [];

  Math = Math;

  constructor(
    private graphState: GraphStateService,
    public modeManager: ModeManagerService,
    private pinState: PinStateService,
    private fileService: FileService,
    private cdr: ChangeDetectorRef
  ) {
    this.normalMode = new NormalMode(this.graphState);
    this.pinEditMode = new PinEditMode(this.graphState, this.pinState);
    this.fileMode = new FileMode(this.graphState, this.pinState, this.fileService);
    this.currentMode = this.normalMode;
  }

  ngOnInit(): void {
    // Assign the observables for use with the async pipe in the template
    this.nodes$ = this.graphState.nodes$;
    this.edges$ = this.graphState.edges$;
    this.pins$ = this.pinState.pins$.pipe(
      map(pinsMap => Array.from(pinsMap.values()))
    );
    
    // Create an observable that groups pins by nodeId for easy template access
    this.pinsByNode$ = this.pins$.pipe(
      map(pins => {
        const pinsByNode = new Map<string, Pin[]>();
        pins.forEach(pin => {
          if (!pinsByNode.has(pin.nodeId)) {
            pinsByNode.set(pin.nodeId, []);
          }
          pinsByNode.get(pin.nodeId)!.push(pin);
        });
        return pinsByNode;
      })
    );

    // Subscribe to keep local copies for imperative operations
    this.nodesSubscription = this.nodes$.subscribe(nodes => {
      this.currentNodes = nodes;
    });
    
    this.edgesSubscription = this.edges$.subscribe(edges => {
      this.currentEdges = edges;
    });
    
    // Initialize mode system
    this.initializeModes();

    // Subscribe to mode changes
    this.modeSubscription = this.modeManager.activeMode$.subscribe(mode => {
      if (mode) {
        this.currentMode = mode;
      }
      // Remove pin-edit overlays when exiting pin-edit mode
      if (mode?.name !== 'pin-edit') {
        this.clearOverlay();
      }
      // Update cursor based on mode
      if (this.svgCanvas?.nativeElement) {
        this.svgCanvas.nativeElement.style.cursor = this.modeManager.getActiveCursor();
      }
    });
  }

  ngOnDestroy(): void {
    this.nodesSubscription?.unsubscribe();
    this.edgesSubscription?.unsubscribe();
    this.modeSubscription?.unsubscribe();
  }

  ngAfterViewInit(): void {
    // Render initial overlay if needed
    if (this.currentMode && this.svgCanvas?.nativeElement) {
      this.modeManager.renderActiveOverlay(this.svgCanvas.nativeElement);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    console.log('GraphEditor: Key pressed:', event.key, 'Current mode:', this.currentMode.name);

    // Mode switching keys
    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
      switch (event.key.toLowerCase()) {
        case 'n':
          if (this.currentMode !== this.normalMode) {
            this.switchToNormalMode();
            event.preventDefault();
            return;
          }
          break;
        case 'p':
          if (this.currentMode !== this.pinEditMode) {
            this.switchToPinEditMode();
            event.preventDefault();
            return;
          }
          break;
        case 'f':
          if (this.currentMode !== this.fileMode) {
            this.switchToFileMode();
            event.preventDefault();
            return;
          }
          break;
      }
    }

    // Handle Enter key in pin edit mode
    if (event.key === 'Enter' && this.currentMode?.name === 'pin-edit') {
      const pinEditMode = this.modeManager.getActiveMode() as any;
      if (pinEditMode?.selectedPins?.size > 0) {
        // Open pin layout editor through the pin state service
        this.modeManager.openPinLayoutEditor();
        event.preventDefault();
        return;
      }
    }
    
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
      // If the mode handled the event (e.g., Delete key), don't proceed with default behavior
      return;
    }

    // Handle global shortcuts
    if (event.key === 'Control' || event.key === 'Meta') {
      this.isCtrlPressed = true;
    }
    if (event.key === 'Delete') {
      // Only handle node deletion in Normal mode
      if (this.currentMode?.name === 'normal' && this.selectedNodes.size > 0) {
        this.deleteSelectedNodes();
      }
      // Other modes (pin-edit, connection) handle their own delete logic
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
    
    // Validate connection integrity after node deletion
    this.validateConnectionIntegrity();
  }

  /** Delete currently selected pins in Pin Edit mode */
  deleteSelectedPins(): void {
    this.modeManager.deleteSelectedPins();
  }

  onSvgMouseDown(event: MouseEvent): void {
    // Baseline behavior in normal mode: always clear or start selection box
    if (this.currentMode?.name === 'normal') {
      this.handleCanvasMouseDown(event);
      return;
    }
    // Delegate to mode or default canvas handling
    if (this.modeManager.handleCanvasClick(event)) {
      return;
    }
    this.handleCanvasMouseDown(event);
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
    // Normal mode baseline: clear selection or start selection box
    if (this.currentMode?.name === 'normal') {
      const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
      const mouseX = event.clientX - svgRect.left;
      const mouseY = event.clientY - svgRect.top;
      if (this.isCtrlPressed) {
        // Start selection box
        this.selectionBox = { startX: mouseX, startY: mouseY, endX: mouseX, endY: mouseY };
      } else {
        this.selectedNodes.clear();
      }
      return;
    }
    // Non-normal modes: clear or delegate to mode if needed
    if (!this.isCtrlPressed) {
      this.selectedNodes.clear();
    }
    if (this.modeManager.handleCanvasClick(event)) {
      return;
    }
    const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;
    if (this.isCtrlPressed) {
      this.selectionBox = { startX: mouseX, startY: mouseY, endX: mouseX, endY: mouseY };
    }
  }
  
  // Mode management methods
  private initializeModes(): void {
    // Create and register modes
    const normalMode = new NormalMode(this.graphState);
    const pinEditMode = new PinEditMode(this.graphState, this.pinState);
    const connectionMode = new ConnectionMode(this.graphState);
    const fileMode = new FileMode(this.graphState, this.pinState, this.fileService);
    
    // Set component references for modes that need dialogs
    pinEditMode.setComponentRef(this);
    connectionMode.setComponentRef(this);
    fileMode.setComponentRef(this);
    
    this.modeManager.registerMode(normalMode);
    this.modeManager.registerMode(pinEditMode);
    this.modeManager.registerMode(connectionMode);
    this.modeManager.registerMode(fileMode);
    
    this.availableModes = this.modeManager.getAvailableModes();
    
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
    // Clear selection when entering normal mode
    if (modeName === 'normal') {
      this.selectedNodes.clear();
    }
    // Remove pin-edit overlays when exiting pin-edit mode
    if (modeName !== 'pin-edit') {
      this.clearOverlay();
    }
    
    // Validate connection integrity when switching modes to clean up any orphaned connections
    this.validateConnectionIntegrity();
  }
  
  switchToNormalMode(): void {
    console.log('Switching to Normal mode');
    if (this.currentMode.isActive) {
      this.currentMode.deactivate();
    }
    this.currentMode = this.normalMode;
    this.normalMode.activate();
    this.modeManager.renderActiveOverlay(this.svgCanvas.nativeElement);
  }

  switchToPinEditMode(): void {
    console.log('Switching to Pin Edit mode');
    if (this.currentMode.isActive) {
      this.currentMode.deactivate();
    }
    this.currentMode = this.pinEditMode;
    this.pinEditMode.activate();
    this.modeManager.renderActiveOverlay(this.svgCanvas.nativeElement);
  }

  switchToFileMode(): void {
    console.log('Switching to File mode');
    if (this.currentMode.isActive) {
      this.currentMode.deactivate();
    }
    this.currentMode = this.fileMode;
    this.fileMode.activate();
    this.modeManager.renderActiveOverlay(this.svgCanvas.nativeElement);
  }
  
  private validateConnectionIntegrity(): void {
    const result = this.graphState.validateConnectionIntegrity();
    if (result.removedConnections > 0) {
      console.log(`Mode switch cleanup: Removed ${result.removedConnections} orphaned connections`);
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
      // Trim whitespace and check for empty names
      const trimmedName = pinName.trim();
      if (!trimmedName) {
        console.warn('Pin name cannot be empty');
        if (this.pinDialog) {
          this.pinDialog.showError('Pin name cannot be empty. Please enter a valid name.');
        }
        return;
      }
      
      // Check if pin name already exists on this node
      if (this.isPinNameDuplicate(this.pendingPinNode, trimmedName)) {
        // Show error and keep dialog open
        console.warn(`Pin name "${trimmedName}" already exists on node ${this.pendingPinNode.id}`);
        if (this.pinDialog) {
          this.pinDialog.showError(`Pin name "${trimmedName}" already exists on this node. Please choose a different name.`);
        }
        return;
      }
      
      this.createPinOnSide(this.pendingPinNode, this.selectedSideForPin, trimmedName);
      // Only close dialog and clear state if pin creation was successful
      this.showPinDialog = false;
      this.pendingPinNode = null;
      this.selectedSideForPin = '';
      // Reset the dialog component to clear any error messages
      if (this.pinDialog) {
        this.pinDialog.reset();
      }
    }
  }
  
  onPinDialogCancelled(): void {
    this.showPinDialog = false;
    this.pendingPinNode = null;
    this.selectedSideForPin = '';
  }
  
  private isPinNameDuplicate(node: GraphNode, pinName: string): boolean {
    if (!node.pins) return false;
    return node.pins.some(pin => pin.name === pinName);
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
  
  // Connection dialog methods
  showConnectionPropertiesDialog(connectionId: string): void {
    const connection = this.currentEdges.find(e => e.id === connectionId);
    if (connection) {
      this.selectedConnectionForEdit = connection;
      this.showConnectionDialog = true;
    }
  }
  
  onConnectionUpdated(updatedConnection: GraphEdge): void {
    if (updatedConnection.id) {
      // Update the connection in the service
      this.graphState.updateEdge(updatedConnection.id, updatedConnection);
    }
    this.showConnectionDialog = false;
    this.selectedConnectionForEdit = null;
  }
  
  onConnectionDialogCancelled(): void {
    this.showConnectionDialog = false;
    this.selectedConnectionForEdit = null;
  }
  
  // Connection bulk edit dialog methods
  showConnectionBulkEditDialog(connectionIds: string[]): void {
    const connections = connectionIds.map(id => 
      this.currentEdges.find(e => e.id === id)
    ).filter(conn => conn !== undefined) as GraphEdge[];
    
    if (connections.length > 0) {
      this.selectedConnectionsForBulkEdit = connections;
      this.showConnectionBulkDialog = true;
    }
  }
  
  onConnectionsBulkUpdated(updatedConnections: GraphEdge[]): void {
    // Update all connections in the service
    updatedConnections.forEach(connection => {
      if (connection.id) {
        this.graphState.updateEdge(connection.id, connection);
      }
    });
    this.showConnectionBulkDialog = false;
    this.selectedConnectionsForBulkEdit = [];
  }
  
  onConnectionBulkDialogCancelled(): void {
    this.showConnectionBulkDialog = false;
    this.selectedConnectionsForBulkEdit = [];
  }
  
  // Method for connection mode to update connection states
  updateConnectionStates(): void {
    const connectionMode = this.modeManager.getActiveMode();
    if (connectionMode?.name === 'connection') {
      const mode = connectionMode as ConnectionMode;
      
      // Update connection selection and hover states
      const currentEdges = this.graphState.getEdges();
      currentEdges.forEach(edge => {
        if (edge.id) {
          edge.isSelected = mode.isConnectionSelected(edge.id);
          edge.isHighlighted = mode.isConnectionHovered(edge.id);
        }
      });
      
      // Force a re-render by updating the service
      // This is a simplified approach - in a more complex app you might use a different strategy
      this.graphState.notifyEdgeStateChange();
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

  // Connection methods for template (legacy pin system)
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
    
    // No default pin behavior - connections should only be created in Connection Mode
    console.log(`Pin ${nodeId}.${pinName} clicked, but no mode handled it. Switch to Connection Mode to create connections.`);
  }
  
  // Enhanced pin system handler
  onPinMouseDownEnhanced(event: MouseEvent, nodeId: string, pinId: string): void {
    event.stopPropagation();
    
    const node = this.currentNodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // In pin-edit mode, handle pin selection
    if (this.currentMode?.name === 'pin-edit') {
      this.pinState.selectPin(pinId, event.ctrlKey || event.metaKey);
      return;
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
  
  // Helper methods for enhanced connection rendering
  getStrokeDashArray(edge: GraphEdge): string {
    switch (edge.strokeStyle) {
      case 'dashed':
        return '5,5';
      case 'dotted':
        return '2,2';
      case 'solid':
      default:
        return 'none';
    }
  }
  
  getMarkerEnd(edge: GraphEdge): string {
    if (edge.direction === 'forward' || edge.direction === 'bidirectional') {
      return 'url(#arrowhead)';
    }
    return '';
  }
  
  getMarkerStart(edge: GraphEdge): string {
    if (edge.direction === 'backward' || edge.direction === 'bidirectional') {
      return 'url(#arrowhead-start)';
    }
    return '';
  }
  
  // Pin position calculation methods
  calculatePinPosition(pin: Pin, node: GraphNode): { x: number; y: number } {
    // Use absolute x,y coordinates if they exist (from legacy system)
    // Otherwise calculate from side/offset
    if (pin.position.x !== 0 || pin.position.y !== 0) {
      return {
        x: node.x + pin.position.x,
        y: node.y + pin.position.y
      };
    }
    
    const { side, offset } = pin.position;
    let x = 0, y = 0;
    
    switch (side) {
      case 'top':
        x = node.x + (node.width * offset);
        y = node.y;
        break;
      case 'right':
        x = node.x + node.width;
        y = node.y + (node.height * offset);
        break;
      case 'bottom':
        x = node.x + (node.width * offset);
        y = node.y + node.height;
        break;
      case 'left':
        x = node.x;
        y = node.y + (node.height * offset);
        break;
    }
    
    return { x, y };
  }
  
  // Get the original pin position from the legacy pin system
  getOriginalPinPosition(pin: Pin, node: GraphNode): { x: number; y: number } {
    // Find the original pin in the node.pins array
    const originalPin = node.pins?.find(p => p.name === pin.label);
    if (originalPin) {
      return { x: originalPin.x, y: originalPin.y };
    }
    // Fallback to using the pin's stored x,y coordinates
    return { x: pin.position.x, y: pin.position.y };
  }
  
  calculatePinTextPosition(pin: Pin, node: GraphNode): { x: number; y: number } {
    const pinPos = this.calculatePinPosition(pin, node);
    return {
      x: pinPos.x + pin.textStyle.offset.x,
      y: pinPos.y + pin.textStyle.offset.y
    };
  }
  
  // Get pins for a specific node (helper for template)
  getPinsForNode(nodeId: string, pinsByNode: Map<string, Pin[]> | null): Pin[] {
    if (!pinsByNode) return [];
    return pinsByNode.get(nodeId) || [];
  }
  
  // Check if a pin is selected (for styling)
  isPinSelected(pin: Pin): boolean {
    const currentState = this.pinState.modeState$.pipe(map(state => state));
    // This is a simplified check - in practice, you might want to use a more reactive approach
    return false; // Will be handled by the pin selection logic
  }
  
  // TrackBy function for pin rendering performance
  trackByPinId(index: number, pin: Pin): string {
    return pin.id;
  }
  
  // Check if a pin has been modified from its original position
  isPinModified(pin: Pin): boolean {
    // For now, only show enhanced rendering if pin has actually been edited
    // We'll use a flag or check if the pin has non-default styling
    return pin.textStyle.fontSize !== 12 || 
           pin.textStyle.color !== '#000000' ||
           pin.textStyle.orientation !== 0 ||
           pin.pinStyle.size !== 8 ||
           pin.pinStyle.color !== '#4CAF50' ||
           (pin.position.side !== 'left' && pin.position.offset !== 0);
  }
  
  // Check if a legacy pin is currently selected in enhanced mode (to avoid duplicates)
  isPinSelectedInEnhancedMode(nodeId: string, pinName: string): boolean {
    if (this.currentMode?.name !== 'pin-edit') return false;
    
    const pinId = `${nodeId}.${pinName}`;
    let isSelected = false;
    
    const subscription = this.pinsByNode$.subscribe(pinsByNode => {
      if (pinsByNode) {
        const pins = this.getPinsForNode(nodeId, pinsByNode);
        const pin = pins.find(p => p.id === pinId);
        isSelected = pin?.isSelected || false;
      }
    });
    
    subscription.unsubscribe();
    return isSelected;
  }

  // File operations
  saveGraph(): void {
    this.fileMode.save();
  }

  saveGraphAs(): void {
    this.fileMode.saveAs();
  }

  openGraph(): void {
    this.fileMode.open();
  }

  newGraph(): void {
    this.fileMode.newGraph();
  }

  get currentFileName(): string | null {
    return this.fileService.getCurrentFileName();
  }

  // Add currentModeName getter
  get currentModeName(): string {
    return this.currentMode?.name || '';
  }
}
