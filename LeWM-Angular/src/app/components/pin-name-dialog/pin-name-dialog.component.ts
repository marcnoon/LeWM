import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pin-name-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pin-dialog-overlay" *ngIf="isVisible" (click)="onOverlayClick()" (keydown.enter)="onOverlayClick()" tabindex="0">
      <div class="pin-dialog" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
        <div class="pin-dialog-header">
          <h4>Add Pin to {{ side }} side</h4>
        </div>
        <div class="pin-dialog-body">
          <label for="pinName">Pin Name:</label>
          <input 
            #pinInput
            type="text" 
            id="pinName" 
            [(ngModel)]="pinName" 
            (keydown)="onKeyDown($event)"
            placeholder="Enter pin name..."
            class="pin-input"
            [class.error]="errorMessage">
          <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
        </div>
        <div class="pin-dialog-footer">
          <button type="button" class="btn btn-cancel" (click)="onCancel()" (keydown.enter)="onCancel()">Cancel</button>
          <button type="button" class="btn btn-ok" (click)="onOk()" (keydown.enter)="onOk()" [disabled]="!pinName.trim()">OK</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pin-dialog-overlay {
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

    .pin-dialog {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 400px;
    }

    .pin-dialog-header {
      padding: 1rem 1.5rem 0.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .pin-dialog-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.1rem;
    }

    .pin-dialog-body {
      padding: 1.5rem;
    }

    .pin-dialog-body label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #555;
    }

    .pin-input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e9ecef;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .pin-input:focus {
      outline: none;
      border-color: #007bff;
    }

    .pin-input.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .pin-dialog-footer {
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

    .btn-ok:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-ok:disabled {
      background: #e9ecef;
      color: #6c757d;
      cursor: not-allowed;
    }
  `]
})
export class PinNameDialogComponent {
  @Input() isVisible = false;
  @Input() side = '';
  @Output() pinCreated = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  pinName = '';
  errorMessage = '';

  onOk(): void {
    if (this.pinName.trim()) {
      this.clearError(); // Clear any previous error
      this.pinCreated.emit(this.pinName.trim());
      // Note: Don't reset here if there's a validation error
      // The parent component will handle whether to close the dialog
    }
  }

  onCancel(): void {
    this.cancelled.emit();
    this.reset();
  }

  onOverlayClick(): void {
    this.onCancel();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onOk();
    } else if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  reset(): void {
    this.pinName = '';
    this.errorMessage = '';
    this.isVisible = false;
  }

  private clearError(): void {
    this.errorMessage = '';
  }

  showError(message: string): void {
    this.errorMessage = message;
  }

  show(side: string): void {
    this.side = side;
    this.isVisible = true;
    this.pinName = '';
    this.errorMessage = '';
    
    // Focus the input after a short delay to ensure the dialog is rendered
    setTimeout(() => {
      const input = document.getElementById('pinName') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  }
}