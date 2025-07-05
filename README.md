![image](https://github.com/user-attachments/assets/4336db93-e31e-451d-89c2-a2dfbf17c170)

# LeWM — A Type-Safe Visual Graph Editor

**🌐 Live Demo:** [View on GitHub Pages](https://marcnoon.github.io/LeWM/)

**A visual-first, graph-aware application suite with type-safe architecture and modular design patterns.**

LeWM is a sophisticated node-pin-connection editor built with modern web technologies, designed for developers who value type safety, clean architecture, and extensible design patterns. Create interactive graphs, manage complex connections, and leverage advanced editing modes—all while maintaining strict TypeScript standards and comprehensive test coverage.

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

### Angular Implementation (Recommended)
The Angular application provides the most complete and type-safe implementation:

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

### React Prototype (Legacy)
The React prototype demonstrates core capabilities:

```bash
# From the root directory
npm install
npm start

# Open your browser to http://localhost:3000/
```

## 📦 Type Safety Guarantee

> **🎯 Commitment to Type Safety**
> 
> LeWM maintains **strict TypeScript standards** throughout the codebase:
> - No `any` types in production code
> - Comprehensive interface definitions for all data structures
> - Type-safe feature flag system with compile-time validation
> - Enhanced maintainability and productivity with AI-assisted development tools
> 
> This ensures **reliable refactoring**, **confident deployments**, and **excellent developer experience**.

## 🚩 Feature Flags System

LeWM implements a sophisticated, **type-safe feature flag system** that enables dynamic control of application features across different environments and user tiers.

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

## 📖 Documentation & Resources

### 📚 **Core Documentation**
- **[Angular Implementation](LeWM-Angular/README.md)** - Complete Angular application with type-safe architecture
- **[Feature Flags System](LeWM-Angular/docs/feature-flags.md)** - Type-safe feature flag system guide
- **[Linting Strategy & Build](LeWM-Angular/linting-strategy-and-build.md)** - Architecture overview and development practices
- **[Feature Flag Setup](LeWM-Angular/FEATURE_FLAG_SETUP.md)** - Implementation details and setup guide

### 🗺️ **Development Roadmap**
- **✅ Phase 1**: Type-safe architecture with feature flags system (Angular)
- **✅ Phase 2**: Advanced pin editing and connection management (Angular)
- **✅ Phase 3**: React prototype with advanced algorithms (Complete)
- **🔄 Phase 4**: Layout mode with auto-arrangement algorithms
- **📋 Phase 5**: Advanced routing and domain-specific modes
- **🔮 Future**: Plugin system and custom mode API

### 🤝 **Contributing**
This project maintains high standards for code quality:
- All code must pass linting (`npm run lint`)
- Tests must pass (`npm test`)
- Builds must succeed (`npm run build`)
- Follow existing TypeScript patterns and avoid `any` usage

## 🛠️ Technical Implementation

### Angular Application (Production-Ready)

The Angular implementation provides a complete graph editing system with **SOLID principles** and mode-based architecture:

### React Prototype (Legacy)

The React prototype demonstrates core capabilities with advanced algorithms:

- **Advanced Routing**: A* pathfinding with GCD optimization
- **Group Operations**: Multi-select and move components together  
- **Real-time Updates**: Connections follow components dynamically
- **Mathematical Optimization**: GCD-based grid spacing and LCM integration

### Architecture Benefits

LeWM provides foundational capabilities for graph-based applications across domains:

- **Circuit diagrams** - Electrical component validation and simulation
- **Network diagrams** - Topology analysis and connectivity verification
- **Flowcharts** - Logic flow validation and process optimization
- **State machines** - State transitions and workflow management
- **Mind maps** - Hierarchical concept mapping
- **Organizational charts** - Reporting structures and hierarchies

## 🎯 Core Features & Usage

### Graph Objects & Connections
- **Node Management**: Add, move, select, and delete graph nodes with TypeScript type safety
- **Pin System**: Visual connection points on nodes with customizable positions and names
- **Connection Creation**: Click one pin, then another to create typed connections
- **Multi-Selection**: Ctrl+click for multiple node/pin/connection selection and group operations
- **Automatic Cleanup**: Orphaned connections automatically removed when pins/nodes are deleted

### Mode-Based Architecture
- **Normal Mode**: Standard node manipulation and general editing
- **Pin Edit Mode**: Advanced pin management and customization  
- **Connection Mode**: Exclusive connection creation and management
- **Layout Mode** (Planned): Automatic arrangement and alignment tools

Each mode maintains strict separation of concerns following SOLID principles.

## 🔧 Getting Started

### Development Setup

**Build & Test:**
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build

# Lint code
npm run lint
```

### Architecture Overview

LeWM provides foundational capabilities for graph-based applications:

```typescript
// Core architecture
interface GraphMode {
  name: string;
  activate(): void;
  deactivate(): void;
  handleNodeClick(node: GraphNode, event: MouseEvent): void;
  handlePinClick(node: GraphNode, pin: Pin, event: MouseEvent): void;
}
```

**Key Design Principles:**
- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Composition-Based**: Add functionality through composition rather than inheritance
- **Type Safety**: Comprehensive TypeScript interfaces throughout
- **Framework Agnostic**: Core system adaptable to different domains

## 🌟 Use Cases

LeWM is adaptable for various graph-based visualization needs:

- **📡 Circuit Diagrams** - Electrical component validation and simulation
- **🌐 Network Diagrams** - Topology analysis and connectivity verification  
- **📊 Flowcharts** - Logic flow validation and process optimization
- **🔄 State Machines** - State transitions and workflow management
- **🧠 Mind Maps** - Hierarchical concept mapping
- **🏢 Organizational Charts** - Reporting structures and hierarchies

## 📋 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for developers who value type safety, clean architecture, and extensible design patterns.*
