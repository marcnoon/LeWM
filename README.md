# LeWM - Level With Me

A flexible, graph-based object and connection system built on SOLID principles and composition patterns.

## Overview

LeWM (Level With Me) is a foundational graph visualization and manipulation system that provides core functionality for creating, connecting, and manipulating graphical objects. It's designed to be framework-agnostic and extensible through composition.

**Current Status**: 
- **React Prototype**: Sophisticated graph editor with advanced routing algorithms, group selection, and real-time connection management
- **Angular Implementation**: Core connection functionality now implemented with pins, edges, and interactive connection creation
- **Next Phase**: Implementing mode-based architecture with pin editing capabilities and composition-based extensibility

## Interactive Circuit Editor (React Prototype)

A sophisticated graph-based visual editor originally designed for circuit diagrams but adaptable to various graph-based visualization needs, featuring:

- **Advanced Routing**: A* pathfinding with GCD optimization
- **Group Operations**: Multi-select and move components together  
- **Real-time Updates**: Connections follow components dynamically
- **Visual Feedback**: Efficiency indicators and path optimization
- **Mathematical Optimization**: GCD-based grid spacing and LCM integration

## Angular Implementation (Current)

The Angular application now provides core graph editing capabilities with full connection support:

### Current Angular Features
- **Node Management**: Add, move, select, and delete graph nodes with TypeScript type safety
- **Pin System**: Visual connection points on nodes with customizable positions and names
- **Connection Creation**: Click-to-connect interface - click one pin, then another to create connections
- **Connection Rendering**: Visual lines with arrows showing relationships between pins
- **Connection Management**: Full CRUD operations for edges with automatic cleanup
- **RxJS Integration**: Reactive state management using observables and services
- **Multi-Selection**: Ctrl+click for multiple node selection and group operations

### Angular Architecture
```
src/app/
├── components/
│   └── graph-editor/           # Main graph editing component
├── services/
│   └── graph-state.service.ts  # Centralized state management
├── models/
│   ├── graph-node.model.ts     # Node interface with pins
│   └── graph-edge.model.ts     # Edge interface
└── ...
```

### Usage (Angular)

#### Normal Mode (Default)
1. **Add Nodes**: Click component buttons to add different node types
2. **Create Connections**: Click on a pin (red circle), then click on another pin to connect
3. **Move Nodes**: Drag nodes individually or select multiple with Ctrl+click
4. **Delete**: Select nodes and press Delete key (connections auto-delete)
5. **Clear Connections**: Use "Clear Edges" button to remove all connections
6. **Deselect**: Click on the blank canvas or press the Escape key to deselect all nodes

- For full details, see `LeWM-Angular/README.md#standard-mode`

#### Pin Edit Mode
1. **Enter Pin Mode**: Press 'P' key or click "Pin Edit" button
2. **Select Node**: Click any node to see side indicators
3. **Add Pins**: Hover sides to highlight, click to open naming dialog and create pins
4. **Remove Pins**: Left-click or right-click existing pins to delete
5. **Exit**: Press Escape or click "Normal" button in toolbar

- For full details, see `LeWM-Angular/README.md#pin-edit-mode`

#### Connection Mode
1. **Enter Connection Mode**: Click "Connection Mode" (future UI) or use toolbar
2. **Draw Connections**: Click one pin, then another to draw a connection line
3. **Select & Edit**: Select a connection to view/edit properties (label, direction, value)
4. **Delete**: Press Delete key when a connection is selected

- For full details, see `LeWM-Angular/README.md#connection-mode`

## Core Features

### Graph Objects & Connections
- **Object Management**: Add, remove, and manipulate graph objects
- **Connection System**: Create and manage arrowed connections between objects
- **Individual Movement**: Move single objects with automatic connection tracking
- **Group Selection**: Use Ctrl+click to select multiple objects for group operations
- **Group Movement**: Move selected groups while maintaining all connections
- **Dynamic Connection Tracking**: Connections automatically adjust when objects move

### Advanced Graph Algorithms
- **Distribution Prevention**: Algorithms to prevent unwanted object scattering
- **Line Crossing Prevention**: Smart routing to minimize connection intersections
- **Connection Distribution**: Intelligent spacing of multiple connections between points
- **Multi-Point Objects**: Support for objects with multiple connection points (like integrated circuits)
- **A* Pathfinding**: Enhanced with grid quantization and crossover penalties
- **GCD Grid Optimization**: Calculates optimal grid size using Greatest Common Divisor

