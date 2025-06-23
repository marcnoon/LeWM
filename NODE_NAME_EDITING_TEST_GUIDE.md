# Node Name Editing Feature - Manual Test Guide

## Feature Description
In Normal mode, you can now edit a node's name by selecting a single node and pressing Enter.

## How to Test

### Prerequisites
1. Start the application: `npm start`
2. Navigate to `http://localhost:4200`
3. Ensure you're in Normal mode (default mode)

### Test Steps

1. **Select a Single Node**
   - Click on any node in the graph editor to select it
   - The node should appear highlighted (blue background)
   - Ensure only one node is selected (Ctrl+click can multi-select)

2. **Press Enter Key**
   - With exactly one node selected, press the Enter key
   - A dialog should appear titled "Edit Node Name"
   - The current node name should be pre-filled and selected in the input field

3. **Edit the Node Name**
   - Type a new name for the node
   - The input field should accept text input normally

4. **Save Changes**
   - Press Enter key OR click the "OK" button
   - The dialog should close
   - The node should now display the new name
   - The change should be persisted (refresh the page to verify)

5. **Cancel Changes**
   - Repeat steps 1-3
   - Press Escape key OR click the "Cancel" button
   - The dialog should close without saving changes
   - The node name should remain unchanged

### Expected Behavior

- ✅ Only works when exactly one node is selected
- ✅ Only works in Normal mode (not Pin Edit or other modes)
- ✅ Dialog pre-fills with current node name
- ✅ Text is selected for easy editing
- ✅ Enter key saves changes
- ✅ Escape key cancels changes
- ✅ Changes are persisted in the graph state
- ✅ Clicking outside the dialog cancels changes

### Error Cases

- **No nodes selected**: Pressing Enter should do nothing
- **Multiple nodes selected**: Pressing Enter should do nothing
- **Wrong mode**: In Pin Edit mode, Enter should work for pins, not nodes

## Implementation Details

### Files Modified
- `src/app/components/node-name-dialog/node-name-dialog.component.ts` (new)
- `src/app/app.module.ts`
- `src/app/modes/normal.mode.ts`
- `src/app/components/graph-editor/graph-editor.component.ts`
- `src/app/components/graph-editor/graph-editor.component.html`

### Key Components
- **NodeNameDialogComponent**: Reusable dialog for editing node names
- **Normal Mode**: Handles Enter key to trigger node editing
- **Graph Editor**: Orchestrates the dialog and state management
- **GraphStateService**: Persists the node changes

This implementation follows the existing patterns in the codebase and integrates seamlessly with the existing mode system.