import { TestBed } from '@angular/core/testing';

import { GraphStateService } from './graph-state.service'; // Updated import

describe('GraphStateService', () => { // Updated describe block
  let service: GraphStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphStateService); // Updated injection
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