### Architecture & Extensibility
- **SOLID Principles**: Built with Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles
- **Composition-Based**: Add functionality through composition rather than inheritance
- **Mode System**: Select different operational modes to extend base functionality
- **Framework Agnostic**: Core system knows nothing about specific domains (circuits, flowcharts, etc.)

## Current System Architecture (React Prototype)

### Component Structure
```
InteractiveCircuitEditor (Main Component)
├── State Management (useState hooks)
│   ├── components[] - Node/component data
│   ├── connections[] - Edge/wire data
│   ├── selectedComponents - Selection state
│   └── UI state (dragging, selection box, etc.)
├── Algorithm Layer
│   ├── utils.js - Standalone math utilities
│   ├── findOptimalPath() - A* pathfinding
│   └── calculateOptimalGridSpacing() - GCD-based grid
├── Rendering Layer
│   ├── renderComponent() - Node visualization
│   └── renderConnections() - Edge visualization
└── Interaction Handlers
    ├── Mouse events (drag, select)
    └── Keyboard events (delete, ctrl)
```

### Data Structures

**Component (Node) Structure:**
```javascript
{
  id: 'unique_id',
  type: 'component_type',
  x: 100,
  y: 150,
  width: 80,
  height: 60,
  label: 'Display Name',
  pins: [
    {x: 80, y: 20, name: 'PIN_NAME'}
  ]
}
```

**Connection (Edge) Structure:**
```javascript
{
  from: 'componentId.pinName',
  to: 'componentId.pinName'
}
```

## Angular Migration Plan

### Why Angular?
Converting from React to Angular will provide:
- **TypeScript First**: Better type safety and IDE support
- **Dependency Injection**: Cleaner service architecture
- **RxJS Integration**: Powerful stream-based state management
- **Enterprise Ready**: Better for large teams and complex applications
- **Built-in Testing**: Comprehensive testing framework

### Current Angular Architecture
```
src/app/
├── components/
│   ├── circuit-editor/
│   ├── component-library/
│   └── selection-box/
├── services/
│   ├── circuit-state.service.ts
│   ├── routing.service.ts
│   ├── selection.service.ts
│   └── component-factory.service.ts
├── directives/
│   ├── draggable.directive.ts
│   └── selectable.directive.ts
├── models/
│   ├── component.model.ts
│   ├── connection.model.ts
│   └── pin.model.ts
└── pipes/
    └── efficiency-color.pipe.ts
```

## Design Philosophy

LeWM provides the foundational layer for graph-based applications without imposing domain-specific constraints. The system can be adapted for:

- **Circuit diagrams** (current prototype focus)
- **Network diagrams** (servers, routers, connections)
- **Flowcharts** (process flows, decision trees)
- **State machines** (state transitions, workflows)
- **Mind maps** (hierarchical concept mapping)
- **Organizational charts** (reporting structures)

### Domain Adaptation Examples

**Network Diagrams:**
```javascript
{
  id: 'server_1',
  type: 'server',
  label: 'Web Server',
  ports: [{x: 80, y: 20, name: 'HTTP', protocol: 'TCP/80'}]
}
```

**Flow Charts:**
```javascript
{
  id: 'decision_1',
  type: 'decision',
  label: 'Approve?',
  exits: [
    {x: 80, y: 30, name: 'YES'},
    {x: 80, y: 50, name: 'NO'}
  ]
}
```

## Key Algorithms & Features

### Mathematical Optimization
- **GCD-based Grid Spacing**: Calculates optimal grid size using Greatest Common Divisor of component positions
- **Utility Functions**: Standalone functions for statistical operations (min, max, median, average, gcd)
- **LCM Integration**: Prepared for Least Common Multiple calculations for wire spacing

### Routing System
- **Grid Quantization**: Snaps to GCD-optimized grid
- **Crossover Penalties**: Minimizes wire intersections  
- **8-directional Movement**: Manhattan + diagonal paths
- **Obstacle Avoidance**: Routes around components

### Visual Feedback
- **Path Efficiency**: Color-coded connections (green = optimal)
- **Path Length**: Distance labels on connections
- **Selection State**: Blue highlighting for selected components
- **Grid Background**: Visual alignment aid

