import { GraphNode } from "../models/graph-node.model";
import { GraphEditorComponent } from "../components/graph-editor/graph-editor.component";
import { Pin } from "../models/graph-node.model"; // Assuming Pin is defined within GraphNode

export interface GraphMode {
  name: string;
  displayName: string;
  selectedPins: Set<string>; // Track selected pin identifiers within mode
  isActive: boolean;
  
  // Lifecycle methods
  activate(): void;
  deactivate(): void | Promise<void>;
  
  // Event handlers - return true if handled, false to pass through
  handleNodeClick(node: GraphNode, event: MouseEvent): boolean;
  handlePinClick(node: GraphNode, pin: { x: number; y: number; name: string }, event: MouseEvent): boolean;
  handleCanvasClick(event: MouseEvent): boolean;
  handleMouseMove(event: MouseEvent): boolean;
  handleKeyDown(event: KeyboardEvent): boolean;
  /** Delete any selected pins within the current mode */
  deleteSelectedPins(): void;
  
  // Visual rendering
  renderOverlay(canvas: SVGElement): void;
  
  // Mode-specific cursor
  getCursor(): string;
}

export interface PinEditState {
  selectedNode: GraphNode | null;
  selectedSide: 'top' | 'right' | 'bottom' | 'left' | null;
  hoveredSide: 'top' | 'right' | 'bottom' | 'left' | null;
  pinDraft: Partial<{ x: number; y: number; name: string }> | null;
  isEditingPinName: boolean;
  editingPinName: string | null;
}