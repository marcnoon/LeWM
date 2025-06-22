import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { PinStateService } from '../../services/pin-state.service';
import { Pin, PinPosition, PinTextStyle } from '../../interfaces/pin.interface';

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

  constructor(private pinState: PinStateService) {}

  ngOnInit(): void {
    // Subscribe to layout editor visibility
    this.subscriptions.push(
      this.pinState.layoutEditorVisible$.subscribe(visible => {
        this.visible = visible;
        if (visible) {
          this.initializeEditor();
        }
      })
    );

    // Subscribe to selected pins
    this.subscriptions.push(
      this.pinState.selectedPins$.subscribe(pins => {
        this.selectedPins = pins;
        if (this.visible && pins.length > 0) {
          this.initializeEditor();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    
    if (this.selectedPins.length === 0) {
      console.warn('No pins provided to editor');
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
    this.editingPins = this.editingPins.map(pin => {
      if (pin.id === pinId) {
        return {
          ...pin,
          position: { ...pin.position, [field]: value }
        };
      }
      return pin;
    });
    
    // Update grouped pins reference
    this.regroupPins();
  }

  updatePinTextStyle(pinId: string, field: keyof PinTextStyle, value: any): void {
    this.editingPins = this.editingPins.map(pin => {
      if (pin.id === pinId) {
        return {
          ...pin,
          textStyle: { ...pin.textStyle, [field]: value }
        };
      }
      return pin;
    });
    
    this.regroupPins();
  }

  updatePinTextOffset(pinId: string, axis: 'x' | 'y', value: number): void {
    this.editingPins = this.editingPins.map(pin => {
      if (pin.id === pinId) {
        return {
          ...pin,
          textStyle: {
            ...pin.textStyle,
            offset: { ...pin.textStyle.offset, [axis]: value }
          }
        };
      }
      return pin;
    });
    
    this.regroupPins();
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

  // Batch operations for multiple pins
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

  applyFontToAll(nodeId: string, fontProperty: keyof PinTextStyle, value: any): void {
    const nodePins = this.groupedPins.get(nodeId) || [];
    nodePins.forEach(pin => {
      this.updatePinTextStyle(pin.id, fontProperty, value);
    });
  }

  applyChanges(): void {
    console.log('Applying changes to', this.editingPins.length, 'pins');
    
    this.editingPins.forEach(pin => {
      this.pinState.updatePin(pin.id, {
        position: pin.position,
        textStyle: pin.textStyle,
        pinStyle: pin.pinStyle
      });
    });
    
    this.closeEditor();
  }

  resetChanges(): void {
    this.initializeEditor();
  }

  closeEditor(): void {
    console.log('Closing pin layout editor');
    this.pinState.closeLayoutEditor();
  }

  setActiveTab(tab: 'position' | 'text' | 'batch'): void {
    this.activeTab = tab;
  }

  getGroupedPinsArray(): Array<[string, Pin[]]> {
    return Array.from(this.groupedPins.entries());
  }
}
