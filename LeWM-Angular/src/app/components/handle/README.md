# HandleComponent

A reusable Angular component for creating resizable UI elements with mouse drag functionality.

## Overview

The HandleComponent encapsulates all resize handle behavior, including mouse event handling, visual feedback, and parent communication. It was extracted from the GraphEditorComponent to follow the Single Responsibility Principle and enable reusability.

## Features

- **Mouse Event Handling**: Uses `@HostListener` for mousedown events
- **Global Event Management**: Automatically manages document-level mousemove and mouseup events
- **Visual Feedback**: Shows hover and active states with CSS transitions
- **Parent Communication**: Emits events for resize start, resize deltas, and resize end
- **Proper Cleanup**: Removes event listeners and restores styles on component destruction
- **Dual Orientation Support**: Works as both vertical and horizontal resize handles

## Usage

### Vertical Handle (Default)
```html
<app-handle 
  (resize)="onResize($event)" 
  (resizeStart)="onResizeStart()" 
  (resizeEnd)="onResizeEnd()">
</app-handle>
```

### Horizontal Handle
```html
<app-handle 
  orientation="horizontal"
  (resize)="onResize($event)" 
  (resizeStart)="onResizeStart()" 
  (resizeEnd)="onResizeEnd()">
</app-handle>
```

## Inputs

- `@Input() orientation: 'horizontal' | 'vertical' = 'vertical'` - Controls handle orientation and behavior

## Events

- `@Output() resize: EventEmitter<number>` - Emits the delta movement during resize (deltaX for vertical, deltaY for horizontal)
- `@Output() resizeStart: EventEmitter<void>` - Emitted when resize begins
- `@Output() resizeEnd: EventEmitter<void>` - Emitted when resize ends

## Implementation Details

### Mouse Event Flow
1. User clicks on handle → `@HostListener('mousedown')` triggers
2. Component stores initial mouse position and adds global listeners
3. Mouse movement → emits `resize` event with delta X
4. Mouse release → removes listeners and emits `resizeEnd`

### Styling
The component includes hover and active states:
- Default: Light gray background
- Hover/Active: Blue background with white indicator
- 6px width with centered vertical indicator line

### Parent Integration
The parent component should:
1. Store initial width on `resizeStart`
2. Apply width constraints (min/max) on `resize`
3. Optionally handle cleanup on `resizeEnd`

## Example Implementation

```typescript
export class MyComponent {
  panelWidth = 250;
  minWidth = 200;
  maxWidth = 500;
  private startWidth = 0;

  onResizeStart(): void {
    this.startWidth = this.panelWidth;
  }

  onResize(deltaX: number): void {
    const newWidth = this.startWidth + deltaX;
    this.panelWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
  }
}
```

## Benefits

- **Reusable**: Can be used for any resizable panel or element
- **Maintainable**: Clear separation of resize logic from business logic
- **Testable**: Isolated component with well-defined inputs/outputs
- **Performant**: Efficient event handling with proper cleanup