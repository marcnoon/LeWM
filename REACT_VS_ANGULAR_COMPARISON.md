# Multi-Node Drag Fix: React vs Angular Implementation Comparison

## Summary
Both the React prototype and Angular app had the same critical bug in their multi-node drag behavior. This document compares the implementations and fixes applied.

## Problem Description
When multiple components/nodes are selected and dragged near workspace boundaries, they would lose their relative positions because each component was being clamped to boundaries independently.

## React Implementation Fix

### Location
`src/components/InteractiveCircuitEditor.jsx` - `handleMouseMove` function

### Before (Broken)
```javascript
setComponents(prev => prev.map(comp => {
  if (selectedComponents.has(comp.id)) {
    const initial = initialPositions[comp.id];
    return {
      ...comp,
      x: Math.max(0, initial.x + deltaX),  // ❌ Individual clamping
      y: Math.max(0, initial.y + deltaY)   // ❌ Individual clamping
    };
  }
  return comp;
}));
```

### After (Fixed)
```javascript
const deltaX = mouseX - dragStart.x;
const deltaY = mouseY - dragStart.y;

// Calculate the movement limits for the entire group
let minAllowedDeltaX = deltaX;
let minAllowedDeltaY = deltaY;

// Check constraints for all selected components
selectedComponents.forEach(compId => {
  const initial = initialPositions[compId];
  if (initial) {
    const maxNegativeDeltaX = -initial.x;
    minAllowedDeltaX = Math.max(minAllowedDeltaX, maxNegativeDeltaX);
    
    const maxNegativeDeltaY = -initial.y;
    minAllowedDeltaY = Math.max(minAllowedDeltaY, maxNegativeDeltaY);
  }
});

// Apply the same constrained delta to ALL selected components
setComponents(prev => prev.map(comp => {
  if (selectedComponents.has(comp.id)) {
    const initial = initialPositions[comp.id];
    return {
      ...comp,
      x: initial.x + minAllowedDeltaX,  // ✅ Group-constrained movement
      y: initial.y + minAllowedDeltaY   // ✅ Group-constrained movement
    };
  }
  return comp;
}));
```

## Angular Implementation Fix

### Location
`LeWM-Angular/src/app/components/graph-editor/graph-editor.component.ts` - `onMouseMove` method

### Before (Broken)
```typescript
// Create updates map for the service
const updates = new Map<string, { x: number; y: number }>();
this.selectedNodes.forEach(nodeId => {
  const initial = this.initialPositions[nodeId];
  if (initial) {
    updates.set(nodeId, {
      x: Math.max(0, initial.x + offsetX),  // ❌ Individual clamping
      y: Math.max(0, initial.y + offsetY)   // ❌ Individual clamping
    });
  }
});
```

### After (Fixed)
```typescript
// Calculate the movement limits for the entire group to maintain relative positions
let minAllowedOffsetX = offsetX;
let minAllowedOffsetY = offsetY;

// Check constraints for all selected nodes
this.selectedNodes.forEach(nodeId => {
  const initial = this.initialPositions[nodeId];
  if (initial) {
    const maxNegativeOffsetX = -initial.x;
    minAllowedOffsetX = Math.max(minAllowedOffsetX, maxNegativeOffsetX);
    
    const maxNegativeOffsetY = -initial.y;
    minAllowedOffsetY = Math.max(minAllowedOffsetY, maxNegativeOffsetY);
  }
});

// Create updates map for the service - apply same constrained offset to ALL selected nodes
const updates = new Map<string, { x: number; y: number }>();
this.selectedNodes.forEach(nodeId => {
  const initial = this.initialPositions[nodeId];
  if (initial) {
    updates.set(nodeId, {
      x: initial.x + minAllowedOffsetX,  // ✅ Group-constrained movement
      y: initial.y + minAllowedOffsetY   // ✅ Group-constrained movement
    });
  }
});
```

## Key Differences in Implementation

### React
- Uses `useState` hooks for state management
- Direct component state manipulation with `setComponents`
- Component selection tracked with `Set<string>`
- Mouse events handled directly on SVG elements

### Angular
- Uses RxJS observables and services for state management
- State updates through `GraphStateService.updateNodePositions()`
- Node selection tracked with `Set<string>`
- Mouse events handled through component methods with decorators

## Common Pattern Applied

Both implementations now follow the same pattern:

1. **Calculate desired movement** from mouse position
2. **Find most restrictive constraint** across all selected items
3. **Apply the same constrained movement** to all selected items
4. **Preserve relative positions** even when hitting boundaries

## Validation

Both implementations:
- ✅ Build successfully
- ✅ Pass linting checks
- ✅ Maintain consistent behavior
- ✅ Preserve spatial relationships during drag operations
- ✅ Handle boundary constraints correctly

## Impact

This fix ensures that multi-component/multi-node selection works reliably in both React and Angular versions of the application, providing a consistent user experience across different technology stacks while maintaining the spatial integrity of selected groups during drag operations.