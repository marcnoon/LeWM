import { Injectable } from '@angular/core';
import { GraphNode } from '../models/graph-node.model';

export interface PinLayoutConfig {
  minSpacing: number;
  edgeMargin: number;
  textPadding: number;
  estimatedCharWidth: number;
}

export interface OptimalPinLayout {
  positions: { x: number; y: number; name: string }[];
  totalWidth: number;
  hasOverlap: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PinLayoutService {
  private defaultConfig: PinLayoutConfig = {
    minSpacing: 8,
    edgeMargin: 10,
    textPadding: 6,
    estimatedCharWidth: 6 // Approximate width per character in pixels
  };

  constructor() {}

  /**
   * Distributes pins optimally on a node side using GCD-based spacing
   */
  distributePinsOnSide(
    node: GraphNode, 
    side: 'top' | 'right' | 'bottom' | 'left', 
    pinNames: string[],
    config: Partial<PinLayoutConfig> = {}
  ): OptimalPinLayout {
    const finalConfig = { ...this.defaultConfig, ...config };
    const sideLength = this.getSideLength(node, side);
    const availableSpace = sideLength - (2 * finalConfig.edgeMargin);
    
    // Calculate text widths for each pin
    const pinData = pinNames.map(name => ({
      name,
      textWidth: this.estimateTextWidth(name, finalConfig.estimatedCharWidth)
    }));
    
    // Calculate total text width needed
    const totalTextWidth = pinData.reduce((sum, pin) => sum + pin.textWidth + finalConfig.textPadding, 0);
    
    // Use GCD-based optimization for spacing
    const optimalSpacing = this.calculateOptimalSpacing(
      availableSpace, 
      pinNames.length, 
      totalTextWidth, 
      finalConfig.minSpacing
    );
    
    // Generate positions
    const positions = pinData.map((pin, index) => {
      const position = this.calculatePinPosition(
        node, 
        side, 
        index, 
        pinNames.length, 
        optimalSpacing, 
        finalConfig.edgeMargin
      );
      
      return {
        x: Math.round(position.x),
        y: Math.round(position.y),
        name: pin.name
      };
    });
    
    return {
      positions,
      totalWidth: totalTextWidth,
      hasOverlap: totalTextWidth > availableSpace
    };
  }

  /**
   * Calculates optimal spacing using GCD-based algorithm
   */
  private calculateOptimalSpacing(
    availableSpace: number, 
    pinCount: number, 
    totalTextWidth: number, 
    minSpacing: number
  ): number {
    if (pinCount <= 1) return 0;
    
    // Calculate ideal spacing based on available space
    const idealSpacing = availableSpace / (pinCount - 1);
    
    // Calculate minimum required spacing based on text
    const textBasedSpacing = totalTextWidth / (pinCount - 1);
    
    // Use the larger of the two, but at least minSpacing
    const optimalSpacing = Math.max(idealSpacing, textBasedSpacing, minSpacing);
    
    // Apply GCD optimization for grid alignment
    return this.snapToGCDGrid(optimalSpacing);
  }

  /**
   * Snaps spacing to GCD-based grid for better alignment
   */
  private snapToGCDGrid(spacing: number): number {
    // Common grid sizes based on typical UI measurements
    const gridSizes = [5, 8, 10, 12, 15, 16, 20];
    
    // Find the closest grid size
    const closest = gridSizes.reduce((prev, curr) => 
      Math.abs(curr - spacing) < Math.abs(prev - spacing) ? curr : prev
    );
    
    return closest;
  }

  /**
   * Calculates the position of a specific pin
   */
  private calculatePinPosition(
    node: GraphNode,
    side: 'top' | 'right' | 'bottom' | 'left',
    index: number,
    totalPins: number,
    spacing: number,
    margin: number
  ): { x: number; y: number } {
    switch (side) {
      case 'top':
        return {
          x: margin + (index * spacing),
          y: 0
        };
      case 'right':
        return {
          x: node.width,
          y: margin + (index * spacing)
        };
      case 'bottom':
        return {
          x: margin + (index * spacing),
          y: node.height
        };
      case 'left':
        return {
          x: 0,
          y: margin + (index * spacing)
        };
    }
  }

  /**
   * Gets the length of a node side
   */
  private getSideLength(node: GraphNode, side: 'top' | 'right' | 'bottom' | 'left'): number {
    return (side === 'top' || side === 'bottom') ? node.width : node.height;
  }

  /**
   * Estimates text width based on character count
   */
  private estimateTextWidth(text: string, charWidth: number): number {
    return text.length * charWidth;
  }

  /**
   * Redistributes existing pins on a side for better spacing
   */
  redistributeExistingPins(
    node: GraphNode,
    side: 'top' | 'right' | 'bottom' | 'left',
    config: Partial<PinLayoutConfig> = {}
  ): OptimalPinLayout | null {
    if (!node.pins) return null;
    
    // Filter pins that are on the specified side
    const sidePins = this.getPinsOnSide(node, side);
    const pinNames = sidePins.map(pin => pin.name);
    
    if (pinNames.length === 0) return null;
    
    return this.distributePinsOnSide(node, side, pinNames, config);
  }

  /**
   * Gets all pins that are positioned on a specific side of a node
   */
  private getPinsOnSide(node: GraphNode, side: 'top' | 'right' | 'bottom' | 'left'): { x: number; y: number; name: string }[] {
    if (!node.pins) return [];
    
    return node.pins.filter(pin => {
      switch (side) {
        case 'top':
          return pin.y === 0;
        case 'right':
          return pin.x === node.width;
        case 'bottom':
          return pin.y === node.height;
        case 'left':
          return pin.x === 0;
        default:
          return false;
      }
    });
  }
}