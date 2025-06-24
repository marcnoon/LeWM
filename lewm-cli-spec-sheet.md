# LeWM-CLI Specification Sheet

**LeWM Command Line Interface for Programmatic Graph Creation**

Version: 1.0.0  
Status: Basic Implementation Specification

## Overview

LeWM-CLI provides a command-line interface for programmatically creating, editing, and managing graph-based diagrams including circuit diagrams, flowcharts, network diagrams, and other node-based visualizations. The CLI operates on the same data models as the LeWM Angular application, ensuring full compatibility and interoperability.

## Core Concepts

### Data Model Alignment
LeWM-CLI operates on the established LeWM data models:
- **GraphNode**: Nodes with properties (id, type, position, dimensions, label, pins)
- **Pin**: Connection points with advanced positioning and styling
- **GraphEdge**: Connections between pins with rich metadata and value systems
- **ConnectionValue**: Typed key-value pairs with comprehensive unit support

### Command Structure
```
lewm <command> [subcommand] [options] [arguments]
```

## Installation & Setup

```bash
# Install LeWM-CLI globally
npm install -g lewm-cli

# Initialize a new project
lewm init [project-name]

# Set working directory (optional, defaults to current directory)
lewm config workspace /path/to/project
```

## Core Commands

### 1. Project Management

#### `lewm init [name]`
Initialize a new LeWM project with default configuration.

```bash
# Create new project
lewm init my-circuit

# Create project in current directory
lewm init .
```

**Output:** Creates `lewm.json` configuration file and project structure.

#### `lewm load <file>`
Load an existing LeWM project file.

```bash
lewm load circuit.lewm
lewm load --format json data.json
```

#### `lewm save [file] [options]`
Save current project state.

```bash
lewm save circuit.lewm
lewm save --format json --output data.json
lewm save --format svg --output diagram.svg
```

### 2. Node Operations

#### `lewm node add <type> [options]`
Add a new node to the graph.

**Basic Syntax:**
```bash
lewm node add <type> --id <id> --label <label> --x <x> --y <y> [options]
```

**Options:**
- `--id <string>`: Unique identifier (auto-generated if not provided)
- `--label <string>`: Display label for the node
- `--x <number>`: X-coordinate position
- `--y <number>`: Y-coordinate position  
- `--width <number>`: Node width (default varies by type)
- `--height <number>`: Node height (default varies by type)
- `--type <string>`: Node type classification

**Examples:**
```bash
# Add basic resistor
lewm node add circuit-resistor --id R1 --label "1kΩ Resistor" --x 100 --y 200

# Add IC chip with custom dimensions
lewm node add ic-chip --id U1 --label "Op-Amp" --x 300 --y 150 --width 80 --height 60

# Add basic node with minimal parameters
lewm node add basic --label "Process Step" --x 50 --y 100
```

#### `lewm node list [options]`
List all nodes in the current project.

```bash
lewm node list
lewm node list --type circuit-resistor
lewm node list --format table
```

#### `lewm node edit <id> [options]`
Modify an existing node.

```bash
lewm node edit R1 --label "2.2kΩ Resistor" --x 120
lewm node edit U1 --width 100 --height 80
```

#### `lewm node delete <id>`
Remove a node and all associated pins and connections.

```bash
lewm node delete R1
```

### 3. Pin Operations

#### `lewm pin add <node-id> [options]`
Add pins to a node.

**Basic Syntax:**
```bash
lewm pin add <node-id> --name <name> --side <side> [options]
```

