# LeWM-CLI Specification Sheet

**LeWM Command Line Interface for Programmatic Graph Creation**

Version: 1.1.0  
Status: Enhanced Implementation Specification

## Overview

LeWM-CLI provides a command-line interface for programmatically creating, editing, and managing graph-based diagrams including circuit diagrams, flowcharts, network diagrams, and other node-based visualizations. The CLI operates on the same data models as the LeWM Angular application, ensuring full compatibility and interoperability.

The CLI is built around three core architectural concepts with clear separation of concerns:

## Architecture: Three-Domain Model

### 1. **NODES** - Container Elements
Nodes are the primary container elements that represent components, processes, or entities in your graph. They provide spatial positioning and serve as hosts for pins.

### 2. **PINS** - Connection Interfaces  
Pins are the connection interfaces attached to nodes. They define how data, signals, or relationships can flow into and out of nodes. Each pin has specific properties, positioning, and data types.

### 3. **CONNECTIONS** - Functional Relationships
Connections are functional relationships between pins that can contain methods, transformations, and computed values. They represent not just visual links, but active functional relationships that can process, transform, or operate on data flowing between pins.

### Command Structure
```
lewm <domain> <operation> [options] [arguments]

Domains:  node | pin | connection | project
Operations: add | edit | delete | list | bulk-add | apply-function
```

## Installation & Setup

```bash
# Install LeWM-CLI globally
npm install -g lewm-cli

# Initialize a new project
lewm project init [project-name]

# Set working directory (optional, defaults to current directory)
lewm project config workspace /path/to/project
```

---

## DOMAIN 1: NODE OPERATIONS

Nodes are container elements that represent components, processes, or entities. They provide spatial positioning and serve as hosts for pins.

### Core Node Commands

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
# Add basic resistor component
lewm node add circuit-resistor --id R1 --label "1kΩ Resistor" --x 100 --y 200

# Add IC chip with custom dimensions
lewm node add ic-chip --id U1 --label "Op-Amp" --x 300 --y 150 --width 80 --height 60

# Add processing node
lewm node add process --label "Signal Filter" --x 50 --y 100
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

### Node Templates & Types

#### `lewm node template list`
List available node templates.

#### `lewm node template create <name> [options]`
Create custom node template.

```bash
lewm node template create amplifier-stage --width 100 --height 60 --default-pins config.json
```

---

## DOMAIN 2: PIN OPERATIONS

Pins are connection interfaces attached to nodes. They define how data, signals, or relationships can flow into and out of nodes.

### Core Pin Commands

#### `lewm pin add <node-id> [options]`
Add pins to a node.

**Basic Syntax:**
```bash
lewm pin add <node-id> --name <n> --side <side> [options]
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

# Add pin with specific positioning and data type
lewm pin add U1 --name OUT --side right --offset 0.5 --type output --data-type analog

# Add styled pin
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

---

## DOMAIN 3: CONNECTION OPERATIONS

Connections are functional relationships between pins that can contain methods, transformations, and computed values. They represent active functional relationships, not just visual links.

### Core Connection Commands

#### `lewm connection add <from> <to> [options]`
Create a functional connection between two pins.

**Basic Syntax:**
```bash
lewm connection add <node-id>.<pin-name> <node-id>.<pin-name> [options]
```

**Options:**
- `--label <string>`: Connection display name
- `--direction <forward|backward|bidirectional>`: Connection flow direction
- `--type <signal|power|data|control|custom>`: Connection category
- `--function <function-name>`: Apply transformation function
- `--color <string>`: Connection line color
- `--width <number>`: Line stroke width
- `--style <solid|dashed|dotted>`: Line style

**Examples:**
```bash
# Basic connection
lewm connection add R1.A U1.INPUT

# Connection with function
lewm connection add U1.OUT R2.A --function amplify --gain 2.5

