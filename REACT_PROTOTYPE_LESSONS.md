# React Prototype - Multi-Node Drag Fix: Lessons Learned

## Problem Identified
The React prototype's Interactive Circuit Editor had a critical bug where multiple selected components would lose their relative positions when dragged near workspace boundaries. This occurred because individual components were being clamped to boundaries independently.

## Root Cause
The original implementation used individual component clamping:
```javascript
// BROKEN: Individual component clamping
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

This violated the fundamental requirement that "all nodes maintain their relative positions unless a node reaches the workspace boundary."

## Solution Applied
The fix implemented group-aware boundary constraints:

```javascript
// FIXED: Group-aware boundary constraints
const deltaX = mouseX - dragStart.x;
const deltaY = mouseY - dragStart.y;

// Calculate the movement limits for the entire group
let minAllowedDeltaX = deltaX;
let minAllowedDeltaY = deltaY;

// Check constraints for all selected components
selectedComponents.forEach(compId => {
  const initial = initialPositions[compId];
  if (initial) {
    // Constrain deltaX to prevent going below x = 0
    const maxNegativeDeltaX = -initial.x;
    minAllowedDeltaX = Math.max(minAllowedDeltaX, maxNegativeDeltaX);
    
    // Constrain deltaY to prevent going below y = 0  
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

## Key Insights & Lessons Learned

### 1. **Group Movement Principle**
When multiple components are selected, they must move as a cohesive unit. The movement delta should be calculated once for the entire group, not per component.

### 2. **Boundary Constraint Algorithm**
- Calculate the desired movement delta from mouse position
- Check each selected component against workspace boundaries
- Find the most restrictive constraint (minimum allowed delta)
- Apply the same constrained delta to all selected components

### 3. **Relative Position Preservation**
The spatial relationships between components must be preserved even when constrained by boundaries. This requires treating the selection as a single logical entity.

### 4. **Implementation Pattern**
```javascript
// Pattern for group-aware boundary constraints:
// 1. Calculate desired movement
const desiredDeltaX = mouseX - dragStart.x;
const desiredDeltaY = mouseY - dragStart.y;

// 2. Find most restrictive constraint across all selected items
let allowedDeltaX = desiredDeltaX;
let allowedDeltaY = desiredDeltaY;

selectedItems.forEach(item => {
  const initial = initialPositions[item.id];
  // Apply boundary constraints
  const maxNegativeDeltaX = -initial.x; // Can't go below x=0
  const maxNegativeDeltaY = -initial.y; // Can't go below y=0
  allowedDeltaX = Math.max(allowedDeltaX, maxNegativeDeltaX);
  allowedDeltaY = Math.max(allowedDeltaY, maxNegativeDeltaY);
});

// 3. Apply same constrained delta to all selected items
selectedItems.forEach(item => {
  const initial = initialPositions[item.id];
  item.x = initial.x + allowedDeltaX;
  item.y = initial.y + allowedDeltaY;
});
```

## Testing Results
The fix was validated with:
- ✅ **Normal drag operations**: Multiple nodes maintain relative positions during diagonal movement
- ✅ **Consistent behavior**: Group movement works regardless of which node is used as drag anchor
- ✅ **Boundary constraints**: When any component would exceed workspace boundaries, the entire group stops together
- ✅ **Relative position preservation**: Spatial relationships maintained even when constrained by boundaries

## Applicability to Angular Implementation
This same pattern can be applied to fix the Angular app's drag behavior. The Angular implementation currently has the same issue with individual component clamping that needs to be replaced with group-aware boundary constraints.

## Performance Considerations
The group-aware approach is actually more efficient as it:
- Calculates constraints once per drag operation instead of per component
- Reduces redundant boundary checks
- Provides more predictable behavior for users

## User Experience Impact
This fix ensures that multi-component selection feature works reliably and predictably, maintaining the spatial integrity of component groups during drag operations while properly respecting workspace boundaries.