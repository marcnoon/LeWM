import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SimpleChange } from '@angular/core';

import { NodeNameDialogComponent } from './node-name-dialog.component';

describe('NodeNameDialogComponent', () => {
  let component: NodeNameDialogComponent;
  let fixture: ComponentFixture<NodeNameDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NodeNameDialogComponent],
      imports: [FormsModule]
    });
    fixture = TestBed.createComponent(NodeNameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update nodeName when currentName input changes', () => {
    // Initial state
    expect(component.nodeName).toBe('');
    
    // Simulate input change from parent component
    component.currentName = 'Node A';
    component.ngOnChanges({
      currentName: new SimpleChange(undefined, 'Node A', false)
    });
    
    expect(component.nodeName).toBe('Node A');
    
    // Change to different node
    component.currentName = 'Node B';
    component.ngOnChanges({
      currentName: new SimpleChange('Node A', 'Node B', false)
    });
    
    expect(component.nodeName).toBe('Node B');
  });

  it('should not update nodeName when currentName is undefined', () => {
    component.nodeName = 'existing value';
    
    component.ngOnChanges({
      currentName: new SimpleChange('old', undefined, false)
    });
    
    expect(component.nodeName).toBe('existing value');
  });

  it('should emit nameChanged when onOk is called with valid name', () => {
    spyOn(component.nameChanged, 'emit');
    component.nodeName = '  Valid Name  ';
    
    component.onOk();
    
    expect(component.nameChanged.emit).toHaveBeenCalledWith('Valid Name');
  });

  it('should not emit nameChanged when onOk is called with empty name', () => {
    spyOn(component.nameChanged, 'emit');
    component.nodeName = '   ';
    
    component.onOk();
    
    expect(component.nameChanged.emit).not.toHaveBeenCalled();
  });

  it('should emit cancelled and reset when onCancel is called', () => {
    spyOn(component.cancelled, 'emit');
    spyOn(component, 'reset');
    
    component.onCancel();
    
    expect(component.cancelled.emit).toHaveBeenCalled();
    expect(component.reset).toHaveBeenCalled();
  });

  it('should reset state when reset is called', () => {
    component.nodeName = 'test name';
    component.errorMessage = 'test error';
    component.isVisible = true;
    
    component.reset();
    
    expect(component.nodeName).toBe('');
    expect(component.errorMessage).toBe('');
    expect(component.isVisible).toBe(false);
  });
});