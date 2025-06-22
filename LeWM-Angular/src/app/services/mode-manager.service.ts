import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GraphMode } from '../interfaces/graph-mode.interface';
import { GraphNode } from '../models/graph-node.model';

@Injectable({
  providedIn: 'root'
})
export class ModeManagerService {
  private readonly _activeMode = new BehaviorSubject<GraphMode | null>(null);
  private readonly _availableModes = new Map<string, GraphMode>();
  
  readonly activeMode$ = this._activeMode.asObservable();
  
  constructor() {}
  
  /**
   * Registers a mode with the manager
   */
  registerMode(mode: GraphMode): void {
    this._availableModes.set(mode.name, mode);
  }
  
  /**
   * Activates a specific mode
   */
  activateMode(modeName: string): boolean {
    const mode = this._availableModes.get(modeName);
    if (!mode) {
      console.warn(`Mode '${modeName}' not found`);
      return false;
    }
    
    // Deactivate current mode
    const currentMode = this._activeMode.value;
    if (currentMode) {
      currentMode.deactivate();
      currentMode.isActive = false;
    }
    
    // Activate new mode
    mode.activate();
    mode.isActive = true;
    this._activeMode.next(mode);
    
    console.log(`Activated mode: ${mode.displayName}`);
    return true;
  }
  
  /**
   * Gets the currently active mode
   */
  getActiveMode(): GraphMode | null {
    return this._activeMode.value;
  }
  
  /**
   * Gets all available modes
   */
  getAvailableModes(): GraphMode[] {
    return Array.from(this._availableModes.values());
  }
  
  /**
   * Delegates node click events to the active mode
   */
  handleNodeClick(node: GraphNode, event: MouseEvent): boolean {
    const mode = this._activeMode.value;
    return mode ? mode.handleNodeClick(node, event) : false;
  }
  
  /**
   * Delegates pin click events to the active mode
   */
  handlePinClick(node: GraphNode, pin: { x: number; y: number; name: string }, event: MouseEvent): boolean {
    const mode = this._activeMode.value;
    return mode ? mode.handlePinClick(node, pin, event) : false;
  }
  
  /**
   * Delegates canvas click events to the active mode
   */
  handleCanvasClick(event: MouseEvent): boolean {
    const mode = this._activeMode.value;
    return mode ? mode.handleCanvasClick(event) : false;
  }
  
  /**
   * Delegates mouse move events to the active mode
   */
  handleMouseMove(event: MouseEvent): boolean {
    const mode = this._activeMode.value;
    return mode ? mode.handleMouseMove(event) : false;
  }
  
  /**
   * Delegates keyboard events to the active mode
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    const mode = this._activeMode.value;
    return mode ? mode.handleKeyDown(event) : false;
  }
  
  /**
   * Delegates delete pins action to the active mode
   */
  deleteSelectedPins(): void {
    const mode = this._activeMode.value;
    if (!mode) {
      console.warn('No active mode to handle deleteSelectedPins.');
      return;
    }
    mode.deleteSelectedPins();
  }

  /**
   * Gets the cursor style for the active mode
   */
  getActiveCursor(): string {
    const mode = this._activeMode.value;
    return mode ? mode.getCursor() : 'default';
  }
  
  /**
   * Renders overlay for the active mode
   */
  renderActiveOverlay(canvas: SVGElement): void {
    const mode = this._activeMode.value;
    if (mode) {
      mode.renderOverlay(canvas);
    }
  }
}