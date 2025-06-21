import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getAverage, gcdArray } from './utils.js';

const InteractiveCircuitEditor = () => {
  const [components, setComponents] = useState([
    { id: 'power', type: 'power', x: 100, y: 150, width: 80, height: 60, label: '9V Battery', pins: [{x: 80, y: 20, name: '+9V'}, {x: 80, y: 40, name: 'GND'}] },
    { id: 'reg', type: 'ic', x: 250, y: 150, width: 60, height: 40, label: 'LM7805', pins: [{x: 0, y: 20, name: 'IN'}, {x: 30, y: 40, name: 'GND'}, {x: 60, y: 20, name: 'OUT'}] },
    { id: 'mic1', type: 'component', x: 100, y: 250, width: 40, height: 40, label: 'MIC1', pins: [{x: 40, y: 20, name: 'OUT'}, {x: 20, y: 40, name: 'GND'}] },
    { id: 'r1', type: 'resistor', x: 180, y: 270, width: 60, height: 20, label: '10kΩ', pins: [{x: 0, y: 10, name: 'A'}, {x: 60, y: 10, name: 'B'}] },
    { id: 'amp1', type: 'ic', x: 300, y: 230, width: 80, height: 60, label: 'LM386', pins: [
      {x: 0, y: 15, name: 'GAIN'}, {x: 0, y: 30, name: '-IN'}, {x: 0, y: 45, name: '+IN'},
      {x: 20, y: 60, name: 'GND'}, {x: 40, y: 60, name: 'VCC'}, {x: 60, y: 60, name: 'BYP'},
      {x: 80, y: 45, name: 'OUT'}, {x: 80, y: 15, name: 'VS'}
    ]},
    { id: 'ptt', type: 'switch', x: 450, y: 250, width: 50, height: 30, label: 'PTT', pins: [{x: 0, y: 15, name: '1'}, {x: 50, y: 15, name: '2'}] },
    { id: 'led1', type: 'led', x: 550, y: 250, width: 30, height: 20, label: 'Talk', pins: [{x: 0, y: 10, name: 'A'}, {x: 30, y: 10, name: 'K'}] },
    { id: 'r2', type: 'resistor', x: 600, y: 250, width: 60, height: 20, label: '330Ω', pins: [{x: 0, y: 10, name: 'A'}, {x: 60, y: 10, name: 'B'}] },
  ]);

  const [connections, setConnections] = useState([
    { from: 'power.+9V', to: 'reg.IN' },
    { from: 'power.GND', to: 'reg.GND' },
    { from: 'reg.OUT', to: 'amp1.VCC' },
    { from: 'mic1.OUT', to: 'r1.A' },
    { from: 'r1.B', to: 'amp1.+IN' },
    { from: 'amp1.OUT', to: 'ptt.1' },
    { from: 'ptt.2', to: 'led1.A' },
    { from: 'led1.K', to: 'r2.A' },
  ]);

  const [selectedComponents, setSelectedComponents] = useState(new Set());
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [initialPositions, setInitialPositions] = useState({});
  const svgRef = useRef(null);

  const availableComponents = [
    { type: 'power', label: '9V Battery', width: 80, height: 60 },
    { type: 'ic', label: 'LM386 OpAmp', width: 80, height: 60 },
    { type: 'ic', label: 'NE555 Timer', width: 80, height: 60 },
    { type: 'resistor', label: 'Resistor', width: 60, height: 20 },
    { type: 'capacitor', label: 'Capacitor', width: 40, height: 40 },
    { type: 'led', label: 'LED', width: 30, height: 20 },
    { type: 'switch', label: 'Switch', width: 50, height: 30 },
    { type: 'component', label: 'Microphone', width: 40, height: 40 },
    { type: 'component', label: 'Speaker', width: 50, height: 40 },
  ];

  // Key event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(true);
      }
      // Delete selected components
      if (e.key === 'Delete' && selectedComponents.size > 0) {
        const idsToRemove = Array.from(selectedComponents);
        setComponents(prev => prev.filter(comp => !idsToRemove.includes(comp.id)));
        setConnections(prev => prev.filter(conn => {
          const [fromId] = conn.from.split('.');
          const [toId] = conn.to.split('.');
          return !idsToRemove.includes(fromId) && !idsToRemove.includes(toId);
        }));
        setSelectedComponents(new Set());
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedComponents]);

  // Calculate optimal grid spacing using GCD for component positions
  const calculateOptimalGridSpacing = () => {
    if (components.length < 2) return 20;
    
    const xPositions = components.map(c => c.x).filter(x => x > 0);
    const yPositions = components.map(c => c.y).filter(y => y > 0);
    
    if (xPositions.length === 0 || yPositions.length === 0) return 20;
    
    const xGcd = gcdArray(xPositions);
    const yGcd = gcdArray(yPositions);
    
    const optimalSpacing = Math.max(10, Math.min(40, ((xGcd || 0) + (yGcd || 0)) / 2));
    return Math.round(optimalSpacing) || 20;
  };

  // Check if component is within selection box
  const isComponentInSelectionBox = (comp, box) => {
    if (!box) return false;
    
    const minX = Math.min(box.startX, box.endX);
    const maxX = Math.max(box.startX, box.endX);
    const minY = Math.min(box.startY, box.endY);
    const maxY = Math.max(box.startY, box.endY);
    
    // Check if component rectangle intersects with selection box
    return !(comp.x + comp.width < minX || 
             comp.x > maxX || 
             comp.y + comp.height < minY || 
             comp.y > maxY);
  };

  // Advanced path finding with GCD-based spacing and crossover minimization
  const findOptimalPath = (start, end, obstacles, existingPaths = []) => {
    const grid = calculateOptimalGridSpacing();
    const startGrid = { x: Math.round(start.x / grid), y: Math.round(start.y / grid) };
    const endGrid = { x: Math.round(end.x / grid), y: Math.round(end.y / grid) };
    
    // Calculate crossover penalty zones based on existing paths
    const crossoverZones = new Set();
    existingPaths.forEach(path => {
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = { x: Math.round(path[i].x / grid), y: Math.round(path[i].y / grid) };
        const p2 = { x: Math.round(path[i + 1].x / grid), y: Math.round(path[i + 1].y / grid) };
        
        const dx = Math.sign(p2.x - p1.x);
        const dy = Math.sign(p2.y - p1.y);
        let current = { ...p1 };
        
        while (current.x !== p2.x || current.y !== p2.y) {
          crossoverZones.add(`${current.x},${current.y}`);
          if (current.x !== p2.x) current.x += dx;
          if (current.y !== p2.y) current.y += dy;
        }
      }
    });
    
    // Enhanced heuristic with crossover penalty
    const heuristic = (a, b) => {
      const manhattan = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      const crossoverPenalty = crossoverZones.has(`${a.x},${a.y}`) ? 50 : 0;
      return manhattan + crossoverPenalty;
    };
    
    // A* pathfinding
    const openSet = [{ 
      ...startGrid, 
      g: 0, 
      h: heuristic(startGrid, endGrid), 
      f: heuristic(startGrid, endGrid), 
      path: [startGrid] 
    }];
    const closedSet = new Set();
    
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      
      if (current.x === endGrid.x && current.y === endGrid.y) {
        const path = current.path.map(p => ({ x: p.x * grid, y: p.y * grid }));
        return path;
      }
      
      closedSet.add(`${current.x},${current.y}`);
      
      const neighbors = [
        { x: current.x + 1, y: current.y, cost: 1 },
        { x: current.x - 1, y: current.y, cost: 1 },
        { x: current.x, y: current.y + 1, cost: 1 },
        { x: current.x, y: current.y - 1, cost: 1 },
        { x: current.x + 1, y: current.y + 1, cost: 1.414 },
        { x: current.x - 1, y: current.y - 1, cost: 1.414 },
        { x: current.x + 1, y: current.y - 1, cost: 1.414 },
        { x: current.x - 1, y: current.y + 1, cost: 1.414 }
      ];
      
      for (const neighbor of neighbors) {
        if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;
        
        const isObstacle = obstacles.some(obs => 
          neighbor.x >= Math.round(obs.x / grid) && 
          neighbor.x <= Math.round((obs.x + obs.width) / grid) &&
          neighbor.y >= Math.round(obs.y / grid) && 
          neighbor.y <= Math.round((obs.y + obs.height) / grid)
        );
        
        if (isObstacle) continue;
        
        const g = current.g + neighbor.cost;
        const h = heuristic(neighbor, endGrid);
        const f = g + h;
        
        const existing = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
        if (!existing || g < existing.g) {
          const newPath = [...current.path, { x: neighbor.x, y: neighbor.y }];
          if (existing) {
            existing.g = g;
            existing.f = f;
            existing.path = newPath;
          } else {
            openSet.push({ x: neighbor.x, y: neighbor.y, g, h, f, path: newPath });
          }
        }
      }
      
      if (openSet.length > 200) break;
    }
    
    return [start, end];
  };

  const renderComponent = (comp) => {
    const isSelected = selectedComponents.has(comp.id);
    
    switch (comp.type) {
      case 'power':
        return (
          <g key={comp.id}>
            <rect
              x={comp.x} y={comp.y} width={comp.width} height={comp.height}
              fill={isSelected ? "#4a90e2" : "#f0f0f0"}
              stroke="#333" strokeWidth="2"
              style={{ cursor: 'move' }}
            />
            <text x={comp.x + comp.width/2} y={comp.y + 20} textAnchor="middle" fontSize="10" fontWeight="bold">
              {comp.label}
            </text>
            <text x={comp.x + comp.width/2} y={comp.y + 35} textAnchor="middle" fontSize="8">9V</text>
            <text x={comp.x + comp.width/2} y={comp.y + 50} textAnchor="middle" fontSize="8">Battery</text>
            <circle cx={comp.x + 80} cy={comp.y + 20} r="3" fill="red" />
            <text x={comp.x + 85} y={comp.y + 15} fontSize="8" fill="red">+</text>
            <circle cx={comp.x + 80} cy={comp.y + 40} r="3" fill="black" />
            <text x={comp.x + 85} y={comp.y + 45} fontSize="8">-</text>
          </g>
        );
        
      case 'ic':
        return (
          <g key={comp.id}>
            <rect
              x={comp.x} y={comp.y} width={comp.width} height={comp.height}
              fill={isSelected ? "#4a90e2" : "#333"}
              stroke="#333" strokeWidth="2"
              style={{ cursor: 'move' }}
            />
            <text x={comp.x + comp.width/2} y={comp.y + comp.height/2} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
              {comp.label}
            </text>
            {comp.pins?.map((pin, i) => (
              <g key={i}>
                <circle cx={comp.x + pin.x} cy={comp.y + pin.y} r="2" fill="gold" stroke="#333" />
                <text x={comp.x + pin.x + (pin.x < comp.width/2 ? -15 : 8)} y={comp.y + pin.y + 3} fontSize="6" textAnchor={pin.x < comp.width/2 ? "end" : "start"}>
                  {pin.name}
                </text>
              </g>
            ))}
          </g>
        );
        
      case 'resistor':
        return (
          <g key={comp.id}>
            <rect
              x={comp.x} y={comp.y} width={comp.width} height={comp.height}
              fill={isSelected ? "#4a90e2" : "tan"}
              stroke="#333" strokeWidth="1"
              style={{ cursor: 'move' }}
            />
            <text x={comp.x + comp.width/2} y={comp.y + comp.height/2 + 3} textAnchor="middle" fontSize="8" fontWeight="bold">
              {comp.label}
            </text>
            <line x1={comp.x} y1={comp.y + comp.height/2} x2={comp.x - 10} y2={comp.y + comp.height/2} stroke="#333" strokeWidth="2" />
            <line x1={comp.x + comp.width} y1={comp.y + comp.height/2} x2={comp.x + comp.width + 10} y2={comp.y + comp.height/2} stroke="#333" strokeWidth="2" />
            <circle cx={comp.x} cy={comp.y + comp.height/2} r="2" fill="silver" />
            <circle cx={comp.x + comp.width} cy={comp.y + comp.height/2} r="2" fill="silver" />
          </g>
        );
        
      case 'led':
        return (
          <g key={comp.id}>
            <circle
              cx={comp.x + comp.width/2} cy={comp.y + comp.height/2} r={comp.width/2}
              fill={isSelected ? "#4a90e2" : "#ffcccc"}
              stroke="#333" strokeWidth="2"
              style={{ cursor: 'move' }}
            />
            <text x={comp.x + comp.width/2} y={comp.y + comp.height/2 + 3} textAnchor="middle" fontSize="6" fontWeight="bold">
              LED
            </text>
            <text x={comp.x + comp.width/2} y={comp.y - 5} textAnchor="middle" fontSize="8">
              {comp.label}
            </text>
            <line x1={comp.x} y1={comp.y + comp.height/2} x2={comp.x - 10} y2={comp.y + comp.height/2} stroke="#333" strokeWidth="2" />
            <line x1={comp.x + comp.width} y1={comp.y + comp.height/2} x2={comp.x + comp.width + 10} y2={comp.y + comp.height/2} stroke="#333" strokeWidth="2" />
            <circle cx={comp.x} cy={comp.y + comp.height/2} r="2" fill="silver" />
            <circle cx={comp.x + comp.width} cy={comp.y + comp.height/2} r="2" fill="silver" />
          </g>
        );
        
      case 'switch':
        return (
          <g key={comp.id}>
            <rect
              x={comp.x} y={comp.y} width={comp.width} height={comp.height}
              fill={isSelected ? "#4a90e2" : "#dddddd"}
              stroke="#333" strokeWidth="2"
              style={{ cursor: 'move' }}
            />
            <text x={comp.x + comp.width/2} y={comp.y + comp.height/2 + 3} textAnchor="middle" fontSize="8" fontWeight="bold">
              {comp.label}
            </text>
            <circle cx={comp.x + 10} cy={comp.y + comp.height/2} r="3" fill="silver" />
            <circle cx={comp.x + comp.width - 10} cy={comp.y + comp.height/2} r="3" fill="silver" />
            <line x1={comp.x + 10} y1={comp.y + comp.height/2} x2={comp.x + comp.width - 15} y2={comp.y + 5} stroke="#333" strokeWidth="2" />
          </g>
        );
        
      default:
        return (
          <g key={comp.id}>
            <rect
              x={comp.x} y={comp.y} width={comp.width} height={comp.height}
              fill={isSelected ? "#4a90e2" : "#f0f0f0"}
              stroke="#333" strokeWidth="2"
              style={{ cursor: 'move' }}
            />
            <text x={comp.x + comp.width/2} y={comp.y + comp.height/2 + 3} textAnchor="middle" fontSize="9" fontWeight="bold">
              {comp.label}
            </text>
          </g>
        );
    }
  };

  const renderConnections = () => {
    const existingPaths = [];
    
    return connections.map((conn, i) => {
      const [fromComp, fromPin] = conn.from.split('.');
      const [toComp, toPin] = conn.to.split('.');
      
      const fromComponent = components.find(c => c.id === fromComp);
      const toComponent = components.find(c => c.id === toComp);
      
      if (!fromComponent || !toComponent) return null;
      
      const fromPinData = fromComponent.pins?.find(p => p.name === fromPin);
      const toPinData = toComponent.pins?.find(p => p.name === toPin);
      
      let startX, startY, endX, endY;
      
      if (!fromPinData || !toPinData) {
        startX = fromComponent.x + fromComponent.width;
        startY = fromComponent.y + fromComponent.height / 2;
        endX = toComponent.x;
        endY = toComponent.y + toComponent.height / 2;
      } else {
        startX = fromComponent.x + fromPinData.x;
        startY = fromComponent.y + fromPinData.y;
        endX = toComponent.x + toPinData.x;
        endY = toComponent.y + toPinData.y;
      }
      
      const path = findOptimalPath(
        { x: startX, y: startY }, 
        { x: endX, y: endY }, 
        components,
        existingPaths
      );
      
      existingPaths.push(path);
      
      const pathLength = path.reduce((acc, point, index) => {
        if (index === 0) return 0;
        const prev = path[index - 1];
        return acc + Math.sqrt(Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2));
      }, 0);
      
      const pathLengths = existingPaths.map(p => p.length);
      const avgPathLength = pathLengths.length > 0 ? getAverage(pathLengths) : path.length;
      
      const efficiency = Math.min(1, (avgPathLength || 0) / Math.max(1, path.length));
      const color = `hsl(${120 * efficiency}, 70%, 50%)`;
      
      const pathString = path.reduce((acc, point, index) => {
        return acc + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
      }, '');
      
      return (
        <g key={i}>
          <path
            d={pathString}
            stroke={color}
            strokeWidth="3"
            fill="none"
            markerEnd="url(#arrowhead)"
            opacity="0.8"
          />
          <circle
            cx={startX}
            cy={startY}
            r="4"
            fill={color}
            stroke="white"
            strokeWidth="1"
          />
          <text
            x={path[Math.floor(path.length / 2)]?.x || startX}
            y={path[Math.floor(path.length / 2)]?.y - 5 || startY}
            fontSize="8"
            fill="#333"
            textAnchor="middle"
          >
            {Math.round(pathLength)}px
          </text>
        </g>
      );
    });
  };

  const handleMouseDown = (e, compId) => {
    e.preventDefault();
    const comp = components.find(c => c.id === compId);
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    if (isCtrlPressed && !comp) {
      // Start selection box
      setSelectionBox({
        startX: mouseX,
        startY: mouseY,
        endX: mouseX,
        endY: mouseY
      });
    } else if (compId && comp) {
      // Component click
      if (isCtrlPressed) {
        // Toggle selection with Ctrl
        setSelectedComponents(prev => {
          const newSet = new Set(prev);
          if (newSet.has(compId)) {
            newSet.delete(compId);
          } else {
            newSet.add(compId);
          }
          return newSet;
        });
      } else {
        // Regular click - select only this component or start dragging
        if (!selectedComponents.has(compId)) {
          setSelectedComponents(new Set([compId]));
        }
        
        // Start dragging
        setDragging(true);
        
        // Store initial positions of all selected components
        const positions = {};
        components.forEach(c => {
          if (selectedComponents.has(c.id) || c.id === compId) {
            positions[c.id] = { x: c.x, y: c.y };
          }
        });
        setInitialPositions(positions);
        
        setDragOffset({
          x: mouseX - comp.x,
          y: mouseY - comp.y
        });
      }
    } else if (!isCtrlPressed) {
      // Click on empty space without Ctrl - clear selection
      setSelectedComponents(new Set());
    }
  };

  const handleMouseMove = (e) => {
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    if (selectionBox) {
      // Update selection box
      setSelectionBox(prev => ({
        ...prev,
        endX: mouseX,
        endY: mouseY
      }));

      // Update selected components based on selection box
      const newSelection = new Set();
      components.forEach(comp => {
        if (isComponentInSelectionBox(comp, { ...selectionBox, endX: mouseX, endY: mouseY })) {
          newSelection.add(comp.id);
        }
      });
      setSelectedComponents(newSelection);
    } else if (dragging && selectedComponents.size > 0) {
      // Move all selected components
      const deltaX = mouseX - dragOffset.x;
      const deltaY = mouseY - dragOffset.y;

      setComponents(prev => prev.map(comp => {
        if (selectedComponents.has(comp.id)) {
          const initial = initialPositions[comp.id];
          return {
            ...comp,
            x: Math.max(0, initial.x + (deltaX - initialPositions[Array.from(selectedComponents)[0]].x)),
            y: Math.max(0, initial.y + (deltaY - initialPositions[Array.from(selectedComponents)[0]].y))
          };
        }
        return comp;
      }));
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setSelectionBox(null);
    setInitialPositions({});
  };

  const addComponent = (type) => {
    const template = availableComponents.find(c => c.type === type);
    const newId = `${type}_${Date.now()}`;
    
    const defaultPins = {
      ic: [{x: 0, y: 20, name: 'IN'}, {x: 80, y: 20, name: 'OUT'}, {x: 40, y: 60, name: 'GND'}],
      resistor: [{x: 0, y: 10, name: 'A'}, {x: 60, y: 10, name: 'B'}],
      led: [{x: 0, y: 10, name: 'A'}, {x: 30, y: 10, name: 'K'}],
      switch: [{x: 0, y: 15, name: '1'}, {x: 50, y: 15, name: '2'}],
      power: [{x: 80, y: 20, name: '+9V'}, {x: 80, y: 40, name: 'GND'}],
      component: [{x: 40, y: 20, name: 'OUT'}, {x: 20, y: 40, name: 'GND'}]
    };
    
    const newComponent = {
      id: newId,
      type: type,
      x: 50 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      width: template.width,
      height: template.height,
      label: template.label,
      pins: defaultPins[type] || []
    };
    
    setComponents(prev => [...prev, newComponent]);
  };

  const removeComponent = (id) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    setConnections(prev => prev.filter(conn => 
      !conn.from.startsWith(id + '.') && !conn.to.startsWith(id + '.')
    ));
    if (selectedComponents.has(id)) {
      setSelectedComponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex">
      <div className="w-64 bg-white border-r border-gray-300 p-4 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Component Library</h3>
        
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Selection Controls:</h4>
          <div className="bg-blue-50 p-3 rounded text-xs space-y-1">
            <p><strong>Ctrl + Drag:</strong> Rectangle select multiple</p>
            <p><strong>Ctrl + Click:</strong> Add/remove from selection</p>
            <p><strong>Click:</strong> Select single component</p>
            <p><strong>Delete:</strong> Remove selected components</p>
            <p><strong>Drag:</strong> Move all selected components</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Add Components:</h4>
          <div className="grid grid-cols-1 gap-2">
            {availableComponents.map((comp, i) => (
              <button
                key={i}
                onClick={() => addComponent(comp.type)}
                className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
              >
                + {comp.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Components in Circuit:</h4>
          <div className="space-y-1">
            {components.map(comp => (
              <div key={comp.id} className={`flex justify-between items-center p-2 rounded ${selectedComponents.has(comp.id) ? 'bg-blue-200' : 'bg-gray-100'}`}>
                <span className="text-sm">{comp.label}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedComponents(new Set([comp.id]))}
                    className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => removeComponent(comp.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Selected: {selectedComponents.size}</h4>
          {selectedComponents.size > 0 && (
            <button
              onClick={() => {
                const idsToRemove = Array.from(selectedComponents);
                setComponents(prev => prev.filter(comp => !idsToRemove.includes(comp.id)));
                setConnections(prev => prev.filter(conn => {
                  const [fromId] = conn.from.split('.');
                  const [toId] = conn.to.split('.');
                  return !idsToRemove.includes(fromId) && !idsToRemove.includes(toId);
                }));
                setSelectedComponents(new Set());
              }}
              className="w-full bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
            >
              Delete Selected ({selectedComponents.size})
            </button>
          )}
        </div>
        
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Controls:</h4>
          <button
            onClick={() => setConnections([])}
            className="w-full bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
          >
            Clear All Connections
          </button>
        </div>
        
        <div className="text-xs text-gray-600">
          <p className="mb-2"><strong>Advanced Features:</strong></p>
          <p>• GCD-based optimal spacing</p>
          <p>• LCM crossover minimization</p>
          <p>• Multi-component selection</p>
          <p>• Group movement maintains relative positions</p>
          <p>• Auto wire rerouting</p>
        </div>
      </div>
      
      <div className="flex-1">
        <div className="bg-gray-200 p-4 border-b border-gray-300">
          <h2 className="text-xl font-bold">Circuit Editor with Group Selection</h2>
          <p className="text-sm text-gray-600">Hold Ctrl and drag to select multiple components • Selected: {selectedComponents.size}</p>
        </div>
        
        <svg
          ref={svgRef}
          width="100%"
          height="calc(100vh - 80px)"
          className="bg-white"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget || e.target.id === 'grid-rect') {
              handleMouseDown(e, null);
            }
          }}
        >
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
              refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#2196F3" />
            </marker>
          </defs>
          <rect id="grid-rect" width="100%" height="100%" fill="url(#grid)" />
          
          {useMemo(() => renderConnections(), [components, connections])}
          
          {components.map(comp => (
            <g
              key={comp.id}
              onMouseDown={(e) => handleMouseDown(e, comp.id)}
              style={{ cursor: dragging && selectedComponents.has(comp.id) ? 'grabbing' : 'grab' }}
            >
              {renderComponent(comp)}
            </g>
          ))}
          
          {/* Selection box */}
          {selectionBox && (
            <rect
              x={Math.min(selectionBox.startX, selectionBox.endX)}
              y={Math.min(selectionBox.startY, selectionBox.endY)}
              width={Math.abs(selectionBox.endX - selectionBox.startX)}
              height={Math.abs(selectionBox.endY - selectionBox.startY)}
              fill="rgba(74, 144, 226, 0.2)"
              stroke="#4a90e2"
              strokeWidth="2"
              strokeDasharray="5,5"
              pointerEvents="none"
            />
          )}
          
          <line x1="0" y1="100" x2="100%" y2="100" stroke="red" strokeWidth="3" opacity="0.3" />
          <text x="10" y="95" fontSize="12" fill="red">+5V Rail</text>
          <line x1="0" y1="120" x2="100%" y2="120" stroke="black" strokeWidth="3" opacity="0.3" />
          <text x="10" y="135" fontSize="12">Ground Rail</text>
        </svg>
      </div>
    </div>
  );
};

export default InteractiveCircuitEditor;