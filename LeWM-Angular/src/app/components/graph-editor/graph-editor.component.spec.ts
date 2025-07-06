import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { GraphEditorComponent } from './graph-editor.component';
import { GraphStateService } from '../../services/graph-state.service';
import { ModeManagerService } from '../../services/mode-manager.service';
import { PinStateService } from '../../services/pin-state.service';
import { FileService } from '../../services/file.service';
import { GraphNode } from '../../models/graph-node.model';
import { GraphMode } from '../../interfaces/graph-mode.interface';

describe('GraphEditorComponent', () => {
  let component: GraphEditorComponent;
  let fixture: ComponentFixture<GraphEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphEditorComponent, HttpClientTestingModule],
      providers: [
        GraphStateService,
        ModeManagerService,
        PinStateService,
        FileService
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(GraphEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Service State Cleanup
    // Reset all services to clean state
    const graphStateService = TestBed.inject(GraphStateService);
    graphStateService.resetToDefaults();
    
    // Component State Cleanup
    // Destroy component fixture
    if (fixture) {
      fixture.destroy();
    }
    
    // Clear SVG elements and arrow markers
    document.querySelectorAll('svg').forEach(svg => {
      svg.querySelectorAll('line, path, polyline, #arrowhead, #arrowhead-start, defs marker').forEach(el => el.remove());
    });
    
    // Clear any test-specific DOM elements
    document.querySelectorAll('[data-test], [data-node-id], [data-pin-id]').forEach(el => el.remove());
    
    // Clear localStorage test data
    localStorage.removeItem('lewm-graph-nodes');
    localStorage.removeItem('lewm-enhanced-pin-properties');
    
    // Reset any global state
    delete (window as any).testGlobals;
    delete (window as any).arrowMarkerCache;
    delete (window as any).connectionRenderState;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Mode switching during dialog interaction', () => {
    beforeEach(() => {
      // Set up spies for mode switching methods
      spyOn(component, 'switchToNormalMode');
      spyOn(component, 'switchToPinEditMode');
      spyOn(component, 'switchToFileMode');
    });

    it('should prevent mode switching when node dialog is open', () => {
      // Simulate node dialog being open
      component.showNodeDialog = true;

      // Create keyboard events for mode switching keys
      const eventF = new KeyboardEvent('keydown', { key: 'f' });
      const eventP = new KeyboardEvent('keydown', { key: 'p' });
      const eventN = new KeyboardEvent('keydown', { key: 'n' });

      // Trigger the keyboard events
      component.handleKeyDown(eventF);
      component.handleKeyDown(eventP);
      component.handleKeyDown(eventN);

      // Verify that mode switching methods were not called
      expect(component.switchToFileMode).not.toHaveBeenCalled();
      expect(component.switchToPinEditMode).not.toHaveBeenCalled();
      expect(component.switchToNormalMode).not.toHaveBeenCalled();
    });

    it('should prevent mode switching when pin dialog is open', () => {
      // Simulate pin dialog being open
      component.showPinDialog = true;

      // Create keyboard events for mode switching keys
      const eventF = new KeyboardEvent('keydown', { key: 'f' });
      const eventP = new KeyboardEvent('keydown', { key: 'p' });

      // Trigger the keyboard events
      component.handleKeyDown(eventF);
      component.handleKeyDown(eventP);

      // Verify that mode switching methods were not called
      expect(component.switchToFileMode).not.toHaveBeenCalled();
      expect(component.switchToPinEditMode).not.toHaveBeenCalled();
    });

    it('should prevent mode switching when connection dialog is open', () => {
      // Simulate connection dialog being open
      component.showConnectionDialog = true;

      // Create keyboard events for mode switching keys
      const eventF = new KeyboardEvent('keydown', { key: 'f' });
      const eventC = new KeyboardEvent('keydown', { key: 'c' });

      // Trigger the keyboard events
      component.handleKeyDown(eventF);
      component.handleKeyDown(eventC);

      // Verify that mode switching methods were not called
      expect(component.switchToFileMode).not.toHaveBeenCalled();
    });

    it('should prevent mode switching when pin layout editor is open', () => {
      // Simulate pin layout editor being open
      component.showPinLayoutEditor = true;

      // Create keyboard events for mode switching keys
      const eventF = new KeyboardEvent('keydown', { key: 'f' });
      const eventN = new KeyboardEvent('keydown', { key: 'n' });
      const eventP = new KeyboardEvent('keydown', { key: 'p' });

      // Trigger the keyboard events
      component.handleKeyDown(eventF);
      component.handleKeyDown(eventN);
      component.handleKeyDown(eventP);

      // Verify that mode switching methods were not called
      expect(component.switchToFileMode).not.toHaveBeenCalled();
      expect(component.switchToNormalMode).not.toHaveBeenCalled();
      expect(component.switchToPinEditMode).not.toHaveBeenCalled();
    });

    it('should allow mode switching when no dialogs are open', () => {
      // Ensure all dialogs are closed
      component.showNodeDialog = false;
      component.showPinDialog = false;
      component.showConnectionDialog = false;
      component.showConnectionBulkDialog = false;
      component.showPinLayoutEditor = false;

      // Mock the current mode to ensure mode switching logic is triggered
      component.currentMode = { name: 'normal', displayName: 'Normal' } as GraphMode;

      // Create keyboard events for mode switching keys
      const eventF = new KeyboardEvent('keydown', { key: 'f' });
      const eventP = new KeyboardEvent('keydown', { key: 'p' });

      // Trigger the keyboard events
      component.handleKeyDown(eventF);
      component.handleKeyDown(eventP);

      // Verify that mode switching methods were called
      expect(component.switchToFileMode).toHaveBeenCalled();
      expect(component.switchToPinEditMode).toHaveBeenCalled();
    });

    it('should prevent Enter key actions when dialogs are open', () => {
      // Mock the necessary dependencies
      spyOn(component, 'openNodeNameDialog');
      spyOn(component, 'deleteSelectedNodes');

      // Set up for normal mode Enter key handling
      component.currentMode = { name: 'normal' } as GraphMode;
      component.selectedNodes.add('test-node');

      // Test with node dialog open
      component.showNodeDialog = true;
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      component.handleKeyDown(enterEvent);

      // Verify that node dialog opening was prevented
      expect(component.openNodeNameDialog).not.toHaveBeenCalled();
    });

    it('should prevent Delete key actions when dialogs are open', () => {
      // Mock the necessary dependencies
      spyOn(component, 'deleteSelectedNodes');

      // Set up for normal mode delete handling
      component.currentMode = { name: 'normal' } as GraphMode;
      component.selectedNodes.add('test-node');

      // Test with node dialog open
      component.showNodeDialog = true;
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      component.handleKeyDown(deleteEvent);

      // Verify that deletion was prevented
      expect(component.deleteSelectedNodes).not.toHaveBeenCalled();
    });
  });

  describe('Pin duplicate name validation', () => {
    let testNode: GraphNode;

    beforeEach(() => {
      testNode = {
        id: 'test-node',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        type: 'test',
        label: 'Test Node',
        pins: [
          { x: 0, y: 50, name: 'existingPin' },
          { x: 200, y: 50, name: 'anotherPin' }
        ]
      };
    });

    it('should detect duplicate pin names', () => {
      expect(component['isPinNameDuplicate'](testNode, 'existingPin')).toBe(true);
      expect(component['isPinNameDuplicate'](testNode, 'anotherPin')).toBe(true);
      expect(component['isPinNameDuplicate'](testNode, 'newPin')).toBe(false);
    });

    it('should allow unique pin names', () => {
      expect(component['isPinNameDuplicate'](testNode, 'uniqueName')).toBe(false);
    });

    it('should handle nodes with no pins', () => {
      const emptyNode = { ...testNode, pins: [] };
      expect(component['isPinNameDuplicate'](emptyNode, 'anyName')).toBe(false);
    });

    it('should handle nodes with undefined pins', () => {
      const nodeWithoutPins = { ...testNode };
      delete nodeWithoutPins.pins;
      expect(component['isPinNameDuplicate'](nodeWithoutPins, 'anyName')).toBe(false);
    });
  });

  describe('Central Reference Area', () => {
    it('should return entire workspace dimensions for central reference area', () => {
      // Mock the SVG canvas element
      const mockSvgElement = {
        getBoundingClientRect: () => ({
          width: 1000,
          height: 800,
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 1000,
          bottom: 800
        })
      };

      // Set up the mocked SVG canvas
      component.svgCanvas = { nativeElement: mockSvgElement as SVGElement };

      // Call the method under test
      const result = component.getCentralReferenceArea();

      // Verify that the reference area covers the entire workspace
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.width).toBe(1000); // Should be full width, not limited
      expect(result.height).toBe(800); // Should be full height, not limited
    });

    it('should handle case when svgCanvas is not available', () => {
      // Set svgCanvas to null
      component.svgCanvas = null as any;

      // Call the method under test
      const result = component.getCentralReferenceArea();

      // Should return default values
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });

    it('should use actual workspace dimensions regardless of size', () => {
      // Mock a very large SVG canvas to test that we're not limited by previous constraints
      const mockSvgElement = {
        getBoundingClientRect: () => ({
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 1920,
          bottom: 1080
        })
      };

      component.svgCanvas = { nativeElement: mockSvgElement as SVGElement };

      const result = component.getCentralReferenceArea();

      // Should use the full dimensions without any size limitations
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('Pin creation flow', () => {
    let testNode: GraphNode;
    let mockPinDialog: any;

    beforeEach(() => {
      testNode = {
        id: 'test-node',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        type: 'test',
        label: 'Test Node',
        pins: [
          { x: 0, y: 50, name: 'existingPin' }
        ]
      };

      // Mock the pin dialog
      mockPinDialog = {
        isVisible: false,
        side: '',
        pinCreated: new EventEmitter<string>(),
        cancelled: new EventEmitter<void>(),
        pinName: '',
        errorMessage: '',
        showError: jasmine.createSpy('showError'),
        reset: jasmine.createSpy('reset'),
        onOk: jasmine.createSpy('onOk'),
        onCancel: jasmine.createSpy('onCancel'),
        onOverlayClick: jasmine.createSpy('onOverlayClick'),
        onKeyDown: jasmine.createSpy('onKeyDown'),
        clearError: jasmine.createSpy('clearError')
      };
      component.pinDialog = mockPinDialog;
      component.pendingPinNode = testNode;
      component.selectedSideForPin = 'left';
      component.showPinDialog = true; // Initialize dialog as open

      // Mock the GraphStateService updateNode method
      spyOn(component['graphState'], 'updateNode');
    });

    it('should successfully create pin with unique name', () => {
      component.onPinCreated('newUniquePin');

      expect(component['graphState'].updateNode).toHaveBeenCalled();
      expect(mockPinDialog.showError).not.toHaveBeenCalled();
      expect(mockPinDialog.reset).toHaveBeenCalled();
      expect(component.showPinDialog).toBe(false);
    });

    it('should prevent creation of pin with duplicate name', () => {
      component.onPinCreated('existingPin');

      expect(component['graphState'].updateNode).not.toHaveBeenCalled();
      expect(mockPinDialog.showError).toHaveBeenCalledWith('Pin name "existingPin" already exists on this node. Please choose a different name.');
      expect(mockPinDialog.reset).not.toHaveBeenCalled();
      expect(component.showPinDialog).toBe(true); // Dialog should remain open
    });

    it('should handle empty or whitespace pin names', () => {
      component.onPinCreated('   '); // whitespace only

      // Should not create pin because name is empty after trimming
      expect(component['graphState'].updateNode).not.toHaveBeenCalled();
      expect(mockPinDialog.showError).toHaveBeenCalledWith('Pin name cannot be empty. Please enter a valid name.');
      expect(component.showPinDialog).toBe(true); // Dialog should remain open
    });
  });

  describe('Pin and Text Positioning', () => {
    it('should correctly position pins and text when switching between pin mode and normal mode', () => {
      // 1. Create a node with a pin
      const testNode: GraphNode = {
        id: 'test-node-pos',
        x: 200,
        y: 200,
        width: 150,
        height: 80,
        type: 'test',
        label: 'Test Node Position',
        pins: [{ x: 0, y: 40, name: 'testPin' }]
      };
      component['graphState'].addNode(testNode);
      fixture.detectChanges();

      // 2. Switch to pin-edit mode
      component.switchToPinEditMode();
      fixture.detectChanges();

      // 3. Check the pin and text positions in pin-edit mode
      let pinElement = fixture.nativeElement.querySelector(`[data-pin-id="${testNode.id}.testPin"]`);
      let textElement = fixture.nativeElement.querySelector(`[data-pin-id="${testNode.id}.testPin"] text`);
      
      expect(pinElement.getAttribute('transform')).toBe('translate(200, 240)');
      expect(textElement.getAttribute('x')).toBe('10');

      // 4. Switch back to normal mode
      component.switchToNormalMode();
      fixture.detectChanges();

      // 5. Check the pin and text positions again
      pinElement = fixture.nativeElement.querySelector(`[data-pin-id="${testNode.id}.testPin"]`);
      textElement = fixture.nativeElement.querySelector(`[data-pin-id="${testNode.id}.testPin"] text`);

      expect(pinElement.getAttribute('transform')).toBe('translate(200, 240)');
      expect(textElement.getAttribute('x')).toBe('10');
    });
  });
});