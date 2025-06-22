export interface GraphEdge {
  id?: string; // Optional unique identifier for the edge
  from: string; // Source node.pin (e.g., 'nodeId.pinName')
  to: string; // Target node.pin (e.g., 'nodeId.pinName')
  isSelected?: boolean; // Selection state for UI
  isHighlighted?: boolean; // Hover/highlight state for UI
}