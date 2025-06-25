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

  it('should update all properties when input changes', () => {
    // Initial state
    expect(component.nodeName).toBe('');
    expect(component.nodeValue).toBe('');
    expect(component.nodeUnit).toBe('');
    
    // Simulate input change from parent component
    component.currentName = 'Node A';
    component.currentValue = '42';
    component.currentUnit = 'V';
    component.ngOnChanges({
      currentName: new SimpleChange(undefined, 'Node A', false),
      currentValue: new SimpleChange(undefined, '42', false),
      currentUnit: new SimpleChange(undefined, 'V', false)
    });
    
    expect(component.nodeName).toBe('Node A');
    expect(component.nodeValue).toBe('42');
    expect(component.nodeUnit).toBe('V');
    
    // Change to different node
    component.currentName = 'Node B';
    component.currentValue = '100';
    component.currentUnit = 'A';
    component.ngOnChanges({
      currentName: new SimpleChange('Node A', 'Node B', false),
      currentValue: new SimpleChange('42', '100', false),
      currentUnit: new SimpleChange('V', 'A', false)
    });
    
    expect(component.nodeName).toBe('Node B');
    expect(component.nodeValue).toBe('100');
    expect(component.nodeUnit).toBe('A');
  });

  it('should not update properties when current values are undefined', () => {
    component.nodeName = 'existing name';
    component.nodeValue = 'existing value';
    component.nodeUnit = 'existing unit';
    
    component.ngOnChanges({
      currentName: new SimpleChange('old', undefined, false),
      currentValue: new SimpleChange('old', undefined, false),
      currentUnit: new SimpleChange('old', undefined, false)
    });
    
    expect(component.nodeName).toBe('existing name');
    expect(component.nodeValue).toBe('existing value');
    expect(component.nodeUnit).toBe('existing unit');
  });

  it('should emit propertiesChanged when onOk is called with valid name', () => {
    spyOn(component.propertiesChanged, 'emit');
    component.nodeName = '  Valid Name  ';
    component.nodeValue = '  42  ';
    component.nodeUnit = '  V  ';
    
    component.onOk();
    
    expect(component.propertiesChanged.emit).toHaveBeenCalledWith({
      name: 'Valid Name',
      value: '42',
      unit: 'V'
    });
  });

  it('should not emit propertiesChanged when onOk is called with empty name', () => {
    spyOn(component.propertiesChanged, 'emit');
    component.nodeName = '   ';
    
    component.onOk();
    
    expect(component.propertiesChanged.emit).not.toHaveBeenCalled();
  });

  it('should emit cancelled and reset when onCancel is called', () => {
    spyOn(component.cancelled, 'emit');
    spyOn(component, 'reset');
    
    component.onCancel();
    
    expect(component.cancelled.emit).toHaveBeenCalled();
    expect(component.reset).toHaveBeenCalled();
  });

  it('should reset all state when reset is called', () => {
    component.nodeName = 'test name';
    component.nodeValue = 'test value';
    component.nodeUnit = 'test unit';
    component.errorMessage = 'test error';
    component.isVisible = true;
    
    component.reset();
    
    expect(component.nodeName).toBe('');
    expect(component.nodeValue).toBe('');
    expect(component.nodeUnit).toBe('');
    expect(component.errorMessage).toBe('');
    expect(component.isVisible).toBe(false);
  });

  it('should focus input when currentName changes and dialog is visible', (done) => {
    // Set up the component to be visible
    component.isVisible = true;
    fixture.detectChanges();

    // Spy on the private focusInput method indirectly by spying on document.getElementById
    const mockInput = {
      focus: jasmine.createSpy('focus'),
      select: jasmine.createSpy('select')
    };
    spyOn(document, 'getElementById').and.returnValue(mockInput as any);

    // Simulate input change when dialog is visible
    component.currentName = 'Node A';
    component.ngOnChanges({
      currentName: new SimpleChange(undefined, 'Node A', false)
    });

    // Wait for the setTimeout in focusInput to execute
    setTimeout(() => {
      expect(document.getElementById).toHaveBeenCalledWith('nodeName');
      expect(mockInput.focus).toHaveBeenCalled();
      expect(mockInput.select).toHaveBeenCalled();
      done();
    }, 150);
  });

  it('should not focus input when currentName changes and dialog is not visible', (done) => {
    // Set up the component to be not visible
    component.isVisible = false;
    fixture.detectChanges();

    // Spy on document.getElementById to ensure it's not called
    spyOn(document, 'getElementById');

    // Simulate input change when dialog is not visible
    component.currentName = 'Node A';
    component.ngOnChanges({
      currentName: new SimpleChange(undefined, 'Node A', false)
    });

    // Wait a bit to ensure no focus attempt was made
    setTimeout(() => {
      expect(document.getElementById).not.toHaveBeenCalled();
      done();
    }, 150);
  });

  it('should focus input when show is called with all properties', (done) => {
    const mockInput = {
      focus: jasmine.createSpy('focus'),
      select: jasmine.createSpy('select')
    };
    spyOn(document, 'getElementById').and.returnValue(mockInput as any);

    component.show('Test Node', 'Test Value', 'Test Unit');
    
    expect(component.currentName).toBe('Test Node');
    expect(component.currentValue).toBe('Test Value');
    expect(component.currentUnit).toBe('Test Unit');
    expect(component.nodeName).toBe('Test Node');
    expect(component.nodeValue).toBe('Test Value');
    expect(component.nodeUnit).toBe('Test Unit');
    expect(component.isVisible).toBe(true);

    // Wait for the setTimeout in focusInput to execute
    setTimeout(() => {
      expect(document.getElementById).toHaveBeenCalledWith('nodeName');
      expect(mockInput.focus).toHaveBeenCalled();
      expect(mockInput.select).toHaveBeenCalled();
      done();
    }, 150);
  });

  it('should handle show method with only name parameter', () => {
    component.show('Test Node Only');
    
    expect(component.currentName).toBe('Test Node Only');
    expect(component.currentValue).toBe('');
    expect(component.currentUnit).toBe('');
    expect(component.nodeName).toBe('Test Node Only');
    expect(component.nodeValue).toBe('');
    expect(component.nodeUnit).toBe('');
    expect(component.isVisible).toBe(true);
  });
});