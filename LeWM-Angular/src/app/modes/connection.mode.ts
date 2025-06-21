import { GraphMode } from '../interfaces/graph-mode.interface';
import { GraphNode } from '../models/graph-node.model';
import { GraphEdge } from '../models/graph-edge.model';
import { GraphStateService } from '../services/graph-state.service';

export interface ConnectionModeState {
  selectedConnections: Set<string>;
  hoveredConnection: string | null;
  isCreatingConnection: boolean;
  connectionStartPin: { nodeId: string; pinName: string } | null;
  connectionPreview: { startX: number; startY: number; endX: number; endY: number } | null;
}

export class ConnectionMode implements GraphMode {
  name = 'connection';
  displayName = 'Connection';
  isActive = false;
  
  state: ConnectionModeState = {
    selectedConnections: new Set(),
    hoveredConnection: null,
    isCreatingConnection: false,
    connectionStartPin: null,
    connectionPreview: null
  };
  
  // Reference to component for dialog
  private componentRef: any = null;
  
  constructor(private graphState: GraphStateService) {}
  
  setComponentRef(component: any): void {
    this.componentRef = component;
  }
  
  activate(): void {
    console.log('Connection mode activated');
    // Clear any existing state
    this.state = {
      selectedConnections: new Set(),
      hoveredConnection: null,
      isCreatingConnection: false,
      connectionStartPin: null,
      connectionPreview: null
    };
  }
  
  deactivate(): void {
    console.log('Connection mode deactivated');
    // Clear all selection and preview states
    this.clearAllSelections();
    this.state = {
      selectedConnections: new Set(),
      hoveredConnection: null,
      isCreatingConnection: false,
      connectionStartPin: null,
      connectionPreview: null
    };
  }
  
  handleNodeClick(node: GraphNode, event: MouseEvent): boolean {
    // In connection mode, clicking a node clears connection selection
    this.clearConnectionSelections();
    return false; // Let other handlers process
  }
  
  handlePinClick(node: GraphNode, pin: { x: number; y: number; name: string }, event: MouseEvent): boolean {
    event.stopPropagation();
    
    if (!this.state.isCreatingConnection) {
      // Start creating a new connection
      this.state.isCreatingConnection = true;
      this.state.connectionStartPin = { nodeId: node.id, pinName: pin.name };
      
      // Start preview line
      const startX = node.x + pin.x;
      const startY = node.y + pin.y;
      this.state.connectionPreview = {
        startX,
        startY,
        endX: startX,
        endY: startY
      };
      
      console.log(`Starting connection from ${node.id}.${pin.name}`);
      return true;
    } else {
      // Complete the connection
      if (this.state.connectionStartPin && 
          (this.state.connectionStartPin.nodeId !== node.id || 
           this.state.connectionStartPin.pinName !== pin.name)) {
        
        const newEdge: GraphEdge = {
          from: `${this.state.connectionStartPin.nodeId}.${this.state.connectionStartPin.pinName}`,
          to: `${node.id}.${pin.name}`,
          direction: 'forward',
          type: 'signal',
          createdAt: new Date()
        };
        
        this.graphState.addEdge(newEdge);
        console.log(`Created connection: ${newEdge.from} -> ${newEdge.to}`);
      }
      
      // Reset connection creation state
      this.state.isCreatingConnection = false;
      this.state.connectionStartPin = null;
      this.state.connectionPreview = null;
      return true;
    }
  }
  
  handleCanvasClick(event: MouseEvent): boolean {
    // Check if clicking on a connection line
    const clickedConnection = this.getConnectionAtPoint(event);
    
    if (clickedConnection) {
      // Select the connection
      if (event.ctrlKey || event.metaKey) {
        // Multi-select with Ctrl
        if (this.state.selectedConnections.has(clickedConnection)) {
          this.state.selectedConnections.delete(clickedConnection);
        } else {
          this.state.selectedConnections.add(clickedConnection);
        }
      } else {
        // Single select
        this.state.selectedConnections.clear();
        this.state.selectedConnections.add(clickedConnection);
      }
      
      this.updateConnectionSelectionState();
      return true;
    } else {
      // Clear selections if clicking on empty space
      if (!event.ctrlKey && !event.metaKey) {
        this.clearConnectionSelections();
      }
      
      // Cancel connection creation if in progress
      if (this.state.isCreatingConnection) {
        this.state.isCreatingConnection = false;
        this.state.connectionStartPin = null;
        this.state.connectionPreview = null;
        return true;
      }
    }
    
    return false;
  }
  
  handleMouseMove(event: MouseEvent): boolean {
    if (this.state.isCreatingConnection && this.state.connectionPreview) {
      // Update connection preview
      const svgRect = (event.target as Element).closest('svg')?.getBoundingClientRect();
      if (svgRect) {
        const mouseX = event.clientX - svgRect.left;
        const mouseY = event.clientY - svgRect.top;
        
        this.state.connectionPreview.endX = mouseX;
        this.state.connectionPreview.endY = mouseY;
        return true; // Trigger re-render
      }
    } else {
      // Check for connection hover
      const hoveredConnection = this.getConnectionAtPoint(event);
      if (hoveredConnection !== this.state.hoveredConnection) {
        this.state.hoveredConnection = hoveredConnection;
        this.updateConnectionHoverState();
        return true;
      }
    }
    
    return false;
  }
  
