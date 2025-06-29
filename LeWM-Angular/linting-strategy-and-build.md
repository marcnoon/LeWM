# Project Architecture & Linting Strategy

This document outlines the architecture of the LeWM-Angular application and the plan to successfully complete the linting process.

## 1. Application Architecture

The project is a web-based graphical modeling application built with Angular. Its primary purpose is to provide a canvas where users can create, connect, and manage visual nodes and their associated pins, likely for circuit design or similar diagramming tasks.

### Key Architectural Concepts:

*   **Component Model**: The application has been migrated to use Standalone Components. The `AppComponent` is the root, and the `GraphEditorComponent` serves as the main interactive canvas. Various dialog components (`NodeNameDialogComponent`, `PinLayoutEditorComponent`, etc.) handle specific editing tasks.
*   **State Management**: State is managed reactively using RxJS `BehaviorSubject`s within Angular services. This provides a centralized, observable source of truth. Components subscribe to `  -suffixed observables to react to state changes.
*   **Core Services**:
    *   `GraphStateService`: Acts as the "single source of truth" for the graph's core data structures: the nodes and edges. It holds the BehaviorSubjects for this data and provides methods for manipulation (add, update, delete). It also handles persistence to `localStorage`.
    *   `ModeManagerService`: Implements a state machine pattern to manage different user interaction modes (e.g., normal, pin-edit). It delegates user input events (clicks, key presses) to the active mode, decoupling the main editor component from the specific logic of each mode.
    *   `PinStateService` & `PinSyncService`: These services manage a refactoring effort from a "legacy" pin system to an "enhanced" one. `PinStateService` handles the state of the new system, while `PinSyncService` is crucial for synchronizing data between the old and new pin models during the transition.
    *   `FeatureGraphService`: Manages feature flags, loading them from a JSON configuration file to enable or disable application functionality based on the environment.

## 2. Linting Progress and Plan

The goal is to enforce modern Angular best practices and achieve a clean linting pass.

### Progress So Far:

1.  **Linter Setup**: `eslint` was successfully added to the project via `@angular-eslint/schematics`.
2.  **Standalone Migration**: All components have been refactored to be `standalone: true`.
3.  **Dependency Injection**: All constructor-injected dependencies have been migrated to use the `inject()` function.
4.  **Code Cleanup**: A significant number of unused imports and variables have been removed.

### Next Steps to Complete Linting:

The following categories of errors remain and should be addressed in this order:

1.  **Eliminate `no-explicit-any`**: This is the highest priority. Systematically replace `any` with specific types or interfaces.
2.  **Fix Template Accessibility Errors**:
    *   `@angular-eslint/template/label-has-associated-control`: Add `for` attributes to all `<label>` elements and corresponding `id` attributes to form inputs.
    *   `@angular-eslint/template/click-events-have-key-events`: Add keyboard event handlers (e.g., `(keydown.enter)`) to all non-button elements that have a `(click)` handler.
3.  **Resolve Unused Variables**: Remove all remaining unused local variables and function parameters.
4.  **Correct `no-case-declarations`**: Wrap the content of `case` statements in `switch` blocks with curly braces `{}`.
5.  **Final Verification**: Run `npm run lint -- --fix` to automatically fix any remaining simple issues, followed by `npm run lint` to confirm that all errors have been resolved.

## 3. Build Error Strategy

The following strategy should be used to resolve build errors:

1.  **Nodes**: Fix all errors related to nodes first.
2.  **Pins**: Fix all errors related to pins next.
3.  **Connections**: Fix all errors related to connections last.

## 4. Linting Strategy Guide

### Improving Linting Performance

*   **Run the Linter Incrementally**: Instead of running the linter on the entire project at once, run it on a file-by-file or component-by-component basis. This makes it easier to identify and fix errors in a specific part of the codebase.
*   **Use the `--fix` Flag**: For simple errors, the `--fix` flag can automatically correct them, saving time and effort.

### Common Linting Errors and Solutions

#### `no-explicit-any`

This error occurs when the `any` type is used. To fix this, replace `any` with a more specific type.

**Example:**

```typescript
// Before
private componentRef: any = null;

// After
import { GraphEditorComponent } from '../components/graph-editor/graph-editor.component';
private componentRef: GraphEditorComponent | null = null;
```

In cases where a legacy data structure is being used, it's helpful to define an interface for it.

**Example:**

```typescript
// Define a type for the legacy pin structure
interface LegacyPin {
  name: string;
  x: number;
  y: number;
  // ... other properties
}

// Use the interface instead of any
onPinClick(node: GraphNode, pin: LegacyPin, event: MouseEvent): void {
  // ...
}
```

#### `@angular-eslint/template/label-has-associated-control`

This error occurs when a `<label>` element is not associated with a form control. To fix this, add a `for` attribute to the label and a corresponding `id` to the input.

**Example:**

```html
<!-- Before -->
<label>Name:</label>
<input type="text" [(ngModel)]="name">

<!-- After -->
<label for="nameInput">Name:</label>
<input id="nameInput" type="text" [(ngModel)]="name">
```

#### `@angular-eslint/template/click-events-have-key-events`

This error occurs when an element with a `(click)` handler is not accessible via the keyboard. To fix this, add a keyboard event handler, such as `(keydown.enter)`.

**Example:**

```html
<!-- Before -->
<div (click)="doSomething()">Click me</div>

<!-- After -->
<div (click)="doSomething()" (keydown.enter)="doSomething()" tabindex="0">Click me</div>
```

By following these guidelines, we can systematically improve the codebase's quality and achieve a clean linting pass.

## 5. Build Concepts

### `closestPin` Type Inference

In `graph-editor.component.ts`, the `findClosestPinToMouse` function had a variable `closestPin` that was initialized to `null`. The compiler could not infer the type of the object that would be assigned to it later, so it defaulted to `never`. This caused a build error when trying to access properties on `closestPin`.

To fix this, we explicitly defined the type of `closestPin` to be `{ nodeId: string; pinName: string; distance: number } | null`. This tells the compiler what to expect, and the build error is resolved.

### `pinType` Type Assertion

In `pin-edit.mode.ts`, the `pinType` property was being assigned a string value, but the `Pin` interface expects a specific union of string literals. To fix this, we used a type assertion `(pin.pinType as any)` to tell the compiler to treat the string as the correct type. This is a temporary workaround until the `LegacyPin` and `Pin` interfaces can be reconciled.