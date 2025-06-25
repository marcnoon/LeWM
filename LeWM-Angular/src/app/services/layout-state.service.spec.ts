import { TestBed } from '@angular/core/testing';
import { LayoutStateService } from './layout-state.service';

describe('LayoutStateService', () => {
  let service: LayoutStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial resizing state as false', () => {
    expect(service.isResizing).toBe(false);
  });

  it('should emit false initially through observable', (done) => {
    service.isResizing$.subscribe(isResizing => {
      expect(isResizing).toBe(false);
      done();
    });
  });

  it('should update resizing state', () => {
    service.setResizing(true);
    expect(service.isResizing).toBe(true);

    service.setResizing(false);
    expect(service.isResizing).toBe(false);
  });

  it('should emit state changes through observable', (done) => {
    let callCount = 0;
    const expectedValues = [false, true, false];
    
    service.isResizing$.subscribe(isResizing => {
      expect(isResizing).toBe(expectedValues[callCount]);
      callCount++;
      
      if (callCount === expectedValues.length) {
        done();
      }
    });

    // Trigger state changes
    service.setResizing(true);
    service.setResizing(false);
  });
});