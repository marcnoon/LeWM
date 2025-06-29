import { Injectable, inject } from '@angular/core';
import { PinStateService } from './pin-state.service';
import { GraphStateService } from './graph-state.service';
import { Pin, DEFAULT_PIN_TEXT_STYLE, DEFAULT_PIN_STYLE } from '../interfaces/pin.interface';

// Define a type for the legacy pin structure
interface LegacyPin {
  name: string;
  x: number;
  y: number;
  type?: string;
  pinNumber?: string;
  signalName?: string;
  pinSize?: number;
  pinColor?: string;
  showPinNumber?: boolean;
  dataType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PinSyncService {
  private pinStateService = inject(PinStateService);
  private graphStateService = inject(GraphStateService);

  constructor() {
    this.initializeSync();
  }

  private initializeSync(): void {
    console.log('🔄 Initializing pin sync service');
    // On startup, import all legacy pins to PinStateService
    const nodes = this.graphStateService.getNodes();
    nodes.forEach(node => {
      if (node.pins) {
        node.pins.forEach(legacyPin => {
          this.syncLegacyToEnhanced(node.id, legacyPin);
        });
      }
    });
  }

  syncLegacyToEnhanced(nodeId: string, legacyPin: LegacyPin): void {
    const pinId = `${nodeId}.${legacyPin.name}`;
    
    // Check if already exists in enhanced system
    const existingPin = this.pinStateService.getPin(pinId);
    if (existingPin) {
      // Update position only if changed
      if (existingPin.position.x !== legacyPin.x || existingPin.position.y !== legacyPin.y) {
        this.pinStateService.updatePinPosition(pinId, {
          x: legacyPin.x,
          y: legacyPin.y,
          side: this.detectSide(nodeId, legacyPin),
          offset: 0
        });
      }
      return;
    }

    // Create enhanced pin from legacy
    const enhancedPin: Pin = {
      id: pinId,
      nodeId: nodeId,
      label: legacyPin.name,
      position: {
        x: legacyPin.x || 0,
        y: legacyPin.y || 0,
        side: this.detectSide(nodeId, legacyPin),
        offset: 0
      },
      pinType: (legacyPin.type as Pin['pinType']) || 'bidirectional',
      textStyle: { ...DEFAULT_PIN_TEXT_STYLE },
      pinStyle: { ...DEFAULT_PIN_STYLE },
      isInput: true,
      isOutput: true,
      isSelected: false,
      pinNumber: legacyPin.pinNumber || '',
      signalName: legacyPin.signalName || legacyPin.name,
      pinSize: legacyPin.pinSize || 8,
      pinColor: legacyPin.pinColor || '#4CAF50',
      showPinNumber: legacyPin.showPinNumber || false,
      dataType: legacyPin.dataType
    };

    this.pinStateService.importPin(enhancedPin);
  }

  private detectSide(nodeId: string, pin: { x: number, y: number }): 'top' | 'right' | 'bottom' | 'left' {
    const node = this.graphStateService.getNodes().find(n => n.id === nodeId);
    if (!node) return 'left';

    const centerX = node.width / 2;
    const centerY = node.height / 2;
    
    const dx = Math.abs(pin.x - centerX);
    const dy = Math.abs(pin.y - centerY);

    if (dx > dy) {
      return pin.x < centerX ? 'left' : 'right';
    } else {
      return pin.y < centerY ? 'top' : 'bottom';
    }
  }

  /**
   * Sync all legacy pins to enhanced system
   */
  syncAllLegacyPins(): void {
    console.log('🔄 Syncing all legacy pins to enhanced system');
    const nodes = this.graphStateService.getNodes();
    nodes.forEach(node => {
      if (node.pins) {
        node.pins.forEach(legacyPin => {
          this.syncLegacyToEnhanced(node.id, legacyPin);
        });
      }
    });
  }

  /**
   * Sync a single pin from enhanced back to legacy system
   */
  syncEnhancedToLegacy(pin: Pin): void {
    const node = this.graphStateService.getNodes().find(n => n.id === pin.nodeId);
    if (!node || !node.pins) return;

    const legacyPin = node.pins.find(p => p.name === pin.label);
    if (legacyPin) {
      // Update the legacy pin with enhanced properties
      legacyPin.x = pin.position.x;
      legacyPin.y = pin.position.y;
      // Note: Legacy pins don't have a type property, so we don't sync that
      
      // Update the node in the graph state
      this.graphStateService.updateNode(pin.nodeId, node);
      console.log(`🔄 Synced enhanced pin ${pin.id} back to legacy system`);
    }
  }
}
