import { TestBed } from '@angular/core/testing';

import { CircuitState } from './circuit-state';

describe('CircuitState', () => {
  let service: CircuitState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CircuitState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
