import { ConnectionValue } from './connection-value.model';

export type ConnectionDirection = 'forward' | 'backward' | 'bidirectional';
export type ConnectionType = 'signal' | 'power' | 'data' | 'control' | 'custom';

export interface GraphEdge {
  // Basic connection info
  id?: string; 
  from: string; // e.g., 'nodeId.pinName' or 'nodeId'
  to: string;   // e.g., 'nodeId.pinName' or 'nodeId'
  
  // Enhanced metadata
  label?: string; // Display name for the connection
  direction?: ConnectionDirection; // Flow direction
  type?: ConnectionType; // Connection category
  
  // Value and calculation system
  values?: ConnectionValue[]; // Key-value pairs with units
  
  // Visual properties
  color?: string; // Custom color for the connection
  strokeWidth?: number; // Line thickness
  strokeStyle?: 'solid' | 'dashed' | 'dotted'; // Line style
  
  // State
  isSelected?: boolean; // For connection mode selection
  isHighlighted?: boolean; // For hover effects
  
  // Metadata
  description?: string; // Additional notes
  tags?: string[]; // For categorization and filtering
  createdAt?: Date;
  updatedAt?: Date;
}