# Power connection with properties
lewm connection add VCC.POWER U1.VCC --type power --label "Power Supply" --color "#FF0000" --width 3
```

### Functional Connections

#### `lewm connection apply-function <from> <to> <function> [options]`
Apply transformation functions to connections.

**Built-in Functions:**
- `amplify`: Signal amplification with gain parameter
- `filter`: Signal filtering (low-pass, high-pass, band-pass)
- `convert`: Unit/type conversion
- `transform`: Mathematical transformation
- `gate`: Logic gate operations
- `delay`: Time delay operations

**Examples:**
```bash
# Apply amplification
lewm connection apply-function U1.OUT R2.A amplify --gain 2.5 --bandwidth 1000

# Apply filtering
lewm connection apply-function INPUT.signal FILTER.in filter --type low-pass --cutoff 1000

# Apply conversion
lewm connection apply-function ADC.out PROCESSOR.in convert --from analog --to digital --resolution 12

# Custom mathematical transformation
lewm connection apply-function A.out B.in transform --formula "x * 2 + 1"
```

#### `lewm connection add-value <from> <to> <key> <value> [options]`
Add computed values and metadata to connections.

**Options:**
- `--type <string|number|decimal|integer|boolean|calculated>`: Value type
- `--unit-type <voltage|current|resistance|...>`: Unit category
- `--unit-symbol <string>`: Unit symbol
- `--description <string>`: Value description
- `--formula <string>`: Calculation formula for computed values

**Examples:**
```bash
# Add measured voltage
lewm connection add-value R1.A U1.INPUT voltage 5.0 --type decimal --unit-type voltage --unit-symbol V

# Add calculated power
lewm connection add-value R1.A U1.INPUT power 0.5 --type calculated --formula "V * I" --unit-type power --unit-symbol W

# Add signal characteristics
lewm connection add-value U1.OUT LOAD.IN frequency 1000 --unit-type frequency --unit-symbol Hz
lewm connection add-value U1.OUT LOAD.IN amplitude 3.3 --unit-type voltage --unit-symbol V
```

### Connection Functions Library

#### `lewm connection function list`
List available transformation functions.

#### `lewm connection function create <name> [options]`
Create custom transformation function.

```bash
lewm connection function create custom-filter --type signal-processing --formula "lowpass(x, cutoff)" --parameters "cutoff:number"
```

#### `lewm connection list [options]`
List all connections with their functions.

```bash
lewm connection list
lewm connection list --type power
lewm connection list --format table --include-values --include-functions
```

#### `lewm connection edit <from> <to> [options]`
Modify existing connection or its function.

```bash
lewm connection edit R1.A U1.INPUT --color "#00FF00" --label "Modified Connection"
lewm connection edit R1.A U1.INPUT --function amplify --gain 3.0
```

#### `lewm connection delete <from> <to>`
Remove a connection and its functions.

```bash
lewm connection delete R1.A U1.INPUT
```

---

## PROJECT MANAGEMENT

### Core Project Commands

#### `lewm project init [name]`
Initialize a new LeWM project.

```bash
# Create new project
lewm project init my-circuit

# Create project in current directory
lewm project init .
```

#### `lewm project load <file>`
Load an existing LeWM project file.

```bash
lewm project load circuit.lewm
lewm project load --format json data.json
```

#### `lewm project save [file] [options]`
Save current project state.

```bash
lewm project save circuit.lewm
lewm project save --format json --output data.json
lewm project save --format svg --output diagram.svg
```

## Advanced Features

### Batch Operations

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

# Create functional connections
connection add R1.B U1.IN+ --type signal --label "Input Signal"
connection add U1.OUT R2.A --type signal --label "Output Signal" --function amplify --gain 2.0
```

### Project Import/Export

#### `lewm project export [options]`
Export project in various formats.

```bash
lewm project export --format json --output circuit.json
lewm project export --format svg --output diagram.svg
lewm project export --format png --output image.png --width 800 --height 600
lewm project export --format netlist --output circuit.net
```

