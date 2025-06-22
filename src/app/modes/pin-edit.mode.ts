import { Injectable } from '@angular/core';
import { GraphMode } from '../interfaces/graph-mode.interface';
import { PinStateService } from '../services/pin-state.service';
import { GraphStateService } from '../services/graph-state.service';

@Injectable({
  providedIn: 'root'
})
export class PinEditMode implements GraphMode {
  name = 'Pin Edit';

  constructor(
    private pinState: PinStateService,
    private graphState: GraphStateService
  ) {}

  activate(): void {
    console.log('Activating Pin Edit Mode');
    this.pinState.setPinModeActive(true);
    
    // Add global keyboard listener for pin mode
    document.addEventListener('keydown', this.handleGlobalKeyboard.bind(this), true);
  }

  deactivate(): void {
    console.log('Deactivating Pin Edit Mode');
    this.pinState.setPinModeActive(false);
    this.pinState.clearSelection();
    
    // Remove global keyboard listener
    document.removeEventListener('keydown', this.handleGlobalKeyboard.bind(this), true);
  }

  private handleGlobalKeyboard(event: KeyboardEvent): void {
    console.log('Pin Edit Mode - Global keyboard event:', {
      key: event.key,
      target: (event.target as Element)?.tagName,
      activeElement: document.activeElement?.tagName
    });

    // Don't handle if typing in an input field
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      console.log('Ignoring keyboard event in input field');
      return;
    }

    const handled = this.pinState.handleKeyboard(event);
    if (handled) {
      console.log('Keyboard event handled by pin state service');
      event.preventDefault();
      event.stopPropagation();
    } else {
      console.log('Keyboard event not handled by pin state service');
    }
  }

  handleNodeClick(node: any, event: MouseEvent): void {
    // In pin edit mode, clicking nodes selects them but doesn't allow deletion
    console.log('Node clicked in Pin Edit Mode:', node.id);
    // Show side indicators for pin placement
  }

  handlePinClick(node: any, pin: any, event: MouseEvent): void {
    // Handle pin selection with multi-select support
    const isMultiSelect = event.shiftKey || event.ctrlKey;
    console.log('Pin clicked in Pin Edit Mode:', pin.id, 'multiSelect:', isMultiSelect);
    this.pinState.selectPin(pin.id, isMultiSelect);
  }

  handleCanvasClick(event: MouseEvent): void {
    // Clear pin selection when clicking empty canvas
    this.pinState.clearSelection();
  }

  renderOverlay(canvas: SVGElement): void {
    // Render pin edit mode specific overlays (side indicators, etc.)
  }
}
