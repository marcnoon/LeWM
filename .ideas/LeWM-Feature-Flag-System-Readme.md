# LeWM Feature Flag System

## 1. Overview

This document outlines the architecture of the graph-based feature flag system for the LeWM project. The primary goal of this system is to manage feature availability across different application tiers (e.g., public/free, private/pro) and deployment environments (e.g., dev, qa, prod) in a clean, scalable, and decoupled manner.

The system is designed to:
-   Allow features to be enabled or disabled without code changes.
-   Manage complex dependencies between features.
-   Maintain a strict separation between the public (open-source) and private (commercial) codebases.
-   Support gradual migration of existing features into the new system.

## 2. Core Concepts

### Graph-Based Configuration
Instead of a simple key-value store, our feature flags are defined as nodes within a graph file (`.graph.json`). This "dogfooding" approach uses our own graph technology to manage features.

-   **Feature Nodes**: Each feature is a `node` in the graph with a `type` of `"Feature"`.
-   **Properties**:
    -   `name`: The unique string identifier for the feature (e.g., `"pin-edit-mode"`).
    -   `enabled`: A boolean (`true`/`false`) that acts as the master switch for the feature.
-   **Dependencies**: A `connection` from one feature node to another signifies a dependency. A feature will only be considered active if its `enabled` flag is `true` AND all of its dependencies are also active.

### Tier & Environment Awareness
The system is fundamentally driven by Angular's environment configuration. Two properties in `src/environments/environment.ts` control which feature set is loaded:

-   `tier`: A string identifying the application version (e.g., `'public'`, `'standard'`, `'pro'`).
-   `envName`: A string identifying the deployment environment (e.g., `'dev'`, `'qa'`, `'prod'`).

## 3. Directory Structure

All feature graph files are stored in a structured directory within the `assets` folder. The `FeatureGraphService` constructs the path to the correct file at runtime based on the environment settings.

```
LeWM-Angular/
└── src/
    └── assets/
        └── features/
            ├── public/
            │   ├── dev.graph.json
            │   └── prod.graph.json
            │
            └── pro/  (Example tier, exists only in the private repo)
                ├── dev.graph.json
                ├── qa.graph.json
                └── prod.graph.json
```

## 4. How It Works

### Key Components
1.  **`FeatureGraphService`**: The central service that:
    -   Reads the `tier` and `envName` from the Angular environment.
    -   Constructs the file path and loads the corresponding `.graph.json` file.
    -   Provides the `isFeatureEnabled(featureName: string)` method, which checks the feature's `enabled` status and recursively validates its dependencies.

2.  **`APP_INITIALIZER`**: An Angular dependency injection token used in `app.module.ts`. We use it to ensure that the `FeatureGraphService.loadFeatures()` method is executed *before* the application starts, guaranteeing that feature availability is known from the very beginning.

### Public vs. Private Feature Separation (The Factory Pattern)

To ensure the public repository **never** contains direct code references to private features, we use a factory pattern for feature modes.

1.  **`ModeManagerService`**: This core service is enhanced to work with "mode factories" (functions that create a mode) instead of mode instances. It has a `registerModeFactory(name, factory)` method.

2.  **Public Repo**: The public codebase registers factories for all its standard, public modes (e.g., `PinEditMode`, `ConnectionMode`).

3.  **Private Repo**: In the private repository, a special initializer file (e.g., `private-features.initializer.ts`) exists. This file imports the private mode classes (e.g., `AnalysisMode`) and registers their factories with the `ModeManagerService` during app startup (via `APP_INITIALIZER`).

4.  **Activation**: When the `GraphEditorComponent` initializes, it asks the `FeatureGraphService` for all enabled features. For each one, it asks the `ModeManagerService` to create an instance from the feature's name. The `ModeManagerService` will only succeed if a factory for that name has been registered (by either the public or private initializers).

This completely decouples the core application from the feature implementations, preventing `ReferenceError` exceptions in the public build for features it doesn't know about.

## 5. How to Add or Migrate a Feature

1.  **Define in Graph**: Add a new `Feature` node to the relevant `.graph.json` file(s). Set its `name` and `enabled` status.
    ```json
    {
      "id": "feature-my-new-feature",
      "type": "Feature",
      "properties": {
        "name": "my-new-feature",
        "enabled": true
      },
      "position": { "x": 100, "y": 200 }
    }
    ```

2.  **Guard the Code**: In the component or service where the feature is used, inject the `FeatureGraphService`.

3.  **Conditional Logic**: Wrap the feature's UI or logic in a condition.
    -   **For UI Elements (in HTML templates):**
        ```html
        <button *ngIf="featureGraphService.isFeatureEnabled('my-new-feature')">
          My New Feature
        </button>
        ```
    -   **For Logic (in TypeScript):**
        ```typescript
        if (this.featureGraphService.isFeatureEnabled('my-new-feature')) {
          // Initialize the feature's logic or mode
        }
        ```
4.  **(For Modes)** **Register a Factory**: If the feature is a new mode, register its factory with the `ModeManagerService`. For private features, do this in the private-only initializer file.

### Analysis of this system

Here’s a quick evaluation of the proposed feature‐flag system based on your goals of having modes with features aligned under those modes:

1. Feasibility

Leverages our existing graph loading code in FeatureGraphService via .graph.json files in src/assets/features/{tier}/{env}.graph.json.
Uses Angular’s APP_INITIALIZER to guarantee flags are loaded before boot.
Dependency edges in the feature graph model (“circuit-analysis” → “circuit-diagram” → “node-graph”) can enforce the “base features always available in pro” rule.
2. Ease of Use

Defining new tiers/environments is just adding another folder under assets/features/ and editing environment.ts.
Front-end guard is a simple call to featureGraphService.isFeatureEnabled('my-feature') in templates or in code.
Mode factories register in ModeManagerService, so GraphEditorComponent (…) can dynamically instantiate only the allowed modes.
3. Effectiveness

Decoupling: Public repo only references public factories; private builds register “analysis” factories in private-features.initializer.ts.
Dependency Safety: A paid feature like “circuit-analysis-mode” will only activate if its upstream flags (e.g. “circuit-diagram-mode”, “node-graph-mode”) are also enabled.
Separation of Concerns: Basic graphing, circuit‐diagramming, and circuit‐analysis each get their own JSON node and mode factory—so you can switch between them seamlessly at runtime.
Example graph snippet for your tiers:

With that, isFeatureEnabled('circuit-analysis') returns false in public builds, but in your private pro/prod.graph.json you’d flip "enabled":true for “circuit-analysis” and it will pull in all dependencies automatically.