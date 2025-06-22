import { GraphMode, PinEditState } from '../interfaces/graph-mode.interface';
import { GraphNode } from '../models/graph-node.model';
import { GraphStateService } from '../services/graph-state.service';

export class PinEditMode implements GraphMode {
  name = 'pin-edit';
  displayName = 'Pin Edit';
  isActive = false;
  selectedPins: Set<string> = new Set(); // track selected pins

  // Pin edit state
  state: PinEditState = {
    selectedNode: null,
    selectedSide: null,
    hoveredSide: null,
    pinDraft: null,
    isEditingPinName: false,
    editingPinName: null
  };

  // Reference to component for dialog
  private componentRef: any = null;

  constructor(private graphState: GraphStateService) {}

  setComponentRef(component: any): void {
    this.componentRef = component;
  }

  activate(): void {
    console.log('Pin Edit mode activated');
    // Clear any existing state
    this.state = {
      selectedNode: null,
      selectedSide: null,
      hoveredSide: null,
      pinDraft: null,
      isEditingPinName: false,
      editingPinName: null
    };
    this.selectedPins.clear();
  }

  deactivate(): void {
    console.log('Pin Edit mode deactivated');
    // Clear state when deactivating
    this.state = {
      selectedNode: null,
      selectedSide: null,
      hoveredSide: null,
      pinDraft: null,
      isEditingPinName: false,
      editingPinName: null
    };
    this.selectedPins.clear();
  }

  handleNodeClick(node: GraphNode, event: MouseEvent): boolean {
    // In pin edit mode, clicking a node selects it for pin editing
    this.state.selectedNode = node;
    this.state.selectedSide = null; // Clear side selection
    this.selectedPins.clear(); // clear pin selection when selecting node

    console.log(`Selected node for pin editing: ${node.id}`);
    return true; // Event handled
  }

  handlePinClick(node: GraphNode, pin: { x: number; y: number; name: string }, event: MouseEvent): boolean {
    event.stopPropagation();
    // Double-click to rename
    if (event.detail === 2) {
      this.state.isEditingPinName = true;
      this.state.editingPinName = pin.name;
      console.log(`Editing pin name: ${pin.name}`);
      return true;
    }

    // Selection logic: Ctrl+click for multi-select, otherwise single select
    const pinId = `${node.id}.${pin.name}`;
    if (event.ctrlKey || event.metaKey) {
      if (this.selectedPins.has(pinId)) this.selectedPins.delete(pinId);
      else this.selectedPins.add(pinId);
    } else {
      this.selectedPins.clear();
      this.selectedPins.add(pinId);
    }
    console.log(`Selected pins: ${Array.from(this.selectedPins).join(', ')}`);
    return true;
  }

  handleCanvasClick(event: MouseEvent): boolean {
    // Check if click is on a node edge for pin placement
    if (this.state.selectedNode) {
      const side = this.getClickedSide(this.state.selectedNode, event);
      if (side && this.componentRef) {
        // Check for double-click to enter advanced mode
        if (event.detail === 2) {
          console.log(`Double-clicked side ${side}, entering advanced mode.`);
          this.componentRef.openBulkPinDialog(this.state.selectedNode, side);
          return true;
        }

        this.state.selectedSide = side as 'top' | 'right' | 'bottom' | 'left';
        // Show dialog for pin naming
        this.componentRef.showPinCreationDialog(this.state.selectedNode, side);
        return true;
      }
    }

    // Clear selection if clicking elsewhere
    this.state.selectedNode = null;
    this.state.selectedSide = null;
    this.state.hoveredSide = null;
    return false;
  }

  handleMouseMove(event: MouseEvent): boolean {
    // Update hover state for side highlighting
    if (this.state.selectedNode) {
      const hoveredSide = this.getClickedSide(this.state.selectedNode, event);
      if (hoveredSide !== this.state.hoveredSide) {
        this.state.hoveredSide = hoveredSide as 'top' | 'right' | 'bottom' | 'left' | null;
        // Trigger overlay re-render
        return true;
      }
    }
    return false;
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    if (event.key === 'Escape') {
      // Exit pin edit mode
      return true; // Will be handled by component to switch modes
    }

    if (event.key === 'Delete') {
      // If we have selected pins, delete them
      if (this.selectedPins.size > 0) {
        this.deleteSelectedPins();
        return true; // We handled the delete
      }
      // Otherwise let component handle it (e.g., for node deletion)
      return false;
    }

    return false;
  }

