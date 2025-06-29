import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GraphNode } from '../models/graph-node.model';
import { GraphEdge } from '../models/graph-edge.model';

@Injectable({
  providedIn: 'root'
})
export class GraphStateService {
  // Default initial data
  private readonly defaultNodes: GraphNode[] = [
    { id: 'power', type: 'power', x: 100, y: 150, width: 80, height: 60, label: '9V Battery', pins: [{x: 80, y: 20, name: '+9V'}, {x: 80, y: 40, name: 'GND'}] },
    { id: 'reg', type: 'ic', x: 250, y: 150, width: 60, height: 40, label: 'LM7805', pins: [{x: 0, y: 20, name: 'IN'}, {x: 30, y: 40, name: 'GND'}, {x: 60, y: 20, name: 'OUT'}] },
    { id: 'mic1', type: 'component', x: 100, y: 250, width: 40, height: 40, label: 'MIC1', pins: [{x: 40, y: 20, name: 'OUT'}, {x: 20, y: 40, name: 'GND'}] },
    { id: 'r1', type: 'resistor', x: 180, y: 270, width: 60, height: 20, label: '10kΩ', pins: [{x: 0, y: 10, name: 'A'}, {x: 60, y: 10, name: 'B'}] },
    { id: 'amp1', type: 'ic', x: 300, y: 230, width: 80, height: 60, label: 'LM386', pins: [
      {x: 0, y: 15, name: 'GAIN'}, {x: 0, y: 30, name: '-IN'}, {x: 0, y: 45, name: '+IN'},
      {x: 20, y: 60, name: 'GND'}, {x: 40, y: 60, name: 'VCC'}, {x: 60, y: 60, name: 'BYP'},
      {x: 80, y: 45, name: 'OUT'}, {x: 80, y: 15, name: 'VS'}
    ]},
  ];
  
  private readonly defaultEdges: GraphEdge[] = [
    { id: 'conn_1', from: 'power.+9V', to: 'reg.IN' },
    { id: 'conn_2', from: 'power.GND', to: 'reg.GND' },
    { id: 'conn_3', from: 'reg.OUT', to: 'amp1.VCC' },
    { id: 'conn_4', from: 'mic1.OUT', to: 'r1.A' },
    { id: 'conn_5', from: 'r1.B', to: 'amp1.+IN' },
  ];

  // Use _nodes and _edges for internal state management
  private readonly _nodes = new BehaviorSubject<GraphNode[]>(this.loadFromLocalStorage() || this.defaultNodes);
  private readonly _edges = new BehaviorSubject<GraphEdge[]>(this.defaultEdges);

  // Expose the nodes and edges as observables for components to subscribe to
  readonly nodes$ = this._nodes.asObservable();
  readonly edges$ = this._edges.asObservable();

  constructor() {
    //
  }

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

  /**
   * Updates an entire node (including pins).
   * @param nodeId The ID of the node to update.
   * @param updatedNode The updated node data.
   */
  updateNode(nodeId: string, updatedNode: GraphNode): void {
    const currentNodes = this._nodes.getValue();
    const nodeIndex = currentNodes.findIndex(n => n.id === nodeId);
    
    if (nodeIndex === -1) {
      console.warn(`Node with id ${nodeId} not found`);
      return;
    }
    
    console.log(`📝 Updating node ${nodeId} in GraphStateService`);
    console.log(`📌 Node pins before update:`, currentNodes[nodeIndex].pins);
    console.log(`📌 Node pins after update:`, updatedNode.pins);
    
    const updatedNodes = [...currentNodes];
    updatedNodes[nodeIndex] = { ...updatedNode };
    this._nodes.next(updatedNodes);
    
    // Store to localStorage for persistence
    this.saveToLocalStorage();
    
    console.log(`💾 Node ${nodeId} updated and saved to localStorage`);
  }