#### `lewm project import <file> [options]`
Import from external formats.

```bash
lewm project import spice-netlist.cir --format spice
lewm project import kicad-schematic.sch --format kicad
lewm project import existing-project.json --format lewm-json
```

### Validation & Analysis

#### `lewm project validate [options]`
Validate project integrity.

```bash
lewm project validate
lewm project validate --strict --report validation.txt
```

#### `lewm project analyze [options]`
Analyze project for optimization opportunities.

```bash
lewm project analyze --connections --routing --layout
lewm project analyze --output analysis.json
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
  "version": "1.1.0",
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
  },
  "connectionFunctions": {
    "amplify": {
      "parameters": ["gain", "bandwidth"],
      "description": "Amplifies signal by specified gain"
    },
    "filter": {
      "parameters": ["type", "cutoff", "order"],
      "description": "Filters signal (low-pass, high-pass, band-pass)"
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
      "function": {
        "name": "amplify",
        "parameters": {
          "gain": 2.5,
          "bandwidth": 1000
        }
      },
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
- `FUNCTION_NOT_FOUND`: Referenced connection function does not exist
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
- **Simulation Integration**: Circuit simulation and analysis with connection functions
- **Version Control**: Git-like versioning for projects
- **Collaboration**: Multi-user project sharing
- **Plugin System**: Custom command extensions
- **Advanced Functions**: ML-based signal processing, custom algorithms

### Extensibility Points
- Custom node types via plugins
- Additional export formats
- External tool integration
- Custom validation rules
- Advanced scripting support
- Custom connection functions
- Integration with simulation engines

## Examples

### Complete Functional Circuit Creation Example
```bash
# Initialize project
lewm project init amplifier-circuit

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

# Create functional connections
lewm connection add VCC.POWER U1.VCC --type power --color "#FF0000"
lewm connection add R1.B U1.IN+ --type signal
lewm connection add U1.OUT R2.A --function amplify --gain 2.5

# Add computed values to connections
lewm connection add-value R1.B U1.IN+ voltage 2.5 --unit-type voltage --unit-symbol V
lewm connection add-value U1.OUT R2.A power 0.25 --type calculated --formula "V²/R" --unit-type power --unit-symbol W

# Save project
lewm project save amplifier.lewm

# Export to SVG with function annotations
lewm project export --format svg --output amplifier.svg --include-functions
```

### Signal Processing Chain Example
```bash
# Create signal processing chain
lewm project init signal-processor

# Add signal input
lewm node add signal-source --id INPUT --label "Audio Input" --x 50 --y 100
lewm pin add INPUT --name signal --side right --type output --data-type analog

# Add filter stage
lewm node add filter --id FILTER --label "Low-Pass Filter" --x 200 --y 100
lewm pin add FILTER --name in --side left --type input --data-type analog
lewm pin add FILTER --name out --side right --type output --data-type analog

# Add amplifier stage
lewm node add amplifier --id AMP --label "Amplifier" --x 350 --y 100
lewm pin add AMP --name in --side left --type input --data-type analog
lewm pin add AMP --name out --side right --type output --data-type analog

# Create functional connections with processing
lewm connection add INPUT.signal FILTER.in --function filter --type low-pass --cutoff 1000
lewm connection add FILTER.out AMP.in --function amplify --gain 3.0 --bandwidth 5000

# Add signal analysis values
lewm connection add-value INPUT.signal FILTER.in frequency 2000 --unit-type frequency --unit-symbol Hz
lewm connection add-value FILTER.out AMP.in amplitude 1.2 --unit-type voltage --unit-symbol V
```

---

**Note**: This enhanced specification represents the domain-separated implementation of LeWM-CLI with functional connection capabilities. The CLI maintains full compatibility with the LeWM Angular application data models while adding powerful functional relationship modeling between pins. Additional features and connection functions will be added based on user feedback and domain-specific requirements.