  handleKeyDown(event: KeyboardEvent): boolean {
    if (event.key === 'Delete' && this.state.selectedConnections.size > 0) {
      // Delete selected connections
      this.deleteSelectedConnections();
      return true;
    }
    
    if (event.key === 'Escape') {
      if (this.state.isCreatingConnection) {
        // Cancel connection creation
        this.state.isCreatingConnection = false;
        this.state.connectionStartPin = null;
        this.state.connectionPreview = null;
        return true;
      } else {
        // Exit connection mode
        return true; // Will be handled by component to switch modes
      }
    }
    
    if (event.key === 'Enter' && this.state.selectedConnections.size === 1) {
      // Open properties dialog for selected connection
      const connectionId = Array.from(this.state.selectedConnections)[0];
      if (this.componentRef) {
        this.componentRef.showConnectionPropertiesDialog(connectionId);
      }
      return true;
    }
    
    return false;
  }
  
  renderOverlay(canvas: SVGElement): void {
    // Clear previous overlay
    const existingOverlay = canvas.querySelector('.connection-mode-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
    overlay.classList.add('connection-mode-overlay');
    
    // Render connection preview if creating
    if (this.state.connectionPreview) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', this.state.connectionPreview.startX.toString());
      line.setAttribute('y1', this.state.connectionPreview.startY.toString());
      line.setAttribute('x2', this.state.connectionPreview.endX.toString());
      line.setAttribute('y2', this.state.connectionPreview.endY.toString());
      line.setAttribute('stroke', '#FF9800');
      line.setAttribute('stroke-width', '3');
      line.setAttribute('stroke-dasharray', '5,5');
      line.setAttribute('opacity', '0.8');
      overlay.appendChild(line);
    }
    
    // Render selection indicators for selected connections
    this.renderConnectionSelectionIndicators(overlay);
    
    canvas.appendChild(overlay);
  }
  
  getCursor(): string {
    if (this.state.isCreatingConnection) {
      return 'crosshair';
    }
    return 'pointer';
  }
  
  // Helper methods
  private getConnectionAtPoint(event: MouseEvent): string | null {
    // Get mouse position relative to SVG
    const svgRect = (event.target as Element).closest('svg')?.getBoundingClientRect();
    if (!svgRect) return null;
    
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;
    
    // Check all connections to see if mouse is near any line
    const connections = this.graphState.getEdges();
    const tolerance = 8; // Pixels
    
    for (const connection of connections) {
      if (!connection.id) continue;
      
      const startPos = this.getConnectionStartPosition(connection);
      const endPos = this.getConnectionEndPosition(connection);
      
      if (startPos && endPos) {
        const distance = this.distanceToLineSegment(
          mouseX, mouseY,
          startPos.x, startPos.y,
          endPos.x, endPos.y
        );
        
        if (distance <= tolerance) {
          return connection.id;
        }
      }
    }
    
    return null;
  }
  
  private distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      // Degenerate case: line is a point
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }
    
    // Parameter t represents position along the line segment (0 = start, 1 = end)
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    
    return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
  }
  
  private getConnectionStartPosition(connection: GraphEdge): { x: number; y: number } | null {
    const [nodeId, pinName] = connection.from.split('.');
    return this.graphState.getPinPosition(nodeId, pinName);
  }
  
  private getConnectionEndPosition(connection: GraphEdge): { x: number; y: number } | null {
    const [nodeId, pinName] = connection.to.split('.');
    return this.graphState.getPinPosition(nodeId, pinName);
  }
  
  private clearConnectionSelections(): void {
    this.state.selectedConnections.clear();
    this.updateConnectionSelectionState();
  }
  
  private clearAllSelections(): void {
    this.clearConnectionSelections();
    this.state.hoveredConnection = null;
    this.updateConnectionHoverState();
  }
  
  private updateConnectionSelectionState(): void {
    // Update the isSelected property on connections
    const connections = this.graphState.getEdges();
    const hasChanges = connections.some(conn => {
      const shouldBeSelected = conn.id ? this.state.selectedConnections.has(conn.id) : false;
      return conn.isSelected !== shouldBeSelected;
    });
    
    if (hasChanges && this.componentRef) {
      this.componentRef.updateConnectionStates();
    }
  }
  
  private updateConnectionHoverState(): void {
    // Update the isHighlighted property on connections
    if (this.componentRef) {
      this.componentRef.updateConnectionStates();
    }
  }
  
  private deleteSelectedConnections(): void {
    this.state.selectedConnections.forEach(connectionId => {
      this.graphState.removeEdge(connectionId);
    });
    this.state.selectedConnections.clear();
    console.log('Deleted selected connections');
  }
  
  private renderConnectionSelectionIndicators(overlay: SVGGElement): void {
    const connections = this.graphState.getEdges();
    
    connections.forEach(connection => {
      if (!connection.id || !this.state.selectedConnections.has(connection.id)) return;
      
      const startPos = this.getConnectionStartPosition(connection);
      const endPos = this.getConnectionEndPosition(connection);
      
      if (startPos && endPos) {
        // Render selection indicator around the connection
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startPos.x.toString());
        line.setAttribute('y1', startPos.y.toString());
        line.setAttribute('x2', endPos.x.toString());
        line.setAttribute('y2', endPos.y.toString());
        line.setAttribute('stroke', '#4CAF50');
        line.setAttribute('stroke-width', '6');
        line.setAttribute('opacity', '0.5');
        line.setAttribute('pointer-events', 'none');
        overlay.appendChild(line);
      }
    });
  }
  
  // Public methods for component interaction
  getSelectedConnectionCount(): number {
    return this.state.selectedConnections.size;
  }
  
  getSelectedConnectionIds(): string[] {
    return Array.from(this.state.selectedConnections);
  }
  
  isConnectionSelected(connectionId: string): boolean {
    return this.state.selectedConnections.has(connectionId);
  }
  
  isConnectionHovered(connectionId: string): boolean {
    return this.state.hoveredConnection === connectionId;
  }
}