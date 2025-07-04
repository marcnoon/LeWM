import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { NodeBatchEditDialogComponent } from './node-batch-edit-dialog.component';
import { GraphNode } from '../../models/graph-node.model';

describe('NodeBatchEditDialogComponent', () => {
  let component: NodeBatchEditDialogComponent;
  let fixture: ComponentFixture<NodeBatchEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeBatchEditDialogComponent, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeBatchEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isVisible).toBeFalse();
    expect(component.nodes).toEqual([]);
    expect(component.batchEditData).toBeNull();
  });

  it('should detect common values and units', () => {
    const testNodes: GraphNode[] = [
      { id: '1', type: 'resistor', x: 0, y: 0, width: 60, height: 20, label: 'R1', value: '100', unit: 'Ω' },
      { id: '2', type: 'resistor', x: 100, y: 0, width: 60, height: 20, label: 'R2', value: '100', unit: 'Ω' },
      { id: '3', type: 'resistor', x: 200, y: 0, width: 60, height: 20, label: 'R3', value: '100', unit: 'Ω' }
    ];

    component.nodes = testNodes;
    component.isVisible = true;
    component.ngOnChanges();

    expect(component.batchEditData?.hasCommonValue).toBeTrue();
    expect(component.batchEditData?.hasCommonUnit).toBeTrue();
    expect(component.batchEditData?.commonProperties.value).toBe('100');
    expect(component.batchEditData?.commonProperties.unit).toBe('Ω');
  });

  it('should detect different values and units', () => {
    const testNodes: GraphNode[] = [
      { id: '1', type: 'resistor', x: 0, y: 0, width: 60, height: 20, label: 'R1', value: '100', unit: 'Ω' },
      { id: '2', type: 'capacitor', x: 100, y: 0, width: 40, height: 40, label: 'C1', value: '10', unit: 'µF' },
      { id: '3', type: 'led', x: 200, y: 0, width: 30, height: 20, label: 'LED1' }
    ];

    component.nodes = testNodes;
    component.isVisible = true;
    component.ngOnChanges();

    expect(component.batchEditData?.hasCommonValue).toBeFalse();
    expect(component.batchEditData?.hasCommonUnit).toBeFalse();
  });

  it('should generate correct auto-numbered names', () => {
    const testNodes: GraphNode[] = [
      { id: '1', type: 'resistor', x: 0, y: 0, width: 60, height: 20, label: 'R1' },
      { id: '2', type: 'resistor', x: 100, y: 0, width: 60, height: 20, label: 'R2' },
      { id: '3', type: 'resistor', x: 200, y: 0, width: 60, height: 20, label: 'R3' }
    ];

    component.nodes = testNodes;
    component.bulkChanges.baseName = 'X';
    component.bulkChanges.applyAutoNumbering = true;

    component.onApply();

    const updatedNodes = component.nodes.map((node, index) => {
      const updated = { ...node };
      updated.label = `X${index + 1}`;
      return updated;
    });

    expect(updatedNodes[0].label).toBe('X1');
    expect(updatedNodes[1].label).toBe('X2');
    expect(updatedNodes[2].label).toBe('X3');
  });

  it('should emit updated nodes when applying changes', () => {
    spyOn(component.nodesUpdated, 'emit');
    
    const testNodes: GraphNode[] = [
      { id: '1', type: 'resistor', x: 0, y: 0, width: 60, height: 20, label: 'R1' }
    ];

    component.nodes = testNodes;
    component.bulkChanges.baseName = 'X';
    component.bulkChanges.value = '200';
    component.bulkChanges.unit = 'Ω';

    component.onApply();

    expect(component.nodesUpdated.emit).toHaveBeenCalled();
  });

  it('should emit cancelled event when cancelling', () => {
    spyOn(component.cancelled, 'emit');
    
    component.onCancel();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should validate form correctly', () => {
    component.bulkChanges.baseName = '';
    expect(component.isFormValid()).toBeFalse();

    component.bulkChanges.baseName = 'R';
    expect(component.isFormValid()).toBeTrue();
  });

  it('should return correct placeholder for multiple values', () => {
    const testNodes: GraphNode[] = [
      { id: '1', type: 'resistor', x: 0, y: 0, width: 60, height: 20, label: 'R1', value: '100' },
      { id: '2', type: 'resistor', x: 100, y: 0, width: 60, height: 20, label: 'R2', value: '200' }
    ];

    component.nodes = testNodes;
    component.isVisible = true;
    component.ngOnChanges();

    expect(component.getValuePlaceholder()).toBe('(multiple values)');
  });

  it('should return correct placeholder for common values', () => {
    const testNodes: GraphNode[] = [
      { id: '1', type: 'resistor', x: 0, y: 0, width: 60, height: 20, label: 'R1', value: '100' },
      { id: '2', type: 'resistor', x: 100, y: 0, width: 60, height: 20, label: 'R2', value: '100' }
    ];

    component.nodes = testNodes;
    component.isVisible = true;
    component.ngOnChanges();

    expect(component.getValuePlaceholder()).toBe('100');
  });
});