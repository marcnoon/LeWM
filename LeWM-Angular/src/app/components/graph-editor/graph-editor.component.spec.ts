import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { GraphEditorComponent } from './graph-editor.component';
import { GraphStateService } from '../../services/graph-state.service';
import { GraphNode } from '../../models/graph-node.model';

describe('GraphEditorComponent', () => {
  let component: GraphEditorComponent;
  let fixture: ComponentFixture<GraphEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GraphEditorComponent],
      providers: [GraphStateService],
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
});
