import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { GraphEdge } from '../../models/graph-edge.model';
import { ConnectionValue, ValueType, UnitType, AVAILABLE_UNITS, UNIT_DEFINITIONS } from '../../models/connection-value.model';

export interface BulkEditData {
  connections: GraphEdge[];
  commonProperties: {
    label?: string;
    direction?: string;
    type?: string;
    color?: string;
    strokeWidth?: number;
    strokeStyle?: string;
  };
  commonValues: {
    key: string;
    value: any;
    valueType: ValueType;
    unitType?: UnitType;
    unitSymbol?: string;
    count: number; // How many connections have this exact value
  }[];
  compatibleUnits: {
    unitType: UnitType;
    keys: string[];
    count: number;
  }[];
}

@Component({
  selector: 'app-connection-bulk-edit-dialog',
  standalone: false,
  templateUrl: './connection-bulk-edit-dialog.component.html',
  styleUrl: './connection-bulk-edit-dialog.component.scss'
})
export class ConnectionBulkEditDialogComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() connections: GraphEdge[] = [];
  @Output() connectionsUpdated = new EventEmitter<GraphEdge[]>();
  @Output() cancelled = new EventEmitter<void>();

  bulkEditData: BulkEditData | null = null;
  
  // Bulk edit form data
  bulkChanges = {
    labelPrefix: '',
    labelSuffix: '',
    direction: '',
    type: '',
    color: '',
    strokeWidth: null as number | null,
    strokeStyle: '',
    keyPrefix: '',
    keySuffix: '',
    unitChanges: [] as { fromUnitType: UnitType; toUnitType: UnitType; keys: string[] }[],
    newValues: [] as ConnectionValue[]
  };
  
  // Available options
  availableUnits = AVAILABLE_UNITS;
  directionOptions = [
    { value: '', label: 'Keep Current' },
    { value: 'forward', label: 'Forward →' },
    { value: 'backward', label: 'Backward ←' },
    { value: 'bidirectional', label: 'Bidirectional ↔' }
  ];
  
  typeOptions = [
    { value: '', label: 'Keep Current' },
    { value: 'signal', label: 'Signal' },
    { value: 'power', label: 'Power' },
    { value: 'data', label: 'Data' },
    { value: 'control', label: 'Control' },
    { value: 'clock', label: 'Clock' },
    { value: 'ground', label: 'Ground' },
    { value: 'other', label: 'Other' }
  ];
  
  strokeStyleOptions = [
    { value: '', label: 'Keep Current' },
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' }
  ];
  
  valueTypeOptions = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'decimal', label: 'Decimal' },
    { value: 'integer', label: 'Integer' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'calculated', label: 'Calculated' }
  ];

  ngOnInit(): void {
    if (this.connections.length > 0) {
      this.analyzeBulkEditData();
    }
  }

  ngOnChanges(): void {
    if (this.connections.length > 0) {
      this.analyzeBulkEditData();
    }
  }

  private analyzeBulkEditData(): void {
    if (this.connections.length === 0) return;

    const commonProperties: any = {};
    const valuesByKey = new Map<string, Map<string, { value: ConnectionValue; count: number }>>();
    const unitsByType = new Map<UnitType, Set<string>>();

    // Analyze common properties
    const first = this.connections[0];
    if (this.connections.every(c => c.direction === first.direction)) {
      commonProperties.direction = first.direction;
    }
    if (this.connections.every(c => c.type === first.type)) {
      commonProperties.type = first.type;
    }
    if (this.connections.every(c => c.color === first.color)) {
      commonProperties.color = first.color;
    }
    if (this.connections.every(c => c.strokeWidth === first.strokeWidth)) {
      commonProperties.strokeWidth = first.strokeWidth;
    }
    if (this.connections.every(c => c.strokeStyle === first.strokeStyle)) {
      commonProperties.strokeStyle = first.strokeStyle;
    }

    // Analyze values
    this.connections.forEach(connection => {
      if (connection.values) {
        connection.values.forEach(value => {
          if (!valuesByKey.has(value.key)) {
            valuesByKey.set(value.key, new Map());
          }
          
          const keyValues = valuesByKey.get(value.key)!;
          const valueKey = `${value.value}_${value.valueType}_${value.unitType || ''}_${value.unitSymbol || ''}`;
          
          if (keyValues.has(valueKey)) {
            keyValues.get(valueKey)!.count++;
          } else {
            keyValues.set(valueKey, { value: { ...value }, count: 1 });
          }

          // Track units by type
          if (value.unitType) {
            if (!unitsByType.has(value.unitType)) {
              unitsByType.set(value.unitType, new Set());
            }
            unitsByType.get(value.unitType)!.add(value.key);
          }
        });
      }
    });

    // Extract common values (values that appear in multiple connections)
    const commonValues: any[] = [];
    valuesByKey.forEach((values, key) => {
      values.forEach((data, valueKey) => {
        if (data.count > 1) {
          commonValues.push({
            ...data.value,
            key,  // Put key after the spread to ensure it overwrites
            count: data.count
          });
        }
      });
    });

    // Extract compatible units
    const compatibleUnits: any[] = [];
    unitsByType.forEach((keys, unitType) => {
      if (keys.size > 0) {
        compatibleUnits.push({
          unitType,
          keys: Array.from(keys),
          count: keys.size
        });
      }
    });

    this.bulkEditData = {
      connections: this.connections,
      commonProperties,
      commonValues,
      compatibleUnits
    };
  }

  addNewValue(): void {
    this.bulkChanges.newValues.push({
      key: '',
      value: '',
      valueType: 'string'
    });
  }

  removeNewValue(index: number): void {
    this.bulkChanges.newValues.splice(index, 1);
  }

  onApply(): void {
    // First, collect all keys across all connections to detect duplicates
    const allKeysMap = this.collectAllKeys();
    
    const updatedConnections: GraphEdge[] = this.connections.map((connection, connectionIndex) => {
      const updated = { ...connection };

      // Apply property changes
      if (this.bulkChanges.labelPrefix || this.bulkChanges.labelSuffix) {
        const currentLabel = updated.label || '';
        updated.label = `${this.bulkChanges.labelPrefix}${currentLabel}${this.bulkChanges.labelSuffix}`;
      }

      if (this.bulkChanges.direction) {
        updated.direction = this.bulkChanges.direction as any;
      }

      if (this.bulkChanges.type) {
        updated.type = this.bulkChanges.type as any;
      }

      if (this.bulkChanges.color) {
        updated.color = this.bulkChanges.color;
      }

      if (this.bulkChanges.strokeWidth !== null) {
        updated.strokeWidth = this.bulkChanges.strokeWidth;
      }

      if (this.bulkChanges.strokeStyle) {
        updated.strokeStyle = this.bulkChanges.strokeStyle as any;
      }

      // Apply key prefix and suffix to existing values (maintaining uniqueness within each connection)
      if ((this.bulkChanges.keyPrefix || this.bulkChanges.keySuffix) && updated.values) {
        updated.values = updated.values.map(value => {
          let newKey = value.key;
          if (this.bulkChanges.keyPrefix) {
            newKey = `${this.bulkChanges.keyPrefix}${newKey}`;
          }
          if (this.bulkChanges.keySuffix) {
            newKey = `${newKey}${this.bulkChanges.keySuffix}`;
          }
          return {
            ...value,
            key: newKey
          };
        });
      }

      // Apply unit changes
      if (this.bulkChanges.unitChanges.length > 0 && updated.values) {
        updated.values = updated.values.map(value => {
          const unitChange = this.bulkChanges.unitChanges.find(change => 
            change.fromUnitType === value.unitType && change.keys.includes(value.key)
          );
          if (unitChange) {
            return {
              ...value,
              unitType: unitChange.toUnitType,
              // Note: In a real application, you'd want to convert the actual value
              // For now, we're just changing the unit type
              unitSymbol: this.getDefaultUnitSymbol(unitChange.toUnitType)
            };
          }
          return value;
        });
      }

      // Add new values with proper duplicate numbering
      if (this.bulkChanges.newValues.length > 0) {
        const validNewValues = this.bulkChanges.newValues.filter(v => v.key.trim() !== '');
        if (validNewValues.length > 0) {
          if (!updated.values) {
            updated.values = [];
          }
          
          // Add new values with numbering based on duplicate detection
          validNewValues.forEach(newValue => {
            const baseKey = newValue.key.trim();
            let finalKey = baseKey;
            
            // Check if this key appears in multiple places (existing + new)
            const keyInfo = allKeysMap.get(baseKey);
            if (keyInfo && keyInfo.totalCount > 1) {
              // This key has duplicates, so number them
              finalKey = `${baseKey}${keyInfo.getNextNumber()}`;
            }
            
            // Ensure the final key is unique within this connection
            finalKey = this.generateUniqueKey(finalKey, updated.values || []);
            
            updated.values!.push({
              ...newValue,
              key: finalKey
            });
          });
        }
      }

      return updated;
    });

    this.connectionsUpdated.emit(updatedConnections);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  hasCommonProperties(): boolean {
    return this.bulkEditData ? Object.keys(this.bulkEditData.commonProperties).length > 0 : false;
  }

  hasCommonValues(): boolean {
    return this.bulkEditData ? this.bulkEditData.commonValues.length > 0 : false;
  }

  hasCompatibleUnits(): boolean {
    return this.bulkEditData ? this.bulkEditData.compatibleUnits.length > 0 : false;
  }

  addUnitChange(fromUnitType: UnitType, keys: string[]): void {
    this.bulkChanges.unitChanges.push({
      fromUnitType,
      toUnitType: fromUnitType, // Default to same unit type
      keys
    });
  }

  removeUnitChange(index: number): void {
    this.bulkChanges.unitChanges.splice(index, 1);
  }

  private getDefaultUnitSymbol(unitType: UnitType): string {
    const unitDefs = this.availableUnits.find(u => u.type === unitType);
    if (unitDefs && UNIT_DEFINITIONS[unitType] && UNIT_DEFINITIONS[unitType].length > 0) {
      return UNIT_DEFINITIONS[unitType][0].symbol;
    }
    return '';
  }

  getUnitDefinitions(unitType: UnitType) {
    return UNIT_DEFINITIONS[unitType] || [];
  }

  private collectAllKeys(): Map<string, { totalCount: number; currentNumber: number; getNextNumber: () => number }> {
    const keyMap = new Map<string, { totalCount: number; currentNumber: number; getNextNumber: () => number }>();
    
    // Count existing keys across all connections
    this.connections.forEach(connection => {
      if (connection.values) {
        connection.values.forEach(value => {
          const baseKey = value.key;
          if (!keyMap.has(baseKey)) {
            keyMap.set(baseKey, {
              totalCount: 0,
              currentNumber: 0,
              getNextNumber: function() { return ++this.currentNumber; }
            });
          }
          keyMap.get(baseKey)!.totalCount++;
        });
      }
    });
    
    // Count new keys being added (multiply by number of connections)
    const validNewValues = this.bulkChanges.newValues.filter(v => v.key.trim() !== '');
    validNewValues.forEach(newValue => {
      const baseKey = newValue.key.trim();
      if (!keyMap.has(baseKey)) {
        keyMap.set(baseKey, {
          totalCount: 0,
          currentNumber: 0,
          getNextNumber: function() { return ++this.currentNumber; }
        });
      }
      // Each new value will be added to each selected connection
      keyMap.get(baseKey)!.totalCount += this.connections.length;
    });
    
    return keyMap;
  }


  private generateUniqueKey(baseKey: string, existingValues: ConnectionValue[]): string {
    const existingKeys = new Set(existingValues.map(v => v.key));
    
    // If the base key doesn't exist, use it as-is
    if (!existingKeys.has(baseKey)) {
      return baseKey;
    }
    
    // Find the next available numbered key
    let counter = 1;
    let candidateKey = `${baseKey}${counter}`;
    while (existingKeys.has(candidateKey)) {
      counter++;
      candidateKey = `${baseKey}${counter}`;
    }
    
    return candidateKey;
  }
}