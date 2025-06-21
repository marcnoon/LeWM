import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GraphNode } from '../models/graph-node.model';
import { GraphEdge } from '../models/graph-edge.model';

@Injectable({
  providedIn: 'root'
})
export class GraphStateService {
  // Use _nodes and _edges for internal state management
  private readonly _nodes = new BehaviorSubject<GraphNode[]>([
    // Initial data from your React prototype, now typed as GraphNode
    { id: 'power', type: 'power', x: 100, y: 150, width: 80, height: 60, label: '9V Battery' },
    { id: 'reg', type: 'ic', x: 250, y: 150, width: 60, height: 40, label: 'LM7805' },
    { id: 'mic1', type: 'component', x: 100, y: 250, width: 40, height: 40, label: 'MIC1' },
    { id: 'r1', type: 'resistor', x: 180, y: 270, width: 60, height: 20, label: '10kΩ' },
    { id: 'amp1', type: 'ic', x: 300, y: 230, width: 80, height: 60, label: 'LM386' },
  ]);
  private readonly _edges = new BehaviorSubject<GraphEdge[]>([]); // Placeholder for connections

  // Expose the nodes and edges as observables for components to subscribe to
  readonly nodes$ = this._nodes.asObservable();
  readonly edges$ = this._edges.asObservable();

  constructor() { }

  // Method to get the current snapshot of nodes
  getNodes(): GraphNode[] {
    return this._nodes.getValue();
  }

  /**
   * Adds a new node to the graph.
   * @param node The GraphNode object to add.
   */
  addNode(node: GraphNode): void {
    const currentNodes = this._nodes.getValue();
    this._nodes.next([...currentNodes, node]);
  }

  /**
   * Updates the position of multiple nodes.
   * @param updates A map of nodeId to new {x, y} coordinates.
   */
  updateNodePositions(updates: Map<string, { x: number; y: number }>): void {
    const currentNodes = this._nodes.getValue();
    const updatedNodes = currentNodes.map(node => {
      const update = updates.get(node.id);
      return update ? { ...node, x: update.x, y: update.y } : node;
    });
    this._nodes.next(updatedNodes);
  }

  deleteNodes(ids: string[]): void {
    const currentNodes = this._nodes.getValue();
    this._nodes.next(currentNodes.filter(node => !ids.includes(node.id)));
    // Note: We will also need to filter edges that connect to these nodes later.
  }
}
