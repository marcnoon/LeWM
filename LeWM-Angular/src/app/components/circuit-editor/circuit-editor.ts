import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';

interface CircuitComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface AvailableComponent {
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
  selector: 'app-circuit-editor',
  standalone: false,
  templateUrl: './circuit-editor.component.html',
  styleUrl: './circuit-editor.component.scss'
})
export class CircuitEditor {
  @ViewChild('svgCanvas', { static: true }) svgCanvas!: ElementRef<SVGElement>;

  components: CircuitComponent[] = [
    { id: 'power1', type: 'power', x: 100, y: 150, width: 80, height: 60, label: '9V Battery' },
    { id: 'resistor1', type: 'resistor', x: 250, y: 200, width: 60, height: 20, label: '10kΩ' },
    { id: 'led1', type: 'led', x: 400, y: 190, width: 30, height: 20, label: 'LED' }
  ];

  availableComponents: AvailableComponent[] = [
    { type: 'power', label: '9V Battery', width: 80, height: 60 },
    { type: 'resistor', label: 'Resistor', width: 60, height: 20 },
    { type: 'capacitor', label: 'Capacitor', width: 40, height: 40 },
    { type: 'led', label: 'LED', width: 30, height: 20 },
    { type: 'switch', label: 'Switch', width: 50, height: 30 },
    { type: 'ic', label: 'IC Chip', width: 80, height: 60 },
    { type: 'component', label: 'Generic', width: 60, height: 40 }
  ];

  selectedComponents = new Set<string>();
  dragging = false;
  dragOffset = { x: 0, y: 0 };
  selectionBox: SelectionBox | null = null;
  isCtrlPressed = false;
  initialPositions: { [key: string]: { x: number, y: number } } = {};

  // Expose Math to template
  Math = Math;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control' || event.key === 'Meta') {
      this.isCtrlPressed = true;
    }
    if (event.key === 'Delete' && this.selectedComponents.size > 0) {
      this.deleteSelectedComponents();
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control' || event.key === 'Meta') {
      this.isCtrlPressed = false;
    }
  }

  addComponent(type: string): void {
    const template = this.availableComponents.find(c => c.type === type);
    if (!template) return;

    const newId = `${type}_${Date.now()}`;
    const newComponent: CircuitComponent = {
      id: newId,
      type: type,
      x: 50 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      width: template.width,
      height: template.height,
      label: template.label
    };

    this.components.push(newComponent);
  }

  clearConnections(): void {
    // Placeholder for connection clearing logic
    console.log('Connections cleared');
  }

  deleteSelectedComponents(): void {
    const idsToRemove = Array.from(this.selectedComponents);
    this.components = this.components.filter(comp => !idsToRemove.includes(comp.id));
    this.selectedComponents.clear();
  }

  onMouseDown(event: MouseEvent): void {
    if (event.target === this.svgCanvas.nativeElement || 
        (event.target as Element).id === 'grid-rect') {
      this.handleCanvasMouseDown(event);
    }
  }

  onComponentMouseDown(event: MouseEvent, compId: string): void {
    event.stopPropagation();
    const comp = this.components.find(c => c.id === compId);
    if (!comp) return;

    const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    if (this.isCtrlPressed) {
      // Toggle selection with Ctrl
      if (this.selectedComponents.has(compId)) {
        this.selectedComponents.delete(compId);
      } else {
        this.selectedComponents.add(compId);
      }
    } else {
      // Regular click - select only this component or start dragging
      if (!this.selectedComponents.has(compId)) {
        this.selectedComponents.clear();
        this.selectedComponents.add(compId);
      }
      
      // Start dragging
      this.dragging = true;
      
      // Store initial positions of all selected components
      this.initialPositions = {};
      this.components.forEach(c => {
        if (this.selectedComponents.has(c.id)) {
          this.initialPositions[c.id] = { x: c.x, y: c.y };
        }
      });
      
      this.dragOffset = {
        x: mouseX - comp.x,
        y: mouseY - comp.y
      };
    }
  }

  onMouseMove(event: MouseEvent): void {
    const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    if (this.selectionBox) {
      // Update selection box
      this.selectionBox.endX = mouseX;
      this.selectionBox.endY = mouseY;

      // Update selected components based on selection box
      this.selectedComponents.clear();
      this.components.forEach(comp => {
        if (this.isComponentInSelectionBox(comp, this.selectionBox!)) {
          this.selectedComponents.add(comp.id);
        }
      });
    } else if (this.dragging && this.selectedComponents.size > 0) {
      // Move all selected components
      const deltaX = mouseX - this.dragOffset.x;
      const deltaY = mouseY - this.dragOffset.y;

      // Get the first selected component as reference
      const firstSelectedId = Array.from(this.selectedComponents)[0];
      const initialFirst = this.initialPositions[firstSelectedId];

      if (initialFirst) {
        const offsetX = deltaX - initialFirst.x;
        const offsetY = deltaY - initialFirst.y;

        this.components.forEach(comp => {
          if (this.selectedComponents.has(comp.id)) {
            const initial = this.initialPositions[comp.id];
            comp.x = Math.max(0, initial.x + offsetX);
            comp.y = Math.max(0, initial.y + offsetY);
          }
        });
      }
    }
  }

  onMouseUp(event?: MouseEvent): void {
    this.dragging = false;
    this.selectionBox = null;
    this.initialPositions = {};
  }

  private handleCanvasMouseDown(event: MouseEvent): void {
    const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    if (this.isCtrlPressed) {
      // Start selection box
      this.selectionBox = {
        startX: mouseX,
        startY: mouseY,
        endX: mouseX,
        endY: mouseY
      };
    } else {
      // Click on empty space without Ctrl - clear selection
      this.selectedComponents.clear();
    }
  }

  private isComponentInSelectionBox(comp: CircuitComponent, box: SelectionBox): boolean {
    const minX = Math.min(box.startX, box.endX);
    const maxX = Math.max(box.startX, box.endX);
    const minY = Math.min(box.startY, box.endY);
    const maxY = Math.max(box.startY, box.endY);
    
    // Check if component rectangle intersects with selection box
    return !(comp.x + comp.width < minX || 
             comp.x > maxX || 
             comp.y + comp.height < minY || 
             comp.y > maxY);
  }
}
