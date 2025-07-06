# Feature Flag System Documentation

## Overview

The LeWM-Angular application implements a comprehensive feature flag system that enables dynamic control of application features across different tiers and environments. The system is built on a graph-based architecture that supports complex feature dependencies, hierarchical organization, and runtime feature management.

## Current Implementation

### Core Components

#### FeatureGraphService

The `FeatureGraphService` is the central service that manages feature flag evaluation and loading.

**Location**: `src/app/services/feature-graph.service.ts`

**Key Methods**:
- `loadFeatures()`: Loads feature configuration from JSON files during app initialization
- `isFeatureEnabled(featureName: string)`: Checks if a feature is enabled with dependency validation
- `getEnabledFeatures()`: Returns array of all enabled feature names
- `featuresLoaded`: Observable to track when features have been loaded

**Example Usage**:
```typescript
constructor(private featureGraphService: FeatureGraphService) {}

ngOnInit() {
  if (this.featureGraphService.isFeatureEnabled('advanced-editing')) {
    this.initializeAdvancedFeatures();
  }
}
```

#### FeatureGraphNode Interface

**Location**: `src/app/interfaces/feature-graph.interface.ts`

```typescript
export interface FeatureGraphNode {
  id: string;
  name: string;
  enabled: boolean;
  dependencies?: string[];
}

export interface FeatureGraph {
  features: FeatureGraphNode[];
}
```

### Environment Configuration

The system uses Angular's environment configuration to determine which feature set to load:

**Location**: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  tier: 'public',      // 'public', 'standard', 'pro'
  envName: 'dev'       // 'dev', 'qa', 'prod'
};
```

### Feature Graph Files

Feature configurations are stored in JSON files organized by tier and environment:

```
src/assets/features/
├── public/
│   ├── dev.graph.json
│   └── prod.graph.json
└── pro/
    ├── dev.graph.json
    ├── qa.graph.json
    └── prod.graph.json
```

**Example Feature Graph** (`dev.graph.json`):
```json
{
  "features": [
    {
      "id": "basic-graph-editing",
      "name": "basic-graph-editing",
      "enabled": true
    },
    {
      "id": "advanced-features",
      "name": "advanced-features",
      "enabled": false,
      "dependencies": ["basic-graph-editing"]
    },
    {
      "id": "graph-node",
      "name": "graph.node",
      "enabled": true,
      "dependencies": ["basic-graph-editing"]
    }
  ]
}
```

### Usage in Components

#### TypeScript Usage
```typescript
import { FeatureGraphService } from '../services/feature-graph.service';

@Component({...})
export class MyComponent {
  constructor(private featureGraphService: FeatureGraphService) {}

  ngOnInit() {
    if (this.featureGraphService.isFeatureEnabled('my-feature')) {
      // Feature-specific logic
    }
  }
}
```

#### Template Usage
```html
<div *ngIf="featureGraphService.isFeatureEnabled('my-feature')">
  <button (click)="executeFeature()">My Feature</button>
</div>

<ng-container *ngIf="featureGraphService.isFeatureEnabled('advanced-editing')">
  <advanced-editor></advanced-editor>
</ng-container>
```

#### Runtime Toggle Component

The `FeatureFlagToggleComponent` allows users to enable or disable features at runtime.

```html
<app-feature-flag-toggle></app-feature-flag-toggle>
```

## Enhanced Features Documentation

### Hierarchical Flag Support

The system supports hierarchical feature organization using dot notation to express parent-child relationships:

#### Naming Convention
```typescript
// Example hierarchical features
'editor.autosave'
'editor.collaboration'
'editor.collaboration.realtime'
'analysis.circuit'
'analysis.circuit.advanced'
'ui.theme'
'ui.theme.dark'
```

#### Implementation
```typescript
// Check for hierarchical features
if (this.featureGraphService.isFeatureEnabled('editor.autosave')) {
  this.enableAutosave();
}

