# LeWM-Angular — A Type-Safe Visual Graph Editor

**A visual-first, graph-aware Angular application with type-safe feature flags and modular architecture.**

LeWM-Angular is a sophisticated node-pin-connection editor built with Angular, designed for developers who value type safety, clean architecture, and extensible design patterns. Create interactive graphs, manage complex connections, and leverage advanced editing modes—all while maintaining strict TypeScript standards and comprehensive test coverage.

## Why LeWM?

### 🔒 **Type-Safe Architecture**
- **Zero `any` usage** in production code—strict TypeScript throughout
- **Comprehensive interfaces** for all data structures (pins, connections, nodes)
- **Type-safe feature flags** with compile-time validation
- **Enhanced developer experience** with full IntelliSense support

### 🎯 **Visual Node-Pin-Connection Editor**
- **Interactive graph editing** with drag-and-drop functionality
- **Advanced pin management** with precise positioning and distribution
- **Connection properties** with metadata, types, and visual customization
- **Multiple editing modes** for different workflows (Standard, Pin Edit, Connection Mode)

### 🚀 **Feature Flags with User Entitlements**
- **Hierarchical feature system** with graph-based dependencies
- **Environment-specific configurations** (dev, prod, qa)
- **Tier-based feature access** (public, standard, pro)
- **Angular-native structural directives** like `*appFeatureFlag`
- **Runtime feature detection** with graceful fallbacks

### 🛠️ **Clean & Modular Architecture**
- **Lint-clean codebase** with consistent coding standards
- **91 passing tests** with comprehensive coverage
- **Successful builds** with optimized production bundles
- **Mode-based composition** for extensible functionality
- **Service-oriented design** with dependency injection

## 🚀 Quick Start

Clone and run the project locally:

```bash
# Clone the repository
git clone https://github.com/marcnoon/LeWM.git
cd LeWM/LeWM-Angular

# Install dependencies
npm install

# Start development server
ng serve

# Open your browser to http://localhost:4200/
```

**Build & Test:**
```bash
# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

## 🚩 Feature Flags System

LeWM-Angular implements a sophisticated, **type-safe feature flag system** that enables dynamic control of application features across different environments and user tiers.

### Key Features:
- **📊 Graph-based Dependencies**: Features can depend on other features with circular dependency detection
- **🔒 Type-Safe Configuration**: Strongly typed feature definitions with compile-time validation
- **🎯 Hierarchical Organization**: Dot-notation naming for logical feature grouping
- **🌍 Environment-Specific**: Different feature sets for dev, qa, and production
- **💎 Tier-Based Access**: Support for public, standard, and pro feature tiers
- **🔄 Runtime Management**: Dynamic feature enabling/disabling with dependency validation

### Usage Example:

```typescript
// Component usage
constructor(private featureService: FeatureGraphService) {}

ngOnInit() {
  if (this.featureService.isFeatureEnabled('advanced-editing')) {
    this.initializeAdvancedFeatures();
  }
}
```

```html
<!-- Template usage with structural directive -->
<div *appFeatureFlag="'advanced-editing'">
  <advanced-editor></advanced-editor>