## Future Enhancements

### Advanced Routing
- Implement Lee's algorithm for dense circuits
- Add Steiner tree optimization for multi-point nets
- Support layer-based routing

### Interaction Features
- Undo/redo system
- Copy/paste functionality
- Keyboard shortcuts
- Touch gesture support

### Visual Improvements
- Animated connections
- Component thumbnails
- Zoom/pan controls
- Dark mode

### Export/Import
- Save/load diagrams
- Export to SVG/PNG
- Generate netlists
- Import from domain-specific formats

### Collaboration
- Real-time multi-user editing
- Comment system
- Version history
- Share functionality

## Mode-Based Architecture (Planned)

LeWM will implement a mode-based composition system that extends functionality through behavioral modes rather than inheritance. This approach provides maximum flexibility while maintaining clean separation of concerns.

### Core Modes

#### 1. **Normal Mode** (Default)
- **Purpose**: Standard graph editing and connection creation
- **Behavior**: 
  - Drag nodes to move them
  - Click pins to create connections
  - Select and delete nodes/connections
  - Standard interaction patterns
- **Pin Interaction**: Read-only - can use existing pins but cannot modify them

#### 2. **Pin Edit Mode** 
- **Purpose**: Advanced pin management and customization
- **Activation**: Toggle button or keyboard shortcut (P key)
- **Behavior**:
  - **Add Pins**: Click on node edges to add new pins
  - **Remove Pins**: Right-click pins to delete them
  - **Edit Pin Names**: Double-click pin labels to rename
  - **Side Selection**: Choose which side of node to add pins (top, right, bottom, left)
  - **Auto-Distribution**: Pins automatically space evenly along selected side
  - **Pin Properties**: Set pin types (input/output/bidirectional), colors, and metadata
- **Visual Feedback**: 
  - Node edges highlighted when hovering for pin placement
  - Pin editing handles visible
  - Side indicators show available placement areas
  - Pin preview shows where new pin will be placed

#### 3. **Layout Mode**
- **Purpose**: Automatic arrangement and alignment
- **Behavior**: Auto-arrange nodes, align connections, optimize spacing

#### 4. **Routing Mode** 
- **Purpose**: Advanced connection path editing
- **Behavior**: Manual waypoint editing, path optimization, layer management

#### 5. **Domain-Specific Modes**
- **Circuit Mode**: Electrical component validation, simulation controls
- **Flowchart Mode**: Logic flow validation, process optimization
- **Network Mode**: Topology analysis, connectivity verification

### Mode Implementation Strategy

#### Architecture Pattern
```typescript
interface GraphMode {
  name: string;
  activate(): void;
  deactivate(): void;
  handleNodeClick(node: GraphNode, event: MouseEvent): void;
  handlePinClick(node: GraphNode, pin: Pin, event: MouseEvent): void;
  handleCanvasClick(event: MouseEvent): void;
  renderOverlay(canvas: SVGElement): void;
}
```

#### Composition Over Inheritance
- **Mode Stack**: Multiple modes can be active simultaneously
- **Event Delegation**: Each mode receives events and can choose to handle or pass through
- **State Isolation**: Each mode maintains its own state without affecting others
- **Mixins**: Common functionality shared through composition, not inheritance

### Pin Edit Mode Detailed Design

#### Pin Management Interface
```typescript
interface PinEditMode extends GraphMode {
  selectedNode: GraphNode | null;
  selectedSide: 'top' | 'right' | 'bottom' | 'left';
  pinDraft: Partial<Pin> | null;
  
  // Pin operations
  addPin(node: GraphNode, side: string, position?: number): void;
  removePin(node: GraphNode, pinName: string): void;
  renamePin(node: GraphNode, oldName: string, newName: string): void;
  redistributePins(node: GraphNode, side: string): void;
  
  // Side management
  selectSide(node: GraphNode, side: string): void;
  getAvailableSpace(node: GraphNode, side: string): number;
  calculatePinPositions(node: GraphNode, side: string, count: number): Pin[];
}
```

#### User Experience Flow
1. **Enter Pin Mode**: Press 'P' or click "Pin Edit" button
   - UI changes: Pin editing mode becomes active
   - Visual feedback: Selected nodes show side indicators
   - Cursor changes to pin editing cursor

