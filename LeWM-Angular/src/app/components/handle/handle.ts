import { Component, Input, Output, EventEmitter, HostListener, HostBinding, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-handle',
  standalone: false,
  templateUrl: './handle.html',
  styleUrl: './handle.scss'
})
export class HandleComponent implements OnDestroy {
  @Input() orientation: 'horizontal' | 'vertical' = 'vertical';
  @Output() resize = new EventEmitter<number>();
  @Output() resizeStart = new EventEmitter<void>();
  @Output() resizeEnd = new EventEmitter<void>();

  @HostBinding('class.horizontal') get isHorizontal() { return this.orientation === 'horizontal'; }
  @HostBinding('class.vertical') get isVertical() { return this.orientation === 'vertical'; }

  private isResizing = false;
  private resizeStartX = 0;
  private resizeStartY = 0;

  // Bound methods for event listeners
  private resizeMoveHandler = (event: MouseEvent) => this.onResizeMove(event);
  private resizeEndHandler = () => this.onResizeEnd();

  @HostListener('mousedown', ['$event'])
  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    
    // Emit resize start event to parent
    this.resizeStart.emit();
    
    // Add global listeners for mouse move and up
    document.addEventListener('mousemove', this.resizeMoveHandler);
    document.addEventListener('mouseup', this.resizeEndHandler);
    
    // Prevent text selection during resize - but don't change body cursor
    document.body.style.userSelect = 'none';
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    
    // Calculate delta based on orientation
    const delta = this.orientation === 'horizontal' 
      ? event.clientY - this.resizeStartY
      : event.clientX - this.resizeStartX;
    
    // Emit the delta to the parent component
    this.resize.emit(delta);
  }

  private onResizeEnd(): void {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    
    // Remove global listeners
    document.removeEventListener('mousemove', this.resizeMoveHandler);
    document.removeEventListener('mouseup', this.resizeEndHandler);
    
    // Restore default text selection - but don't change body cursor
    document.body.style.userSelect = '';
    
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
    }
  }

  get resizing(): boolean {
    return this.isResizing;
  }
}
