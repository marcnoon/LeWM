# LeWM Angular Test Errors and Solutions

This document provides comprehensive documentation for common test errors encountered in the LeWM Angular project and their solutions.

## Common Test Error Types

### 1. NullInjectorError - Service Not Found

This is the most common error in Angular tests. It occurs when a service is not properly provided in the test setup.

| Error Type | Example | Root Cause | Solution |
|------------|---------|------------|----------|
| `NullInjectorError: No provider for GraphStateService` | `NullInjectorError: No provider for GraphStateService!` | Service not provided in TestBed configuration | Add service to providers array or provide a mock |
| `NullInjectorError: No provider for LayoutStateService` | `NullInjectorError: No provider for LayoutStateService!` | Service not provided in TestBed configuration | Add service to providers array or provide a mock |
| `NullInjectorError: No provider for PinSyncService` | `NullInjectorError: No provider for PinSyncService!` | Service not provided in TestBed configuration | Add service to providers array or provide a mock |

### 2. Property Access Errors

These errors occur when services or components try to access properties that don't exist or are undefined.

| Error Type | Example | Root Cause | Solution |
|------------|---------|------------|----------|
| `Cannot read properties of undefined (reading 'forEach')` | `TypeError: Cannot read properties of undefined (reading 'forEach')` | Service trying to iterate over undefined array | Mock the dependency with proper data structure |
| `Cannot read properties of undefined (reading 'subscribe')` | `TypeError: Cannot read properties of undefined (reading 'subscribe')` | Observable not properly mocked | Provide mock observable with `of()` or `new Subject()` |

### 3. Component Instantiation Errors

These errors occur when components fail to be created due to missing dependencies.

| Error Type | Example | Root Cause | Solution |
|------------|---------|------------|----------|
| `Component creation failed` | Various component instantiation errors | Missing dependencies in component constructor | Provide all required services in TestBed |
| `Standalone component not imported` | Component not found in imports | Standalone components need to be imported, not declared | Move component from declarations to imports array |

## Process for Fixing Tests One at a Time

### Step 1: Identify the Failing Test
Run tests and focus on the first failing test:
```bash
npm run test -- --browsers=ChromeHeadless --no-watch
```

### Step 2: Analyze the Error
Look at the error message and identify:
- What service is missing
- What property is undefined
- What component is failing to instantiate

### Step 3: Fix the Root Cause
Based on the error type:

#### For NullInjectorError:
```typescript
// Add to TestBed.configureTestingModule
providers: [
  GraphStateService,
  // OR provide a mock
  { provide: GraphStateService, useValue: mockGraphStateService }
]
```

#### For Property Access Errors:
```typescript
// Create proper mocks
const mockGraphStateService = {
  nodes: [],
  connections: [],
  // Add all required properties and methods
  getNodes: jasmine.createSpy().and.returnValue([]),
  getConnections: jasmine.createSpy().and.returnValue([])
};
```

#### For Component Instantiation:
```typescript
// Ensure all dependencies are provided
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [StandaloneComponent], // For standalone components
    providers: [
      Service1,
      Service2,
      { provide: Service3, useValue: mockService3 }
    ]
  });
});
```

### Step 4: Run Single Test
```bash
npm run test -- --include="**/specific.test.spec.ts" --browsers=ChromeHeadless --no-watch
```

### Step 5: Repeat for Next Test
Once the test passes, move to the next failing test.

## Preventing Circular Dependency Issues

### 1. Service Hierarchy Best Practices

| Level | Services | Dependencies |
|-------|----------|--------------|
| **Level 1 (Base)** | `GraphStateService`, `LayoutStateService` | No dependencies on other app services |
| **Level 2 (Mid)** | `PinSyncService`, `FeatureGraphService` | Can depend on Level 1 services |
| **Level 3 (High)** | Components, Modes | Can depend on Level 1 and 2 services |

### 2. Testing Hierarchy

When testing services, mock dependencies from lower levels:

