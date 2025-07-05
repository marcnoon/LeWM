import { TestBed } from '@angular/core/testing';
import { ConnectionStateService } from './connection-state.service';
import { GraphEdge } from '../models/graph-edge.model';

describe('ConnectionStateService', () => {
  let service: ConnectionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnectionStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a unique id when adding an edge with duplicate id', () => {
    const initialCount = service.getEdges().length;
    const newEdge: GraphEdge = { id: 'conn_1', from: 'power.+9V', to: 'mic1.OUT' };
    service.addEdge(newEdge);
    const edges = service.getEdges();
    expect(edges.length).toBe(initialCount + 1);
    const added = edges.find(e => e.from === newEdge.from && e.to === newEdge.to);
    expect(added).toBeDefined();
    expect(added!.id).not.toBe('conn_1');
    const ids = edges.map(e => e.id!);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should generate unique ids when adding multiple edges without ids', () => {
    const initialCount = service.getEdges().length;
    const countToAdd = 3;
    for (let i = 0; i < countToAdd; i++) {
      service.addEdge({ from: `nodeA.pin${i}`, to: `nodeB.pin${i}` });
    }
    const edges = service.getEdges();
    expect(edges.length).toBe(initialCount + countToAdd);
    const newEdges = edges.slice(-countToAdd);
    const ids = newEdges.map(e => e.id!);
    const unique = new Set(ids);
    expect(unique.size).toBe(countToAdd);
  });

  it('should regenerate a unique id when updating an edge to a duplicate id', () => {
    service.addEdge({ id: 'e1', from: 'n1.p1', to: 'n2.p2' });
    service.addEdge({ id: 'e2', from: 'n3.p3', to: 'n4.p4' });
    service.updateEdge('e1', { id: 'e2', from: 'n1.p1', to: 'n2.p2' });
    const after = service.getEdges();
    const updated = after.find(e => e.from === 'n1.p1' && e.to === 'n2.p2');
    expect(updated).toBeDefined();
    expect(updated!.id).not.toBe('e2');
    expect(updated!.id).not.toBe('e1');
    const allIds = after.map(e => e.id!);
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
