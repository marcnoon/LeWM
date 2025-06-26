export interface GraphNode {
  id: string; // Unique identifier for the node
  type: string; // Generic type (e.g., 'basic', 'complex', 'circuit-resistor')
  x: number; // X-coordinate on the canvas
  y: number; // Y-coordinate on the canvas
  width: number; // Width of the node
  height: number; // Height of the node
  label: string; // Display label for the node
  value?: string; // Optional value (can be number, string, symbols, etc.)
  unit?: string; // Optional unit string representation
  shape?: 'rectangle' | 'circle' | 'polygon'; // Optional shape for algorithmic pin positioning (defaults to 'rectangle')
  pins?: Pin[]; // Optional connection points for domain-specific nodes
}

export interface Pin {
  x: number;
  y: number;
  name: string;
}

