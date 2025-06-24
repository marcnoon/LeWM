import { Component, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-handle',
  standalone: false,
  templateUrl: './handle.html',
  styleUrl: './handle.scss'
})
export class HandleComponent implements OnDestroy {
  @Output() resize = new EventEmitter<number>();
  @Output() resizeStart = new EventEmitter<void>();
  @Output() resizeEnd = new EventEmitter<void>();

  private isResizing = false;
  private resizeStartX = 0;

  // Bound methods for event listeners
  private resizeMoveHandler = (event: MouseEvent) => this.onResizeMove(event);
  private resizeEndHandler = () => this.onResizeEnd();

  @HostListener('mousedown', ['$event'])
  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.isResizing = true;
    this.resizeStartX = event.clientX;
    
    // Emit resize start event to parent
    this.resizeStart.emit();
    
    // Add global listeners for mouse move and up
    document.addEventListener('mousemove', this.resizeMoveHandler);
    document.addEventListener('mouseup', this.resizeEndHandler);
    
    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    
    const deltaX = event.clientX - this.resizeStartX;
    
    // Emit the delta to the parent component
    this.resize.emit(deltaX);
  }

  private onResizeEnd(): void {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    
    // Remove global listeners
    document.removeEventListener('mousemove', this.resizeMoveHandler);
    document.removeEventListener('mouseup', this.resizeEndHandler);
    
    // Restore default cursor and text selection
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Emit resize end event to parent
    this.resizeEnd.emit();
  }

  ngOnDestroy(): void {
    // Clean up event listeners if component is destroyed during resize
    document.removeEventListener('mousemove', this.resizeMoveHandler);
    document.removeEventListener('mouseup', this.resizeEndHandler);
    
    // Restore default styles if component was destroyed during resize
    if (this.isResizing) {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
  }

  get resizing(): boolean {
    return this.isResizing;
  }
}