// Parent feature automatically enables child features
if (this.featureGraphService.isFeatureEnabled('editor')) {
  // This also enables 'editor.autosave', 'editor.collaboration', etc.
}
```

#### Feature Graph Definition
```json
{
  "features": [
    {
      "id": "editor",
      "name": "editor",
      "enabled": true
    },
    {
      "id": "editor-autosave",
      "name": "editor.autosave",
      "enabled": true,
      "dependencies": ["editor"]
    },
    {
      "id": "editor-collaboration-realtime",
      "name": "editor.collaboration.realtime",
      "enabled": true,
      "dependencies": ["editor", "editor.collaboration"]
    }
  ]
}
```

### Deprecated Feature Flags

The system supports marking features as deprecated with metadata:

#### Extended Interface
```typescript
export interface FeatureGraphNode {
  id: string;
  name: string;
  enabled: boolean;
  dependencies?: string[];
  deprecated?: boolean;
  deprecationMessage?: string;
  removalVersion?: string;
}
```

#### Usage
```json
{
  "features": [
    {
      "id": "legacy-editor",
      "name": "legacy-editor",
      "enabled": true,
      "deprecated": true,
      "deprecationMessage": "Use 'new-editor' instead",
      "removalVersion": "v2.0.0"
    }
  ]
}
```

#### Implementation
```typescript
// The service logs warnings for deprecated features
if (this.featureGraphService.isFeatureEnabled('legacy-editor')) {
  console.warn('Feature "legacy-editor" is deprecated. Use "new-editor" instead. Will be removed in v2.0.0');
}
```

### Paid Feature Support

The system supports paid features with entitlement checking:

#### Extended Interface
```typescript
export interface FeatureGraphNode {
  id: string;
  name: string;
  enabled: boolean;
  dependencies?: string[];
  paid?: boolean;
  requiredTier?: string;
  entitlementCheck?: string;
}
```

#### Usage
```json
{
  "features": [
    {
      "id": "circuit-analysis",
      "name": "circuit-analysis",
      "enabled": true,
      "paid": true,
      "requiredTier": "pro",
      "entitlementCheck": "circuit_analysis_premium"
    }
  ]
}
```

#### Implementation
```typescript
// Extended service method for entitlement checking
isPaidFeatureEnabled(featureName: string): boolean {
  const feature = this.getFeature(featureName);
  if (!feature || !feature.enabled) return false;
  
  if (feature.paid) {
    return this.checkUserEntitlement(feature.entitlementCheck);
  }
  
  return true;
}
```

### Temporary Activation

The system supports temporary feature activation for trial periods:

#### Extended Interface
```typescript
export interface FeatureGraphNode {
  id: string;
  name: string;
  enabled: boolean;
  dependencies?: string[];
  temporaryActivation?: {
    duration: number; // minutes
    activatedAt?: number; // timestamp
  };
}
```

#### Usage
```typescript
// Temporary activation method
activateFeature(featureName: string, durationMinutes: number = 5): void {
  const feature = this.getFeature(featureName);
  if (feature) {
    feature.temporaryActivation = {
      duration: durationMinutes,
      activatedAt: Date.now()
    };
    this.saveTemporaryActivation(featureName, feature.temporaryActivation);
  }
}

// Check if temporarily activated
isTemporarilyActivated(featureName: string): boolean {
  const feature = this.getFeature(featureName);
  if (!feature?.temporaryActivation) return false;
  
  const { duration, activatedAt } = feature.temporaryActivation;
  const expiresAt = activatedAt + (duration * 60 * 1000);
  return Date.now() < expiresAt;
}
```

### Graph File Integration

The system validates that graph files contain necessary features for operations:

#### Features Array in Graph Schema
```json
{
  "features": [...],
  "requiredFeatures": [
    "basic-graph-editing",
    "node-creation",
    "connection-editing"
  ],
  "optionalFeatures": [
    "advanced-analysis",
    "export-formats"
  ]
}
```

#### Validation Implementation
```typescript
validateGraphCapabilities(graphFile: any): ValidationResult {
  const requiredFeatures = graphFile.requiredFeatures || [];
  const availableFeatures = this.getEnabledFeatures();
  
  const missingFeatures = requiredFeatures.filter(
    feature => !availableFeatures.includes(feature)
  );
  
  return {
    isValid: missingFeatures.length === 0,
    missingFeatures,
    warnings: this.generateCompatibilityWarnings(graphFile)
  };
}
```

### Feature Detection

The system can detect required features when opening or saving graphs:

#### Implementation
```typescript
// Graph loading with feature detection
async loadGraph(graphData: any): Promise<LoadResult> {
  const validation = this.validateGraphCapabilities(graphData);
  
  if (!validation.isValid) {
    return {
      success: false,
      error: `Missing required features: ${validation.missingFeatures.join(', ')}`,
      softFail: true // Don't interrupt user experience
    };
  }
  
  // Proceed with loading
  return this.proceedWithGraphLoad(graphData);
}

