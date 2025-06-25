# Node Properties Editing Feature - Manual Test Guide

## Feature Description
In Normal mode, you can now edit a node's name, value, and unit by selecting a single node and pressing Enter. The value and unit fields are completely optional.

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
   - A dialog should appear titled "Edit Node Properties"
   - The current node name should be pre-filled and selected in the first input field
   - The current value (if any) should be shown in the second field
   - The current unit (if any) should be shown in the third field

3. **Edit Node Properties**
   - **Name**: Type a new name for the node (required)
   - **Value**: Type a value (optional) - can be numbers, strings, symbols, etc.
   - **Unit**: Type a unit (optional) - e.g., "V", "A", "Ω", "m/s", etc.
   - All input fields accept text input normally
   - Tab key should move between fields

4. **Save Changes**
   - Press Enter key OR click the "OK" button
   - The dialog should close
   - The node should now display the new name
   - The value and unit should be stored with the node (not visible in normal mode but saved)
   - The changes should be persisted (refresh the page to verify)

5. **Cancel Changes**
   - Repeat steps 1-3
   - Press Escape key OR click the "Cancel" button
   - The dialog should close without saving changes
   - All node properties should remain unchanged

### Additional Test Scenarios

6. **Test Optional Fields**
   - Create a new node or select an existing one
   - Open the properties dialog
   - Enter only a name (leave value and unit empty)
   - Save - should work fine
   - Reopen dialog - value and unit fields should be empty

7. **Test with Value Only**
   - Open properties dialog
   - Enter a name and value, but leave unit empty
   - Save and verify the value is stored
   - Reopen dialog to confirm value is preserved and unit is still empty

8. **Test with Unit Only**
   - Open properties dialog  
   - Enter a name and unit, but leave value empty
   - Save and verify the unit is stored
   - Reopen dialog to confirm unit is preserved and value is still empty

9. **Test with All Fields**
   - Enter name: "Resistor R1"
   - Enter value: "100"
   - Enter unit: "Ω"
   - Save and verify all properties are preserved
   - Reopen dialog to confirm all fields are correctly populated

10. **Test Whitespace Handling**
    - Enter values with leading/trailing spaces
    - Save and reopen - spaces should be trimmed
    - Empty value/unit fields (just spaces) should be saved as empty

11. **Test Backwards Compatibility**
    - Open properties for nodes that existed before the update
    - Value and unit fields should be empty but editable
    - Saving should work normally without affecting existing functionality

### Expected Behavior

- ✅ Only works when exactly one node is selected
- ✅ Only works in Normal mode (not Pin Edit or other modes)
- ✅ Dialog shows "Edit Node Properties" title
- ✅ Dialog pre-fills with current node name, value, and unit
- ✅ Name field text is selected for easy editing
- ✅ Value and unit fields are optional
- ✅ Tab key moves between input fields
- ✅ Enter key saves changes
- ✅ Escape key cancels changes  
- ✅ Changes are persisted in the graph state
- ✅ Empty value/unit fields are not stored (cleaned up)
- ✅ Whitespace is trimmed from all fields
- ✅ Backwards compatible with existing nodes
- ✅ Clicking outside the dialog cancels changes

### Error Cases

- **No nodes selected**: Pressing Enter should do nothing
- **Multiple nodes selected**: Pressing Enter should do nothing
- **Wrong mode**: In Pin Edit mode, Enter should work for pins, not nodes

## Implementation Details

### Files Modified
- `src/app/models/graph-node.model.ts` (updated)
- `src/app/components/node-name-dialog/node-name-dialog.component.ts` (updated)
- `src/app/components/node-name-dialog/node-name-dialog.component.spec.ts` (updated)
- `src/app/components/graph-editor/graph-editor.component.ts` (updated)
- `src/app/components/graph-editor/graph-editor.component.html` (updated)

### Key Components
- **GraphNode Model**: Updated to include optional `value` and `unit` fields
- **NodeNameDialogComponent**: Enhanced dialog for editing node name, value, and unit
- **Normal Mode**: Handles Enter key to trigger node properties editing
- **Graph Editor**: Orchestrates the dialog and state management
- **GraphStateService**: Persists the node changes including value and unit

### Key Features Added
- **Optional Value Field**: Accepts any string (numbers, text, symbols)
- **Optional Unit Field**: Accepts any string representing units (V, A, Ω, m/s, etc.)
- **Backwards Compatibility**: Existing nodes without value/unit work unchanged
- **Data Cleanliness**: Empty strings are converted to undefined to keep data clean
- **Enhanced UI**: Form layout with proper labels and placeholders
- **Comprehensive Testing**: Full test coverage for new functionality

This implementation follows the existing patterns in the codebase and integrates seamlessly with the existing mode system while adding the requested value and unit functionality.