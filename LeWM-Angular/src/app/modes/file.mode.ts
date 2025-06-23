import { GraphMode } from '../interfaces/graph-mode.interface';
import { GraphStateService } from '../services/graph-state.service';
import { PinStateService } from '../services/pin-state.service';
import { FileService } from '../services/file.service';
import { DEFAULT_PIN_TEXT_STYLE } from '../interfaces/pin.interface';

export interface GraphData {
  version: string;
  metadata: {
    created: string;
    modified: string;
    name: string;
    description?: string;
  };
  nodes: any[];
  pins: any[];
  connections: any[];
}

export class FileMode implements GraphMode {
  name = 'file';
  displayName = 'File';
  isActive = false;
  selectedPins: Set<string> = new Set();
  
  private componentRef: any = null;

  constructor(
    private graphState: GraphStateService,
    private pinState: PinStateService,
    private fileService: FileService
  ) {}

  setComponentRef(component: any): void {
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

  handleNodeClick(node: any, event: MouseEvent): boolean {
    // In file mode, clicking nodes selects them for export
    return false;
  }

  handlePinClick(node: any, pin: any, event: MouseEvent): boolean {
    return false;
  }

  handleCanvasClick(event: MouseEvent): boolean {
    return false;
  }

  handleMouseMove(event: MouseEvent): boolean {
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

  renderOverlay(canvas: SVGElement): void {
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
        id: node.id,
        type: node.type || 'basic',
        label: node.label,
        position: { x: node.x, y: node.y },
        size: { width: node.width, height: node.height },
        style: {}
      })),
      pins: pins.map(pin => ({
        id: pin.id,
        nodeId: pin.nodeId,
        name: pin.name || pin.label,
        position: pin.position,
        type: pin.pinType || 'input',
        style: pin.pinStyle || {}
      })),
      connections: connections.map((conn: any) => ({
        id: conn.id,
        source: {
          nodeId: conn.source.nodeId,
          pinId: conn.source.pinId
        },
        target: {
          nodeId: conn.target.nodeId,
          pinId: conn.target.pinId
        },
        type: conn.type || 'bezier',
        style: conn.style || {}
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
    data.nodes.forEach(node => {
      this.graphState.addNode({
        id: node.id,
        x: node.position.x,
        y: node.position.y,
        width: node.size.width,
        height: node.size.height,
        label: node.label,
        type: node.type,
        pins: [] // Pins will be added separately
      });
    });

    // 2. Import pins
    data.pins.forEach(pin => {
      // Add pin to node
      const nodes = this.graphState.getNodes();
      const node = nodes.find(n => n.id === pin.nodeId);
      if (node) {
        const updatedNode = {
          ...node,
          pins: [...(node.pins || []), {
            name: pin.name,
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
          label: pin.name,
          position: pin.position,
          pinType: pin.type,
          pinStyle: pin.style,
          textStyle: { ...DEFAULT_PIN_TEXT_STYLE },
          isInput: pin.type === 'input' || pin.type === 'bidirectional',
          isOutput: pin.type === 'output' || pin.type === 'bidirectional',
          pinNumber: '',
          signalName: '',
          pinSize: 4,
          pinColor: '#000000',
          showPinNumber: false
        });
      }
    });

    // 3. Import connections
    data.connections.forEach(conn => {
      // Use GraphStateService to add edge
      const sourcePinName = conn.source.pinId.split('.')[1];
      const targetPinName = conn.target.pinId.split('.')[1];
      
      this.graphState.addEdge({
        id: conn.id,
        from: `${conn.source.nodeId}.${sourcePinName}`,
        to: `${conn.target.nodeId}.${targetPinName}`
      });
    });

    console.log(`Imported graph: ${data.nodes.length} nodes, ${data.pins.length} pins, ${data.connections.length} connections`);
  }

  private getAllPins(): any[] {
    // Get pins from nodes in GraphStateService
    const nodes = this.graphState.getNodes();
    const pins: any[] = [];

    nodes.forEach(node => {
      if (node.pins) {
        node.pins.forEach((pin: any) => {
          pins.push({
            id: `${node.id}.${pin.name}`,
            nodeId: node.id,
            name: pin.name,
            position: {
              side: pin.side || 'left',
              offset: pin.offset || 0.5,
              x: pin.x,
              y: pin.y
            },
            pinType: pin.type || 'input',
            pinStyle: pin.style || {}
          });
        });
      }
    });

    return pins;
  }

  private getConnections(): any[] {
    const edges = this.graphState.getEdges();
    return edges.map(edge => {
      // Parse the from and to strings to extract node and pin info
      const [sourceNodeId, sourcePinName] = edge.from.split('.');
      const [targetNodeId, targetPinName] = edge.to.split('.');
      
      return {
        id: edge.id,
        source: {
          nodeId: sourceNodeId,
          pinId: edge.from
        },
        target: {
          nodeId: targetNodeId,
          pinId: edge.to
        },
        type: 'bezier',
        style: {}
      };
    });
  }
}