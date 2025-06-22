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

  applyChanges(): void {
    console.log('Applying changes to', this.editingPins.length, 'pins');
    
    // Update both the PinStateService and sync back to legacy system
    this.editingPins.forEach(pin => {
      // Update the enhanced pin system
      this.pinStateService.updatePin(pin.id, {
        position: pin.position,
        textStyle: pin.textStyle,
        pinStyle: pin.pinStyle
      });
      
      // Sync changes back to the legacy node.pins system
      this.syncPinToLegacySystem(pin);
    });
    
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
      // Apply all current changes for preview
      this.applyAllChangesForPreview();
    } else {
      // Revert to original state (reload from service)
      this.initializeEditor();
    }
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
}
