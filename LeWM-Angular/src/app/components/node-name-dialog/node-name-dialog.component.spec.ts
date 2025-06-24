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

  it('should focus input when show() method is called', async () => {
    // Show the dialog first to make the input element visible
    component.show('test name');
    fixture.detectChanges();
    
    // Wait for ViewChild to be initialized
    await fixture.whenStable();
    
    const inputElement = component.nodeInputRef?.nativeElement;
    expect(inputElement).toBeTruthy();
    
    spyOn(inputElement, 'focus');
    spyOn(inputElement, 'select');
    
    // Trigger another show to test the focus signal
    component.show('updated name');
    fixture.detectChanges();
    
    // Wait for setTimeout in the effect to execute
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(inputElement.focus).toHaveBeenCalled();
    expect(inputElement.select).toHaveBeenCalled();
    expect(component.isVisible).toBe(true);
    expect(component.nodeName).toBe('updated name');
  });

  it('should focus input when dialog becomes visible', async () => {
    // Show the dialog to make the input element available
    component.show('another name');
    fixture.detectChanges();
    
    // Wait for ViewChild to be initialized
    await fixture.whenStable();
    
    const inputElement = component.nodeInputRef?.nativeElement;
    expect(inputElement).toBeTruthy();
    
    spyOn(inputElement, 'focus');
    spyOn(inputElement, 'select');
    
    // Show again to trigger focus (this increments the signal counter)
    component.show('final name');
    fixture.detectChanges();
    
    // Wait for setTimeout in the effect to execute
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(inputElement.focus).toHaveBeenCalled();
    expect(inputElement.select).toHaveBeenCalled();
  });
});