// Feature requirement detection
detectRequiredFeatures(graphData: any): string[] {
  const detectedFeatures = [];
  
  // Analyze graph structure to determine required features
  if (graphData.nodes?.some(node => node.type === 'CircuitElement')) {
    detectedFeatures.push('circuit-analysis');
  }
  
  if (graphData.connections?.length > 0) {
    detectedFeatures.push('connection-editing');
  }
  
  return detectedFeatures;
}
```

## Extending the System

### FeatureManagerService

For advanced feature management, consider implementing a `FeatureManagerService`:

```typescript
@Injectable({
  providedIn: 'root'
})
export class FeatureManagerService {
  constructor(
    private featureGraphService: FeatureGraphService,
    private userService: UserService
  ) {}

  // Runtime activation support
  async activateFeature(featureName: string, duration?: number): Promise<boolean> {
    // Implementation for temporary activation
  }

  // User entitlement validation
  async validateEntitlements(userId: string): Promise<string[]> {
    // Implementation for checking user's feature entitlements
  }

  // Deprecation warnings
  logDeprecationWarnings(): void {
    // Implementation for logging deprecated feature usage
  }

  // Soft-fail behavior
  handleFeatureValidationFailure(error: ValidationError): void {
    // Implementation for graceful failure handling
  }
}
```

### Custom Feature Directives

Create Angular structural directives for cleaner template usage:

```typescript
@Directive({
  selector: '[appFeatureFlag]'
})
export class FeatureFlagDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private featureService: FeatureGraphService
  ) {}

  @Input() set appFeatureFlag(featureName: string) {
    if (this.featureService.isFeatureEnabled(featureName)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
```

**Usage**:
```html
<div *appFeatureFlag="'advanced-editing'">
  <advanced-editor></advanced-editor>
</div>
```

### Integration with External Services

#### Flagsmith Integration

The system can be extended to integrate with Flagsmith for remote flag management:

```typescript
// Example integration (not currently implemented)
@Injectable({
  providedIn: 'root'
})
export class FlagsmithFeatureService {
  constructor(
    private flagsmith: FlagsmithService,
    private featureGraphService: FeatureGraphService
  ) {}

  async loadRemoteFlags(): Promise<void> {
    const remoteFlags = await this.flagsmith.getEnvironmentFlags();
    // Merge with local feature graph
    this.mergeWithLocalFeatures(remoteFlags);
  }
}
```

## Best Practices

### Feature Naming
- Use descriptive, hierarchical names: `editor.autosave`, `analysis.circuit.advanced`
- Avoid abbreviations: `collaboration` not `collab`
- Use consistent casing: kebab-case for feature names

### Dependency Management
- Keep dependencies shallow when possible
- Document dependency chains clearly
- Test feature combinations thoroughly

### Performance Considerations
- Features are loaded once at startup for optimal performance
- Use caching for entitlement checks
- Minimize feature flag evaluations in tight loops

### Error Handling
- Always provide fallback behavior when features are disabled
- Log warnings for deprecated features
- Gracefully handle missing feature files

### Testing
- Test features in both enabled and disabled states
- Test dependency chains
- Test with different tier configurations

## Migration Guide

### From Simple Boolean Flags
```typescript
// Before
if (this.config.enableAdvancedEditor) {
  // feature logic
}

// After
if (this.featureGraphService.isFeatureEnabled('advanced-editor')) {
  // feature logic
}
```

### Adding New Features
1. Define feature in appropriate graph files
2. Implement feature flag checks in code
3. Test with feature enabled/disabled
4. Document feature dependencies

### Deprecating Features
1. Mark feature as deprecated in graph files
2. Add deprecation warnings
3. Provide migration path
4. Schedule removal in future version

This documentation provides a comprehensive guide to the LeWM feature flag system, covering current implementation and planned enhancements for maintainability, clarity, and extensibility.