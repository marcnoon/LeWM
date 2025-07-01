import { TestBed } from '@angular/core/testing';
import { FileMode, GraphData } from './file.mode';
import { GraphStateService } from '../services/graph-state.service';
import { PinStateService } from '../services/pin-state.service';
import { FileService } from '../services/file.service';
import { GraphEdge } from '../models/graph-edge.model';
import { GraphNode } from '../models/graph-node.model';
import { Pin, DEFAULT_PIN_TEXT_STYLE } from '../interfaces/pin.interface';

describe('FileMode', () => {
  let fileMode: FileMode;
  let mockGraphState: jasmine.SpyObj<GraphStateService>;
  let mockPinState: jasmine.SpyObj<PinStateService>;
  let mockFileService: jasmine.SpyObj<FileService>;

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
        { provide: FileService, useValue: fileServiceSpy }
      ]
    });

    mockGraphState = TestBed.inject(GraphStateService) as jasmine.SpyObj<GraphStateService>;
    mockPinState = TestBed.inject(PinStateService) as jasmine.SpyObj<PinStateService>;
    mockFileService = TestBed.inject(FileService) as jasmine.SpyObj<FileService>;

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
});