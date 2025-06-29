import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { GraphEdge } from '../../models/graph-edge.model';
import { ConnectionValue, ValueType, UnitType, UNIT_DEFINITIONS } from '../../models/connection-value.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-connection-properties-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="connection-dialog-overlay" *ngIf="isVisible" (click)="onOverlayClick()" (keydown.enter)="onOverlayClick()" tabindex="0">
      <div class="connection-dialog" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
        <div class="connection-dialog-header">
          <h4>Connection Properties</h4>
          <button class="close-btn" (click)="onCancel()" (keydown.enter)="onCancel()">&times;</button>
        </div>
        
        <div class="connection-dialog-body">
          <!-- Basic Properties -->
          <div class="property-section">
            <h5>Basic Properties</h5>
            
            <div class="form-group">
              <label for="connectionLabel">Label:</label>
              <input 
                type="text" 
                id="connectionLabel" 
                [(ngModel)]="connectionData.label" 
                placeholder="Connection name..."
                class="form-control">
            </div>
            
            <div class="form-group">
              <label for="connectionType">Type:</label>
              <select id="connectionType" [(ngModel)]="connectionData.type" class="form-control">
                <option value="signal">Signal</option>
                <option value="power">Power</option>
                <option value="data">Data</option>
                <option value="control">Control</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="connectionDirection">Direction:</label>
              <select id="connectionDirection" [(ngModel)]="connectionData.direction" class="form-control">
                <option value="forward">Forward (→)</option>
                <option value="backward">Backward (←)</option>
                <option value="bidirectional">Bidirectional (↔)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="connectionDescription">Description:</label>
              <textarea 
                id="connectionDescription" 
                [(ngModel)]="connectionData.description" 
                placeholder="Additional notes..."
                rows="2"
                class="form-control"></textarea>
            </div>
          </div>
          
          <!-- Visual Properties -->
          <div class="property-section">
            <h5>Visual Properties</h5>
            
            <div class="form-row">
              <div class="form-group">
                <label for="connectionColor">Color:</label>
                <input 
                  type="color" 
                  id="connectionColor" 
                  [(ngModel)]="connectionData.color" 
                  class="form-control color-input">
              </div>
              
              <div class="form-group">
                <label for="strokeWidth">Width:</label>
                <input 
                  type="number" 
                  id="strokeWidth" 
                  [(ngModel)]="connectionData.strokeWidth" 
                  min="1" 
                  max="10"
                  class="form-control number-input">
              </div>
              
              <div class="form-group">
                <label for="strokeStyle">Style:</label>
                <select id="strokeStyle" [(ngModel)]="connectionData.strokeStyle" class="form-control">
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Values and Units -->
          <div class="property-section">
            <h5>Values & Units</h5>
            
            <div class="values-list">
              <div *ngFor="let value of connectionData.values; let i = index" class="value-item">
                <div class="value-row">
                  <div class="form-group">
                    <label [for]="'key-' + i">Key:</label>
                    <input 
                      type="text"
                      [id]="'key-' + i"
                      [(ngModel)]="value.key" 
                      placeholder="Property name..."
                      class="form-control">
                  </div>
                  
                  <div class="form-group">
                    <label [for]="'value-' + i">Value:</label>
                    <input 
                      [type]="getInputType(value.valueType)"
                      [id]="'value-' + i"
                      [(ngModel)]="value.value" 
                      placeholder="Value..."
                      class="form-control">
                  </div>
                  
                  <div class="form-group">
                    <label [for]="'value-type-' + i">Type:</label>
                    <select [id]="'value-type-' + i" [(ngModel)]="value.valueType" class="form-control" (change)="onValueTypeChange(value)">
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="decimal">Decimal</option>
                      <option value="integer">Integer</option>
                      <option value="boolean">Boolean</option>
                      <option value="calculated">Calculated</option>
                    </select>
                  </div>
                  
                  <div class="form-group" *ngIf="value.valueType !== 'string' && value.valueType !== 'boolean'">
                    <label [for]="'unit-type-' + i">Unit Type:</label>
                    <select [id]="'unit-type-' + i" [(ngModel)]="value.unitType" class="form-control" (change)="onUnitTypeChange(value)">
                      <option value="none">No Unit</option>
                      <option value="voltage">Voltage</option>
                      <option value="current">Current</option>
                      <option value="resistance">Resistance</option>
                      <option value="power">Power</option>
                      <option value="frequency">Frequency</option>
                      <option value="capacitance">Capacitance</option>
                      <option value="inductance">Inductance</option>
                      <option value="length">Length</option>
                      <option value="mass">Mass</option>
                      <option value="time">Time</option>
                      <option value="temperature">Temperature</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  
                  <div class="form-group" *ngIf="value.unitType && value.unitType !== 'none'">
                    <label [for]="'unit-symbol-' + i">Unit:</label>
                    <select [id]="'unit-symbol-' + i" [(ngModel)]="value.unitSymbol" class="form-control">
                      <option *ngFor="let unit of getUnitsForType(value.unitType)" [value]="unit.symbol">
                        {{ unit.symbol }} ({{ unit.name }})
                      </option>
                    </select>
                  </div>
                  
                  <button type="button" class="remove-value-btn" (click)="removeValue(i)" (keydown.enter)="removeValue(i)" title="Remove value">
                    &times;
                  </button>
                </div>
                
                <div class="form-group" *ngIf="value.valueType === 'calculated'">
                  <label [for]="'formula-' + i">Formula:</label>
                  <input 
                    type="text"
                    [id]="'formula-' + i"
                    [(ngModel)]="value.calculationFormula" 
                    placeholder="e.g., voltage * current"
                    class="form-control">
                </div>
                
                <div class="form-group" *ngIf="value.description !== undefined">
                  <label [for]="'description-' + i">Description:</label>
                  <input 
                    type="text"
                    [id]="'description-' + i"
                    [(ngModel)]="value.description" 
                    placeholder="Description..."
                    class="form-control">
                </div>
              </div>
            </div>
            
            <button type="button" class="add-value-btn" (click)="addValue()" (keydown.enter)="addValue()">
              + Add Value
            </button>
          </div>
        </div>
        
        <div class="connection-dialog-footer">
          <button type="button" class="btn btn-cancel" (click)="onCancel()" (keydown.enter)="onCancel()">Cancel</button>
          <button type="button" class="btn btn-ok" (click)="onSave()" (keydown.enter)="onSave()">Save Changes</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .connection-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .connection-dialog {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      width: 90%;
      max-width: 700px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .connection-dialog-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .connection-dialog-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.1rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #333;
    }

    .connection-dialog-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .property-section {
      margin-bottom: 2rem;
    }

    .property-section h5 {
      margin: 0 0 1rem 0;
      color: #555;
      font-size: 1rem;
      font-weight: 600;
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 0.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.25rem;
      font-weight: 600;
      color: #555;
      font-size: 0.9rem;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      font-size: 0.9rem;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1rem;
    }

    .color-input {
      height: 40px;
      padding: 2px;
    }

    .number-input {
      max-width: 80px;
    }

    .values-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .value-item {
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1rem;
      position: relative;
      background: #f8f9fa;
    }

    .value-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto;
      gap: 0.5rem;
      align-items: end;
    }

    .remove-value-btn {
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      height: 36px;
      width: 36px;
    }

    .remove-value-btn:hover {
      background: #c82333;
    }

    .add-value-btn {
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.75rem 1rem;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .add-value-btn:hover {
      background: #218838;
    }

    .connection-dialog-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }

    .btn-cancel {
      background: #6c757d;
      color: white;
    }

    .btn-cancel:hover {
      background: #5a6268;
    }

    .btn-ok {
      background: #007bff;
      color: white;
    }

    .btn-ok:hover {
      background: #0056b3;
    }
  `]
})
export class ConnectionPropertiesDialogComponent implements OnChanges {
  @Input() isVisible = false;
  @Input() connection: GraphEdge | null = null;
  @Output() connectionUpdated = new EventEmitter<GraphEdge>();
  @Output() cancelled = new EventEmitter<void>();

  connectionData: GraphEdge = this.getDefaultConnection();

  ngOnChanges() {
    if (this.connection) {
      this.connectionData = {
        ...this.connection,
        values: this.connection.values ? [...this.connection.values] : []
      };
    } else {
      this.connectionData = this.getDefaultConnection();
    }
  }

  private getDefaultConnection(): GraphEdge {
    return {
      id: '',
      from: '',
      to: '',
      label: '',
      direction: 'forward',
      type: 'signal',
      color: '#2196F3',
      strokeWidth: 2,
      strokeStyle: 'solid',
      description: '',
      values: []
    };
  }

  onSave(): void {
    if (this.connectionData) {
      this.connectionUpdated.emit({
        ...this.connectionData,
        updatedAt: new Date()
      });
      this.reset();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
    this.reset();
  }

  onOverlayClick(): void {
    this.onCancel();
  }

  private reset(): void {
    this.isVisible = false;
    this.connectionData = this.getDefaultConnection();
  }

  // Value management
  addValue(): void {
    if (!this.connectionData.values) {
      this.connectionData.values = [];
    }

    const newValue: ConnectionValue = {
      key: '',
      value: '',
      valueType: 'string',
      unitType: 'none',
      unitSymbol: '',
      description: ''
    };

    this.connectionData.values.push(newValue);
  }

  removeValue(index: number): void {
    if (this.connectionData.values) {
      this.connectionData.values.splice(index, 1);
    }
  }

  getInputType(valueType: ValueType): string {
    switch (valueType) {
      case 'number':
      case 'decimal':
        return 'number';
      case 'integer':
        return 'number';
      case 'boolean':
        return 'checkbox';
      default:
        return 'text';
    }
  }

  onValueTypeChange(value: ConnectionValue): void {
    // Reset unit-related fields when changing value type
    if (value.valueType === 'string' || value.valueType === 'boolean') {
      value.unitType = 'none';
      value.unitSymbol = '';
    }
    
    // Set default value based on type
    switch (value.valueType) {
      case 'boolean':
        value.value = false;
        break;
      case 'number':
      case 'decimal':
      case 'integer':
        value.value = 0;
        break;
      default:
        value.value = '';
    }
  }

  onUnitTypeChange(value: ConnectionValue): void {
    // Reset unit symbol when changing unit type
    if (value.unitType && value.unitType !== 'none') {
      const units = this.getUnitsForType(value.unitType);
      value.unitSymbol = units.length > 0 ? units[0].symbol : '';
    } else {
      value.unitSymbol = '';
    }
  }

  getUnitsForType(unitType: UnitType | undefined) {
    if (!unitType || unitType === 'none') return [];
    return UNIT_DEFINITIONS[unitType] || [];
  }
}

  