import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { GraphEditorComponent } from './graph-editor.component';
import { GraphStateService } from '../../services/graph-state.service';

describe('GraphEditorComponent', () => {
  let component: GraphEditorComponent;
  let fixture: ComponentFixture<GraphEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GraphEditorComponent],
      providers: [GraphStateService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(GraphEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