```typescript
// Testing Level 2 service
describe('PinSyncService', () => {
  let service: PinSyncService;
  let mockGraphStateService: jasmine.SpyObj<GraphStateService>;
  
  beforeEach(() => {
    const graphStateSpy = jasmine.createSpyObj('GraphStateService', ['getNodes', 'getConnections']);
    
    TestBed.configureTestingModule({
      providers: [
        PinSyncService,
        { provide: GraphStateService, useValue: graphStateSpy }
      ]
    });
    
    service = TestBed.inject(PinSyncService);
    mockGraphStateService = TestBed.inject(GraphStateService) as jasmine.SpyObj<GraphStateService>;
  });
});
```

### 3. Avoiding Circular Dependencies

| Do | Don't |
|----|-------|
| Create clear service hierarchy | Have services depend on each other bidirectionally |
| Use dependency injection properly | Import services directly in other services |
| Mock dependencies in tests | Provide actual services when testing higher-level services |
| Use interfaces for loose coupling | Tightly couple services together |

## Common Mock Patterns

### 1. Service Mocks
```typescript
const mockGraphStateService = {
  nodes: [],
  connections: [],
  getNodes: jasmine.createSpy().and.returnValue([]),
  getConnections: jasmine.createSpy().and.returnValue([]),
  addNode: jasmine.createSpy(),
  removeNode: jasmine.createSpy(),
  updateNode: jasmine.createSpy()
};
```

### 2. Observable Mocks
```typescript
const mockObservableService = {
  data$: of([]), // For simple observables
  errors$: new Subject(), // For complex observables that need to emit during tests
  getData: jasmine.createSpy().and.returnValue(of([])),
  updateData: jasmine.createSpy().and.returnValue(of({}))
};
```

### 3. Component Mocks
```typescript
@Component({
  selector: 'app-mock-component',
  template: '<div>Mock Component</div>'
})
class MockComponent {
  @Input() data: any;
  @Output() dataChange = new EventEmitter();
}
```

## Injector Error Fix Process

### Quick Fix Checklist

1. **Identify the missing service** from the error message
2. **Check if service is provided** in TestBed configuration
3. **Verify service dependencies** - does the service need other services?
4. **Create appropriate mocks** for dependencies
5. **Test the fix** by running only that specific test
6. **Verify no new errors** were introduced

### Example Fix Process

```typescript
// Error: NullInjectorError: No provider for GraphStateService
// Fix: Add to TestBed
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      GraphStateService,
      // If GraphStateService has dependencies, mock them:
      { provide: HttpClient, useValue: mockHttpClient },
      { provide: Router, useValue: mockRouter }
    ]
  });
});
```

## Testing Best Practices

### 1. Test Structure
- One describe block per component/service
- One it block per test case
- Use descriptive test names
- Setup and teardown properly

### 2. Mock Strategy
- Mock external dependencies
- Provide real implementations for the service under test
- Use spies to verify behavior
- Return predictable data from mocks

### 3. Standalone Components
- Import standalone components in `imports` array
- Don't declare standalone components in `declarations`
- Provide all required services for standalone components

### 4. Error Prevention
- Always provide required services in TestBed
- Mock complex dependencies
- Use proper TypeScript types
- Test edge cases and error conditions

## Tools and Commands

### Run All Tests
```bash
npm run test -- --browsers=ChromeHeadless --no-watch
```

### Run Specific Test File
```bash
npm run test -- --include="**/service.spec.ts" --browsers=ChromeHeadless --no-watch
```

### Run Tests with Coverage
```bash
npm run test -- --browsers=ChromeHeadless --no-watch --code-coverage
```

### Debug Single Test
```bash
npm run test -- --include="**/specific.spec.ts" --browsers=Chrome
```

## When to Use Each Approach

| Situation | Approach | Example |
|-----------|----------|---------|
| Testing pure service logic | Provide real service, mock dependencies | `TestBed.configureTestingModule({ providers: [MyService, { provide: Dependency, useValue: mock }] })` |
| Testing component behavior | Provide real component, mock services | `TestBed.configureTestingModule({ imports: [MyComponent], providers: [{ provide: MyService, useValue: mock }] })` |
| Testing integration | Provide multiple real services | `TestBed.configureTestingModule({ providers: [Service1, Service2, Service3] })` |
| Complex service dependencies | Create comprehensive mocks | Use `jasmine.createSpyObj()` with all required methods |

This documentation should be referenced when encountering test failures and updated as new patterns emerge.