import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphEditorComponent } from './graph-editor.component';
import { GraphStateService } from '../../services/graph-state.service';

describe('GraphEditorComponent', () => {
  let component: GraphEditorComponent;
  let fixture: ComponentFixture<GraphEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GraphEditorComponent],
      providers: [GraphStateService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
