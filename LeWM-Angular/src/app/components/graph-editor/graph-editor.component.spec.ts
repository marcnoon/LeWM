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
});
