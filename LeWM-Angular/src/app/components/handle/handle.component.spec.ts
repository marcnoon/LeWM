import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HandleComponent } from './handle';
import { LayoutStateService } from '../../services/layout-state.service';

describe('HandleComponent', () => {
  let component: HandleComponent;
  let fixture: ComponentFixture<HandleComponent>;
  let layoutStateService: LayoutStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HandleComponent],
      providers: [LayoutStateService]
    }).compileComponents();

    fixture = TestBed.createComponent(HandleComponent);
    component = fixture.componentInstance;
    layoutStateService = TestBed.inject(LayoutStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have resize output event', () => {
    expect(component.resize).toBeDefined();
    expect(component.resize.emit).toBeDefined();
  });

  it('should have resizeStart output event', () => {
    expect(component.resizeStart).toBeDefined();
    expect(component.resizeStart.emit).toBeDefined();
  });

  it('should have resizeEnd output event', () => {
    expect(component.resizeEnd).toBeDefined();
    expect(component.resizeEnd.emit).toBeDefined();
  });

  it('should not be resizing initially', () => {
    expect(component.resizing).toBe(false);
  });

  it('should emit resizeStart when mousedown occurs', () => {
    spyOn(component.resizeStart, 'emit');
    spyOn(layoutStateService, 'setResizing');
    const event = new MouseEvent('mousedown', { clientX: 100 });
    
    component.onResizeStart(event);
    
    expect(component.resizeStart.emit).toHaveBeenCalled();
    expect(component.resizing).toBe(true);
    expect(layoutStateService.setResizing).toHaveBeenCalledWith(true);
  });

  it('should clean up event listeners on destroy', () => {
    spyOn(document, 'removeEventListener');
    spyOn(layoutStateService, 'setResizing');
    
    component.ngOnDestroy();
    
    expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', jasmine.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', jasmine.any(Function));
  });

  it('should clear global resize state when destroyed during resize', () => {
    spyOn(layoutStateService, 'setResizing');
    const event = new MouseEvent('mousedown', { clientX: 100 });
    
    // Start resizing
    component.onResizeStart(event);
    expect(layoutStateService.setResizing).toHaveBeenCalledWith(true);
    
    // Destroy while resizing
    component.ngOnDestroy();
    expect(layoutStateService.setResizing).toHaveBeenCalledWith(false);
  });

  // Tests for new orientation functionality
  it('should default to vertical orientation', () => {
    expect(component.orientation).toBe('vertical');
    expect(component.isVertical).toBe(true);
    expect(component.isHorizontal).toBe(false);
  });

  it('should support horizontal orientation', () => {
    component.orientation = 'horizontal';
    fixture.detectChanges();
    
    expect(component.isVertical).toBe(false);
    expect(component.isHorizontal).toBe(true);
  });

  it('should emit deltaX for vertical orientation', () => {
    spyOn(component.resize, 'emit');
    component.orientation = 'vertical';
    
    // Start resize
    const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    component.onResizeStart(startEvent);
    
    // Simulate mouse move
    const moveEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 110 });
    document.dispatchEvent(moveEvent);
    
    expect(component.resize.emit).toHaveBeenCalledWith(20); // deltaX = 120 - 100
  });

  it('should emit deltaY for horizontal orientation', () => {
    spyOn(component.resize, 'emit');
    component.orientation = 'horizontal';
    
    // Start resize
    const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    component.onResizeStart(startEvent);
    
    // Simulate mouse move
    const moveEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 110 });
    document.dispatchEvent(moveEvent);
    
    expect(component.resize.emit).toHaveBeenCalledWith(10); // deltaY = 110 - 100
  });

  it('should clear global resize state on resize end', () => {
    spyOn(component.resizeEnd, 'emit');
    spyOn(layoutStateService, 'setResizing');
    const startEvent = new MouseEvent('mousedown', { clientX: 100 });
    
    // Start resize
    component.onResizeStart(startEvent);
    expect(layoutStateService.setResizing).toHaveBeenCalledWith(true);
    
    // End resize
    const endEvent = new MouseEvent('mouseup');
    document.dispatchEvent(endEvent);
    
    expect(layoutStateService.setResizing).toHaveBeenCalledWith(false);
    expect(component.resizeEnd.emit).toHaveBeenCalled();
  });
});