import { TestBed } from '@angular/core/testing';

import { GraphStateService } from './graph-state.service';
import { GraphEdge } from '../models/graph-edge.model';

describe('GraphStateService', () => {
  let service: GraphStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphStateService);
  });

  afterEach(() => {
    // Service State Cleanup
    // Reset GraphStateService to default state
    service.resetToDefaults();
    
    // Clear localStorage test data
    localStorage.removeItem('lewm-graph-nodes');
    localStorage.removeItem('lewm-enhanced-pin-properties');
    
    // Reset any global state
    delete (window as any).testGlobals;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a unique id when adding an edge with duplicate id', () => {
    const initialCount: number = service.getEdges().length;
    const newEdge: GraphEdge = { id: 'conn_1', from: 'power.+9V', to: 'mic1.OUT' };
    service.addEdge(newEdge);
    const edges: GraphEdge[] = service.getEdges();
    expect(edges.length).toBe(initialCount + 1);
    const added: GraphEdge | undefined = edges.find((e: GraphEdge) => e.from === newEdge.from && e.to === newEdge.to);
    expect(added).toBeDefined();
    expect(added!.id).not.toBe('conn_1');
    // All IDs should be unique
    const ids: string[] = edges.map((e: GraphEdge) => e.id!);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should generate unique ids when adding multiple edges without ids', () => {
    const initialCount: number = service.getEdges().length;
    const countToAdd = 3;
    for (let i = 0; i < countToAdd; i++) {
      const edge: GraphEdge = { from: `nodeA.pin${i}`, to: `nodeB.pin${i}` };
      service.addEdge(edge);
    }
    const edges: GraphEdge[] = service.getEdges();
    expect(edges.length).toBe(initialCount + countToAdd);
    const newEdges: GraphEdge[] = edges.slice(-countToAdd);
    const ids: string[] = newEdges.map((e: GraphEdge) => e.id!);
    const unique = new Set(ids);
    expect(unique.size).toBe(countToAdd);
  });

  it('should regenerate a unique id when updating an edge to a duplicate id', () => {
    // Add two distinct edges
    service.addEdge({ id: 'e1', from: 'n1.p1', to: 'n2.p2' } as GraphEdge);
    service.addEdge({ id: 'e2', from: 'n3.p3', to: 'n4.p4' } as GraphEdge);
    // Attempt to update e1's id to 'e2'
    service.updateEdge('e1', { id: 'e2', from: 'n1.p1', to: 'n2.p2' } as GraphEdge);
    const after: GraphEdge[] = service.getEdges();
    // e1 should now have a new unique id not 'e2' and not collide
    const updated: GraphEdge | undefined = after.find((e: GraphEdge) => e.from === 'n1.p1' && e.to === 'n2.p2');
    expect(updated).toBeDefined();
    expect(updated!.id).not.toBe('e2');
    expect(updated!.id).not.toBe('e1');
    // All IDs in graph should be unique
    const allIds: string[] = after.map((e: GraphEdge) => e.id!);
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
