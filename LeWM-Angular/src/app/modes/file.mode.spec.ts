import { TestBed } from '@angular/core/testing';
import { FileMode, GraphData } from './file.mode';
import { GraphStateService } from '../services/graph-state.service';
import { PinStateService } from '../services/pin-state.service';
import { FileService } from '../services/file.service';
import { GraphEdge } from '../models/graph-edge.model';
import { GraphNode } from '../models/graph-node.model';
import { DEFAULT_PIN_TEXT_STYLE } from '../interfaces/pin.interface';
import { ConnectionStateService } from '../services/connection-state.service';

describe('FileMode', () => {
  let fileMode: FileMode;
  let mockGraphState: jasmine.SpyObj<GraphStateService>;
  let mockPinState: jasmine.SpyObj<PinStateService>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let connectionStateService: ConnectionStateService;

  beforeEach(() => {
    const graphStateSpy = jasmine.createSpyObj('GraphStateService', [
      'getNodes', 'getEdges', 'addNode', 'addEdge', 'updateNode', 'deleteNodes'
    ]);
    const pinStateSpy = jasmine.createSpyObj('PinStateService', [
      'clearAll', 'importPin'
    ]);
    const fileServiceSpy = jasmine.createSpyObj('FileService', [
      'saveGraph', 'saveGraphAs', 'openGraph'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: GraphStateService, useValue: graphStateSpy },
        { provide: PinStateService, useValue: pinStateSpy },
        { provide: FileService, useValue: fileServiceSpy },
        ConnectionStateService
      ]
    });

    mockGraphState = TestBed.inject(GraphStateService) as jasmine.SpyObj<GraphStateService>;
    mockPinState = TestBed.inject(PinStateService) as jasmine.SpyObj<PinStateService>;
    mockFileService = TestBed.inject(FileService) as jasmine.SpyObj<FileService>;
    connectionStateService = TestBed.inject(ConnectionStateService);

    fileMode = new FileMode(mockGraphState, mockPinState, mockFileService);
  });

  describe('Connection Direction Import/Export', () => {
    it('should preserve connection direction when importing graph data', () => {
      // Arrange: Create test data with directional connections
      const testGraphData: GraphData = {
        version: '1.0',
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          name: 'Test Graph'
        },
        nodes: [
          {
            id: 'node1',
            type: 'component',
            x: 100,
            y: 100,
            width: 80,
            height: 60,
            label: 'Node 1',
            pins: [{ x: 80, y: 30, name: 'OUT' }]
          },
          {
            id: 'node2',
            type: 'component',
            x: 300,
            y: 100,
            width: 80,
            height: 60,
            label: 'Node 2',
            pins: [{ x: 0, y: 30, name: 'IN' }]
          }
        ],
        pins: [
          {
            id: 'node1.OUT',
            nodeId: 'node1',
            label: 'OUT',
            position: { side: 'right', offset: 0.5, x: 80, y: 30 },
            pinType: 'output',
            pinStyle: { size: 8, color: '#000000', shape: 'circle', borderWidth: 1, borderColor: '#000000' },
            textStyle: DEFAULT_PIN_TEXT_STYLE,
            isInput: false,
            isOutput: true,
            pinNumber: '',
            signalName: '',
            pinSize: 4,
            pinColor: '#000000',
            showPinNumber: false
          },
          {
            id: 'node2.IN',
            nodeId: 'node2',
            label: 'IN',
            position: { side: 'left', offset: 0.5, x: 0, y: 30 },
            pinType: 'input',
            pinStyle: { size: 8, color: '#000000', shape: 'circle', borderWidth: 1, borderColor: '#000000' },
            textStyle: DEFAULT_PIN_TEXT_STYLE,
            isInput: true,
            isOutput: false,
            pinNumber: '',
            signalName: '',
            pinSize: 4,
            pinColor: '#000000',
            showPinNumber: false
          }
        ],
        connections: [
          {
            id: 'conn_1',
            from: 'node1.OUT',
            to: 'node2.IN',
            type: 'signal',
            direction: 'forward',
            color: '#2196F3',
            strokeWidth: 2
          }
        ]
      };

      // Mock the required methods
      mockGraphState.getNodes.and.returnValue([]);
      mockGraphState.deleteNodes.and.stub();
      mockPinState.clearAll.and.stub();
      mockGraphState.addNode.and.stub();
      mockGraphState.updateNode.and.stub();
      mockPinState.importPin.and.stub();
      mockGraphState.addEdge.and.stub();

      // Act: Import the graph data
      fileMode.importGraphData(testGraphData);

      // Assert: Verify that addEdge was called with the complete connection object including direction
      expect(mockGraphState.addEdge).toHaveBeenCalledWith({
        id: 'conn_1',
        from: 'node1.OUT',
        to: 'node2.IN',
        type: 'signal',
        direction: 'forward',
        color: '#2196F3',
        strokeWidth: 2
      });
    });

    it('should export connections with all metadata including direction', () => {
      // Arrange: Setup mock data
      const mockNodes: GraphNode[] = [
        {
          id: 'node1',
          type: 'component',
          x: 100,
          y: 100,
          width: 80,
          height: 60,
          label: 'Node 1',
          pins: [{ x: 80, y: 30, name: 'OUT' }]
        }
      ];

      const mockEdges: GraphEdge[] = [
        {
          id: 'conn_1',
          from: 'node1.OUT',
          to: 'node2.IN',
          type: 'signal',
          direction: 'forward',
          color: '#FF0000',
          strokeWidth: 3,
          label: 'Test Connection'
        }
      ];

      mockGraphState.getNodes.and.returnValue(mockNodes);
      mockGraphState.getEdges.and.returnValue(mockEdges);

      // Act: Export the graph data
      const exportedData = fileMode.exportGraphData();

      // Assert: Verify that the exported connection includes all metadata
      expect(exportedData.connections).toHaveSize(1);
      const exportedConnection = exportedData.connections[0];
      expect(exportedConnection.id).toBe('conn_1');
      expect(exportedConnection.from).toBe('node1.OUT');
      expect(exportedConnection.to).toBe('node2.IN');
      expect(exportedConnection.direction).toBe('forward');
      expect(exportedConnection.color).toBe('#FF0000');
      expect(exportedConnection.strokeWidth).toBe(3);
      expect(exportedConnection.label).toBe('Test Connection');
    });

    it('should handle connections without direction property (directionless connections)', () => {
      // Arrange: Create test data with a directionless connection
      const testGraphData: GraphData = {
        version: '1.0',
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          name: 'Test Graph'
        },
        nodes: [],
        pins: [],
        connections: [
          {
            id: 'conn_directionless',
            from: 'node1.OUT',
            to: 'node2.IN',
            type: 'signal',
            color: '#2196F3'
            // Note: no direction property
          }
        ]
      };

      // Mock the required methods
      mockGraphState.getNodes.and.returnValue([]);
      mockGraphState.deleteNodes.and.stub();
      mockPinState.clearAll.and.stub();
      mockGraphState.addEdge.and.stub();

      // Act: Import the graph data
      fileMode.importGraphData(testGraphData);

      // Assert: Verify that addEdge was called with the connection object without direction
      expect(mockGraphState.addEdge).toHaveBeenCalledWith({
        id: 'conn_directionless',
        from: 'node1.OUT',
        to: 'node2.IN',
        type: 'signal',
        color: '#2196F3'
        // direction should be undefined
      });
    });

    it('should handle connections with bidirectional direction', () => {
      // Arrange: Create test data with bidirectional connection
      const testGraphData: GraphData = {
        version: '1.0',
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          name: 'Test Graph'
        },
        nodes: [],
        pins: [],
        connections: [
          {
            id: 'conn_bidirectional',
            from: 'node1.OUT',
            to: 'node2.IN',
            direction: 'bidirectional'
          }
        ]
      };

      // Mock the required methods
      mockGraphState.getNodes.and.returnValue([]);
      mockGraphState.deleteNodes.and.stub();
      mockPinState.clearAll.and.stub();
      mockGraphState.addEdge.and.stub();

      // Act: Import the graph data
      fileMode.importGraphData(testGraphData);

      // Assert: Verify that addEdge was called with the bidirectional connection
      expect(mockGraphState.addEdge).toHaveBeenCalledWith({
        id: 'conn_bidirectional',
        from: 'node1.OUT',
        to: 'node2.IN',
        direction: 'bidirectional'
      });
    });
  });

  describe('Integration Test', () => {
    it('should preserve all connection properties through export/import cycle', () => {
      // This test simulates the full export -> import cycle to ensure no data is lost
      
      // Arrange: Setup initial state
      const initialConnection: GraphEdge = {
        id: 'test_conn',
        from: 'node1.OUT',
        to: 'node2.IN',
        type: 'signal',
        direction: 'forward',
        color: '#FF5722',
        strokeWidth: 4,
        strokeStyle: 'dashed',
        label: 'Critical Signal',
        description: 'Important connection',
        tags: ['critical', 'signal']
      };

      const mockNodes: GraphNode[] = [
        {
          id: 'node1',
          type: 'component',
          x: 100,
          y: 100,
          width: 80,
          height: 60,
          label: 'Source',
          pins: [{ x: 80, y: 30, name: 'OUT' }]
        }
      ];

      mockGraphState.getNodes.and.returnValue(mockNodes);
      mockGraphState.getEdges.and.returnValue([initialConnection]);

      // Act: Export and then import
      const exportedData = fileMode.exportGraphData();
      
      // Reset mocks for import
      mockGraphState.getNodes.and.returnValue([]);
      mockGraphState.deleteNodes.and.stub();
      mockPinState.clearAll.and.stub();
      mockGraphState.addNode.and.stub();
      mockGraphState.updateNode.and.stub();
      mockPinState.importPin.and.stub();
      mockGraphState.addEdge.and.stub();
      
      fileMode.importGraphData(exportedData);

      // Assert: All properties should be preserved
      expect(mockGraphState.addEdge).toHaveBeenCalledWith(jasmine.objectContaining({
        id: 'test_conn',
        from: 'node1.OUT',
        to: 'node2.IN',
        direction: 'forward',
        color: '#FF5722',
        strokeWidth: 4,
        strokeStyle: 'dashed',
        label: 'Critical Signal',
        description: 'Important connection',
        tags: ['critical', 'signal']
      }));
    });
  });

  describe('Real Integration Test', () => {
    it('should verify import/export round-trip preserves all connection metadata', () => {
      // This test uses real services to ensure no properties are lost
      const realGraphState = TestBed.inject(GraphStateService);
      const realPinState = new PinStateService();
      const realFileMode = new FileMode(realGraphState, realPinState, mockFileService);

      const testGraphData: GraphData = {
        version: '1.0',
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          name: 'Integration Test Graph'
        },
        nodes: [
          {
            id: 'mic1',
            type: 'component',
            x: 100,
            y: 250,
            width: 40,
            height: 40,
            label: 'MIC1',
            pins: [{ x: 40, y: 20, name: 'OUT' }]
          },
          {
            id: 'r1',
            type: 'resistor',
            x: 180,
            y: 270,
            width: 60,
            height: 20,
            label: '10kΩ',
            pins: [{ x: 0, y: 10, name: 'A' }]
          }
        ],
        pins: [
          {
            id: 'mic1.OUT',
            nodeId: 'mic1',
            label: 'OUT',
            position: { side: 'right', offset: 0.5, x: 40, y: 20 },
            pinType: 'output',
            pinStyle: { size: 8, color: '#000000', shape: 'circle', borderWidth: 1, borderColor: '#000000' },
            textStyle: DEFAULT_PIN_TEXT_STYLE,
            isInput: false,
            isOutput: true,
            pinNumber: '',
            signalName: '',
            pinSize: 4,
            pinColor: '#000000',
            showPinNumber: false
          },
          {
            id: 'r1.A',
            nodeId: 'r1',
            label: 'A',
            position: { side: 'left', offset: 0.5, x: 0, y: 10 },
            pinType: 'input',
            pinStyle: { size: 8, color: '#000000', shape: 'circle', borderWidth: 1, borderColor: '#000000' },
            textStyle: DEFAULT_PIN_TEXT_STYLE,
            isInput: true,
            isOutput: false,
            pinNumber: '',
            signalName: '',
            pinSize: 4,
            pinColor: '#000000',
            showPinNumber: false
          }
        ],
        connections: [
          {
            id: 'conn_4',
            from: 'mic1.OUT',
            to: 'r1.A',
            type: 'signal',
            direction: 'forward',
            color: '#FF5722',
            strokeWidth: 3,
            strokeStyle: 'solid',
            label: 'Audio Signal',
            description: 'Test connection with direction',
            tags: ['audio', 'test']
          }
        ]
      };

      // Import the data
      realFileMode.importGraphData(testGraphData);

      // Verify connection was properly imported with all properties
      const importedEdges = realGraphState.getEdges();
      expect(importedEdges).toHaveSize(1);
      
      const importedConnection = importedEdges[0];
      expect(importedConnection.id).toBe('conn_4');
      expect(importedConnection.from).toBe('mic1.OUT');
      expect(importedConnection.to).toBe('r1.A');
      expect(importedConnection.type).toBe('signal');
      expect(importedConnection.direction).toBe('forward');
      expect(importedConnection.color).toBe('#FF5722');
      expect(importedConnection.strokeWidth).toBe(3);
      expect(importedConnection.strokeStyle).toBe('solid');
      expect(importedConnection.label).toBe('Audio Signal');
      expect(importedConnection.description).toBe('Test connection with direction');
      expect(importedConnection.tags).toEqual(['audio', 'test']);

      // Export back and verify all properties are preserved
      const exportedData = realFileMode.exportGraphData();
      expect(exportedData.connections).toHaveSize(1);
      
      const exportedConnection = exportedData.connections[0];
      expect(exportedConnection.direction).toBe('forward');
      expect(exportedConnection.color).toBe('#FF5722');
      expect(exportedConnection.strokeWidth).toBe(3);
      expect(exportedConnection.strokeStyle).toBe('solid');
      expect(exportedConnection.label).toBe('Audio Signal');
      expect(exportedConnection.description).toBe('Test connection with direction');
      expect(exportedConnection.tags).toEqual(['audio', 'test']);
    });
  });
});