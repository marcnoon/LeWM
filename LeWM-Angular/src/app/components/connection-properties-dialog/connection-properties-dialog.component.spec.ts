import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ConnectionPropertiesDialogComponent } from './connection-properties-dialog.component';
import { GraphEdge } from '../../models/graph-edge.model';

describe('ConnectionPropertiesDialogComponent', () => {
  let component: ConnectionPropertiesDialogComponent;
  let fixture: ComponentFixture<ConnectionPropertiesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionPropertiesDialogComponent, FormsModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConnectionPropertiesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should clear direction property when saving with undefined direction', () => {
    // Arrange
    const testConnection: GraphEdge = {
      id: 'test-conn',
      from: 'node1.pin1',
      to: 'node2.pin2',
      direction: 'forward'
    };

    component.connection = testConnection;
    component.ngOnChanges();
    
    // Set direction to undefined (no direction)
    component.connectionData.direction = undefined;

    let emittedConnection: GraphEdge | undefined;
    component.connectionUpdated.subscribe((conn: GraphEdge) => {
      emittedConnection = conn;
    });

    // Act
    component.onSave();

    // Assert undirected connection
    expect(emittedConnection).toBeDefined();
    // Did the object emittedConnection include a property named direction - should be false because undirected
    expect(Object.prototype.hasOwnProperty.call(emittedConnection, 'direction')).toBeFalse();
  });

  it('should keep direction property when saving with a defined direction', () => {
    // Arrange
    const testConnection: GraphEdge = {
      id: 'test-conn',
      from: 'node1.pin1',
      to: 'node2.pin2'
    };

    component.connection = testConnection;
    component.ngOnChanges();
    
    // Set direction to a specific value
    component.connectionData.direction = 'bidirectional';

    let emittedConnection: GraphEdge | undefined;
    component.connectionUpdated.subscribe((conn: GraphEdge) => {
      emittedConnection = conn;
    });

    // Act
    component.onSave();

    // Assert
    expect(emittedConnection).toBeDefined();
    expect(emittedConnection!.direction).toBe('bidirectional');
  });

  it('should display undefined direction as no direction selected', () => {
    // Arrange
    const testConnection: GraphEdge = {
      id: 'test-conn',
      from: 'node1.pin1',
      to: 'node2.pin2'
      // No direction property
    };

    // Act
    component.connection = testConnection;
    component.ngOnChanges();

    // Assert
    expect(component.connectionData.direction).toBeUndefined();
  });
});