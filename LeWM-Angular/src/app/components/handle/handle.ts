import { Component, Input, Output, EventEmitter, HostListener, HostBinding, OnDestroy, inject } from '@angular/core';
import { LayoutStateService } from '../../services/layout-state.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-handle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './handle.html',
  styleUrl: './handle.scss'
})
export class HandleComponent implements OnDestroy {
  @Input() orientation: 'horizontal' | 'vertical' = 'vertical';
  @Output() positionChange = new EventEmitter<number>();
  @Output() positionChangeStart = new EventEmitter<void>();
  @Output() positionChangeEnd = new EventEmitter<void>();

  @HostBinding('class.horizontal') get isHorizontal() { return this.orientation === 'horizontal'; }
  @HostBinding('class.vertical') get isVertical() { return this.orientation === 'vertical'; }

  private isResizing = false;
  private resizeStartX = 0;
  private resizeStartY = 0;

  // Bound methods for event listeners
  private resizeMoveHandler = (event: MouseEvent) => this.onResizeMove(event);
  private resizeEndHandler = () => this.onResizeEnd();

  private layoutStateService = inject(LayoutStateService);

  @HostListener('mousedown', ['$event'])
  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    
    // Set global resize state
    this.layoutStateService.setResizing(true);
    
    // Emit resize start event to parent
    this.positionChangeStart.emit();
    
    // Add global listeners for mouse move and up
    document.addEventListener('mousemove', this.resizeMoveHandler);
    document.addEventListener('mouseup', this.resizeEndHandler);
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    
    // Calculate delta based on orientation
    const delta = this.orientation === 'horizontal' 
      ? event.clientY - this.resizeStartY
      : event.clientX - this.resizeStartX;
    
    // Emit the delta to the parent component
    this.positionChange.emit(delta);
  }

  private onResizeEnd(): void {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    
    // Clear global resize state
    this.layoutStateService.setResizing(false);
    
    // Remove global listeners
    document.removeEventListener('mousemove', this.resizeMoveHandler);
    document.removeEventListener('mouseup', this.resizeEndHandler);
    
    // Emit resize end event to parent
    this.positionChangeEnd.emit();
  }

  ngOnDestroy(): void {
    // Clean up event listeners if component is destroyed during resize
    document.removeEventListener('mousemove', this.resizeMoveHandler);
    document.removeEventListener('mouseup', this.resizeEndHandler);
    
    // Clear global resize state if component was destroyed during resize
    if (this.isResizing) {
      this.layoutStateService.setResizing(false);
    }
  }

  get resizing(): boolean {
    return this.isResizing;
  }
}