**Options:**
- `--name <string>`: Pin name/label
- `--side <top|right|bottom|left>`: Node side for pin placement
- `--offset <number>`: Position along side (0.0-1.0, default: auto-distribute)
- `--type <input|output|bidirectional>`: Pin functionality type
- `--data-type <string>`: Data type for the pin (optional)
- `--size <number>`: Pin visual size (default: 8)
- `--color <string>`: Pin color (default: #4CAF50)
- `--shape <circle|square|triangle|diamond>`: Pin shape (default: circle)

**Examples:**
```bash
# Add single pin with auto-positioning
lewm pin add U1 --name VCC --side top --type input

# Add multiple pins with specific positioning
lewm pin add U1 --name GND --side bottom --offset 0.2 --type input
lewm pin add U1 --name OUT --side right --offset 0.5 --type output

# Add pin with styling
lewm pin add U1 --name CLK --side left --type input --color "#FF5722" --shape square --size 10
```

#### `lewm pin bulk-add <node-id> [options]`
Add multiple pins in a single command.

```bash
# Add multiple pins to one side
lewm pin bulk-add U1 --side top --names "VCC,VDD,GND" --type input

# Add pins with JSON configuration
lewm pin bulk-add U1 --config pins.json
```

**pins.json example:**
```json
{
  "pins": [
    {
      "name": "VCC",
      "side": "top",
      "offset": 0.2,
      "type": "input",
      "dataType": "power"
    },
    {
      "name": "GND", 
      "side": "top",
      "offset": 0.8,
      "type": "input",
      "dataType": "power"
    },
    {
      "name": "OUT",
      "side": "right", 
      "offset": 0.5,
      "type": "output",
      "dataType": "signal"
    }
  ]
}
```

#### `lewm pin list [node-id] [options]`
List pins for specified node(s).

```bash
lewm pin list U1
lewm pin list --all
lewm pin list --format table
```

#### `lewm pin edit <node-id> <pin-name> [options]`
Modify an existing pin.

```bash
lewm pin edit U1 VCC --color "#FF0000" --size 12
lewm pin edit U1 OUT --offset 0.3 --type bidirectional
```

#### `lewm pin delete <node-id> <pin-name>`
Remove a pin and all associated connections.

```bash
lewm pin delete U1 VCC
```

### 4. Connection Operations

#### `lewm connect <from> <to> [options]`
Create a connection between two pins.

**Basic Syntax:**
```bash
lewm connect <node-id>.<pin-name> <node-id>.<pin-name> [options]
```

**Options:**
- `--label <string>`: Connection display name
- `--direction <forward|backward|bidirectional>`: Connection flow direction (default: forward)
- `--type <signal|power|data|control|custom>`: Connection category (default: signal)
- `--color <string>`: Connection line color
- `--width <number>`: Line stroke width (default: 2)
- `--style <solid|dashed|dotted>`: Line style (default: solid)
- `--values <json>`: Connection values and metadata

**Examples:**
```bash
# Basic connection
lewm connect R1.A U1.INPUT

# Connection with properties
lewm connect U1.VCC VCC.POWER --type power --label "Power Supply" --color "#FF0000" --width 3

# Connection with values
lewm connect R1.A U1.INPUT --values '{"voltage": {"value": 5.0, "unit": "V"}, "current": {"value": 0.1, "unit": "A"}}'
```

#### `lewm connection add-value <from> <to> <key> <value> [options]`
Add metadata values to an existing connection.

**Options:**
- `--type <string|number|decimal|integer|boolean|calculated>`: Value type (default: string)
- `--unit-type <voltage|current|resistance|...>`: Unit category
- `--unit-symbol <string>`: Unit symbol (e.g., "V", "A", "Ω")
- `--description <string>`: Value description

**Examples:**
```bash
# Add voltage measurement
lewm connection add-value R1.A U1.INPUT voltage 5.0 --type decimal --unit-type voltage --unit-symbol V

# Add calculated value
lewm connection add-value R1.A U1.INPUT power 0.5 --type calculated --unit-type power --unit-symbol W --description "P = V * I"

# Add string metadata
lewm connection add-value R1.A U1.INPUT signal_name "AUDIO_IN" --type string --description "Audio input signal"
```

#### `lewm connection list [options]`
List all connections in the project.

```bash
lewm connection list
lewm connection list --type power
lewm connection list --format table --include-values
```

#### `lewm connection edit <from> <to> [options]`
Modify an existing connection.

```bash
lewm connection edit R1.A U1.INPUT --color "#00FF00" --label "Modified Connection"
lewm connection edit R1.A U1.INPUT --direction bidirectional --type data
```

#### `lewm connection delete <from> <to>`
Remove a connection.

```bash
lewm connection delete R1.A U1.INPUT
```

## Advanced Features

### 5. Batch Operations

#### `lewm batch <script-file>`
Execute multiple commands from a script file.

**batch-script.lewm example:**
```
# Add components for amplifier circuit
node add ic-chip --id U1 --label "Op-Amp" --x 200 --y 150
node add circuit-resistor --id R1 --label "1kΩ" --x 50 --y 100  
node add circuit-resistor --id R2 --label "10kΩ" --x 50 --y 200

# Add pins
pin add U1 --name VCC --side top --type input
pin add U1 --name GND --side bottom --type input
pin add U1 --name IN+ --side left --offset 0.3 --type input
pin add U1 --name IN- --side left --offset 0.7 --type input
pin add U1 --name OUT --side right --type output

pin bulk-add R1 --side left --names "A" --type bidirectional
pin bulk-add R1 --side right --names "B" --type bidirectional

# Create connections
connect R1.B U1.IN+ --type signal --label "Input Signal"
connect U1.OUT R2.A --type signal --label "Output Signal"
```

### 6. Project Import/Export

#### `lewm export [options]`
Export project in various formats.

```bash
lewm export --format json --output circuit.json
lewm export --format svg --output diagram.svg
lewm export --format png --output image.png --width 800 --height 600
lewm export --format netlist --output circuit.net
```

#### `lewm import <file> [options]`
Import from external formats.

```bash
lewm import spice-netlist.cir --format spice
lewm import kicad-schematic.sch --format kicad
lewm import existing-project.json --format lewm-json
```

### 7. Validation & Analysis

#### `lewm validate [options]`
Validate project integrity.

```bash
lewm validate
lewm validate --strict --report validation.txt
```

#### `lewm analyze [options]`
Analyze project for optimization opportunities.

```bash
lewm analyze --connections --routing --layout
lewm analyze --output analysis.json
```

## Configuration

### Global Configuration
```bash
# Set default values
lewm config node.default-width 80
lewm config node.default-height 60
lewm config pin.default-size 8
lewm config pin.default-color "#4CAF50"
lewm config connection.default-width 2
```

### Project Configuration (lewm.json)
```json
{
  "version": "1.0.0",
  "name": "My Circuit Project",
  "defaults": {
    "node": {
      "width": 80,
      "height": 60
    },
    "pin": {
      "size": 8,
      "color": "#4CAF50",
      "shape": "circle"
    },
    "connection": {
      "strokeWidth": 2,
      "color": "#2196F3",
      "type": "signal"
    }
  },
  "nodeTypes": {
    "circuit-resistor": {
      "width": 60,
      "height": 20,
      "defaultPins": [
        {"name": "A", "side": "left"},
        {"name": "B", "side": "right"}
      ]
    },
    "ic-chip": {
      "width": 80,
      "height": 60,
      "defaultPins": []
    }
  }
}
```

## Output Formats

### JSON Export Format
```json
{
  "nodes": [
    {
      "id": "U1",
      "type": "ic-chip", 
      "x": 200,
      "y": 150,
      "width": 80,
      "height": 60,
      "label": "Op-Amp",
      "pins": [
        {
          "id": "U1.VCC",
          "nodeId": "U1",
          "label": "VCC",
          "position": {
            "x": 40,
            "y": 0,
            "side": "top",
            "offset": 0.5
          },
          "textStyle": {
            "fontFamily": "Arial, sans-serif",
            "fontSize": 12,
            "fontWeight": "normal",
            "color": "#000000",
            "orientation": 0,
            "alignment": "center",
            "verticalAlignment": "middle",
            "offset": {"x": 0, "y": 0}
          },
          "pinStyle": {
            "size": 8,
            "color": "#4CAF50",
            "shape": "circle",
            "borderWidth": 1,
            "borderColor": "#2E7D32"
          },
          "isInput": true,
          "isOutput": false,
          "dataType": "power"
        }
      ]
    }
  ],
  "connections": [
    {
      "id": "conn_1",
      "from": "R1.B",
      "to": "U1.IN+",
      "label": "Input Signal",
      "direction": "forward",
      "type": "signal",
      "color": "#2196F3",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "values": [
        {
          "key": "voltage",
          "value": 5.0,
          "valueType": "decimal",
          "unitType": "voltage",
          "unitSymbol": "V",
          "description": "Operating voltage"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Error Handling

### Common Error Codes
- `NODE_NOT_FOUND`: Referenced node ID does not exist
- `PIN_NOT_FOUND`: Referenced pin does not exist
- `DUPLICATE_ID`: Attempting to create node/pin with existing ID
- `INVALID_POSITION`: Coordinates outside valid range
- `INVALID_CONNECTION`: Cannot connect incompatible pin types
- `VALIDATION_ERROR`: Project fails validation checks

### Error Output Format
```json
{
  "error": {
    "code": "NODE_NOT_FOUND",
    "message": "Node with ID 'U1' does not exist",
    "command": "lewm pin add U1 --name VCC --side top",
    "suggestions": [
      "Check available node IDs with: lewm node list",
      "Create the node first with: lewm node add"
    ]
  }
}
```

## Future Extensions

### Planned Features
- **Layout Commands**: Automatic node arrangement and alignment
- **Routing Commands**: Advanced connection path optimization
- **Template System**: Reusable component templates
- **Simulation Integration**: Circuit simulation and analysis
- **Version Control**: Git-like versioning for projects
- **Collaboration**: Multi-user project sharing
- **Plugin System**: Custom command extensions

### Extensibility Points
- Custom node types via plugins
- Additional export formats
- External tool integration
- Custom validation rules
- Advanced scripting support

## Examples

### Complete Circuit Creation Example
```bash
# Initialize project
lewm init amplifier-circuit

# Add power supply
lewm node add power-supply --id VCC --label "+5V" --x 50 --y 50
lewm pin add VCC --name POWER --side right --type output

# Add op-amp
lewm node add ic-chip --id U1 --label "LM358" --x 200 --y 150
lewm pin bulk-add U1 --side top --names "VCC" --type input
lewm pin bulk-add U1 --side bottom --names "GND" --type input  
lewm pin bulk-add U1 --side left --names "IN+,IN-" --type input
lewm pin bulk-add U1 --side right --names "OUT" --type output

# Add resistors
lewm node add circuit-resistor --id R1 --label "1kΩ" --x 50 --y 150
lewm pin bulk-add R1 --names "A,B" --side "left,right"

# Create connections
lewm connect VCC.POWER U1.VCC --type power --color "#FF0000"
lewm connect R1.B U1.IN+ --type signal
lewm connection add-value R1.B U1.IN+ voltage 2.5 --unit-type voltage --unit-symbol V

# Save project
lewm save amplifier.lewm

# Export to SVG
lewm export --format svg --output amplifier.svg
```

---

**Note**: This specification represents the basic implementation of LeWM-CLI. Additional features and commands will be added based on user feedback and requirements. The CLI maintains full compatibility with the LeWM Angular application data models and project files.