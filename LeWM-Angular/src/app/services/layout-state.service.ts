import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutStateService {
  private isResizingSubject = new BehaviorSubject<boolean>(false);

  public isResizing$: Observable<boolean> = this.isResizingSubject.asObservable();

  setResizing(isResizing: boolean): void {
    this.isResizingSubject.next(isResizing);
  }

  get isResizing(): boolean {
    return this.isResizingSubject.value;
  }
}