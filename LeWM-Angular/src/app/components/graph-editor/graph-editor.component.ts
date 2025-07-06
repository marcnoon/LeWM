import { Component, ElementRef, HostListener, ViewChild, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphNode } from '../../models/graph-node.model';
import { GraphEdge } from '../../models/graph-edge.model';
import { GraphStateService } from '../../services/graph-state.service';
import { ModeManagerService } from '../../services/mode-manager.service';
import { PinStateService } from '../../services/pin-state.service';
import { PinSyncService } from '../../services/pin-sync.service';
import { FileService } from '../../services/file.service';
import { FeatureGraphService } from '../../services/feature-graph.service';
import { GraphMode } from '../../interfaces/graph-mode.interface';
import { Pin } from '../../interfaces/pin.interface';
import { NormalMode } from '../../modes/normal.mode';
import { PinEditMode } from '../../modes/pin-edit.mode';
import { ConnectionMode } from '../../modes/connection.mode';
import { FileMode } from '../../modes/file.mode';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConnectionPropertiesDialogComponent } from '../connection-properties-dialog/connection-properties-dialog.component';
import { ConnectionBulkEditDialogComponent } from '../connection-bulk-edit-dialog/connection-bulk-edit-dialog.component';
import { NodeNameDialogComponent } from '../node-name-dialog/node-name-dialog.component';
import { NodeBatchEditDialogComponent } from '../node-batch-edit-dialog/node-batch-edit-dialog.component';
import { PinNameDialogComponent } from '../pin-name-dialog/pin-name-dialog.component';
import { PinLayoutEditorComponent } from '../pin-layout-editor/pin-layout-editor.component';
import { HandleComponent } from '../handle/handle';
import { PinModeToolbarComponent } from '../pin-mode-toolbar/pin-mode-toolbar.component';

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

// Define a type for the legacy pin structure found in graph-node.model.ts
interface LegacyPin {
  x: number;
  y: number;
  name: string;
}

