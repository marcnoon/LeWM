import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GraphEdge } from '../models/graph-edge.model';

@Injectable({
  providedIn: 'root'
})
export class ConnectionStateService {
  private readonly defaultEdges: GraphEdge[] = [
    { id: 'conn_1', from: 'power.+9V', to: 'reg.IN' },
    { id: 'conn_2', from: 'power.GND', to: 'reg.GND' },
    { id: 'conn_3', from: 'reg.OUT', to: 'amp1.VCC' },
    { id: 'conn_4', from: 'mic1.OUT', to: 'r1.A' },
    { id: 'conn_5', from: 'r1.B', to: 'amp1.+IN' },
  ];

  private readonly _edges = new BehaviorSubject<GraphEdge[]>(this.defaultEdges);

  readonly edges$ = this._edges.asObservable();

  getEdges(): GraphEdge[] {
    return this._edges.getValue();
  }

  setEdges(edges: GraphEdge[]): void {
    this._edges.next(edges);
  }

  addEdge(edge: GraphEdge): void {
    const currentEdges = this._edges.getValue();
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

  removeEdge(edgeId: string): void {
    const currentEdges = this._edges.getValue();
    this._edges.next(currentEdges.filter(edge => edge.id !== edgeId));
  }

  updateEdge(edgeId: string, updatedEdge: GraphEdge): void {
    const currentEdges = this._edges.getValue();
    const edgeIndex = currentEdges.findIndex(e => e.id === edgeId);
    if (edgeIndex === -1) {
      console.warn(`Edge with id ${edgeId} not found`);
      return;
    }
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

  notifyEdgeStateChange(): void {
    const currentEdges = this._edges.getValue();
    this._edges.next([...currentEdges]);
  }

  resetToDefaults(): void {
    this._edges.next(this.defaultEdges);
  }
}
