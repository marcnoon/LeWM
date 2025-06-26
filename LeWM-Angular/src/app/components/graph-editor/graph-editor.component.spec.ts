import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { GraphEditorComponent } from './graph-editor.component';
import { GraphStateService } from '../../services/graph-state.service';
import { ModeManagerService } from '../../services/mode-manager.service';
import { PinStateService } from '../../services/pin-state.service';
import { FileService } from '../../services/file.service';
import { GraphNode } from '../../models/graph-node.model';

describe('GraphEditorComponent', () => {
  let component: GraphEditorComponent;
  let fixture: ComponentFixture<GraphEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GraphEditorComponent],
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
      component.currentMode = component['normalMode'];

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
      component.currentMode = { name: 'normal' } as any;
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
      component.currentMode = { name: 'normal' } as any;
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
        showError: jasmine.createSpy('showError'),
        reset: jasmine.createSpy('reset')
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

  describe('Pin positioning logic', () => {
    let testNode: GraphNode;
    let testPin: any; // Using any to match the Pin interface from pin.interface.ts

    beforeEach(() => {
      testNode = {
        id: 'test-node',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        type: 'test',
        label: 'Test Node',
        shape: 'rectangle'
      };
    });

    describe('Semantic positioning with side and offset', () => {
      it('should calculate top side position correctly', () => {
        testPin = {
          id: 'pin1',
          nodeId: 'test-node',
          position: { side: 'top', offset: 0.5, x: 0, y: 0 },
          label: 'test-pin'
        };

        const position = component.calculatePinPosition(testPin, testNode);
        expect(position.x).toBe(200); // node.x + (node.width * 0.5) = 100 + (200 * 0.5)
        expect(position.y).toBe(100); // node.y = 100
      });

      it('should calculate right side position correctly', () => {
        testPin = {
          id: 'pin1',
          nodeId: 'test-node',
          position: { side: 'right', offset: 0.3, x: 0, y: 0 },
          label: 'test-pin'
        };

        const position = component.calculatePinPosition(testPin, testNode);
        expect(position.x).toBe(300); // node.x + node.width = 100 + 200
        expect(position.y).toBe(130); // node.y + (node.height * 0.3) = 100 + (100 * 0.3)
      });

      it('should calculate bottom side position correctly', () => {
        testPin = {
          id: 'pin1',
          nodeId: 'test-node',
          position: { side: 'bottom', offset: 0.8, x: 0, y: 0 },
          label: 'test-pin'
        };

        const position = component.calculatePinPosition(testPin, testNode);
        expect(position.x).toBe(260); // node.x + (node.width * 0.8) = 100 + (200 * 0.8)
        expect(position.y).toBe(200); // node.y + node.height = 100 + 100
      });

      it('should calculate left side position correctly', () => {
        testPin = {
          id: 'pin1',
          nodeId: 'test-node',
          position: { side: 'left', offset: 0.7, x: 0, y: 0 },
          label: 'test-pin'
        };

        const position = component.calculatePinPosition(testPin, testNode);
        expect(position.x).toBe(100); // node.x = 100
        expect(position.y).toBe(170); // node.y + (node.height * 0.7) = 100 + (100 * 0.7)
      });

      it('should prioritize side/offset over x/y coordinates', () => {
        // This is the key test for the bug fix
        testPin = {
          id: 'pin1',
          nodeId: 'test-node',
          position: { side: 'top', offset: 0.5, x: 999, y: 999 }, // Non-zero x,y should be ignored
          label: 'test-pin'
        };

        const position = component.calculatePinPosition(testPin, testNode);
        expect(position.x).toBe(200); // Should use side/offset calculation, not x/y
        expect(position.y).toBe(100);
      });
    });

    describe('Legacy positioning fallback', () => {
      it('should use x/y coordinates when no side is defined', () => {
        testPin = {
          id: 'pin1',
          nodeId: 'test-node',
          position: { side: undefined, offset: 0, x: 50, y: 25 },
          label: 'test-pin'
        };

        const position = component.calculatePinPosition(testPin, testNode);
        expect(position.x).toBe(150); // node.x + pin.x = 100 + 50
        expect(position.y).toBe(125); // node.y + pin.y = 100 + 25
      });

      it('should use x/y coordinates when offset is not defined', () => {
        testPin = {
          id: 'pin1',
          nodeId: 'test-node',
          position: { side: 'top', offset: undefined, x: 75, y: 15 },
          label: 'test-pin'
        };

        const position = component.calculatePinPosition(testPin, testNode);
        expect(position.x).toBe(175); // node.x + pin.x = 100 + 75
        expect(position.y).toBe(115); // node.y + pin.y = 100 + 15
      });
    });

    describe('Circular node positioning', () => {
      beforeEach(() => {
        testNode.shape = 'circle';
        testNode.width = 100; // Make it square for easier testing
        testNode.height = 100;
      });

      it('should calculate circular positions for top side', () => {
        testPin = {
          id: 'pin1',
          nodeId: 'test-node',
          position: { side: 'top', offset: 0.5, x: 0, y: 0 },
          label: 'test-pin'
        };

        const position = component.calculatePinPosition(testPin, testNode);
        // For center offset (0.5) on top side, should be at top of circle
        expect(Math.round(position.x)).toBe(150); // centerX = 100 + 50
        expect(Math.round(position.y)).toBe(50);  // centerY - radius = 150 - 50
      });
    });

    describe('Shape handling', () => {
      it('should default to rectangle when shape is undefined', () => {
        delete testNode.shape;
        testPin = {
          id: 'pin1',
          nodeId: 'test-node',
          position: { side: 'top', offset: 0.5, x: 0, y: 0 },
          label: 'test-pin'
        };

        const position = component.calculatePinPosition(testPin, testNode);
        expect(position.x).toBe(200); // Should use rectangular calculation
        expect(position.y).toBe(100);
      });

      it('should handle unknown shapes by falling back to rectangle', () => {
        testNode.shape = 'polygon' as any;
        testPin = {
          id: 'pin1',
          nodeId: 'test-node',
          position: { side: 'top', offset: 0.5, x: 0, y: 0 },
          label: 'test-pin'
        };

        const position = component.calculatePinPosition(testPin, testNode);
        expect(position.x).toBe(200); // Should use rectangular calculation
        expect(position.y).toBe(100);
      });
    });
  });
});
