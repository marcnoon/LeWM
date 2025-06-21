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
    { id: 'power', type: 'power', x: 100, y: 150, width: 80, height: 60, label: '9V Battery', pins: [{x: 80, y: 20, name: '+9V'}, {x: 80, y: 40, name: 'GND'}] },
    { id: 'reg', type: 'ic', x: 250, y: 150, width: 60, height: 40, label: 'LM7805', pins: [{x: 0, y: 20, name: 'IN'}, {x: 30, y: 40, name: 'GND'}, {x: 60, y: 20, name: 'OUT'}] },
    { id: 'mic1', type: 'component', x: 100, y: 250, width: 40, height: 40, label: 'MIC1', pins: [{x: 40, y: 20, name: 'OUT'}, {x: 20, y: 40, name: 'GND'}] },
    { id: 'r1', type: 'resistor', x: 180, y: 270, width: 60, height: 20, label: '10kΩ', pins: [{x: 0, y: 10, name: 'A'}, {x: 60, y: 10, name: 'B'}] },
    { id: 'amp1', type: 'ic', x: 300, y: 230, width: 80, height: 60, label: 'LM386', pins: [
      {x: 0, y: 15, name: 'GAIN'}, {x: 0, y: 30, name: '-IN'}, {x: 0, y: 45, name: '+IN'},
      {x: 20, y: 60, name: 'GND'}, {x: 40, y: 60, name: 'VCC'}, {x: 60, y: 60, name: 'BYP'},
      {x: 80, y: 45, name: 'OUT'}, {x: 80, y: 15, name: 'VS'}
    ]},
  ]);
  private readonly _edges = new BehaviorSubject<GraphEdge[]>([
    { id: 'conn_1', from: 'power.+9V', to: 'reg.IN' },
    { id: 'conn_2', from: 'power.GND', to: 'reg.GND' },
    { id: 'conn_3', from: 'reg.OUT', to: 'amp1.VCC' },
    { id: 'conn_4', from: 'mic1.OUT', to: 'r1.A' },
    { id: 'conn_5', from: 'r1.B', to: 'amp1.+IN' },
  ]);

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
    
    // Also remove edges connected to deleted nodes
    const currentEdges = this._edges.getValue();
    const filteredEdges = currentEdges.filter(edge => {
      const [fromNodeId] = edge.from.split('.');
      const [toNodeId] = edge.to.split('.');
      return !ids.includes(fromNodeId) && !ids.includes(toNodeId);
    });
    this._edges.next(filteredEdges);
  }

  // Method to get the current snapshot of edges
  getEdges(): GraphEdge[] {
    return this._edges.getValue();
  }

  /**
   * Adds a new edge to the graph.
   * @param edge The GraphEdge object to add.
   */
  addEdge(edge: GraphEdge): void {
    const currentEdges = this._edges.getValue();
    const newEdge = {
      ...edge,
      id: edge.id || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this._edges.next([...currentEdges, newEdge]);
  }

  /**
   * Removes an edge from the graph.
   * @param edgeId The ID of the edge to remove.
   */
  removeEdge(edgeId: string): void {
    const currentEdges = this._edges.getValue();
    this._edges.next(currentEdges.filter(edge => edge.id !== edgeId));
  }

  /**
   * Gets the absolute position of a pin on a node.
   * @param nodeId The ID of the node.
   * @param pinName The name of the pin.
   * @returns The absolute {x, y} coordinates of the pin, or null if not found.
   */
  getPinPosition(nodeId: string, pinName: string): { x: number; y: number } | null {
    const node = this.getNodes().find(n => n.id === nodeId);
    if (!node || !node.pins) return null;
    
    const pin = node.pins.find(p => p.name === pinName);
    if (!pin) return null;
    
    return {
      x: node.x + pin.x,
      y: node.y + pin.y
    };
  }
}