  renderOverlay(canvas: SVGElement): void {
    if (!this.state.selectedNode) return;

    // Create overlay elements for selected node
    const overlay = (canvas.querySelector('.pin-edit-overlay') || 
                   this.createOverlayGroup(canvas)) as SVGGElement;

    // Clear previous overlay
    overlay.innerHTML = '';

    // Add side selection indicators
    this.renderSideIndicators(overlay, this.state.selectedNode);

    // Add pin placement preview
    if (this.state.selectedSide) {
      this.renderPinPlacementPreview(overlay, this.state.selectedNode, this.state.selectedSide);
    }
  }

  getCursor(): string {
    if (this.state.selectedNode) {
      return 'crosshair';
    }
    return 'pointer';
  }

  // Helper methods
  private createOverlayGroup(canvas: SVGElement): SVGGElement {
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
    overlay.classList.add('pin-edit-overlay');
    canvas.appendChild(overlay);
    return overlay;
  }

  private renderSideIndicators(overlay: SVGGElement, node: GraphNode): void {
    const sides = ['top', 'right', 'bottom', 'left'];

    sides.forEach(side => {
      const rect = this.createSideIndicator(node, side);

      // Style based on state
      if (this.state.selectedSide === side) {
        rect.setAttribute('stroke', '#4CAF50');
        rect.setAttribute('stroke-width', '3');
        rect.setAttribute('fill', 'rgba(76, 175, 80, 0.2)');
      } else if (this.state.hoveredSide === side) {
        rect.setAttribute('stroke', '#FF9800');
        rect.setAttribute('stroke-width', '3');
        rect.setAttribute('fill', 'rgba(255, 152, 0, 0.2)');
      } else {
        rect.setAttribute('stroke', '#2196F3');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('fill', 'rgba(33, 150, 243, 0.1)');
      }

      rect.setAttribute('stroke-dasharray', '5,5');
      rect.setAttribute('style', 'pointer-events: none;'); // Allow clicks through
      overlay.appendChild(rect);
    });
  }

  private createSideIndicator(node: GraphNode, side: string): SVGRectElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const margin = 5;

    switch (side) {
      case 'top':
        rect.setAttribute('x', (node.x - margin).toString());
        rect.setAttribute('y', (node.y - margin).toString());
        rect.setAttribute('width', (node.width + 2 * margin).toString());
        rect.setAttribute('height', margin.toString());
        break;
      case 'right':
        rect.setAttribute('x', (node.x + node.width).toString());
        rect.setAttribute('y', (node.y - margin).toString());
        rect.setAttribute('width', margin.toString());
        rect.setAttribute('height', (node.height + 2 * margin).toString());
        break;
      case 'bottom':
        rect.setAttribute('x', (node.x - margin).toString());
        rect.setAttribute('y', (node.y + node.height).toString());
        rect.setAttribute('width', (node.width + 2 * margin).toString());
        rect.setAttribute('height', margin.toString());
        break;
      case 'left':
        rect.setAttribute('x', (node.x - margin).toString());
        rect.setAttribute('y', (node.y - margin).toString());
        rect.setAttribute('width', margin.toString());
        rect.setAttribute('height', (node.height + 2 * margin).toString());
        break;
    }