  /**
   * Updates an entire node synchronously and returns a promise when persistence is complete.
   * @param nodeId The ID of the node to update.
   * @param updatedNode The updated node data.
   * @returns Promise that resolves when the update is persisted.
   */
  updateNodeSync(nodeId: string, updatedNode: GraphNode): Promise<void> {
    return new Promise((resolve) => {
      this.updateNode(nodeId, updatedNode);
      // Add a small delay to ensure state is updated
      setTimeout(() => resolve(), 10);
    });
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
    
    const removedConnections = currentEdges.length - filteredEdges.length;
    if (removedConnections > 0) {
      console.log(`Removed ${removedConnections} connections due to node deletion`);
    }
    
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
    // Determine unique ID for new edge
    let newId = edge.id || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const exists = (id: string) => currentEdges.some(e => e.id === id);
    if (exists(newId)) {
      do {
        newId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      } while (exists(newId));
    }
    const newEdge = { ...edge, id: newId };
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
   * Updates an existing edge in the graph.
   * @param edgeId The ID of the edge to update.
   * @param updatedEdge The updated edge data.
   */
  updateEdge(edgeId: string, updatedEdge: GraphEdge): void {
    const currentEdges = this._edges.getValue();
    const edgeIndex = currentEdges.findIndex(e => e.id === edgeId);
    if (edgeIndex === -1) {
      console.warn(`Edge with id ${edgeId} not found`);
      return;
    }
    // Ensure unique ID if changed
    let newId: string = updatedEdge.id ?? edgeId;
    if (newId !== edgeId) {
      const existsOther = (id: string) => currentEdges.some((e, idx) => idx !== edgeIndex && e.id === id);
      if (existsOther(newId)) {
        do {
          newId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        } while (existsOther(newId));
      }
    } else {
      newId = edgeId;
    }
    const newEdge = { ...updatedEdge, id: newId };
    const updatedEdges = [...currentEdges];
    updatedEdges[edgeIndex] = newEdge;
    this._edges.next(updatedEdges);
  }

  /**
   * Notifies subscribers of edge state changes (for selection, hover, etc.)
   */
  notifyEdgeStateChange(): void {
    // Force notification by re-emitting current edges
    const currentEdges = this._edges.getValue();
    this._edges.next([...currentEdges]);
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

  /**
   * Checks if a pin exists on a node.
   * @param nodeId The ID of the node.
   * @param pinName The name of the pin.
   * @returns True if the pin exists, false otherwise.
   */
  pinExists(nodeId: string, pinName: string): boolean {
    const node = this.getNodes().find(n => n.id === nodeId);
    if (!node || !node.pins) return false;
    
    return node.pins.some(p => p.name === pinName);
  }

  /**
   * Removes specified pins from a node and cleans up associated connections.
   * @param nodeId The ID of the node from which to remove pins.
   * @param pinNames List of pin names to remove.
   */
  removePins(nodeId: string, pinNames: string[]): void {
    const nodes = this._nodes.getValue();
    const idx = nodes.findIndex(n => n.id === nodeId);
    if (idx === -1) return;
    const node = {...nodes[idx]};
    if (!node.pins) return;
    node.pins = node.pins.filter(pin => !pinNames.includes(pin.name));
    const updated = [...nodes]; updated[idx] = node;
    this._nodes.next(updated);
    // clean up connections for each removed pin
    pinNames.forEach(name => this.removeConnectionsForPin(nodeId, name));
  }

  /**
   * Removes orphaned connections that reference a specific pin.
   * @param nodeId The ID of the node.
   * @param pinName The name of the pin that was removed.
   * @returns The number of connections removed.
   */
  removeConnectionsForPin(nodeId: string, pinName: string): number {
    const currentEdges = this._edges.getValue();
    const pinReference = `${nodeId}.${pinName}`;
    
    const validEdges = currentEdges.filter(edge => 
      edge.from !== pinReference && edge.to !== pinReference
    );
    
    const removedCount = currentEdges.length - validEdges.length;
    
    if (removedCount > 0) {
      this._edges.next(validEdges);
      console.log(`Removed ${removedCount} connections for pin ${nodeId}.${pinName}`);
    }
    
    return removedCount;
  }

  /**
   * Removes all orphaned connections (connections that reference non-existent pins).
   * @returns The number of orphaned connections removed.
   */
  cleanupOrphanedConnections(): number {
    const currentEdges = this._edges.getValue();
    const validEdges = currentEdges.filter(edge => this.isConnectionValid(edge));
    
    const removedCount = currentEdges.length - validEdges.length;
    
    if (removedCount > 0) {
      this._edges.next(validEdges);
      console.log(`Cleaned up ${removedCount} orphaned connections`);
    }
    
    return removedCount;
  }

  /**
   * Checks if a connection is valid (both endpoints exist).
   * @param edge The edge to validate.
   * @returns True if the connection is valid, false otherwise.
   */
  private isConnectionValid(edge: GraphEdge): boolean {
    try {
      const [fromNodeId, fromPinName] = edge.from.split('.');
      const [toNodeId, toPinName] = edge.to.split('.');
      
      // Check if both pins exist
      return this.pinExists(fromNodeId, fromPinName) && this.pinExists(toNodeId, toPinName);
    } catch {
      // Invalid connection format
      return false;
    }
  }

  /**
   * Validates the integrity of all connections and removes any orphaned ones.
   * This method can be called periodically or after major operations to ensure data consistency.
   * @returns A summary of the validation results.
   */
  validateConnectionIntegrity(): { totalConnections: number; validConnections: number; removedConnections: number } {
    const currentEdges = this._edges.getValue();
    const totalConnections = currentEdges.length;
    
    const validEdges = currentEdges.filter(edge => this.isConnectionValid(edge));
    const validConnections = validEdges.length;
    const removedConnections = totalConnections - validConnections;
    
    if (removedConnections > 0) {
      this._edges.next(validEdges);
      console.log(`Connection integrity validation: removed ${removedConnections} orphaned connections out of ${totalConnections} total`);
    }
    
    return {
      totalConnections,
      validConnections,
      removedConnections
    };
  }
  
  /**
   * Save nodes to localStorage for persistence
   */
  private saveToLocalStorage(): void {
    try {
      const nodes = this._nodes.getValue();
      localStorage.setItem('lewm-graph-nodes', JSON.stringify(nodes));
      console.log('💾 Saved nodes to localStorage');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }
  
  /**
   * Load nodes from localStorage
   */
  private loadFromLocalStorage(): GraphNode[] | null {
    try {
      const saved = localStorage.getItem('lewm-graph-nodes');
      if (saved) {
        const nodes = JSON.parse(saved);
        console.log('📥 Loaded nodes from localStorage');
        return nodes;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  }
  
  /**
   * Clear saved data and reset to defaults
   */
  resetToDefaults(): void {
    localStorage.removeItem('lewm-graph-nodes');
    localStorage.removeItem('lewm-enhanced-pin-properties'); // Clear enhanced properties too
    this._nodes.next(this.defaultNodes);
    this._edges.next(this.defaultEdges);
    console.log('🔄 Reset to default data');
  }
}
