import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphEditorComponent } from '../components/graph-editor/graph-editor.component';
import { GraphStateService } from '../services/graph-state.service';
import { PinStateService } from '../services/pin-state.service';
import { FileService } from '../services/file.service';
import { FileMode, GraphData } from '../modes/file.mode';
import { GraphEdge } from '../models/graph-edge.model';
import { of } from 'rxjs';

describe('FileMode Integration Tests', () => {
  let component: GraphEditorComponent;
  let fixture: ComponentFixture<GraphEditorComponent>;
  let fileMode: FileMode;
  let graphStateService: GraphStateService;
  let mockFileService: jasmine.SpyObj<FileService>;

  beforeEach(async () => {
    const fileServiceSpy = jasmine.createSpyObj('FileService', ['openGraph', 'saveGraph']);

    await TestBed.configureTestingModule({
      declarations: [GraphEditorComponent],
      providers: [
        GraphStateService,
        PinStateService,
        { provide: FileService, useValue: fileServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GraphEditorComponent);
    component = fixture.componentInstance;
    graphStateService = TestBed.inject(GraphStateService);
    mockFileService = TestBed.inject(FileService) as jasmine.SpyObj<FileService>;
    fileMode = new FileMode(graphStateService, TestBed.inject(PinStateService), mockFileService);
  });

  describe('File Load and Arrow Rendering Integration', () => {
    it('should preserve arrow markers when loading a graph with directional connections', async () => {
      // Arrange: Create test graph data with directional connection
      const testGraphData: GraphData = {
        version: '1.0',
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          name: 'Test Graph with Arrows'
        },
        nodes: [
          {
            id: 'source',
            type: 'component',
            x: 100,
            y: 100,
            width: 80,
            height: 60,
            label: 'Source Node',
            pins: [{ x: 80, y: 30, name: 'OUT' }]
          },
          {
            id: 'target',
            type: 'component',
            x: 300,
            y: 100,
            width: 80,
            height: 60,
            label: 'Target Node',
            pins: [{ x: 0, y: 30, name: 'IN' }]
          }
        ],
        pins: [], // Simplified for this test
        connections: [
          {
            id: 'directional_conn',
            from: 'source.OUT',
            to: 'target.IN',
            direction: 'forward',
            color: '#FF0000',
            strokeWidth: 2,
            type: 'signal'
          }
        ]
      };

      // Act: Import the graph data (simulating file load)
      fileMode.importGraphData(testGraphData);

      // Wait for Angular change detection
      fixture.detectChanges();
      await fixture.whenStable();

      // Assert: Verify the connection was added to GraphStateService with direction preserved
      const edges = graphStateService.getEdges();
      expect(edges).toHaveSize(1);
      const importedEdge = edges[0];
      
      expect(importedEdge.id).toBe('directional_conn');
      expect(importedEdge.from).toBe('source.OUT');
      expect(importedEdge.to).toBe('target.IN');
      expect(importedEdge.direction).toBe('forward');
      expect(importedEdge.color).toBe('#FF0000');
      expect(importedEdge.strokeWidth).toBe(2);

      // Verify arrow marker rendering
      const markerEnd = component.getMarkerEnd(importedEdge);
      expect(markerEnd).toBe('url(#arrowhead)');
      
      const markerStart = component.getMarkerStart(importedEdge);
      expect(markerStart).toBe('');
    });

    it('should handle bidirectional connections correctly after file load', async () => {
      // Arrange: Create test data with bidirectional connection
      const testGraphData: GraphData = {
        version: '1.0',
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          name: 'Bidirectional Test'
        },
        nodes: [],
        pins: [],
        connections: [
          {
            id: 'bidirectional_conn',
            from: 'node1.PIN1',
            to: 'node2.PIN2',
            direction: 'bidirectional',
            type: 'data'
          }
        ]
      };

      // Act: Import the graph data
      fileMode.importGraphData(testGraphData);
      fixture.detectChanges();

      // Assert: Verify bidirectional arrows
      const edges = graphStateService.getEdges();
      const importedEdge = edges[0];
      
      expect(importedEdge.direction).toBe('bidirectional');
      
      const markerEnd = component.getMarkerEnd(importedEdge);
      const markerStart = component.getMarkerStart(importedEdge);
      
      expect(markerEnd).toBe('url(#arrowhead)');
      expect(markerStart).toBe('url(#arrowhead-start)');
    });

    it('should handle directionless connections correctly after file load', async () => {
      // Arrange: Create test data with directionless connection (no direction property)
      const testGraphData: GraphData = {
        version: '1.0',
        metadata: {
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          name: 'Directionless Test'
        },
        nodes: [],
        pins: [],
        connections: [
          {
            id: 'directionless_conn',
            from: 'node1.PIN1',
            to: 'node2.PIN2',
            type: 'signal'
            // Note: no direction property
          }
        ]
      };

      // Act: Import the graph data
      fileMode.importGraphData(testGraphData);
      fixture.detectChanges();

      // Assert: Verify no arrows are rendered
      const edges = graphStateService.getEdges();
      const importedEdge = edges[0];
      
      expect(importedEdge.direction).toBeUndefined();
      
      const markerEnd = component.getMarkerEnd(importedEdge);
      const markerStart = component.getMarkerStart(importedEdge);
      
      expect(markerEnd).toBe('');
      expect(markerStart).toBe('');
    });

    it('should preserve all connection properties through export/import cycle', async () => {
      // Arrange: Start with a connection that has all properties
      const originalConnection: GraphEdge = {
        id: 'full_featured_conn',
        from: 'node1.OUT',
        to: 'node2.IN',
        direction: 'backward',
        color: '#00FF00',
        strokeWidth: 4,
        strokeStyle: 'dashed',
        type: 'power',
        label: 'Power Line',
        description: 'Main power connection',
        tags: ['critical', 'power']
      };

      // Add the connection to the graph state
      graphStateService.addEdge(originalConnection);

      // Act: Export and then import
      const exportedData = fileMode.exportGraphData();
      
      // Clear the graph and import the exported data
      graphStateService.deleteNodes(graphStateService.getNodes().map(n => n.id));
      fileMode.importGraphData(exportedData);
      
      fixture.detectChanges();

      // Assert: All properties should be preserved
      const edges = graphStateService.getEdges();
      const reimportedEdge = edges.find(e => e.id === 'full_featured_conn');
      
      expect(reimportedEdge).toBeDefined();
      expect(reimportedEdge!.direction).toBe('backward');
      expect(reimportedEdge!.color).toBe('#00FF00');
      expect(reimportedEdge!.strokeWidth).toBe(4);
      expect(reimportedEdge!.strokeStyle).toBe('dashed');
      expect(reimportedEdge!.type).toBe('power');
      expect(reimportedEdge!.label).toBe('Power Line');
      expect(reimportedEdge!.description).toBe('Main power connection');
      expect(reimportedEdge!.tags).toEqual(['critical', 'power']);

      // Verify arrow rendering for backward direction
      const markerEnd = component.getMarkerEnd(reimportedEdge!);
      const markerStart = component.getMarkerStart(reimportedEdge!);
      
      expect(markerEnd).toBe('');
      expect(markerStart).toBe('url(#arrowhead-start)');
    });

    it('should maintain arrow markers after multiple save/load cycles', async () => {
      // This test simulates the user's workflow: save -> load -> save -> load
      
      // Arrange: Create initial connection with forward direction
      const initialConnection: GraphEdge = {
        id: 'persistent_arrow',
        from: 'a.out',
        to: 'b.in',
        direction: 'forward',
        color: '#0000FF'
      };

      graphStateService.addEdge(initialConnection);

      // Act & Assert: Multiple export/import cycles
      for (let cycle = 1; cycle <= 3; cycle++) {
        // Export current state
        const exportedData = fileMode.exportGraphData();
        
        // Verify export includes direction
        const exportedConnection = exportedData.connections.find(c => c.id === 'persistent_arrow');
        expect(exportedConnection?.direction).toBe('forward');
        
        // Clear and reimport
        graphStateService.deleteNodes(graphStateService.getNodes().map(n => n.id));
        fileMode.importGraphData(exportedData);
        
        fixture.detectChanges();
        
        // Verify reimport preserves direction and arrow markers
        const edges = graphStateService.getEdges();
        const reimportedEdge = edges.find(e => e.id === 'persistent_arrow');
        
        expect(reimportedEdge?.direction).toBe('forward');
        
        const markerEnd = component.getMarkerEnd(reimportedEdge!);
        expect(markerEnd).toBe('url(#arrowhead)');
        
        console.log(`Cycle ${cycle}: Direction and arrow markers preserved`);
      }
    });
  });

  describe('Real File Operation Simulation', () => {
    it('should handle actual file content as provided by user', async () => {
      // This test uses the exact structure that would come from a real JSON file
      const realFileContent = {
        "version": "1.0",
        "metadata": {
          "created": "2024-01-01T00:00:00.000Z",
          "modified": "2024-01-01T00:00:00.000Z",
          "name": "Real User File"
        },
        "nodes": [
          {
            "id": "mic1",
            "type": "component", 
            "x": 100,
            "y": 200,
            "width": 40,
            "height": 40,
            "label": "MIC1",
            "pins": [{"x": 40, "y": 20, "name": "OUT"}]
          },
          {
            "id": "r1",
            "type": "resistor",
            "x": 200, 
            "y": 220,
            "width": 60,
            "height": 20,
            "label": "10kΩ",
            "pins": [{"x": 0, "y": 10, "name": "A"}]
          }
        ],
        "pins": [],
        "connections": [
          {
            "id": "conn_4",
            "from": "mic1.OUT",
            "to": "r1.A",
            "type": "signal",
            "direction": "forward",
            "color": "#2196F3",
            "strokeWidth": 2
          }
        ]
      };

      // Mock file service to return this data
      mockFileService.openGraph.and.returnValue(Promise.resolve(realFileContent as GraphData));

      // Act: Simulate opening the file
      const loadedData = await mockFileService.openGraph();
      if (loadedData) {
        fileMode.importGraphData(loadedData);
      }
      
      fixture.detectChanges();

      // Assert: Connection should be imported with all properties
      const edges = graphStateService.getEdges();
      const connection = edges.find(e => e.id === 'conn_4');
      
      expect(connection).toBeDefined();
      expect(connection!.from).toBe('mic1.OUT');
      expect(connection!.to).toBe('r1.A');
      expect(connection!.direction).toBe('forward');
      expect(connection!.color).toBe('#2196F3');
      expect(connection!.strokeWidth).toBe(2);

      // Verify arrow marker would be rendered
      const markerEnd = component.getMarkerEnd(connection!);
      expect(markerEnd).toBe('url(#arrowhead)');
      
      console.log('Real file content test passed - direction and arrow preserved');
    });
  });
});