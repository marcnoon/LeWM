import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { PinStateService } from '../../services/pin-state.service';
import { GraphStateService } from '../../services/graph-state.service';
import { Pin, PinPosition, PinTextStyle, PinModeState } from '../../interfaces/pin.interface';

@Component({
  selector: 'app-pin-layout-editor',
  standalone: false,
  templateUrl: './pin-layout-editor.component.html',
  styleUrls: ['./pin-layout-editor.component.scss']
})
export class PinLayoutEditorComponent implements OnInit, OnDestroy {
  visible = false;
  selectedPins: Pin[] = [];
  editingPins: Pin[] = [];
  groupedPins: Map<string, Pin[]> = new Map();
  previewMode = false;
  activeTab: 'position' | 'text' | 'batch' = 'position';
  previewZoom = 1.0;
  previewOffset = { x: 0, y: 0 };
  nodeInfoCache = new Map<string, any>();

  private subscriptions: Subscription[] = [];
  private regroupTimeout: any;

  constructor(
    private pinStateService: PinStateService,
    private graphStateService: GraphStateService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Subscribe to layout editor visibility
    this.subscriptions.push(
      this.pinStateService.layoutEditorVisible$.subscribe(visible => {
        console.log('Layout editor visibility changed:', visible);
        this.visible = visible;
        if (visible) {
          // When editor opens, get the current selected pins immediately
          const currentSelectedPins = this.pinStateService.getSelectedPins();
          console.log('Getting selected pins on editor open:', currentSelectedPins.length);
          this.selectedPins = [...currentSelectedPins];
          this.initializeEditor();
        }
      })
    );

    // Don't subscribe to selectedPins$ changes during editing - this causes the reactive loop
    // The initial pins are loaded when the editor opens via layoutEditorVisible$ subscription
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.regroupTimeout) {
      clearTimeout(this.regroupTimeout);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.visible) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeEditor();
    } else if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.applyChanges();
    }
  }

  initializeEditor(): void {
    console.log('Initializing pin layout editor with', this.selectedPins.length, 'pins');
    console.log('Selected pins:', this.selectedPins.map(p => ({ id: p.id, label: p.label })));
    
    if (this.selectedPins.length === 0) {
      console.warn('No pins provided to editor');
      this.editingPins = [];
      this.groupedPins = new Map();
      return;
    }

    // Clone pins for editing without affecting the store
    this.editingPins = this.selectedPins.map(pin => ({
      ...pin,
      textStyle: { 
        ...pin.textStyle, 
        offset: { ...pin.textStyle.offset } 
      },
      pinStyle: { ...pin.pinStyle },
      position: { ...pin.position }
    }));
    
    // Group pins by node
    this.groupedPins = new Map();
    this.editingPins.forEach(pin => {
      if (!this.groupedPins.has(pin.nodeId)) {
        this.groupedPins.set(pin.nodeId, []);
      }
      this.groupedPins.get(pin.nodeId)!.push(pin);
    });
    
    console.log('Editor initialized with grouped pins:', Array.from(this.groupedPins.keys()));
  }

  updatePinPosition(pinId: string, field: keyof PinPosition, value: any): void {
    console.log(`Updating pin ${pinId} field ${field} to value:`, value);
    
    // Apply grid snapping if enabled
    if (field === 'x' || field === 'y') {
      const modeState = this.pinStateService.modeState$.pipe(map((state: PinModeState) => state));
      modeState.subscribe((state: PinModeState) => {
        if (state.gridSnap) {
          value = this.snapToGrid(value);
        }
      }).unsubscribe();
    }
    
    // Update local editing pins directly by index to avoid array recreation
    const pinIndex = this.editingPins.findIndex(pin => pin.id === pinId);
    if (pinIndex !== -1) {
      this.editingPins[pinIndex] = {
        ...this.editingPins[pinIndex],
        position: { ...this.editingPins[pinIndex].position, [field]: value }
      };
      console.log(`Updated local pin ${pinId} position:`, this.editingPins[pinIndex].position);
      
      // Clear node cache when pin positions change for preview update
      this.nodeInfoCache.delete(this.editingPins[pinIndex].nodeId);
    }
    
    // Defer regrouping to avoid excessive template updates
    this.deferredRegroupPins();
  }

  updatePinTextStyle(pinId: string, field: keyof PinTextStyle, value: any): void {
    console.log(`Updating pin ${pinId} text style ${field} to:`, value);
    
    // Update local editing pins directly by index
    const pinIndex = this.editingPins.findIndex(pin => pin.id === pinId);
    if (pinIndex !== -1) {
      this.editingPins[pinIndex] = {
        ...this.editingPins[pinIndex],
        textStyle: { ...this.editingPins[pinIndex].textStyle, [field]: value }
      };
      
      // Trigger change detection for preview
      this.cdr.detectChanges();
    }
    
    this.deferredRegroupPins();
  }

  updatePinTextOffset(pinId: string, axis: 'x' | 'y', value: number): void {
    console.log(`Updating pin ${pinId} text offset ${axis} to:`, value);
    
    // Update local editing pins directly by index
    const pinIndex = this.editingPins.findIndex(pin => pin.id === pinId);
    if (pinIndex !== -1) {
      this.editingPins[pinIndex] = {
        ...this.editingPins[pinIndex],
        textStyle: {
          ...this.editingPins[pinIndex].textStyle,
          offset: { ...this.editingPins[pinIndex].textStyle.offset, [axis]: value }
        }
      };
    }
    
    this.deferredRegroupPins();
  }

  private regroupPins(): void {
    this.groupedPins = new Map();
    this.editingPins.forEach(pin => {
      if (!this.groupedPins.has(pin.nodeId)) {
        this.groupedPins.set(pin.nodeId, []);
      }
      this.groupedPins.get(pin.nodeId)!.push(pin);
    });
  }
  
  private deferredRegroupPins(): void {
    // Clear any existing timeout
    if (this.regroupTimeout) {
      clearTimeout(this.regroupTimeout);
    }
    
    // Set a new timeout to regroup pins after a short delay
    this.regroupTimeout = setTimeout(() => {
      this.regroupPins();
    }, 50); // 50ms delay to batch multiple rapid changes
  }

  // Enhanced batch operations for multiple pins
  alignPinsOnSide(nodeId: string, side: 'top' | 'right' | 'bottom' | 'left'): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    const spacing = 1 / (nodePins.length + 1);
    
    nodePins.forEach((pin, index) => {
      this.updatePinPosition(pin.id, 'side', side);
      this.updatePinPosition(pin.id, 'offset', spacing * (index + 1));
    });
  }

  distributeEvenly(nodeId: string): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    if (nodePins.length <= 1) return;

    const firstPin = nodePins[0];
    const side = firstPin.position.side;
    const spacing = 1 / (nodePins.length + 1);
    
    nodePins.forEach((pin, index) => {
      this.updatePinPosition(pin.id, 'offset', spacing * (index + 1));
    });
  }
  
  // Advanced alignment operations
  alignLeft(nodeId: string): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    if (nodePins.length === 0) return;
    
    const leftmostX = Math.min(...nodePins.map(p => p.position.x));
    nodePins.forEach(pin => {
      this.updatePinPosition(pin.id, 'x', leftmostX);
    });
  }
  
  alignRight(nodeId: string): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    if (nodePins.length === 0) return;
    
    const rightmostX = Math.max(...nodePins.map(p => p.position.x));
    nodePins.forEach(pin => {
      this.updatePinPosition(pin.id, 'x', rightmostX);
    });
  }
  
  alignTop(nodeId: string): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    if (nodePins.length === 0) return;
    
    const topY = Math.min(...nodePins.map(p => p.position.y));
    nodePins.forEach(pin => {
      this.updatePinPosition(pin.id, 'y', topY);
    });
  }
  
  alignBottom(nodeId: string): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    if (nodePins.length === 0) return;
    
    const bottomY = Math.max(...nodePins.map(p => p.position.y));
    nodePins.forEach(pin => {
      this.updatePinPosition(pin.id, 'y', bottomY);
    });
  }
  
  centerHorizontally(nodeId: string): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    if (nodePins.length === 0) return;
    
    const avgX = nodePins.reduce((sum, p) => sum + p.position.x, 0) / nodePins.length;
    nodePins.forEach(pin => {
      this.updatePinPosition(pin.id, 'x', avgX);
    });
  }
  
  centerVertically(nodeId: string): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    if (nodePins.length === 0) return;
    
    const avgY = nodePins.reduce((sum, p) => sum + p.position.y, 0) / nodePins.length;
    nodePins.forEach(pin => {
      this.updatePinPosition(pin.id, 'y', avgY);
    });
  }
  
  distributeHorizontally(nodeId: string): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    if (nodePins.length <= 2) return;
    
    // Sort pins by x position
    const sortedPins = [...nodePins].sort((a, b) => a.position.x - b.position.x);
    const leftX = sortedPins[0].position.x;
    const rightX = sortedPins[sortedPins.length - 1].position.x;
    const spacing = (rightX - leftX) / (sortedPins.length - 1);
    
    sortedPins.forEach((pin, index) => {
      this.updatePinPosition(pin.id, 'x', leftX + (spacing * index));
    });
  }
  
  distributeVertically(nodeId: string): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    if (nodePins.length <= 2) return;
    
    // Sort pins by y position
    const sortedPins = [...nodePins].sort((a, b) => a.position.y - b.position.y);
    const topY = sortedPins[0].position.y;
    const bottomY = sortedPins[sortedPins.length - 1].position.y;
    const spacing = (bottomY - topY) / (sortedPins.length - 1);
    
    sortedPins.forEach((pin, index) => {
      this.updatePinPosition(pin.id, 'y', topY + (spacing * index));
    });
  }

  applyFontToAll(nodeId: string, fontProperty: keyof PinTextStyle, value: any): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    nodePins.forEach(pin => {
      this.updatePinTextStyle(pin.id, fontProperty, value);
    });
  }

  async applyChanges(): Promise<void> {
    console.log('Applying changes to', this.editingPins.length, 'pins');
    
    // Update both the PinStateService and sync back to legacy system
    const syncPromises = this.editingPins.map(async (pin) => {
      // Update the enhanced pin system
      this.pinStateService.updatePin(pin.id, {
        position: pin.position,
        textStyle: pin.textStyle,
        pinStyle: pin.pinStyle
      });
      
      // Sync changes back to the legacy node.pins system synchronously
      return this.syncPinToLegacySystemSync(pin);
    });
    
    // Wait for all syncs to complete before closing
    await Promise.all(syncPromises);
    console.log('✅ All pin changes applied and persisted');
    
    this.closeEditor();
  }
  
  private syncPinToLegacySystem(pin: Pin): void {
    // Extract nodeId and pinName from the pin ID format "nodeId.pinName"
    const [nodeId, pinName] = pin.id.split('.');
    
    console.log(`🔄 Syncing pin ${pin.id} to legacy system...`);
    console.log(`📍 Pin position data:`, pin.position);
    
    // Get the node from GraphStateService
    const nodes = this.graphStateService.getNodes();
    const node = nodes.find(n => n.id === nodeId);
    
    console.log(`🔍 Found node:`, node ? 'YES' : 'NO');
    console.log(`📌 Node has pins:`, node?.pins ? `YES (${node.pins.length})` : 'NO');
    
    if (node && node.pins) {
      // Find the legacy pin and update its position
      const legacyPin = node.pins.find(p => p.name === pinName);
      console.log(`🎯 Found legacy pin:`, legacyPin ? 'YES' : 'NO');
      
      if (legacyPin) {
        console.log(`📍 BEFORE: Legacy pin ${pinName} at x=${legacyPin.x}, y=${legacyPin.y}`);
        
        // Update the legacy pin position with the new coordinates
        legacyPin.x = pin.position.x;
        legacyPin.y = pin.position.y;
        
        console.log(`📍 AFTER: Legacy pin ${pinName} at x=${legacyPin.x}, y=${legacyPin.y}`);
        console.log(`💾 Updating node in GraphStateService...`);
        
        // Update the node in GraphStateService to persist the changes
        this.graphStateService.updateNode(nodeId, { ...node });
        
        console.log(`✅ Node update completed for ${nodeId}`);
        
        // Verify the update
        setTimeout(() => {
          const updatedNodes = this.graphStateService.getNodes();
          const updatedNode = updatedNodes.find(n => n.id === nodeId);
          const updatedPin = updatedNode?.pins?.find(p => p.name === pinName);
          console.log(`🔍 VERIFICATION: Pin ${pinName} now at x=${updatedPin?.x}, y=${updatedPin?.y}`);
        }, 100);
      } else {
        console.error(`❌ Legacy pin ${pinName} not found in node ${nodeId}`);
      }
    } else {
      console.error(`❌ Node ${nodeId} not found or has no pins`);
    }
  }

  private async syncPinToLegacySystemSync(pin: Pin): Promise<void> {
    // Extract nodeId and pinName from the pin ID format "nodeId.pinName"
    const [nodeId, pinName] = pin.id.split('.');
    
    console.log(`🔄 Syncing pin ${pin.id} to legacy system synchronously...`);
    console.log(`📍 Pin position data:`, pin.position);
    
    // Get the node from GraphStateService
    const nodes = this.graphStateService.getNodes();
    const node = nodes.find(n => n.id === nodeId);
    
    console.log(`🔍 Found node:`, node ? 'YES' : 'NO');
    console.log(`📌 Node has pins:`, node?.pins ? `YES (${node.pins.length})` : 'NO');
    
    if (node && node.pins) {
      // Find the legacy pin and update its position
      const legacyPin = node.pins.find(p => p.name === pinName);
      console.log(`🎯 Found legacy pin:`, legacyPin ? 'YES' : 'NO');
      
      if (legacyPin) {
        console.log(`📍 BEFORE: Legacy pin ${pinName} at x=${legacyPin.x}, y=${legacyPin.y}`);
        
        // Update the legacy pin position with the new coordinates
        legacyPin.x = pin.position.x;
        legacyPin.y = pin.position.y;
        
        console.log(`📍 AFTER: Legacy pin ${pinName} at x=${legacyPin.x}, y=${legacyPin.y}`);
        console.log(`💾 Updating node in GraphStateService synchronously...`);
        
        // Use the synchronous update method and wait for completion
        await this.graphStateService.updateNodeSync(nodeId, { ...node });
        
        console.log(`✅ Node update and persistence completed for ${nodeId}`);
      } else {
        console.error(`❌ Legacy pin ${pinName} not found in node ${nodeId}`);
        throw new Error(`Legacy pin ${pinName} not found in node ${nodeId}`);
      }
    } else {
      console.error(`❌ Node ${nodeId} not found or has no pins`);
      throw new Error(`Node ${nodeId} not found or has no pins`);
    }
  }

  resetChanges(): void {
    this.initializeEditor();
  }

  closeEditor(): void {
    console.log('Closing pin layout editor');
    this.pinStateService.closeLayoutEditor();
  }

  setActiveTab(tab: 'position' | 'text' | 'batch'): void {
    this.activeTab = tab;
  }

  getGroupedPinsArray(): Array<[string, Pin[]]> {
    return Array.from(this.groupedPins.entries());
  }
  
  // TrackBy functions for better performance
  trackByPinId(index: number, pin: Pin): string {
    return pin.id;
  }
  
  trackByNodeId(index: number, item: [string, Pin[]]): string {
    return item[0]; // nodeId
  }
  
  togglePreviewMode(): void {
    console.log('Preview mode toggled:', this.previewMode);
    
    if (this.previewMode) {
      // Clear cache and initialize preview
      this.refreshPreview();
    } else {
      // Revert to original state (reload from service)
      this.initializeEditor();
    }
  }

  /**
   * Refresh the preview by clearing caches and updating view
   */
  refreshPreview(): void {
    this.nodeInfoCache.clear();
    this.resetPreviewView();
    this.regroupPins();
    this.cdr.detectChanges();
    console.log('🔄 Preview refreshed');
  }
  
  private applyPinUpdate(pinId: string, updates: Partial<Pin>): void {
    this.pinStateService.updatePin(pinId, updates);
  }
  
  private applyAllChangesForPreview(): void {
    this.editingPins.forEach(pin => {
      this.pinStateService.updatePin(pin.id, {
        position: pin.position,
        textStyle: pin.textStyle,
        pinStyle: pin.pinStyle
      });
    });
  }
  
  // Grid snapping functionality
  snapToGrid(value: number, gridSize: number = 5): number {
    return Math.round(value / gridSize) * gridSize;
  }
  
  toggleGridSnap(): void {
    this.pinStateService.toggleGridSnap();
  }
  
  get gridSnapEnabled(): boolean {
    // This could be made reactive, but for simplicity we'll use a getter
    let enabled = true;
    this.pinStateService.modeState$.subscribe((state: PinModeState) => {
      enabled = state.gridSnap;
    }).unsubscribe();
    return enabled;
  }

  // ===== LIVE PREVIEW METHODS =====

  /**
   * Get the node information from GraphStateService with caching
   */
  private getNodeInfo(nodeId: string): any {
    if (!this.nodeInfoCache.has(nodeId)) {
      const nodes = this.graphStateService.getNodes();
      const node = nodes.find(n => n.id === nodeId);
      this.nodeInfoCache.set(nodeId, node || null);
    }
    return this.nodeInfoCache.get(nodeId);
  }

  /**
   * Get preview viewBox for the SVG container
   */
  getPreviewViewBox(): string {
    if (this.groupedPins.size === 0) {
      return '0 0 400 300';
    }

    const nodeIds = Array.from(this.groupedPins.keys());
    
    // For single node, use a compact view
    if (nodeIds.length === 1) {
      const nodeSize = this.getNodePreviewSize(nodeIds[0]);
      const padding = 80; // Extra padding for pins that extend outside
      const width = (nodeSize.width + 2 * padding) / this.previewZoom;
      const height = (nodeSize.height + 2 * padding) / this.previewZoom;
      
      return `0 0 ${width} ${height}`;
    }

    // For multiple nodes, calculate grid layout bounds
    const cols = Math.min(3, nodeIds.length);
    const rows = Math.ceil(nodeIds.length / cols);
    
    const maxNodeWidth = 120;
    const maxNodeHeight = 80;
    const horizontalSpacing = maxNodeWidth + 60;
    const verticalSpacing = maxNodeHeight + 40;
    const padding = 40;
    
    const totalWidth = (cols * horizontalSpacing + 2 * padding) / this.previewZoom;
    const totalHeight = (rows * verticalSpacing + 2 * padding) / this.previewZoom;

    return `0 0 ${totalWidth} ${totalHeight}`;
  }

  /**
   * Get node preview position for rendering
   */
  getNodePreviewPosition(nodeId: string): { x: number; y: number } {
    const nodeInfo = this.getNodeInfo(nodeId);
    if (!nodeInfo) {
      return { x: 50, y: 50 };
    }

    const nodeIds = Array.from(this.groupedPins.keys());
    
    // If only one node, center it in the preview
    if (nodeIds.length === 1) {
      return {
        x: 50, // Centered with padding
        y: 50
      };
    }
    
    // For multiple nodes, arrange them in a clean grid layout
    const nodeIndex = nodeIds.indexOf(nodeId);
    const cols = Math.min(3, nodeIds.length); // Max 3 columns
    const col = nodeIndex % cols;
    const row = Math.floor(nodeIndex / cols);
    
    // Calculate spacing based on max node sizes
    const maxNodeWidth = 120;
    const maxNodeHeight = 80;
    const horizontalSpacing = maxNodeWidth + 60; // Extra space for pins and labels
    const verticalSpacing = maxNodeHeight + 40;
    
    return {
      x: 50 + col * horizontalSpacing,
      y: 50 + row * verticalSpacing
    };
  }

  /**
   * Get node preview size
   */
  getNodePreviewSize(nodeId: string): { width: number; height: number } {
    const nodeInfo = this.getNodeInfo(nodeId);
    if (!nodeInfo) {
      return { width: 120, height: 80 };
    }

    return {
      width: nodeInfo.width || 120,
      height: nodeInfo.height || 80
    };
  }

  /**
   * Get node color based on type
   */
  getNodeColor(nodeId: string): string {
    const nodeInfo = this.getNodeInfo(nodeId);
    if (!nodeInfo) {
      return '#4a90e2';
    }

    // Color coding based on node type
    const colorMap: { [key: string]: string } = {
      'power': '#ff6b35',
      'ic': '#4a90e2',
      'resistor': '#8e44ad',
      'capacitor': '#2ecc71',
      'led': '#f1c40f',
      'switch': '#e74c3c',
      'component': '#95a5a6',
      'node': '#34495e'
    };

    return colorMap[nodeInfo.type] || '#4a90e2';
  }

  /**
   * Get absolute pin position in preview coordinates - matches graph editor logic
   */
  getAbsolutePinPosition(pin: Pin): { x: number; y: number } {
    const nodeId = pin.nodeId;
    const nodePos = this.getNodePreviewPosition(nodeId);
    const nodeSize = this.getNodePreviewSize(nodeId);
    const nodeInfo = this.getNodeInfo(nodeId);
    
    // Use the same shape-aware logic as graph editor
    const shape = nodeInfo?.shape || 'rectangle';
    
    return this.calculatePinPositionForShape(pin, nodePos, nodeSize, shape);
  }

  /**
   * Shape-aware algorithmic positioning for pins - matches graph editor logic
   */
  private calculatePinPositionForShape(
    pin: Pin, 
    nodePos: { x: number; y: number }, 
    nodeSize: { width: number; height: number }, 
    shape: 'rectangle' | 'circle' | 'polygon'
  ): { x: number; y: number } {
    const { side, offset } = pin.position;
    
    // Always prioritize side and offset for semantic positioning
    // Only use x,y coordinates as fallback when side is not properly defined
    if (side && typeof offset === 'number') {
      switch (shape) {
        case 'rectangle':
          return this.calculateRectangularPinPosition(pin, nodePos, nodeSize);
        case 'circle':
          return this.calculateCircularPinPosition(pin, nodePos, nodeSize);
        case 'polygon':
          // For future extension - currently fallback to rectangle
          return this.calculateRectangularPinPosition(pin, nodePos, nodeSize);
        default:
          return this.calculateRectangularPinPosition(pin, nodePos, nodeSize);
      }
    }
    
    // Fallback to absolute x,y coordinates only when semantic positioning is not available
    return {
      x: nodePos.x + pin.position.x,
      y: nodePos.y + pin.position.y
    };
  }

  /**
   * Calculate pin position for rectangular nodes
   */
  private calculateRectangularPinPosition(
    pin: Pin, 
    nodePos: { x: number; y: number }, 
    nodeSize: { width: number; height: number }
  ): { x: number; y: number } {
    const { side, offset } = pin.position;
    let pinX: number, pinY: number;
    
    switch (side) {
      case 'top':
        pinX = nodePos.x + (nodeSize.width * offset);
        pinY = nodePos.y;
        break;
      case 'right':
        pinX = nodePos.x + nodeSize.width;
        pinY = nodePos.y + (nodeSize.height * offset);
        break;
      case 'bottom':
        pinX = nodePos.x + (nodeSize.width * offset);
        pinY = nodePos.y + nodeSize.height;
        break;
      case 'left':
        pinX = nodePos.x;
        pinY = nodePos.y + (nodeSize.height * offset);
        break;
      default:
        console.warn(`Unknown pin side: ${side}, falling back to center`);
        pinX = nodePos.x + nodeSize.width / 2;
        pinY = nodePos.y + nodeSize.height / 2;
    }

    return { x: pinX, y: pinY };
  }

  /**
   * Calculate pin position for circular nodes
   */
  private calculateCircularPinPosition(
    pin: Pin, 
    nodePos: { x: number; y: number }, 
    nodeSize: { width: number; height: number }
  ): { x: number; y: number } {
    const { side, offset } = pin.position;
    const centerX = nodePos.x + nodeSize.width / 2;
    const centerY = nodePos.y + nodeSize.height / 2;
    const radius = Math.min(nodeSize.width, nodeSize.height) / 2;
    
    let angle = 0;
    
    // Map sides to angles and adjust by offset
    switch (side) {
      case 'top':
        angle = -Math.PI / 2 + (offset - 0.5) * Math.PI; // Top arc
        break;
      case 'right':
        angle = 0 + (offset - 0.5) * Math.PI; // Right arc
        break;
      case 'bottom':
        angle = Math.PI / 2 + (offset - 0.5) * Math.PI; // Bottom arc
        break;
      case 'left':
        angle = Math.PI + (offset - 0.5) * Math.PI; // Left arc
        break;
      default:
        console.warn(`Unknown pin side: ${side}, falling back to center`);
        return { x: centerX, y: centerY };
    }
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  }

  /**
   * Get connection point on node edge for guide line
   */
  getNodeEdgeConnection(pin: Pin): { x: number; y: number } {
    const nodeId = pin.nodeId;
    const nodePos = this.getNodePreviewPosition(nodeId);
    const nodeSize = this.getNodePreviewSize(nodeId);
    const pinPos = this.getAbsolutePinPosition(pin);

    // For pins positioned using side/offset, connect to the appropriate edge
    if (pin.position.side) {
      switch (pin.position.side) {
        case 'top':
          return { x: pinPos.x, y: nodePos.y };
        case 'right':
          return { x: nodePos.x + nodeSize.width, y: pinPos.y };
        case 'bottom':
          return { x: pinPos.x, y: nodePos.y + nodeSize.height };
        case 'left':
          return { x: nodePos.x, y: pinPos.y };
      }
    }

    // For legacy x,y positioned pins, calculate closest edge point
    const nodeCenterX = nodePos.x + nodeSize.width / 2;
    const nodeCenterY = nodePos.y + nodeSize.height / 2;
    const dx = pinPos.x - nodeCenterX;
    const dy = pinPos.y - nodeCenterY;

    // Clamp the connection point to the node edges
    let connectionX = pinPos.x;
    let connectionY = pinPos.y;

    if (pinPos.x < nodePos.x) {
      connectionX = nodePos.x; // Left edge
    } else if (pinPos.x > nodePos.x + nodeSize.width) {
      connectionX = nodePos.x + nodeSize.width; // Right edge
    }

    if (pinPos.y < nodePos.y) {
      connectionY = nodePos.y; // Top edge
    } else if (pinPos.y > nodePos.y + nodeSize.height) {
      connectionY = nodePos.y + nodeSize.height; // Bottom edge
    }

    // If pin is inside the node, find the closest edge
    if (pinPos.x >= nodePos.x && pinPos.x <= nodePos.x + nodeSize.width &&
        pinPos.y >= nodePos.y && pinPos.y <= nodePos.y + nodeSize.height) {
      
      const distToLeft = pinPos.x - nodePos.x;
      const distToRight = (nodePos.x + nodeSize.width) - pinPos.x;
      const distToTop = pinPos.y - nodePos.y;
      const distToBottom = (nodePos.y + nodeSize.height) - pinPos.y;
      
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      
      if (minDist === distToLeft) {
        connectionX = nodePos.x;
      } else if (minDist === distToRight) {
        connectionX = nodePos.x + nodeSize.width;
      } else if (minDist === distToTop) {
        connectionY = nodePos.y;
      } else {
        connectionY = nodePos.y + nodeSize.height;
      }
    }

    return { x: connectionX, y: connectionY };
  }

  /**
   * Get SVG text transform for pin text rotation
   */
  getPinTextTransform(pin: Pin): string {
    const pos = this.getAbsolutePinPosition(pin);
    const rotation = pin.textStyle?.orientation || 0;
    
    if (rotation === 0) {
      return '';
    }
    
    return `rotate(${rotation} ${pos.x} ${pos.y})`;
  }

  /**
   * Convert vertical alignment to SVG dominant-baseline
   */
  getVerticalAlignment(alignment: string): string {
    switch (alignment) {
      case 'top': return 'hanging';
      case 'middle': return 'middle';
      case 'bottom': return 'baseline';
      default: return 'middle';
    }
  }

  /**
   * Update preview zoom level
   */
  updatePreviewZoom(zoom: number): void {
    this.previewZoom = zoom;
    console.log('Preview zoom updated to:', zoom);
  }

  /**
   * Reset preview view to default
   */
  resetPreviewView(): void {
    this.previewZoom = 1.0;
    this.previewOffset = { x: 0, y: 0 };
    console.log('Preview view reset');
  }

}
