import { Component, ElementRef, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { GraphNode } from '../../models/graph-node.model';
import { GraphEdge } from '../../models/graph-edge.model';
import { GraphStateService } from '../../services/graph-state.service';

interface AvailableNode {
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
  selector: 'app-graph-editor',
  standalone: false,
  templateUrl: './graph-editor.component.html',
  styleUrl: './graph-editor.component.scss'
})
export class GraphEditorComponent implements OnInit, OnDestroy {
  @ViewChild('svgCanvas', { static: true }) svgCanvas!: ElementRef<SVGElement>;

  // Expose the nodes and edges observables directly to the template
  nodes$!: Observable<GraphNode[]>;
  edges$!: Observable<GraphEdge[]>;

  // Keep a local copy of nodes and edges for imperative operations
  private currentNodes: GraphNode[] = [];
  private currentEdges: GraphEdge[] = [];
  private nodesSubscription?: Subscription;
  private edgesSubscription?: Subscription;

  availableNodes: AvailableNode[] = [
    { type: 'power', label: '9V Battery', width: 80, height: 60 },
    { type: 'resistor', label: 'Resistor', width: 60, height: 20 },
    { type: 'capacitor', label: 'Capacitor', width: 40, height: 40 },
    { type: 'led', label: 'LED', width: 30, height: 20 },
    { type: 'switch', label: 'Switch', width: 50, height: 30 },
    { type: 'ic', label: 'IC Chip', width: 80, height: 60 },
    { type: 'node', label: 'Generic Node', width: 60, height: 40 }
  ];

  selectedNodes = new Set<string>();
  dragging = false;
  dragOffset = { x: 0, y: 0 };
  selectionBox: SelectionBox | null = null;
  isCtrlPressed = false;
  initialPositions: { [key: string]: { x: number, y: number } } = {};
  
  // Connection creation state
  connectingFrom: { nodeId: string; pinName: string } | null = null;

  Math = Math;

  constructor(private graphState: GraphStateService) {}

  ngOnInit(): void {
    // Assign the observables for use with the async pipe in the template
    this.nodes$ = this.graphState.nodes$;
    this.edges$ = this.graphState.edges$;

    // Subscribe to keep local copies for imperative operations
    this.nodesSubscription = this.nodes$.subscribe(nodes => {
      this.currentNodes = nodes;
    });
    
    this.edgesSubscription = this.edges$.subscribe(edges => {
      this.currentEdges = edges;
    });
  }