2. **Select Node**: Click on a node to select it for pin editing
   - Selected node highlighted with colored side indicators
   - Four sides (top, right, bottom, left) shown with dashed borders
   - Hover over sides to see orange highlighting

3. **Add Pins**: 
   - **Hover Feedback**: Hover over any side to see orange highlight
   - **Click Side**: Click anywhere around a side to trigger pin creation
   - **Name Dialog**: Popup dialog appears asking for pin name
   - **Auto-Placement**: Pin automatically placed with optimal spacing
   - **Submit**: Press Enter or click OK to create pin
   - **Cancel**: Press Escape or click Cancel to abort

4. **Remove Pins**:
   - **Left-click existing pins** to delete them instantly
   - **Right-click pins** also works for deletion
   - Connections to deleted pins are automatically removed

5. **Exit Pin Mode**:
   - Press **Escape** key to return to Normal mode
   - Click **Normal** button in toolbar
   - All pin editing indicators disappear

### Pin Creation Features

#### Smart Pin Placement
- **Automatic Spacing**: Pins distributed evenly along selected side
- **Collision Avoidance**: New pins placed to avoid overlapping
- **Side Detection**: Intelligent side detection based on click position relative to node center
- **Visual Feedback**: Real-time highlighting shows which side will receive the pin

#### Pin Naming Dialog
- **Popup Interface**: Clean dialog for entering pin names
- **Keyboard Support**: Enter to confirm, Escape to cancel
- **Validation**: Empty names are rejected
- **Focus Management**: Automatic input field focus for quick typing

#### Visual Indicators
- **Blue Borders**: Normal side indicators (available for pins)
- **Orange Highlighting**: Hover state showing which side is targeted
- **Green Borders**: Selected side (currently unused in new workflow)
- **Dashed Lines**: All indicators use dashed borders for clear visual distinction

#### Smart Pin Distribution Algorithm
```typescript
function distributePins(node: GraphNode, side: string, pinCount: number): Pin[] {
  const sideLength = getSideLength(node, side);
  const minPinSpacing = 10; // Minimum pixels between pins
  const edgeMargin = 5;     // Margin from node corners
  
  const availableSpace = sideLength - (2 * edgeMargin);
  const optimalSpacing = Math.max(minPinSpacing, availableSpace / (pinCount + 1));
  
  return Array.from({ length: pinCount }, (_, i) => ({
    x: calculatePinX(node, side, edgeMargin + (optimalSpacing * (i + 1))),
    y: calculatePinY(node, side, edgeMargin + (optimalSpacing * (i + 1))),
    name: `PIN_${i + 1}`,
    type: 'bidirectional'
  }));
}
```

### Mode Activation & Management

#### UI Controls
- **Mode Selector**: Toolbar with mode buttons (Normal, Pin Edit, Layout, etc.)
- **Keyboard Shortcuts**: 
  - `Escape`: Return to Normal mode
  - `P`: Toggle Pin Edit mode
  - `L`: Toggle Layout mode
  - `R`: Toggle Routing mode
- **Context Menus**: Right-click provides mode-specific options
- **Status Bar**: Shows current active modes and shortcuts

#### Mode Persistence
- **Session State**: Active modes remembered during session
- **User Preferences**: Default mode settings saved
- **Project Settings**: Mode configurations saved with graph files

### Benefits of Mode-Based Architecture

1. **Extensibility**: Easy to add new modes without modifying core code
2. **Separation of Concerns**: Each mode handles specific functionality
3. **User Experience**: Clear mental model - different tools for different tasks
4. **Testability**: Each mode can be tested independently
5. **Customization**: Users can create custom modes for specific workflows
6. **Performance**: Only active modes consume resources

### Implementation Priority
1. **Phase 1**: Implement basic Normal and Pin Edit modes
2. **Phase 2**: Add mode management infrastructure and UI
3. **Phase 3**: Implement advanced modes (Layout, Routing)
4. **Phase 4**: Domain-specific modes and customization API

## Getting Started

*Documentation for setup and basic usage coming soon...*

The React prototype demonstrates the core capabilities. Angular conversion will provide enhanced enterprise features and better scalability for complex applications.

## Contributing

This system demonstrates advanced graph visualization techniques applicable across many domains. The combination of mathematical optimization, intelligent routing, and flexible architecture makes it suitable for any application requiring connected node visualization.

*Guidelines for contributing to LeWM coming soon...*

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.