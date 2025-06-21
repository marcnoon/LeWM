# LeWM - Level With Me

A flexible, graph-based object and connection system built on SOLID principles and composition patterns.

## Overview

LeWM (Level With Me) is a foundational graph visualization and manipulation system that provides core functionality for creating, connecting, and manipulating graphical objects. It's designed to be framework-agnostic and extensible through composition.

**Current Status**: A sophisticated React prototype has been developed using Claude Opus, demonstrating advanced routing algorithms, group selection, and real-time connection management. The next phase involves converting this to an Angular application for enhanced enterprise capabilities.

## Interactive Circuit Editor (React Prototype)

A sophisticated graph-based visual editor originally designed for circuit diagrams but adaptable to various graph-based visualization needs, featuring:

- **Advanced Routing**: A* pathfinding with GCD optimization
- **Group Operations**: Multi-select and move components together  
- **Real-time Updates**: Connections follow components dynamically
- **Visual Feedback**: Efficiency indicators and path optimization
- **Mathematical Optimization**: GCD-based grid spacing and LCM integration

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
│   ├── setupArrayPrototypes() - Math utilities
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

### Planned Angular Architecture
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
- **Array Extensions**: Custom array methods for statistical operations (min, max, median, average, gcd)
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

## Getting Started

*Documentation for setup and basic usage coming soon...*

The React prototype demonstrates the core capabilities. Angular conversion will provide enhanced enterprise features and better scalability for complex applications.

## Contributing

This system demonstrates advanced graph visualization techniques applicable across many domains. The combination of mathematical optimization, intelligent routing, and flexible architecture makes it suitable for any application requiring connected node visualization.

*Guidelines for contributing to LeWM coming soon...*

## License

*License information coming soon...*