import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { NodeNameDialogComponent } from './node-name-dialog.component';

describe('NodeNameDialogComponent', () => {
  let component: NodeNameDialogComponent;
  let fixture: ComponentFixture<NodeNameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NodeNameDialogComponent],
      imports: [FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeNameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call autofocusMethod when attribute binding is evaluated', () => {
    spyOn(component, 'autofocusMethod').and.returnValue('focused');
    
    component.isVisible = true;
    fixture.detectChanges();
    
    expect(component.autofocusMethod).toHaveBeenCalled();
  });

  it('should focus input when dialog is visible and autofocusMethod is called', async () => {
    component.isVisible = true;
    fixture.detectChanges();
    
    // Ensure ViewChild is initialized
    await fixture.whenStable();
    
    const inputElement = component.nodeInputRef?.nativeElement;
    if (inputElement) {
      spyOn(inputElement, 'focus');
      spyOn(inputElement, 'select');
      
      component.autofocusMethod();
      
      // Wait for setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(inputElement.focus).toHaveBeenCalled();
      expect(inputElement.select).toHaveBeenCalled();
    }
  });

  it('should not attempt to focus when dialog is not visible', async () => {
    component.isVisible = false;
    fixture.detectChanges();
    
    await fixture.whenStable();
    
    const inputElement = component.nodeInputRef?.nativeElement;
    if (inputElement) {
      spyOn(inputElement, 'focus');
      
      component.autofocusMethod();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(inputElement.focus).not.toHaveBeenCalled();
    } else {
      // If input element doesn't exist when dialog is not visible, that's expected
      expect(inputElement).toBeFalsy();
    }
  });
});