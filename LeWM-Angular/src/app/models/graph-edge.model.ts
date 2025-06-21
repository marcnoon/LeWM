export interface GraphEdge {
  // Unique identifier for the edge (optional, but good for tracking)
  id?: string; 
  from: string; // e.g., 'nodeId.pinName' or 'nodeId'
  to: string;   // e.g., 'nodeId.pinName' or 'nodeId'
}