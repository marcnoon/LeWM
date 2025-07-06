import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LayoutStateService } from './services/layout-state.service';
import { FeatureGraphService } from './services/feature-graph.service';
import { ModeManagerService } from './services/mode-manager.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GraphEditorComponent } from './components/graph-editor/graph-editor.component';
import { HandleComponent } from './components/handle/handle';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GraphEditorComponent,
    HandleComponent
  ],
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

  private layoutStateService = inject(LayoutStateService);
  private featureGraphService = inject(FeatureGraphService);
  private modeManagerService = inject(ModeManagerService);

  constructor() {
    this.isResizing$ = this.layoutStateService.isResizing$;
    
    // Demonstrate feature flag system is working
    this.featureGraphService.featuresLoaded.subscribe(loaded => {
      if (loaded) {
        console.log('Feature Flag System Status:');
        console.log('- basic-graph-editing enabled:', this.featureGraphService.isFeatureEnabled('basic-graph-editing'));
        console.log('- graph.node enabled:', this.featureGraphService.isFeatureEnabled('graph.node'));
        console.log('- advanced-features enabled:', this.featureGraphService.isFeatureEnabled('advanced-features'));
        console.log('- non-existent-feature enabled:', this.featureGraphService.isFeatureEnabled('non-existent-feature'));
        console.log('- all enabled features:', this.featureGraphService.getEnabledFeatures());
        
        // Initialize mode manager with current features
        this.modeManagerService.initializeFeatureModes();
      }
    });
  }

  onHeaderResizeStart(): void {
    this.resizeStartHeight = this.headerHeight;
  }

  onHeaderResize(): void {
    const newHeight = this.resizeStartHeight;
    
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
