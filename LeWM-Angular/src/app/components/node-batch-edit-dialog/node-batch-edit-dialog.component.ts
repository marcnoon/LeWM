import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { GraphNode } from '../../models/graph-node.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NodeBatchEditData {
  nodes: GraphNode[];
  commonProperties: {
    value?: string;
    unit?: string;
  };
  hasCommonValue: boolean;
  hasCommonUnit: boolean;
}

@Component({
  selector: 'app-node-batch-edit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './node-batch-edit-dialog.component.html',
  styleUrl: './node-batch-edit-dialog.component.scss'
})
export class NodeBatchEditDialogComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() nodes: GraphNode[] = [];
  @Output() nodesUpdated = new EventEmitter<GraphNode[]>();
  @Output() cancelled = new EventEmitter<void>();

  batchEditData: NodeBatchEditData | null = null;
  
  // Batch edit form data
  bulkChanges = {
    baseName: '',
    value: '',
    unit: '',
    applyAutoNumbering: true
  };

  ngOnInit(): void {
    this.updateBatchEditData();
  }

  ngOnChanges(): void {
    if (this.isVisible) {
      this.updateBatchEditData();
      this.resetForm();
    }
  }

  private updateBatchEditData(): void {
    if (this.nodes.length === 0) {
      this.batchEditData = null;
      return;
    }

    // Analyze common properties
    const values = this.nodes.map(n => n.value || '').filter(v => v.length > 0);
    const units = this.nodes.map(n => n.unit || '').filter(u => u.length > 0);
    
    const hasCommonValue = values.length > 0 && values.every(v => v === values[0]);
    const hasCommonUnit = units.length > 0 && units.every(u => u === units[0]);

    this.batchEditData = {
      nodes: this.nodes,
      commonProperties: {
        value: hasCommonValue ? values[0] : undefined,
        unit: hasCommonUnit ? units[0] : undefined
      },
      hasCommonValue,
      hasCommonUnit
    };
  }

  private resetForm(): void {
    this.bulkChanges = {
      baseName: '',
      value: this.batchEditData?.commonProperties.value || '',
      unit: this.batchEditData?.commonProperties.unit || '',
      applyAutoNumbering: true
    };
  }

  getValuePlaceholder(): string {
    if (!this.batchEditData) return '';
    if (this.batchEditData.hasCommonValue) {
      return this.batchEditData.commonProperties.value || '';
    }
    return '(multiple values)';
  }

  getUnitPlaceholder(): string {
    if (!this.batchEditData) return '';
    if (this.batchEditData.hasCommonUnit) {
      return this.batchEditData.commonProperties.unit || '';
    }
    return '(multiple units)';
  }

  onApply(): void {
    const updatedNodes: GraphNode[] = this.nodes.map((node, index) => {
      const updated = { ...node };

      // Handle name/label updates
      if (this.bulkChanges.baseName.trim()) {
        if (this.bulkChanges.applyAutoNumbering) {
          // Auto-increment naming: R → R1, R2, R3...
          updated.label = `${this.bulkChanges.baseName.trim()}${index + 1}`;
        } else {
          // Use the same name for all (might create duplicates)
          updated.label = this.bulkChanges.baseName.trim();
        }
      }

      // Handle value updates
      if (this.bulkChanges.value.trim()) {
        updated.value = this.bulkChanges.value.trim();
      } else if (this.bulkChanges.value === '') {
        // Explicitly clear value if empty string is entered
        updated.value = undefined;
      }

      // Handle unit updates
      if (this.bulkChanges.unit.trim()) {
        updated.unit = this.bulkChanges.unit.trim();
      } else if (this.bulkChanges.unit === '') {
        // Explicitly clear unit if empty string is entered
        updated.unit = undefined;
      }

      return updated;
    });

    this.nodesUpdated.emit(updatedNodes);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onOverlayClick(): void {
    this.onCancel();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onApply();
    } else if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  // Helper method to check if form is valid
  isFormValid(): boolean {
    return this.bulkChanges.baseName.trim().length > 0;
  }
}