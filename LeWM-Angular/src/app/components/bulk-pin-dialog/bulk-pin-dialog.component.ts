import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-bulk-pin-dialog',
  standalone: false,
  template: `
    <div class="dialog-overlay" *ngIf="isVisible" (click)="onCancel()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <h3>Advanced Pin Layout - {{ side | titlecase }} Side</h3>
        
        <div class="dialog-body">
          <label for="pinNames">Enter pin names (comma-separated):</label>
          <textarea 
            id="pinNames"
            [(ngModel)]="pinNamesText"
            placeholder="VCC, GND, DATA0, DATA1, CLK, RESET"
            rows="4"
            cols="40"
            (keydown.enter)="onSubmit()"
            (keydown.escape)="onCancel()"
            #textareaRef>
          </textarea>
          
          <div class="preview" *ngIf="previewPins.length > 0">
            <h4>Preview ({{ previewPins.length }} pins):</h4>
            <div class="pin-preview">
              <span *ngFor="let pin of previewPins" class="pin-tag">{{ pin }}</span>
            </div>
          </div>
          
          <div class="layout-options">
            <h4>Layout Options:</h4>
            <label>
              <input type="checkbox" [(ngModel)]="options.autoDistribute" />
              Auto-distribute with optimal spacing
            </label>
            <label>
              <input type="checkbox" [(ngModel)]="options.snapToGrid" />
              Snap to grid for alignment
            </label>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="cancel-btn" (click)="onCancel()">Cancel</button>
          <button class="submit-btn" (click)="onSubmit()" [disabled]="previewPins.length === 0">
            Create {{ previewPins.length }} Pins
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .dialog-content {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      min-width: 400px;
      max-width: 600px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .dialog-content h3 {
      margin: 0 0 1rem 0;
      color: #333;
    }
    
    .dialog-body label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #555;
    }
    
    .dialog-body textarea {
      width: 100%;
      border: 2px solid #ddd;
      border-radius: 4px;
      padding: 0.5rem;
      font-family: monospace;
      margin-bottom: 1rem;
      resize: vertical;
    }
    
    .dialog-body textarea:focus {
      border-color: #007bff;
      outline: none;
    }
    
    .preview {
      margin: 1rem 0;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }
    
    .preview h4 {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
    }
    
    .pin-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    
    .pin-tag {
      background: #007bff;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-family: monospace;
    }
    
    .layout-options {
      margin: 1rem 0;
    }
    
    .layout-options h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    .layout-options label {
      display: flex;
      align-items: center;
      margin-bottom: 0.25rem;
      font-weight: normal;
      font-size: 0.9rem;
    }
    
    .layout-options input[type="checkbox"] {
      margin-right: 0.5rem;
    }
    
    .dialog-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
    
    .cancel-btn, .submit-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }
    
    .cancel-btn {
      background-color: #6c757d;
      color: white;
    }
    
    .cancel-btn:hover {
      background-color: #5a6268;
    }
    
    .submit-btn {
      background-color: #28a745;
      color: white;
    }
    
    .submit-btn:hover:not(:disabled) {
      background-color: #218838;
    }
    
    .submit-btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  `]
})
export class BulkPinDialogComponent {
  @Input() isVisible = false;
  @Input() side: string = '';
  @Output() pinsCreated = new EventEmitter<{
    pinNames: string[];
    options: {
      autoDistribute: boolean;
      snapToGrid: boolean;
    };
  }>();
  @Output() cancelled = new EventEmitter<void>();

  pinNamesText = '';
  options = {
    autoDistribute: true,
    snapToGrid: true
  };

  get previewPins(): string[] {
    if (!this.pinNamesText.trim()) return [];
    
    return this.pinNamesText
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }

  onSubmit(): void {
    if (this.previewPins.length === 0) return;
    
    this.pinsCreated.emit({
      pinNames: this.previewPins,
      options: { ...this.options }
    });
    
    this.reset();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.reset();
  }

  private reset(): void {
    this.pinNamesText = '';
    this.options = {
      autoDistribute: true,
      snapToGrid: true
    };
  }
}