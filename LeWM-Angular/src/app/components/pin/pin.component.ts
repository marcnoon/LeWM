import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

export interface PinCoords {
  x: number;
  y: number;
}

@Component({
  selector: 'app-pin',
  standalone: false,
  templateUrl: './pin.component.html',
  styleUrls: ['./pin.component.scss']
})
export class PinComponent implements OnChanges {
  @Input() pin: any; // Pin data with position, style, etc.
  @Input() node: any; // Node data for calculating absolute position
  @Input() isSelected: boolean = false;
  
  @Output() pinSelected = new EventEmitter<string>();
  
  pinCoords: PinCoords = { x: 0, y: 0 };
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pin'] || changes['node']) {
      this.updatePinPosition();
    }
  }
  
  private updatePinPosition(): void {
    if (!this.pin || !this.node) {
      return;
    }
    
    // Calculate numeric coordinates based on pin position
    if (this.pin.position) {
      // Use semantic positioning (side/offset) if available
      if (this.pin.position.side && typeof this.pin.position.offset === 'number') {
        const coords = this.calculatePinPositionFromSide();
        this.pinCoords = {
          x: coords.x,
          y: coords.y
        };
      } else {
        // Fallback to x/y coordinates
        this.pinCoords = {
          x: this.node.x + (this.pin.position.x || 0),
          y: this.node.y + (this.pin.position.y || 0)
        };
      }
    } else {
      // Legacy pin support
      this.pinCoords = {
        x: this.node.x + (this.pin.x || 0),
        y: this.node.y + (this.pin.y || 0)
      };
    }
  }
  
  private calculatePinPositionFromSide(): { x: number, y: number } {
    const { side, offset } = this.pin.position;
    const nodeX = this.node.x;
    const nodeY = this.node.y;
    const nodeWidth = this.node.width;
    const nodeHeight = this.node.height;
    
    switch (side) {
      case 'top':
        return {
          x: nodeX + (nodeWidth * offset),
          y: nodeY
        };
      case 'right':
        return {
          x: nodeX + nodeWidth,
          y: nodeY + (nodeHeight * offset)
        };
      case 'bottom':
        return {
          x: nodeX + (nodeWidth * offset),
          y: nodeY + nodeHeight
        };
      case 'left':
        return {
          x: nodeX,
          y: nodeY + (nodeHeight * offset)
        };
      default:
        return {
          x: nodeX + (this.pin.position.x || 0),
          y: nodeY + (this.pin.position.y || 0)
        };
    }
  }
  
  onPinClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.pin.id && this.isSelected) {
      this.pinSelected.emit(this.pin.id);
    }
  }
}