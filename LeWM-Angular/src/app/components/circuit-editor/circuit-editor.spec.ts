import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircuitEditor } from './circuit-editor';

describe('CircuitEditor', () => {
  let component: CircuitEditor;
  let fixture: ComponentFixture<CircuitEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CircuitEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircuitEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