  ngOnDestroy(): void {
    this.nodesSubscription?.unsubscribe();
    this.edgesSubscription?.unsubscribe();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Control' || event.key === 'Meta') {
      this.isCtrlPressed = true;
    }
    if (event.key === 'Delete' && this.selectedNodes.size > 0) {
      this.deleteSelectedNodes();
    }
  }
    
  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control' || event.key === 'Meta') {
      this.isCtrlPressed = false;
    }
  }

  addNode(type: string): void {
    const template = this.availableNodes.find(c => c.type === type);
    if (!template) return;

    const newId = `${type}_${Date.now()}`;
    const newNode: GraphNode = {
      id: newId,
      type: type,
      x: 50 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      width: template.width,
      height: template.height,
      label: template.label
    };

    this.graphState.addNode(newNode);
  }

  clearConnections(): void {
    // Clear all edges
    const currentEdges = this.graphState.getEdges();
    currentEdges.forEach(edge => {
      if (edge.id) {
        this.graphState.removeEdge(edge.id);
      }
    });
  }

  deleteSelectedNodes(): void {
    this.graphState.deleteNodes(Array.from(this.selectedNodes));
    this.selectedNodes.clear();
  }

  onMouseDown(event: MouseEvent): void {
    if (event.target === this.svgCanvas.nativeElement || 
        (event.target as Element).id === 'grid-rect') {
      this.handleCanvasMouseDown(event);
    }
  }

  onNodeMouseDown(event: MouseEvent, nodeId: string): void {
    event.stopPropagation();
    const node = this.currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const svgRect = this.svgCanvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    if (this.isCtrlPressed) {
      // Toggle selection with Ctrl
      if (this.selectedNodes.has(nodeId)) {
        this.selectedNodes.delete(nodeId);
      } else {
        this.selectedNodes.add(nodeId);
      }
    } else {
      // Regular click - select only this node or start dragging
      if (!this.selectedNodes.has(nodeId)) {
        this.selectedNodes.clear();
        this.selectedNodes.add(nodeId);
      }
      
      // Start dragging
      this.dragging = true;
      
      // Store initial positions of all selected nodes
      this.initialPositions = {};
      this.currentNodes.forEach(n => {
        if (this.selectedNodes.has(n.id)) {
          this.initialPositions[n.id] = { x: n.x, y: n.y };
        }
      });
      
      this.dragOffset = {
        x: mouseX - node.x,
        y: mouseY - node.y
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

      // Update selected nodes based on selection box
      this.selectedNodes = new Set<string>();
      this.currentNodes.forEach(node => {
        if (this.isNodeInSelectionBox(node, this.selectionBox!)) {
          this.selectedNodes.add(node.id);
        }
      });
    } else if (this.dragging && this.selectedNodes.size > 0) {
      // Move all selected nodes
      const deltaX = mouseX - this.dragOffset.x;
      const deltaY = mouseY - this.dragOffset.y;

      // Get the first selected node as reference
      const firstSelectedId = Array.from(this.selectedNodes)[0];
      const initialFirst = this.initialPositions[firstSelectedId];

      if (initialFirst) {
        const offsetX = deltaX - initialFirst.x;
        const offsetY = deltaY - initialFirst.y;

        // Create updates map for the service
        const updates = new Map<string, { x: number; y: number }>();
        this.selectedNodes.forEach(nodeId => {
          const initial = this.initialPositions[nodeId];
          if (initial) {
            updates.set(nodeId, {
              x: Math.max(0, initial.x + offsetX),
              y: Math.max(0, initial.y + offsetY)
            });
          }
        });
        this.graphState.updateNodePositions(updates);
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
      this.selectedNodes.clear();
    }
  }

  private isNodeInSelectionBox(node: GraphNode, box: SelectionBox): boolean {
    const minX = Math.min(box.startX, box.endX);
    const maxX = Math.max(box.startX, box.endX);
    const minY = Math.min(box.startY, box.endY);
    const maxY = Math.max(box.startY, box.endY);
    
    // Check if node rectangle intersects with selection box
    return !(node.x + node.width < minX || 
             node.x > maxX || 
             node.y + node.height < minY || 
             node.y > maxY);
  }

  // Connection methods for template
  onPinMouseDown(event: MouseEvent, nodeId: string, pinName: string): void {
    event.stopPropagation();
    
    if (this.connectingFrom === null) {
      // Start a new connection
      this.connectingFrom = { nodeId, pinName };
      console.log(`Starting connection from ${nodeId}.${pinName}`);
    } else {
      // Complete the connection
      const newEdge: GraphEdge = {
        from: `${this.connectingFrom.nodeId}.${this.connectingFrom.pinName}`,
        to: `${nodeId}.${pinName}`
      };
      
      this.graphState.addEdge(newEdge);
      console.log(`Created connection: ${newEdge.from} -> ${newEdge.to}`);
      
      // Reset connection state
      this.connectingFrom = null;
    }
  }

  getConnectionStartX(edge: GraphEdge): number {
    const [nodeId, pinName] = edge.from.split('.');
    const position = this.graphState.getPinPosition(nodeId, pinName);
    return position ? position.x : 0;
  }

  getConnectionStartY(edge: GraphEdge): number {
    const [nodeId, pinName] = edge.from.split('.');
    const position = this.graphState.getPinPosition(nodeId, pinName);
    return position ? position.y : 0;
  }

  getConnectionEndX(edge: GraphEdge): number {
    const [nodeId, pinName] = edge.to.split('.');
    const position = this.graphState.getPinPosition(nodeId, pinName);
    return position ? position.x : 0;
  }

  getConnectionEndY(edge: GraphEdge): number {
    const [nodeId, pinName] = edge.to.split('.');
    const position = this.graphState.getPinPosition(nodeId, pinName);
    return position ? position.y : 0;
  }
}
