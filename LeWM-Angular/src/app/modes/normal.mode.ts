import { GraphMode } from '../interfaces/graph-mode.interface';
import { GraphNode } from '../models/graph-node.model';
import { GraphStateService } from '../services/graph-state.service';

export class NormalMode implements GraphMode {
  name = 'normal';
  displayName = 'Normal';
  isActive = false;
  selectedPins: Set<string> = new Set(); // Normal mode doesn't select pins
  
  constructor(private graphState: GraphStateService) {}
  
  activate(): void {
    console.log('Normal mode activated');
    this.selectedPins.clear();
  }
  
  deactivate(): void {
    console.log('Normal mode deactivated');
    this.selectedPins.clear();
  }
  
  handleNodeClick(node: GraphNode, event: MouseEvent): boolean {
    // In normal mode, this handles node selection and dragging
    // Return false to let the component handle it with existing logic
    return false;
  }
  
  handlePinClick(node: GraphNode, pin: { x: number; y: number; name: string }, event: MouseEvent): boolean {
    // In normal mode, this handles connection creation
    // Return false to let the component handle it with existing logic
    return false;
  }
  
  handleCanvasClick(event: MouseEvent): boolean {
    // In normal mode, this handles selection clearing and selection box
    // Return false to let the component handle it with existing logic
    return false;
  }
  
  handleMouseMove(event: MouseEvent): boolean {
    // Normal mode doesn't handle mouse move specially
    return false;
  }
  
  handleKeyDown(event: KeyboardEvent): boolean {
    // Handle mode-specific keyboard shortcuts
    if (event.key === 'p' || event.key === 'P') {
      // Switch to pin edit mode (will be handled by component)
      return true;
    }
    
    // Return false to let component handle other keys (delete, ctrl, etc.)
    return false;
  }
  
  renderOverlay(canvas: SVGElement): void {
    // Normal mode doesn't render any overlay
  }
  
  getCursor(): string {
    return 'default';
  }
  
  deleteSelectedPins(): void {
    // No pin deletion in normal mode
  }
}