@Component({
  selector: 'app-graph-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConnectionPropertiesDialogComponent,
    ConnectionBulkEditDialogComponent,
    NodeNameDialogComponent,
    NodeBatchEditDialogComponent,
    PinNameDialogComponent,
    PinLayoutEditorComponent,
    HandleComponent,
    PinModeToolbarComponent
  ],
  templateUrl: './graph-editor.component.html',
  styleUrl: './graph-editor.component.scss'
})
export class GraphEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('svgCanvas', { static: true }) svgCanvas!: ElementRef<SVGElement>;
  @ViewChild('pinDialog', { static: false }) pinDialog!: PinNameDialogComponent;

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
  private pinLayoutEditorSubscription?: Subscription;

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
  dragStart = { x: 0, y: 0 };
  selectionBox: SelectionBox | null = null;
  isCtrlPressed = false;
  initialPositions: Record<string, { x: number, y: number }> = {};
  
  // Connection creation state
  connectingFrom: { nodeId: string; pinName: string } | null = null;
  
  // Pin hover state for better selection targeting
  hoveredPin: { nodeId: string; pinName: string } | null = null;
  
  // Central reference area for pin interactions
  private centralReferenceArea = { x: 0, y: 0, width: 0, height: 0 };
  
  // Mode system
  public currentMode!: GraphMode;
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

  // Node name dialog state
  showNodeDialog = false;
  selectedNodeForEdit: GraphNode | null = null;

  // Node batch edit dialog state
  showNodeBatchDialog = false;
  selectedNodesForBatchEdit: GraphNode[] = [];

  // Pin layout editor state
  showPinLayoutEditor = false;

  // Resizable panel state
  toolbarWidth = 250; // Initial width
  resizeStartWidth = 0;
  minToolbarWidth = 200;
  maxToolbarWidth = 500;

  Math = Math;

  private graphState = inject(GraphStateService);
  public modeManager = inject(ModeManagerService);
  private pinState = inject(PinStateService);
  private pinSync = inject(PinSyncService);
  private fileService = inject(FileService);
  public featureService = inject(FeatureGraphService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // The mode manager will handle mode creation and management
    // Initialize with a null mode - will be set during ngOnInit
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
    
    // Subscribe to pin layout editor visibility
    this.pinLayoutEditorSubscription = this.pinState.layoutEditorVisible$.subscribe(visible => {
      this.showPinLayoutEditor = visible;
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
    this.pinLayoutEditorSubscription?.unsubscribe();
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

    // Skip mode switching if any dialog is open
    if (this.showNodeDialog || this.showNodeBatchDialog || this.showPinDialog || this.showConnectionDialog || this.showConnectionBulkDialog || this.showPinLayoutEditor) {
      console.log('Dialog is open, skipping mode switching for key:', event.key);
      return;
    }

    // Mode switching keys
    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
      switch (event.key.toLowerCase()) {
        case 'n':
          if (this.currentMode?.name !== 'normal') {
            this.switchToNormalMode();
            event.preventDefault();
            return;
          }
          break;
        case 'p':
          if (this.currentMode?.name !== 'pin-edit') {
            this.switchToPinEditMode();
            event.preventDefault();
            return;
          }
          break;
        case 'f':
          if (this.currentMode?.name !== 'file') {
            this.switchToFileMode();
            event.preventDefault();
            return;
          }
          break;
      }
    }

    // Handle Enter key in pin edit mode - let the mode handle it via the PinStateService
    if (event.key === 'Enter' && this.currentMode?.name === 'pin-edit') {
      // Skip if any dialog is open
      if (this.showNodeDialog || this.showNodeBatchDialog || this.showPinDialog || this.showConnectionDialog || this.showConnectionBulkDialog || this.showPinLayoutEditor) {
        return;
      }
      // Let the mode handle the Enter key through PinStateService which has access to the actual selected pins
      if (this.modeManager.handleKeyDown(event)) {
        event.preventDefault();
        return;
      }
    }


    
    // Handle Enter key in normal mode for node name editing
    if (event.key === 'Enter' && this.currentMode?.name === 'normal') {
      // Skip if any dialog is open
      if (this.showNodeDialog || this.showNodeBatchDialog || this.showPinDialog || this.showConnectionDialog || this.showConnectionBulkDialog || this.showPinLayoutEditor) {
        return;
      }
      if (this.selectedNodes.size === 1) {
        // Edit the name of the single selected node
        const nodeId = Array.from(this.selectedNodes)[0];
        const node = this.currentNodes.find(n => n.id === nodeId);
        if (node) {
          this.openNodeNameDialog(node);
          event.preventDefault();
          return;
        }
      } else if (this.selectedNodes.size > 1) {
        // Open batch edit dialog for multiple selected nodes
        const nodes = this.currentNodes.filter(n => this.selectedNodes.has(n.id));
        if (nodes.length > 1) {
          this.openNodeBatchEditDialog(nodes);
          event.preventDefault();
          return;
        }
      }
    }
    
    // First, let the mode handle the event
    if (this.modeManager.handleKeyDown(event)) {
      // Skip mode-specific shortcuts if any dialog is open
      if (this.showNodeDialog || this.showNodeBatchDialog || this.showPinDialog || this.showConnectionDialog || this.showConnectionBulkDialog || this.showPinLayoutEditor) {
        return;
      }
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
      // Skip if any dialog is open
      if (this.showNodeDialog || this.showNodeBatchDialog || this.showPinDialog || this.showConnectionDialog || this.showConnectionBulkDialog || this.showPinLayoutEditor) {
        return;
      }
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
    if (!this.featureService.isFeatureEnabled('graph.node')) {
      console.warn('graph.node feature is disabled');
      return;
    }
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
      
      this.dragStart = {
        x: mouseX,
        y: mouseY
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
      // Move all selected nodes with group-aware boundary constraints
      const deltaX = mouseX - this.dragStart.x;
      const deltaY = mouseY - this.dragStart.y;

      // Calculate the movement limits for the entire group to maintain relative positions
      let minAllowedDeltaX = deltaX;
      let minAllowedDeltaY = deltaY;
      
      // Check constraints for all selected nodes
      this.selectedNodes.forEach(nodeId => {
        const initial = this.initialPositions[nodeId];
        if (initial) {
          // Constrain deltaX to prevent going below x = 0
          const maxNegativeDeltaX = -initial.x;
          minAllowedDeltaX = Math.max(minAllowedDeltaX, maxNegativeDeltaX);
          
          // Constrain deltaY to prevent going below y = 0  
          const maxNegativeDeltaY = -initial.y;
          minAllowedDeltaY = Math.max(minAllowedDeltaY, maxNegativeDeltaY);
        }
      });

      // Create updates map for the service - apply same constrained delta to ALL selected nodes
      const updates = new Map<string, { x: number; y: number }>();
      this.selectedNodes.forEach(nodeId => {
        const initial = this.initialPositions[nodeId];
        if (initial) {
          updates.set(nodeId, {
            x: initial.x + minAllowedDeltaX,  // ✅ Group-constrained movement
            y: initial.y + minAllowedDeltaY   // ✅ Group-constrained movement
          });
        }
      });
      this.graphState.updateNodePositions(updates);
    }
  }

  onMouseUp(): void {
    this.dragging = false;
    this.selectionBox = null;
    this.initialPositions = {};
    this.dragStart = { x: 0, y: 0 };
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
    
    // Validate connection integrity when switching modes to clean up any orphaned connections
    this.validateConnectionIntegrity();
  }
  
  switchToNormalMode(): void {
    console.log('Switching to Normal mode');
    this.modeManager.activateMode('normal');
  }

  switchToPinEditMode(): void {
    console.log('Switching to Pin Edit mode');
    this.modeManager.activateMode('pin-edit');
  }

  switchToFileMode(): void {
    console.log('Switching to File mode');
    this.modeManager.activateMode('file');
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
    
    const newPin: LegacyPin = {
      x: Math.round(position.x),
      y: Math.round(position.y),
      name: pinName
    };
    
    updatedNode.pins.push(newPin);
    
    // Update the node in the service
    this.graphState.updateNode(node.id, updatedNode);
    
    // Sync the new pin to enhanced system
    this.pinSync.syncLegacyToEnhanced(node.id, newPin);
    
    console.log(`Added pin ${pinName} to node ${node.id} on ${side} side and synced to enhanced system`);
  }
  
  private calculateOptimalPinPosition(node: GraphNode, side: string): { x: number; y: number } {
    const existingPins = node.pins || [];
    
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
    ).filter((conn): conn is GraphEdge => conn !== undefined);
    
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
    
    // Bridge to enhanced pin system in pin-edit mode
    if (this.currentMode?.name === 'pin-edit') {
      this.onPinClick(node, pin, event);
      return;
    }
    
    // Let the mode handle the event first
    if (this.modeManager.handlePinClick(node, pin, event)) {
      return; // Mode handled the event
    }
    
    // No default pin behavior - connections should only be created in Connection Mode
    console.log(`Pin ${nodeId}.${pinName} clicked, but no mode handled it. Switch to Connection Mode to create connections.`);
  }

  // Bridge method: Handle legacy pin clicks and sync to enhanced system
  onPinClick(node: GraphNode, pin: LegacyPin, event: MouseEvent): void {
    if (this.currentMode?.name !== 'pin-edit') return;
    
    const pinId = `${node.id}.${pin.name}`;
    
    // Sync legacy pin to enhanced system if not already there
    if (!this.pinState.getPin(pinId)) {
      this.syncLegacyPinToEnhanced(node.id, pin);
    }
    
    // Select the pin in enhanced system
    this.pinState.selectPin(pinId, event.ctrlKey || event.metaKey);
    
    console.log(`Pin ${pinId} selected through legacy bridge`);
  }

  // Helper method to sync a legacy pin to the enhanced system
  private syncLegacyPinToEnhanced(nodeId: string, legacyPin: LegacyPin): void {
    this.pinSync.syncLegacyToEnhanced(nodeId, legacyPin);
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
    // This is a simplified check - in practice, you might want to use a more reactive approach
    return pin.isSelected || false;
  }

  // Bridge method: Check if a legacy pin is selected (for template styling)
  isPinSelectedLegacy(nodeId: string, pinName: string): boolean {
    const pinId = `${nodeId}.${pinName}`;
    let isSelected = false;
    
    // Subscribe to current pin state synchronously to get current selection
    const subscription = this.pinState.modeState$.subscribe(state => {
      isSelected = state.selectedPins.includes(pinId);
    });
    subscription.unsubscribe();
    
    return isSelected;
  }

  // Bridge method: Get CSS classes for legacy pin styling
  getPinClass(nodeId: string, pinName: string): string {
    const baseClass = 'pin-circle';
    if (this.isPinSelectedLegacy(nodeId, pinName)) {
      return `${baseClass} pin-selected`;
    }
    return baseClass;
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

  // Pin hover methods for better targeting
  onPinHover(node: GraphNode, pinName: string, isHovering: boolean): void {
    if (this.currentMode?.name === 'pin-edit') {
      this.hoveredPin = isHovering ? { nodeId: node.id, pinName: pinName } : null;
    }
  }

  isPinHovered(nodeId: string, pinName: string): boolean {
    return this.hoveredPin?.nodeId === nodeId && this.hoveredPin?.pinName === pinName;
  }

  // Central reference area methods
  getCentralReferenceArea(): { x: number; y: number; width: number; height: number } {
    if (!this.svgCanvas?.nativeElement) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
    
    // Create a rectangle covering the entire workspace for pin reference
    const width = svgRect.width;
    const height = svgRect.height;
    
    this.centralReferenceArea = {
      x: 0,
      y: 0,
      width: width,
      height: height
    };
    
    return this.centralReferenceArea;
  }

  onCentralReferenceMouseDown(event: MouseEvent): void {
    if (this.currentMode?.name !== 'pin-edit' && this.currentMode?.name !== 'connection') return;
    
    const { nodeId, pinName } = this.findClosestPinToMouse(event);
    if (nodeId && pinName) {
      const node = this.currentNodes.find(n => n.id === nodeId);
      
      if (node) {
        this.onPinMouseDown(event, nodeId, pinName);
      }
    }
  }

  onCentralReferenceMouseMove(event: MouseEvent): void {
    if (this.currentMode?.name !== 'pin-edit' && this.currentMode?.name !== 'connection') return;
    
    const { nodeId, pinName } = this.findClosestPinToMouse(event);
    
    // Update hover state
    const previousHover = this.hoveredPin;
    if (nodeId && pinName) {
      this.hoveredPin = { nodeId, pinName };
    } else {
      this.hoveredPin = null;
    }
    
    // Trigger hover events if hover changed
    if (previousHover?.nodeId !== this.hoveredPin?.nodeId || 
        previousHover?.pinName !== this.hoveredPin?.pinName) {
      
      if (previousHover) {
        const prevNode = this.currentNodes.find(n => n.id === previousHover.nodeId);
        const prevPinName = previousHover.pinName;
        if (prevNode && prevPinName) {
          this.onPinHover(prevNode, prevPinName, false);
        }
      }
      
      if (this.hoveredPin) {
        const currentNode = this.currentNodes.find(n => n.id === this.hoveredPin!.nodeId);
        const currentPinName = this.hoveredPin!.pinName;
        if (currentNode && currentPinName) {
          this.onPinHover(currentNode, currentPinName, true);
        }
      }
    }
  }

  onCentralReferenceMouseLeave(): void {
    if (this.currentMode?.name !== 'pin-edit' && this.currentMode?.name !== 'connection') return;
    
    // Clear hover state when leaving the central reference area
    if (this.hoveredPin) {
      const node = this.currentNodes.find(n => n.id === this.hoveredPin!.nodeId);
      const pinName = this.hoveredPin!.pinName;
      if (node && pinName) {
        this.onPinHover(node, pinName, false);
      }
      this.hoveredPin = null;
    }
  }

  private findClosestPinToMouse(event: MouseEvent): { nodeId: string; pinName: string } | { nodeId: null; pinName: null } {
    if (!this.svgCanvas?.nativeElement) {
      return { nodeId: null, pinName: null };
    }

    const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;
    
    let closestPin: { nodeId: string; pinName: string; distance: number } | null = null;
    const maxDistance = 20; // Maximum distance to consider a pin "close enough"
    
    // Find the closest pin to the mouse position
    this.currentNodes.forEach(node => {
      if (node.pins) {
        node.pins.forEach(pin => {
          const pinX = node.x + pin.x;
          const pinY = node.y + pin.y;
          const distance = Math.sqrt(Math.pow(mouseX - pinX, 2) + Math.pow(mouseY - pinY, 2));
          
          if (distance <= maxDistance && (!closestPin || distance < closestPin.distance)) {
            closestPin = { nodeId: node.id, pinName: pin.name, distance };
          }
        });
      }
    });
    
    if (closestPin !== null) {
      return { nodeId: (closestPin as any).nodeId, pinName: (closestPin as any).pinName };
    }
    
    return { nodeId: null, pinName: null };
  }

  // Node name dialog methods
  openNodeNameDialog(node: GraphNode): void {
    this.selectedNodeForEdit = node;
    this.showNodeDialog = true;
  }

  onNodePropertiesChanged(properties: {name: string, value: string, unit: string}): void {
    if (this.selectedNodeForEdit) {
      const updatedNode = { 
        ...this.selectedNodeForEdit, 
        label: properties.name,
        value: properties.value || undefined, // Don't store empty strings
        unit: properties.unit || undefined // Don't store empty strings
      };
      this.graphState.updateNode(this.selectedNodeForEdit.id, updatedNode);
      this.onNodeDialogCancelled(); // Close the dialog
    }
  }

  onNodeDialogCancelled(): void {
    this.showNodeDialog = false;
    this.selectedNodeForEdit = null;
  }

  // Node batch edit dialog methods
  openNodeBatchEditDialog(nodes: GraphNode[]): void {
    this.selectedNodesForBatchEdit = nodes;
    this.showNodeBatchDialog = true;
  }

  onNodesBatchUpdated(updatedNodes: GraphNode[]): void {
    // Update all the nodes in the graph state
    updatedNodes.forEach(node => {
      this.graphState.updateNode(node.id, node);
    });
    this.onNodeBatchDialogCancelled(); // Close the dialog
  }

  onNodeBatchDialogCancelled(): void {
    this.showNodeBatchDialog = false;
    this.selectedNodesForBatchEdit = [];
  }

  // File operations
  saveGraph(): void {
    const fileMode = this.modeManager.getAvailableModes().find(mode => mode.name === 'file') as FileMode;
    if (fileMode) {
      fileMode.save();
    }
  }

  saveGraphAs(): void {
    const fileMode = this.modeManager.getAvailableModes().find(mode => mode.name === 'file') as FileMode;
    if (fileMode) {
      fileMode.saveAs();
    }
  }

  openGraph(): void {
    const fileMode = this.modeManager.getAvailableModes().find(mode => mode.name === 'file') as FileMode;
    if (fileMode) {
      fileMode.open();
    }
  }

  newGraph(): void {
    const fileMode = this.modeManager.getAvailableModes().find(mode => mode.name === 'file') as FileMode;
    if (fileMode) {
      fileMode.newGraph();
    }
  }

  get currentFileName(): string | null {
    return this.fileService.getCurrentFileName();
  }

  // Add currentModeName getter
  get currentModeName(): string {
    return this.currentMode?.name || '';
  }

  // Resize functionality methods
  onResizeStart(): void {
    this.resizeStartWidth = this.toolbarWidth;
  }

  onResize(deltaX: number): void {
    const newWidth = this.resizeStartWidth + deltaX;
    
    // Clamp the width between min and max values
    this.toolbarWidth = Math.max(
      this.minToolbarWidth,
      Math.min(this.maxToolbarWidth, newWidth)
    );
  }

  onResizeEnd(): void {
    // Handle can be implemented if needed for cleanup
  }

  renderActiveOverlay(nativeElement: SVGElement) {
    this.modeManager.renderActiveOverlay(nativeElement);
  }
}
