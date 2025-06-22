export interface GraphNode {
  id: string; // Unique identifier for the node
  type: string; // Generic type (e.g., 'basic', 'complex', 'circuit-resistor')
  x: number; // X-coordinate on the canvas
  y: number; // Y-coordinate on the canvas
  width: number; // Width of the node
  height: number; // Height of the node
  label: string; // Display label for the node
  pins?: Pin[]; // Optional connection points for domain-specific nodes
}

export interface Pin {
  x: number;
  y: number;
  name: string;
}

