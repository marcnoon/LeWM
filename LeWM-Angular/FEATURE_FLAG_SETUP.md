# Feature Flag System Setup

## Overview

The LeWM Feature Flag System infrastructure has been successfully scaffolded and is ready for incremental migration of features. This system allows for tier-based and environment-aware feature enabling/disabling based on graph configuration files.

## What's Been Implemented

### 1. Environment Configuration
- **Location**: `src/environments/`
- **Files**: `environment.ts`, `environment.prod.ts`
- **Properties**: 
  - `tier`: Identifies the application version ('public', 'standard', 'pro')
  - `envName`: Identifies the deployment environment ('dev', 'qa', 'prod')

### 2. FeatureGraphService
- **Location**: `src/app/services/feature-graph.service.ts`
- **Key Methods**:
  - `loadFeatures()`: Loads feature graph from JSON file based on environment
  - `isFeatureEnabled(featureName: string)`: Checks if feature is enabled with dependency validation
  - `getEnabledFeatures()`: Returns array of enabled feature names

### 3. Feature Graph Interface
- **Location**: `src/app/interfaces/feature-graph.interface.ts`
- **Structure**: Defines `FeatureGraphNode` and `FeatureGraph` interfaces

### 4. Directory Structure
```
src/assets/features/
├── public/
│   ├── dev.graph.json
│   └── prod.graph.json
```
- Currently contains empty placeholder files `{ "features": [] }`
- Ready for feature definitions as they are migrated

### 5. APP_INITIALIZER Integration
- **Location**: `src/app/app.module.ts`
- **Function**: `initializeFeatures()` factory ensures features are loaded before app startup
- **Dependencies**: HttpClientModule added for JSON loading

### 6. ModeManagerService Preparation
- **Location**: `src/app/services/mode-manager.service.ts`
- **New Method**: `initializeFeatureModes()` placeholder for future mode factory registration
- **Integration**: Injected with FeatureGraphService dependency

### 7. Comprehensive Tests
- **Location**: `src/app/services/feature-graph.service.spec.ts`
- **Coverage**: Tests for loading, error handling, feature enabling, dependency validation, and circular dependency detection

## How to Use

### Checking if a Feature is Enabled

```typescript
// In a component or service
constructor(private featureGraphService: FeatureGraphService) {}

ngOnInit() {
  if (this.featureGraphService.isFeatureEnabled('my-feature')) {
    // Feature is enabled
  }
}
```

### Template Usage

```html
<div *ngIf="featureGraphService.isFeatureEnabled('my-feature')">
  <!-- Feature-specific content -->
</div>
```

## Next Steps for Migration

### Adding a New Feature

1. **Define the feature in the appropriate graph file**:
   ```json
   {
     "features": [
       {
         "id": "unique-id",
         "name": "my-new-feature",
         "enabled": true,
         "dependencies": ["base-feature"] // optional
       }
     ]
   }
   ```

2. **Use the feature flag in your code**:
   ```typescript
   if (this.featureGraphService.isFeatureEnabled('my-new-feature')) {
     // Feature logic
   }
   ```

3. **For mode-based features**, register the mode factory in `ModeManagerService.initializeFeatureModes()`

### Creating Different Tiers

1. **Create new tier directory**: `src/assets/features/pro/`
2. **Add environment files**: `dev.graph.json`, `qa.graph.json`, `prod.graph.json`
3. **Update environment.ts**: Set `tier: 'pro'` for the appropriate build configuration

### Migrating Existing Features

1. **Identify the feature/mode to migrate**
2. **Add feature definition to relevant graph files**
3. **Wrap existing feature code with feature flag checks**
4. **Test with feature enabled/disabled**
5. **Update mode registration if applicable**

## System Benefits

- **Gradual Migration**: Features can be migrated incrementally without disrupting existing functionality
- **Environment Control**: Different features can be enabled per environment (dev/qa/prod)
- **Tier Support**: Public vs. private builds can have different feature sets
- **Dependency Management**: Features can depend on other features
- **Error Resilience**: System gracefully handles missing graph files
- **Performance**: Features are loaded once at app startup

## Architecture Notes

- **Public/Private Separation**: Ready for private initializer files for pro features
- **Mode Factory Pattern**: ModeManagerService prepared for dynamic mode registration
- **Circular Dependency Protection**: Built-in detection prevents infinite loops
- **Validation**: Recursive dependency checking ensures all requirements are met

The infrastructure is now ready for incremental feature migration as described in the original feature flag system design.