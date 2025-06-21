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

In addition to standard and pin modes, the application includes a **Connection Mode** for creating and managing relationships between points. This mode allows you to draw, select, and modify connections.

### Features

-   **Create Connections:** Draw lines between two pins to establish a connection.
-   **Selection & Highlighting:** Select one or more connections to view or modify their properties.
-   **Properties Dialog:** A dedicated dialog allows for editing connection metadata, including:
    -   **Label:** A unique name or identifier for the connection.
    -   **Direction:** Switch the connection's flow (forward, backward, or bidirectional).
-   **Value & Units:** Edit the connection's value (of type `ValueType`) and select units (from `UnitType`) as defined in `src/app/models/connection-value.model.ts`.
    -   ValueType: 'string' | 'number' | 'decimal' | 'integer' | 'boolean' | 'calculated'
    -   UnitType includes electrical (voltage, current, resistance, ...), physical (length, mass, time, ...), data (bits, bytes, bitrate, ...), etc.
-   **Type:** Categorize the connection (e.g., `signal`, `power`).
-   **Bulk Edit:** Update or rename a ValueType or UnitType in one place and have those changes automatically propagate to all connections using that type, enabled by composable SOLID-based architecture.

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
