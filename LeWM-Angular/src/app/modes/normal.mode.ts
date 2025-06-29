import { GraphMode } from '../interfaces/graph-mode.interface';
import { GraphStateService } from '../services/graph-state.service';

export class NormalMode implements GraphMode {
  name = 'normal';
  displayName = 'Normal';
  isActive = false;
  selectedPins = new Set<string>(); // Normal mode doesn't select pins
  
  constructor(private graphState: GraphStateService) {}
  
  activate(): void {
    console.log('Normal mode activated');
    this.selectedPins.clear();
  }
  
  deactivate(): void {
    console.log('Normal mode deactivated');
    this.selectedPins.clear();
  }
  
  handleNodeClick(): boolean {
    // In normal mode, this handles node selection and dragging
    // Return false to let the component handle it with existing logic
    return false;
  }
  
  handlePinClick(): boolean {
    // In normal mode, this handles connection creation
    // Return false to let the component handle it with existing logic
    return false;
  }
  
  handleCanvasClick(): boolean {
    // In normal mode, this handles selection clearing and selection box
    // Return false to let the component handle it with existing logic
    return false;
  }
  
  handleMouseMove(): boolean {
    // Normal mode doesn't handle mouse move specially
    return false;
  }
  
  handleKeyDown(event: KeyboardEvent): boolean {
    // Handle mode-specific keyboard shortcuts
    if (event.key === 'p' || event.key === 'P') {
      // Switch to pin edit mode (will be handled by component)
      return true;
    }
    
    if (event.key === 'Enter') {
      // If nodes are selected, allow component to handle node name editing
      return true;
    }
    
    // Return false to let component handle other keys (delete, ctrl, etc.)
    return false;
  }
  
  renderOverlay(): void {
    // Normal mode doesn't render any overlay
  }
  
  getCursor(): string {
    return 'default';
  }
  
  deleteSelectedPins(): void {
    // No pin deletion in normal mode
  }
}