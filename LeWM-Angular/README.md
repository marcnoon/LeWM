# LeWMAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Standard Mode

The default interaction mode for basic graph editing and connection creation:

- **Add Nodes:** Click node buttons in the toolbar to add predefined nodes.
- **Select & Move:** Click to select a node, drag to move. Ctrl+click to multi-select.
- **Connect Pins:** Click one pin, then another to draw a connection line.
- **Delete:** Press Delete key to remove selected nodes or connections.
- **Clear All:** Use "Clear Edges" button to remove all connections.

## Pin Edit Mode

An advanced mode for customizing node pins and their distribution:

- **Enter Pin Mode:** Click the "Pin Edit" button or press `P`.
- **Select Node:** Click a node to enable side-based pin editing.
- **Hover & Click Sides:** Hover over node edges to highlight. Click to open pin naming dialog.
- **Name Pins:** Enter a pin name in the dialog and press Enter or click OK.
- **Auto-Distribute:** Pins are spaced evenly along the selected side.
- **Remove Pins:** Left-click or right-click existing pins to delete them.
- **Exit Mode:** Press Escape or click "Normal" to return to standard mode.

## Connection Mode

A specialized mode for creating and managing relationships between pins. This mode provides comprehensive connection editing capabilities including single and bulk editing operations.

### Basic Features

-   **Enter Connection Mode:** Click the "Connection" button in the toolbar
-   **Create Connections:** Click one pin, then another to draw a connection line
-   **Select Connections:** Click on connection lines to select them (highlighted in green)
-   **Multi-Select:** Ctrl+click or use selection box to select multiple connections
-   **Delete Connections:** Press Delete key to remove selected connections
-   **Edit Properties:** Double-click a connection to open the properties dialog

### Connection Properties

Each connection supports rich metadata through the properties dialog:

-   **Label:** A unique name or identifier for the connection
-   **Direction:** Control connection flow (forward →, backward ←, or bidirectional ↔)
-   **Type:** Categorize connections (signal, power, data, control, etc.)
-   **Visual Style:** Customize color, stroke width, and line style (solid, dashed, dotted)
-   **Key-Value Pairs:** Assign typed values with comprehensive unit support

### Value System

Connection values support multiple data types and extensive unit systems:

-   **ValueType:** 'string' | 'number' | 'decimal' | 'integer' | 'boolean' | 'calculated'
-   **UnitType:** Electrical (volts, amps, ohms), Physical (meters, grams, seconds), Data (bits, bytes, Hz), and more
-   **Calculated Values:** Support for formula-based values that compute from other connection properties

### Multi-Connection Bulk Editing

**New Feature:** When multiple connections are selected, press **Enter** to open the bulk edit dialog:

#### Bulk Edit Capabilities

-   **Common Properties:** Edit shared properties across all selected connections
    -   Type (if all connections have the same type)
    -   Direction (if all connections have the same direction)  
    -   Color and visual styling
    -   Label prefix/suffix application

-   **Value Management:**
    -   **Unit Changes:** Bulk change units for values that share the same unit type across connections
    -   **Key Management:** Add prefixes or suffixes to existing keys (maintaining key uniqueness within each connection)
    -   **Bulk Value Addition:** Add new key-value pairs to all selected connections

#### Bulk Edit Workflow

1. **Select Multiple Connections:** Use Ctrl+click or selection box to select multiple connections
2. **Activate Bulk Edit:** Press **Enter** key to open the bulk edit dialog
3. **Common Property Detection:** The dialog automatically detects which properties are shared
4. **Selective Editing:** Only properties with commonality across selections can be modified
5. **Key Management:** Apply prefixes/suffixes to key names while maintaining uniqueness within each connection
6. **Unit Management:** Change units for values that share compatible unit types
7. **Apply Changes:** Confirm to update all selected connections simultaneously

#### Smart Property Detection

The bulk edit system intelligently identifies:
- **Identical Values:** Properties that have exactly the same value across all selections
- **Compatible Units:** Values that use the same unit type and can be bulk converted
- **Shared Types:** Connections that use the same connection type or direction
- **Key Management Opportunities:** Existing keys that can benefit from consistent prefixing or suffixing

#### Key Uniqueness and Management

**Important Design Principle:** Keys in connection value dictionaries must remain unique within each connection. The bulk edit system respects this by:

- **No Direct Key Replacement:** Keys cannot be directly changed to avoid breaking uniqueness
- **Prefix/Suffix Only:** Only prefixes and suffixes can be applied to existing keys
- **Per-Connection Uniqueness:** Each connection maintains its own key namespace
- **Example Transformations:**
  - Prefix: `"voltage"` → `"signal_voltage"`
  - Suffix: `"voltage"` → `"voltage_primary"`
  - Combined: `"voltage"` → `"signal_voltage_backup"`

#### Automatic Key Numbering for New Values

When adding new key-value pairs to multiple connections, the system automatically ensures uniqueness:

- **Same Key Across Connections**: If you add the same key name to multiple connections, each gets a unique numbered version
- **Example**: Adding key "bob" to 3 selected connections results in:
  - Connection 1: `"bob1"`
  - Connection 2: `"bob2"` 
  - Connection 3: `"bob3"`
- **Conflict Resolution**: If a connection already has "bob1", the system finds the next available number (e.g., "bob4")
- **Single Key**: If adding only one instance of a key name, no numbering is added unless there's a conflict with existing keys

### Development Roadmap

The `conmode` branch tracks the implementation of this feature.

-   [ ] Create enhanced connection models with metadata support
-   [ ] Create Connection Mode implementation
-   [ ] Add connection selection and highlighting
-   [ ] Create connection properties dialog
-   [ ] Implement connection direction switching
-   [ ] Add value types and unit system
-   [ ] Add connection naming and labeling
-   [ ] Update UI controls for connection mode

## Layout Mode (Planned)

An upcoming mode designed to improve graph readability through automatic and manual layout tools.

### Features

- **Auto-Layout:** Automatically arrange nodes using algorithms like force-directed, hierarchical, or grid-based layouts.
- **Alignment Tools:** Align selected nodes to the left, right, top, bottom, or center.
- **Distribution Tools:** Distribute selected nodes evenly, either horizontally or vertically.
- **Connection Tidying:** Automatically reroute connections to reduce crossings and improve clarity after layout changes.

### Visual Feedback

- Alignment guides appear when dragging nodes near others.
- A toolbar with layout options (e.g., "Align Top," "Distribute Horizontally") becomes available.

### Status

This mode is not yet implemented but is planned for future development.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
