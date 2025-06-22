import { Component, OnInit, OnDestroy, OnChanges, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { PinStateService } from '../../services/pin-state.service';
import { Pin, PinSubMode } from '../../interfaces/pin.interface';

@Component({
  selector: 'app-pin-mode-toolbar',
  standalone: false,
  templateUrl: './pin-mode-toolbar.component.html',
  styleUrls: ['./pin-mode-toolbar.component.scss']
})
export class PinModeToolbarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible = false;

  selectedPins: Pin[] = [];
  gridSnap = true;
  showGuides = true;
  subMode: PinSubMode = 'layout';
  gridSize = 10;

  private subscriptions: Subscription[] = [];

  constructor(private pinState: PinStateService) {}

  ngOnInit(): void {
    // Subscribe to selected pins
    this.subscriptions.push(
      this.pinState.selectedPins$.subscribe(pins => {
        this.selectedPins = pins;
        console.log('Selected pins updated:', pins.length);
      })
    );

    // Subscribe to mode state
    this.subscriptions.push(
      this.pinState.modeState$.subscribe(state => {
        this.gridSnap = state.gridSnap;
        this.showGuides = state.showGuides;
        this.subMode = state.subMode;
      })
    );

    // Set pin mode active when component becomes visible
    this.subscriptions.push(
      // Watch for visibility changes
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.pinState.setPinModeActive(false);
  }

  ngOnChanges(): void {
    // Update pin mode active state when visibility changes
    console.log('Pin toolbar visibility changed:', this.visible);
    this.pinState.setPinModeActive(this.visible);
  }

  setSubMode(subMode: PinSubMode): void {
    this.pinState.setSubMode(subMode);
  }

  toggleGridSnap(): void {
    // Implementation for grid snap toggle
  }

  toggleGuides(): void {
    // Implementation for guides toggle
  }

  openLayoutEditor(): void {
    if (this.selectedPins.length > 0) {
      console.log('Opening layout editor from toolbar for', this.selectedPins.length, 'pins');
      this.pinState.openLayoutEditor();
    } else {
      console.log('Cannot open layout editor: no pins selected');
    }
  }

  updateTextStyle(property: string, event: any): void {
    const value = event.target.value;
    if (this.selectedPins.length > 0) {
      this.selectedPins.forEach(pin => {
        this.pinState.updatePinTextStyle(pin.id, { [property]: value });
      });
    }
  }

  updatePinProperty(property: string, event: any): void {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (this.selectedPins.length > 0) {
      this.selectedPins.forEach(pin => {
        this.pinState.updatePin(pin.id, { [property]: value });
      });
    }
  }

  alignPins(alignment: string): void {
    if (this.selectedPins.length < 2) return;
    
    // Get the reference pin (first selected)
    const referencePinPosition = this.selectedPins[0].position;
    
    this.selectedPins.slice(1).forEach(pin => {
      const newPosition = { ...pin.position };
      
      switch (alignment) {
        case 'left':
        case 'right':
        case 'center-h':
          // For horizontal alignment, we might adjust the side or offset
          // This is a simplified implementation
          newPosition.side = referencePinPosition.side;
          break;
        case 'top':
        case 'bottom':
        case 'center-v':
          // For vertical alignment
          newPosition.offset = referencePinPosition.offset;
          break;
      }
      
      this.pinState.updatePinPosition(pin.id, newPosition);
    });
  }

  distributePins(direction: 'horizontal' | 'vertical'): void {
    if (this.selectedPins.length < 3) return;
    
    // Sort pins by their current position
    const sortedPins = [...this.selectedPins].sort((a, b) => {
      if (direction === 'horizontal') {
        return a.position.offset - b.position.offset;
      } else {
        return a.position.offset - b.position.offset;
      }
    });
    
    // Calculate equal spacing
    const spacing = 1 / (sortedPins.length + 1);
    
    sortedPins.forEach((pin, index) => {
      const newPosition = { ...pin.position };
      newPosition.offset = spacing * (index + 1);
      this.pinState.updatePinPosition(pin.id, newPosition);
    });
  }

  updateGridSize(event: any): void {
    this.gridSize = parseInt(event.target.value);
  }

  snapToGrid(): void {
    if (this.selectedPins.length === 0) return;
    
    this.selectedPins.forEach(pin => {
      const newPosition = { ...pin.position };
      // Snap offset to grid
      newPosition.offset = Math.round(newPosition.offset * this.gridSize) / this.gridSize;
      this.pinState.updatePinPosition(pin.id, newPosition);
    });
  }
}