    return rect;
  }

  private renderPinPlacementPreview(overlay: SVGGElement, node: GraphNode, side: string): void {
    // Show where pins can be placed on the selected side
    const pinCount = this.getPinCountOnSide(node, side);
    const maxPins = this.getMaxPinsForSide(node, side);

    // Show placement indicators
    for (let i = 0; i <= maxPins; i++) {
      const position = this.calculateDistributedPosition(node, side, i, maxPins + 1);
      const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      indicator.setAttribute('cx', position.x.toString());
      indicator.setAttribute('cy', position.y.toString());
      indicator.setAttribute('r', '2');
      indicator.setAttribute('fill', '#4CAF50');
      indicator.setAttribute('opacity', '0.5');
      overlay.appendChild(indicator);
    }
  }

  private getClickedSide(node: GraphNode, event: MouseEvent): string | null {
    // Get mouse position relative to SVG
    const svgRect = (event.target as Element).closest('svg')?.getBoundingClientRect();
    if (!svgRect) return null;

    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    const margin = 15; // Increased margin for easier clicking

    // Check if mouse is inside the node's extended bounds
    const inExtendedBounds = mouseX >= node.x - margin && mouseX <= node.x + node.width + margin &&
                            mouseY >= node.y - margin && mouseY <= node.y + node.height + margin;

    if (!inExtendedBounds) return null;

    // Determine which side based on position relative to node center
    const centerX = node.x + node.width / 2;
    const centerY = node.y + node.height / 2;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;

    // Use diagonal boundaries to determine side
    const angle = Math.atan2(dy, dx);
    const degrees = (angle * 180 / Math.PI + 360) % 360;

    if (degrees >= 315 || degrees < 45) {
      return 'right';
    } else if (degrees >= 45 && degrees < 135) {
      return 'bottom';
    } else if (degrees >= 135 && degrees < 225) {
      return 'left';
    } else {
      return 'top';
    }
  }

  private calculatePinPosition(node: GraphNode, side: string, event: MouseEvent): { x: number; y: number } {
    const svgRect = (event.target as Element).closest('svg')?.getBoundingClientRect();
    if (!svgRect) return { x: 0, y: 0 };

    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    switch (side) {
      case 'top':
        return { x: mouseX - node.x, y: 0 };
      case 'right':
        return { x: node.width, y: mouseY - node.y };
      case 'bottom':
        return { x: mouseX - node.x, y: node.height };
      case 'left':
        return { x: 0, y: mouseY - node.y };
      default:
        return { x: 0, y: 0 };
    }
  }

  private calculateDistributedPosition(node: GraphNode, side: string, index: number, total: number): { x: number; y: number } {
    const margin = 10;

    switch (side) {
      case 'top':
      case 'bottom':
        const xStep = (node.width - 2 * margin) / (total - 1);
        const x = node.x + margin + (index * xStep);
        const y = side === 'top' ? node.y : node.y + node.height;
        return { x, y };

      case 'left':
      case 'right':
        const yStep = (node.height - 2 * margin) / (total - 1);
        const yPos = node.y + margin + (index * yStep);
        const xPos = side === 'left' ? node.x : node.x + node.width;
        return { x: xPos, y: yPos };

      default:
        return { x: node.x, y: node.y };
    }
  }

  // Pin creation is now handled by the component dialog

  private removePin(node: GraphNode, pinName: string): void {
    const updatedNode = { ...node };
    if (!updatedNode.pins) return;

    // First, remove any connections that reference this pin
    const removedConnections = this.graphState.removeConnectionsForPin(node.id, pinName);
    if (removedConnections > 0) {
      console.log(`Removed ${removedConnections} orphaned connections for pin ${node.id}.${pinName}`);
    }

    // Then remove the pin from the node
    updatedNode.pins = updatedNode.pins.filter(pin => pin.name !== pinName);

    // Update the node in the service
    this.graphState.updateNode(node.id, updatedNode);

    console.log(`Removed pin ${pinName} from node ${node.id}`);
  }

  private getPinCountOnSide(node: GraphNode, side: string): number {
    if (!node.pins) return 0;

    // This is a simplified count - in reality we'd check pin positions
    return Math.floor(node.pins.length / 4);
  }

  private getMaxPinsForSide(node: GraphNode, side: string): number {
    // Calculate based on node size and minimum pin spacing
    const minSpacing = 15;

    if (side === 'top' || side === 'bottom') {
      return Math.floor((node.width - 20) / minSpacing);
    } else {
      return Math.floor((node.height - 20) / minSpacing);
    }
  }

  /** Delete all selected pins via state service */
  deleteSelectedPins(): void {
    if (this.selectedPins.size === 0) return;
    
    // Group selected pins by node ID
    const pinsByNode = new Map<string, string[]>();
    Array.from(this.selectedPins).forEach(pinId => {
      const [nodeId, pinName] = pinId.split('.');
      if (!pinsByNode.has(nodeId)) {
        pinsByNode.set(nodeId, []);
      }
      pinsByNode.get(nodeId)!.push(pinName);
    });
    
    // Delete pins from each node
    pinsByNode.forEach((pinNames, nodeId) => {
      this.graphState.removePins(nodeId, pinNames);
      console.log(`Deleted pins ${pinNames.join(', ')} from node ${nodeId}`);
    });
    
    this.selectedPins.clear();
    // re-render overlays
    if (this.componentRef) this.componentRef.renderActiveOverlay(this.componentRef.svgCanvas.nativeElement);
  }
}