</div>
```

📖 **[Full Feature Flags Documentation](docs/feature-flags.md)**

## 📦 Type Safety Guarantee

> **🎯 Commitment to Type Safety**
> 
> LeWM-Angular maintains **strict TypeScript standards** throughout the codebase:
> - No `any` types in production code
> - Comprehensive interface definitions for all data structures
> - Type-safe feature flag system with compile-time validation
> - Enhanced maintainability and productivity with AI-assisted development tools
> 
> This ensures **reliable refactoring**, **confident deployments**, and **excellent developer experience**.

## 📖 Documentation & Resources

### 📚 **Core Documentation**
- **[Feature Flags System](docs/feature-flags.md)** - Complete guide to the type-safe feature flag system
- **[Linting Strategy & Build](linting-strategy-and-build.md)** - Architecture overview and development practices
- **[Feature Flag Setup](FEATURE_FLAG_SETUP.md)** - Implementation details and setup guide

### 🗺️ **Development Roadmap**
- **✅ Phase 1**: Type-safe architecture with feature flags system
- **✅ Phase 2**: Advanced pin editing and connection management
- **🔄 Phase 3**: Layout mode with auto-arrangement algorithms
- **📋 Phase 4**: Advanced routing and domain-specific modes
- **🔮 Future**: Plugin system and custom mode API

### 🤝 **Contributing**
This project maintains high standards for code quality:
- All code must pass linting (`npm run lint`)
- Tests must pass (`npm test`)
- Builds must succeed (`npm run build`)
- Follow existing TypeScript patterns and avoid `any` usage

---

## 🛠️ Technical Reference

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

## Modes

### Standard Mode

The default interaction mode for basic graph editing and connection creation:

- **Add Nodes:** Click node buttons in the toolbar to add predefined nodes.
- **Select & Move:** Click to select a node, drag to move. Ctrl+click to multi-select.
- **Connect Pins:** Click one pin, then another to draw a connection line.
- **Delete:** Press Delete key to remove selected nodes or connections.
- **Clear All:** Use "Clear Edges" button to remove all connections.
- **Deselect:** Click blank canvas or press Escape key to deselect all nodes.

### Pin Edit Mode

An advanced mode for customizing node pins and their distribution:

- **Enter Pin Mode:** Click the "Pin Edit" button or press `P`.
- **Select Node:** Click a node to enable side-based pin editing.
- **Hover & Click Sides:** Hover over node edges to highlight. Click to open pin naming dialog.
- **Name Pins:** Enter a pin name in the dialog and press Enter or click OK.
- **Auto-Distribute:** Pins are spaced evenly along the selected side.
- **Remove Pins:** Left-click or right-click existing pins to delete them.
- **Automatic Cleanup:** When pins are removed, any connections to those pins are automatically deleted to prevent orphaned connections.
- **Exit Mode:** Press Escape or click "Normal" to return to standard mode.

### Advanced Pin Layout Mode

For complex components requiring precise pin arrangements, LeWM offers an **Advanced Pin Layout Mode**. This feature extends the standard Pin Edit Mode, providing granular control over pin positioning, ordering, and distribution to meet exact specifications and maximize readability. It combines powerful automated layout algorithms with intuitive manual adjustment tools.

#### Activation

1.  Enter **Pin Edit Mode** (press `P`).
2.  Select a node to reveal its side indicators.
3.  **Double-click** on a side indicator (the blue dashed line for top, right, bottom, or left) to activate Advanced Pin Layout for that specific edge.

#### Key Features

*   **Bulk Pin Entry & Ordering**:
    *   Upon activation, a dialog prompts for pin names.
    *   You can enter multiple pin names at once, separated by commas (e.g., `DATA0, DATA1, DATA2, CLK, RESET`).
    *   The pins will be created and placed on the edge in the exact order you specify.

*   **Intelligent Auto-Distribution**:
    *   The initial placement is not merely uniform. The system uses **GCD (Greatest Common Divisor)** and **LCM (Least Common Multiple)** based algorithms to calculate an optimal distribution.
    *   This layout considers the width of pin labels to prevent text overlap, ensuring maximum readability from the start.

*   **Pixel-Perfect Manual Adjustments**:
    *   **Constrained Dragging**: Click and drag any pin to reposition it. Its movement will be constrained to the node edge it belongs to.
    *   **Nudge Controls**: Select a pin and use the keyboard arrow keys to "nudge" it one pixel at a time for fine-grained adjustments.
    *   **Group Selection & Movement**: Ctrl+click to select multiple pins on the same edge and move them together as a single unit.

*   **Flexible Distribution Tools**:
    *   After selecting multiple pins, contextual tools appear allowing you to:
        *   **Distribute Horizontally/Vertically**: Evenly space the selected pins across the available edge length.
        *   **Align to Grid**: Snap pins to the underlying grid for perfect alignment with other components.

#### Example Workflow: Customizing an IC Chip

1.  Press `P` to switch to **Pin Edit Mode**.
2.  Click on an "IC Chip" node.
3.  **Double-click** the top edge of the chip.
4.  In the dialog, type: `VCC,GND,IN_A,IN_B,OUT_A,OUT_B` and press Enter.
5.  The six pins are automatically laid out on the top edge, with their labels positioned for clarity.
6.  You decide `VCC` and `GND` should be further apart.
    *   Click the `VCC` pin and drag it to the far left corner of the edge.
    *   Click the `GND` pin and drag it to the far right corner.
7.  Now, select the four `IN` and `OUT` pins using Ctrl+click.
8.  Use the "Distribute Horizontally" tool to space them perfectly between `VCC` and `GND`.
9.  Select the `IN_A` pin and use the `←` arrow key to move it 2 pixels to the left to match a schematic perfectly.
10. Press **Escape** to exit Advanced Pin Layout and return to the standard Pin Edit Mode. The new pin layout is saved.

### Connection Mode

A specialized mode for creating and managing relationships between pins. This mode provides comprehensive connection editing capabilities including single and bulk editing operations.

#### Basic Features

-   **Enter Connection Mode:** Click the "Connection" button in the toolbar
-   **Create Connections:** Click one pin, then another to draw a connection line
-   **Select Connections:** Click on connection lines to select them (highlighted in green)
-   **Multi-Select:** Ctrl+click or use selection box to select multiple connections
-   **Delete Connections:** Press Delete key to remove selected connections
-   **Edit Properties:** Double-click a connection to open the properties dialog
-   **Unique Key Enforcement:** Connection value keys are unique per connection; duplicates are automatically numbered to maintain uniqueness.

#### Connection Properties

Each connection supports rich metadata through the properties dialog:

-   **Label:** A unique name or identifier for the connection
-   **Direction:** Control connection flow (forward →, backward ←, or bidirectional ↔)
-   **Type:** Categorize connections (signal, power, data, control, etc.)
-   **Visual Style:** Customize color, stroke width, and line style (solid, dashed, dotted)
-   **Key-Value Pairs:** Assign typed values with comprehensive unit support

#### Value System

Connection values support multiple data types and extensive unit systems:

-   **ValueType:** 'string' | 'number' | 'decimal' | 'integer' | 'boolean' | 'calculated'
-   **UnitType:** Electrical (volts, amps, ohms), Physical (meters, grams, seconds), Data (bits, bytes, Hz), and more
-   **Calculated Values:** Support for formula-based values that compute from other connection properties

#### Multi-Connection Bulk Editing

**New Feature:** When multiple connections are selected, press **Enter** to open the bulk edit dialog:

##### Bulk Edit Capabilities

-   **Connection Properties:** Edit properties across all selected connections
    -   Direction (forward, backward, bidirectional) - always available
    -   Type (signal, power, data, etc.) - always available
    -   Color and visual styling - always available
    -   Label prefix/suffix application

-   **Value Management:**
    -   **Unit Changes:** Bulk change units for values that share the same unit type across connections
    -   **Key Management:** Add prefixes or suffixes to existing keys (maintaining key uniqueness within each connection)
    -   **Bulk Value Addition:** Add new key-value pairs to all selected connections

##### Bulk Edit Workflow

1. **Select Multiple Connections:** Use Ctrl+click or selection box to select multiple connections
2. **Activate Bulk Edit:** Press **Enter** key to open the bulk edit dialog
3. **Common Property Detection:** The dialog automatically detects which properties are shared
4. **Selective Editing:** Only properties with commonality across selections can be modified
5. **Key Management:** Apply prefixes/suffixes to key names while maintaining uniqueness within each connection
6. **Unit Management:** Change units for values that share compatible unit types
7. **Apply Changes:** Confirm to update all selected connections simultaneously

##### Smart Property Detection

The bulk edit system intelligently identifies:
- **Identical Values:** Properties that have exactly the same value across all selections
- **Compatible Units:** Values that use the same unit type and can be bulk converted
- **Shared Types:** Connections that use the same connection type or direction
- **Key Management Opportunities:** Existing keys that can benefit from consistent prefixing or suffixing

##### Key Uniqueness and Management

**Important Design Principle:** Keys in connection value dictionaries must remain unique within each connection. The bulk edit system respects this by:

- **No Direct Key Replacement:** Keys cannot be directly changed to avoid breaking uniqueness
- **Prefix/Suffix Only:** Only prefixes and suffixes can be applied to existing keys
- **Per-Connection Uniqueness:** Each connection maintains its own key namespace
- **Example Transformations:**
  - Prefix: `"voltage"` → `"signal_voltage"`
  - Suffix: `"voltage"` → `"voltage_primary"`
  - Combined: `"voltage"` → `"signal_voltage_backup"`

##### Comprehensive Duplicate Key Detection and Numbering

The system analyzes ALL keys across ALL connections to detect duplicates and applies intelligent numbering:

- **Global Analysis**: Scans existing keys in all selected connections plus new keys being added
- **Duplicate Detection**: If any key name appears more than once across the entire dataset, ALL instances get numbered
- **Example Scenario**: 
  - Connection 1 has existing key "voltage"
  - Connection 2 has existing key "voltage"  
  - Adding new key "voltage" to both connections
  - **Result**: All four instances become "voltage1", "voltage2", "voltage3", "voltage4"
- **Incremental Numbering**: Always starts from 1 and increments for each occurrence
- **Cross-Connection Uniqueness**: Ensures no duplicate keys exist across all selected connections

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
