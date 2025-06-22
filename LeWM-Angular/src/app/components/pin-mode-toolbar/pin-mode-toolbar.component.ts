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
}
