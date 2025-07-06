import { GraphEditorComponent } from '../components/graph-editor/graph-editor.component';
import { GraphMode } from '../interfaces/graph-mode.interface';
import { GraphStateService } from '../services/graph-state.service';
import { PinStateService } from '../services/pin-state.service';
import { FileService } from '../services/file.service';
import { DEFAULT_PIN_TEXT_STYLE, LegacyPin, Pin } from '../interfaces/pin.interface';
import { GraphNode } from '../models/graph-node.model';
import { GraphEdge, ConnectionType } from '../models/graph-edge.model';


export interface GraphData {
  version: string;
  metadata: {
    created: string;
    modified: string;
    name: string;
    description?: string;
  };
  nodes: GraphNode[];
  pins: Pin[];
  connections: GraphEdge[];
}

export class FileMode implements GraphMode {
  name = 'file';
  displayName = 'File';
  isActive = false;
  selectedPins = new Set<string>();
  
  private componentRef: GraphEditorComponent | null = null;

  constructor(
    private graphState: GraphStateService,
    private pinState: PinStateService,
    private fileService: FileService
  ) {}

  setComponentRef(component: GraphEditorComponent): void {
    this.componentRef = component;
  }

  activate(): void {
    console.log('File mode activated');
    // Show file toolbar if implemented
  }

  deactivate(): void {
    console.log('File mode deactivated');
    // Hide file toolbar if implemented
  }

  handleNodeClick(): boolean {
    // In file mode, clicking nodes selects them for export
    return false;
  }

  handlePinClick(): boolean {
    return false;
  }

  handleCanvasClick(): boolean {
    return false;
  }

  handleMouseMove(): boolean {
    return false;
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          if (event.shiftKey) {
            this.saveAs();
          } else {
            this.save();
          }
          return true;
        case 'o':
          event.preventDefault();
          this.open();
          return true;
        case 'n':
          event.preventDefault();
          this.newGraph();
          return true;
      }
    }
    return false;
  }

  renderOverlay(): void {
    // No overlay needed for file mode
  }

  getCursor(): string {
    return 'default';
  }

  deleteSelectedPins(): void {
    // Not used in file mode
  }

  // File operations
  async save(): Promise<void> {
    const graphData = this.exportGraphData();
    await this.fileService.saveGraph(graphData);
  }

  async saveAs(): Promise<void> {
    const graphData = this.exportGraphData();
    await this.fileService.saveGraphAs(graphData);
  }

  async open(): Promise<void> {
    const graphData = await this.fileService.openGraph();
    if (graphData) {
      this.importGraphData(graphData);
    }
  }

  async newGraph(): Promise<void> {
    if (confirm('Clear the current graph and start new?')) {
      // Clear all nodes using deleteNodes
      const nodes = this.graphState.getNodes();
      const nodeIds = nodes.map(node => node.id);
      this.graphState.deleteNodes(nodeIds);
      
      // Clear all pins
      this.pinState.clearAll();
    }
  }

  exportGraphData(): GraphData {
    const nodes = this.graphState.getNodes();
    const connections = this.getConnections();
    const pins = this.getAllPins();

    return {
      version: '1.0',
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        name: 'Untitled Graph',
        description: ''
      },
      nodes: nodes.map(node => ({
        ...node,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        style: {}
      })),
      pins: pins.map(pin => ({
        ...pin,
        label: pin.label,
        pinType: pin.pinType,
        pinStyle: pin.pinStyle
      })),
      connections: connections.map((conn: GraphEdge) => ({
        ...conn,
        from: conn.from,
        to: conn.to,
        type: 'bezier' as ConnectionType,
        style: {}
      }))
    };
  }

  importGraphData(data: GraphData): void {
    // Clear existing data using deleteNodes
    const nodes = this.graphState.getNodes();
    const nodeIds = nodes.map(node => node.id);
    this.graphState.deleteNodes(nodeIds);
    this.pinState.clearAll();

    // Import in order: nodes -> pins -> connections
    
    // 1. Import nodes
    data.nodes.forEach((node: GraphNode) => {
      this.graphState.addNode({
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        label: node.label,
        type: node.type,
        pins: [] // Pins will be added separately
      });
    });

    // 2. Import pins
    if (data.pins) {
      data.pins.forEach((pin: Pin) => {
        // Add pin to node
        const nodes = this.graphState.getNodes();
        const node = nodes.find(n => n.id === pin.nodeId);
        if (node) {
          const updatedNode = {
            ...node,
            pins: [...(node.pins || []), {
              name: pin.label,
              x: pin.position.x || 0,
              y: pin.position.y || 0,
              side: pin.position.side,
              offset: pin.position.offset
            }]
          };
          this.graphState.updateNode(pin.nodeId, updatedNode);
          
          // Also sync to PinStateService for pin editing
          this.pinState.importPin({
            ...pin,
            id: pin.id,
            nodeId: pin.nodeId,
            label: pin.label,
            position: pin.position,
            pinType: pin.pinType,
            pinStyle: pin.pinStyle,
            textStyle: { ...DEFAULT_PIN_TEXT_STYLE },
            isInput: pin.pinType === 'input' || pin.pinType === 'bidirectional',
            isOutput: pin.pinType === 'output' || pin.pinType === 'bidirectional',
            pinNumber: '',
            signalName: '',
            pinSize: 4,
            pinColor: '#000000',
            showPinNumber: false
          });
        }
      });
    }

    // 3. Import connections
    if (data.connections) {
      data.connections.forEach((conn: GraphEdge) => {
        // Use GraphStateService to add edge with all properties preserved
        this.graphState.addEdge(conn);
      });
    }

    console.log(`Imported graph: ${data.nodes.length} nodes, ${data.pins?.length || 0} pins, ${data.connections?.length || 0} connections`);
  }

  private getAllPins(): Pin[] {
    // Get pins from nodes in GraphStateService
    const nodes = this.graphState.getNodes();
    const pins: Pin[] = [];

    nodes.forEach(node => {
      if (node.pins) {
        node.pins.forEach((pin: LegacyPin) => {
          pins.push({
            id: `${node.id}.${pin.name}`,
            nodeId: node.id,
            label: pin.name,
            position: {
              side: 'left',
              offset: 0.5,
              x: pin.x,
              y: pin.y
            },
            pinType: 'input',
            pinStyle: {
              size: 8,
              color: '#000000',
              shape: 'circle',
              borderWidth: 1,
              borderColor: '#000000'
            },
            textStyle: DEFAULT_PIN_TEXT_STYLE,
            isInput: true,
            isOutput: false,
            pinNumber: '',
            signalName: '',
            pinSize: 4,
            pinColor: '#000000',
            showPinNumber: false
          });
        });
      }
    });

    return pins;
  }

  private getConnections(): GraphEdge[] {
    const edges = this.graphState.getEdges();
    return edges.map(edge => {
      // Parse the from and to strings to extract node and pin info
      
      return {
        ...edge,
        id: edge.id,
        from: edge.from,
        to: edge.to,
        type: 'bezier' as ConnectionType
      };
    });
  }
}
