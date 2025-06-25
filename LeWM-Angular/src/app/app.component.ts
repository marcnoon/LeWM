import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { LayoutStateService } from './services/layout-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected title = 'LeWM-Angular';
  
  // Header height management
  headerHeight = 80; // Default header height in pixels
  minHeaderHeight = 20; // Minimum height to still show some content
  maxHeaderHeight = 200; // Maximum height
  private resizeStartHeight = 0;

  // Observable for resize state
  isResizing$: Observable<boolean>;

  constructor(private layoutStateService: LayoutStateService) {
    this.isResizing$ = this.layoutStateService.isResizing$;
  }

  onHeaderResizeStart(): void {
    this.resizeStartHeight = this.headerHeight;
  }

  onHeaderResize(deltaY: number): void {
    const newHeight = this.resizeStartHeight + deltaY;
    
    // Clamp the height between min and max values
    this.headerHeight = Math.max(
      this.minHeaderHeight,
      Math.min(this.maxHeaderHeight, newHeight)
    );
  }

  onHeaderResizeEnd(): void {
    // Handle can be implemented if needed for cleanup
  }
}
