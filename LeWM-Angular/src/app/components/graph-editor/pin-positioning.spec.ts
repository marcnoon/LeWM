import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GraphEditorComponent } from './graph-editor.component';
import { GraphStateService } from '../../services/graph-state.service';
import { ModeManagerService } from '../../services/mode-manager.service';
import { PinStateService } from '../../services/pin-state.service';
import { FileService } from '../../services/file.service';
import { GraphNode } from '../../models/graph-node.model';
import { Pin, DEFAULT_PIN_TEXT_STYLE, DEFAULT_PIN_STYLE } from '../../interfaces/pin.interface';

describe('Pin Positioning', () => {
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
  });

  describe('Pin Position Calculation', () => {
    it('should calculate pin positions consistently', () => {
      const node: GraphNode = {
        id: 'test-node',
        type: 'ic',
        label: 'Test IC',
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        value: '',
        unit: '',
        pins: []
      };

      const pin: Pin = {
        id: 'test-pin',
        nodeId: 'test-node',
        label: 'TEST',
        position: {
          x: 20,
          y: 30,
          side: 'right',
          offset: 0.5
        },
        textStyle: { ...DEFAULT_PIN_TEXT_STYLE },
        pinStyle: { ...DEFAULT_PIN_STYLE },
        isInput: true,
        isOutput: false,
        pinType: 'bidirectional',
        pinNumber: '1',
        signalName: 'TEST',
        pinSize: 8,
        pinColor: '#4CAF50',
        showPinNumber: false
      };

      // Test absolute positioning (when x,y are non-zero)
      const absolutePosition = component.calculatePinPosition(pin, node);
      expect(absolutePosition.x).toBe(120); // 100 + 20
      expect(absolutePosition.y).toBe(130); // 100 + 30

      // Test side-based positioning
      const sidePin: Pin = {
        ...pin,
        position: {
          x: 0,
          y: 0,
          side: 'right',
          offset: 0.5
        }
      };

      const sidePosition = component.calculatePinPosition(sidePin, node);
      expect(sidePosition.x).toBe(180); // 100 + 80 (right side)
      expect(sidePosition.y).toBe(130); // 100 + (60 * 0.5)
    });

    it('should calculate pin text positions with offsets', () => {
      const node: GraphNode = {
        id: 'test-node',
        type: 'ic',
        label: 'Test IC',
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        value: '',
        unit: '',
        pins: []
      };

      const pin: Pin = {
        id: 'test-pin',
        nodeId: 'test-node',
        label: 'TEST',
        position: {
          x: 20,
          y: 30,
          side: 'right',
          offset: 0.5
        },
        textStyle: {
          ...DEFAULT_PIN_TEXT_STYLE,
          offset: { x: 3, y: 2 }
        },
        pinStyle: { ...DEFAULT_PIN_STYLE },
        isInput: true,
        isOutput: false,
        pinType: 'bidirectional',
        pinNumber: '1',
        signalName: 'TEST',
        pinSize: 8,
        pinColor: '#4CAF50',
        showPinNumber: false
      };

      const textPosition = component.calculatePinTextPosition(pin, node);
      expect(textPosition.x).toBe(123); // 120 + 3 (pin pos + text offset)
      expect(textPosition.y).toBe(132); // 130 + 2
    });
  });

  describe('Pin Position Stability', () => {
    it('should maintain consistent positions for side-based pins', () => {
      const node: GraphNode = {
        id: 'test-node',
        type: 'ic',
        label: 'Test IC',
        x: 200,
        y: 150,
        width: 100,
        height: 80,
        value: '',
        unit: '',
        pins: []
      };

      const testCases = [
        { side: 'top', offset: 0, expectedX: 200, expectedY: 150 },
        { side: 'top', offset: 0.5, expectedX: 250, expectedY: 150 },
        { side: 'top', offset: 1, expectedX: 300, expectedY: 150 },
        { side: 'right', offset: 0, expectedX: 300, expectedY: 150 },
        { side: 'right', offset: 0.5, expectedX: 300, expectedY: 190 },
        { side: 'right', offset: 1, expectedX: 300, expectedY: 230 },
        { side: 'bottom', offset: 0, expectedX: 200, expectedY: 230 },
        { side: 'bottom', offset: 0.5, expectedX: 250, expectedY: 230 },
        { side: 'bottom', offset: 1, expectedX: 300, expectedY: 230 },
        { side: 'left', offset: 0, expectedX: 200, expectedY: 150 },
        { side: 'left', offset: 0.5, expectedX: 200, expectedY: 190 },
        { side: 'left', offset: 1, expectedX: 200, expectedY: 230 }
      ];

      testCases.forEach(({ side, offset, expectedX, expectedY }) => {
        const pin: Pin = {
          id: `test-pin-${side}-${offset}`,
          nodeId: 'test-node',
          label: 'TEST',
          position: {
            x: 0,
            y: 0,
            side: side as 'top' | 'right' | 'bottom' | 'left',
            offset: offset
          },
          textStyle: { ...DEFAULT_PIN_TEXT_STYLE },
          pinStyle: { ...DEFAULT_PIN_STYLE },
          isInput: true,
          isOutput: false,
          pinType: 'bidirectional',
          pinNumber: '1',
          signalName: 'TEST',
          pinSize: 8,
          pinColor: '#4CAF50',
          showPinNumber: false
        };

        const position = component.calculatePinPosition(pin, node);
        expect(position.x).toBe(expectedX, `Failed for ${side} side, offset ${offset} - X position`);
        expect(position.y).toBe(expectedY, `Failed for ${side} side, offset ${offset} - Y position`);
      });
    });
  });
});