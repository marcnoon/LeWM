# Pin Mode Implementation - LeWM Angular

## Project Overview

LeWM (Logic Electronic Wire Manager) is an Angular-based node graphing application that allows users to create and manage electronic circuit diagrams with nodes representing components and connections between their pins.

## Development Environment

- **Platform**: Linux WSL Ubuntu
- **Location**: `C:\src\LeWM\LeWM-Angular`
- **Framework**: Latest Angular
- **Tools**: Claude Code for development assistance

## Current Implementation Status

### ✅ **Completed Features**

1. **Three Mode System**
   - **Normal Mode**: Node movement and selection
   - **Pin Edit Mode**: Pin selection and management 
   - **Connection Mode**: Creating connections between pins

2. **Pin Layout Editor**
   - Modal popup for precise pin positioning
   - Position controls (X, Y coordinates, side placement, offset)
   - Text styling (font, size, color, rotation, alignment)
   - Batch operations (align, distribute, apply to all)
   - Live preview toggle
   - Grid snapping functionality

3. **Hybrid Pin System**
   - Legacy pins (`node.pins`) for normal operation
   - Enhanced pins (PinStateService) for advanced editing
   - Visual selection indicators (gold/orange highlighting)

4. **Data Persistence**
   - localStorage integration for pin modifications
   - Automatic save/load of pin positions
   - GraphStateService with persistence layer

### 🔧 **Current Issues**

#### **Primary Issue: Pin Position Persistence**
When switching from **Pin Edit Mode** back to **Normal Mode** after making changes in the Pin Layout Editor, pin positions occasionally revert to their original locations instead of maintaining the modified positions.

**Symptoms:**
- Changes are visible and persist within Pin Edit Mode
- Changes are correctly saved to localStorage
- When switching to Normal Mode, pins sometimes revert to original positions
- Issue is intermittent - sometimes works, sometimes doesn't

**Technical Context:**
- Pin data flows between legacy system (`node.pins`) and enhanced system (PinStateService)
- GraphStateService handles persistence to localStorage
- Mode switching triggers various reactive updates that may interfere with data sync

#### **Suspected Causes**
1. Race conditions between reactive observables during mode switching
2. Timing issues with localStorage save/load operations
3. Template rendering conflicts between legacy and enhanced pin systems
4. Potential overwrites during GraphStateService updates

## Architecture Overview

### **Pin System Architecture**
```
Legacy System (node.pins) ←→ PinStateService ←→ Pin Layout Editor
         ↓                            ↓
   Normal Mode Display          Enhanced Mode Display
         ↓                            ↓
   GraphStateService ←→ localStorage Persistence
```

### **Key Components**

1. **PinStateService** (`src/app/services/pin-state.service.ts`)
   - Manages enhanced pin data with advanced positioning
   - Handles pin selection state
   - Provides reactive observables for UI updates

2. **Pin Layout Editor** (`src/app/components/pin-layout-editor/`)
   - Modal interface for precise pin editing
   - Real-time position and text style controls
   - Batch operations for multiple pins

3. **GraphStateService** (`src/app/services/graph-state.service.ts`)
   - Manages node and connection data
   - localStorage persistence layer
   - Handles legacy pin system updates

4. **Pin Edit Mode** (`src/app/modes/pin-edit.mode.ts`)
   - Handles pin selection and interaction
   - Bridges legacy and enhanced pin systems
   - Manages mode-specific behaviors

## Development Strategy

### **Phase 1: Current (Sonnet 4)**
- ✅ Implement core pin editing functionality
- ✅ Build UI components and controls
- ✅ Establish data flow between systems
- 🔧 **Resolve persistence issues**

### **Phase 2: Optimization (Opus)**
Once the persistence issues are resolved and we have a stable foundation:
- Advanced pin positioning algorithms
- Complex visual effects and animations
- Performance optimization for large circuits
- Advanced undo/redo functionality
- Export/import capabilities

### **Phase 3: Enhancement (Mixed Models)**
- **Sonnet**: Routine maintenance and feature additions
- **Haiku**: Quick fixes and simple modifications
- **Opus**: Complex algorithmic work and architectural decisions

## Technical Debugging Information

### **Debug Console Logs**
The application includes extensive logging for tracking pin state changes:

```
🔄 Syncing pin mic1.GND to legacy system...
📍 Pin position data: {x: 25, y: 15, side: 'left', offset: 0}
📝 Updating node mic1 in GraphStateService
💾 Node mic1 updated and saved to localStorage
```

### **Key Files for Investigation**
- `src/app/services/pin-state.service.ts` - Pin state management
- `src/app/components/pin-layout-editor/pin-layout-editor.component.ts` - Editor logic
- `src/app/services/graph-state.service.ts` - Data persistence
- `src/app/modes/pin-edit.mode.ts` - Mode switching logic

## Next Steps

1. **Resolve Persistence Issues** - Ensure 100% reliable pin position persistence
2. **Stress Testing** - Test with multiple pins and complex modifications
3. **Performance Optimization** - Reduce reactive update frequency
4. **Documentation** - Complete API documentation for pin system
5. **Transition to Opus** - Hand off complex algorithmic work to Opus model

## Testing Scenarios

### **Basic Test Case**
1. Add a node with pins
2. Switch to Pin Edit Mode
3. Select a pin
4. Open Pin Layout Editor (Enter key)
5. Modify X/Y position
6. Apply Changes
7. Switch to Normal Mode
8. **Expected**: Pin appears in new position
9. **Current Issue**: Pin sometimes reverts to original position

### **Stress Test Case**
1. Select multiple pins across different nodes
2. Make various changes (position, text style, rotation)
3. Apply changes
4. Switch modes multiple times
5. Refresh browser
6. **Expected**: All changes persist
7. **Status**: Needs verification

## Claude Model Usage Strategy

- **Current Development**: Sonnet 4 (architectural foundation)
- **Next Phase**: Opus (precision debugging and complex algorithms)
- **Maintenance**: Mix of Sonnet/Haiku based on complexity

The foundation is solid and nearly complete. Once persistence issues are resolved, we'll have a robust platform for advanced pin editing capabilities that can be enhanced with Opus for more sophisticated features.