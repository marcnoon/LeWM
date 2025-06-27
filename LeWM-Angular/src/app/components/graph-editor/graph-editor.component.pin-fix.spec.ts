import { TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { GraphEditorComponent } from './graph-editor.component';
import { GraphStateService } from '../../services/graph-state.service';
import { ModeManagerService } from '../../services/mode-manager.service';
import { PinStateService } from '../../services/pin-state.service';
import { PinSyncService } from '../../services/pin-sync.service';
import { FileService } from '../../services/file.service';
import { ChangeDetectorRef } from '@angular/core';
import { PinEditMode } from '../../modes/pin-edit.mode';

describe('GraphEditorComponent - Pin Mode Enter Key Fix', () => {
  let component: GraphEditorComponent;
  let fixture: any;
  let pinStateService: jasmine.SpyObj<PinStateService>;
  let modeManagerService: jasmine.SpyObj<ModeManagerService>;
  let mockPinEditMode: jasmine.SpyObj<PinEditMode>;

  beforeEach(async () => {
    // Create spy objects for services
    const pinStateSpy = jasmine.createSpyObj('PinStateService', [
      'openLayoutEditor', 
      'closeLayoutEditor',
      'setPinModeActive',
      'clearSelection'
    ], {
      layoutEditorVisible$: { subscribe: jasmine.createSpy() },
      pins$: { pipe: jasmine.createSpy().and.returnValue({ subscribe: jasmine.createSpy() }) }
    });

    const modeManagerSpy = jasmine.createSpyObj('ModeManagerService', [
      'getActiveMode',
      'activateMode', 
      'registerMode',
      'getAvailableModes',
      'renderActiveOverlay'
    ], {
      activeMode$: { subscribe: jasmine.createSpy() }
    });

    // Create a mock PinEditMode
    mockPinEditMode = jasmine.createSpyObj('PinEditMode', ['activate', 'deactivate'], {
      name: 'pin-edit',
      selectedPins: new Set(['node1.pin1', 'node2.pin2'])
    });

    // Set up the mode manager to return our mock pin edit mode
    modeManagerSpy.getActiveMode.and.returnValue(mockPinEditMode);

    await TestBed.configureTestingModule({
      declarations: [GraphEditorComponent],
      providers: [
        { provide: GraphStateService, useValue: jasmine.createSpyObj('GraphStateService', ['nodes$', 'edges$']) },
        { provide: ModeManagerService, useValue: modeManagerSpy },
        { provide: PinStateService, useValue: pinStateSpy },
        { provide: PinSyncService, useValue: jasmine.createSpyObj('PinSyncService', ['init']) },
        { provide: FileService, useValue: jasmine.createSpyObj('FileService', ['save']) },
        { provide: ChangeDetectorRef, useValue: jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GraphEditorComponent);
    component = fixture.componentInstance;
    pinStateService = TestBed.inject(PinStateService) as jasmine.SpyObj<PinStateService>;
    modeManagerService = TestBed.inject(ModeManagerService) as jasmine.SpyObj<ModeManagerService>;
  });

  it('should open pin layout editor when Enter is pressed in pin-edit mode with selected pins', () => {
    // Set up the component to be in pin-edit mode
    component.currentMode = mockPinEditMode as any;
    
    // Create a keyboard event for Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    
    // Call the handleKeyDown method
    component.handleKeyDown(enterEvent);
    
    // Verify that the pin layout editor was opened
    expect(pinStateService.openLayoutEditor).toHaveBeenCalled();
  });

  it('should not open pin layout editor when Enter is pressed in pin-edit mode with no selected pins', () => {
    // Set up the component to be in pin-edit mode but with no selected pins
    mockPinEditMode.selectedPins = new Set();
    component.currentMode = mockPinEditMode as any;
    
    // Create a keyboard event for Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    
    // Call the handleKeyDown method
    component.handleKeyDown(enterEvent);
    
    // Verify that the pin layout editor was NOT opened
    expect(pinStateService.openLayoutEditor).not.toHaveBeenCalled();
  });

  it('should not open pin layout editor when Enter is pressed and a dialog is open', () => {
    // Set up the component to be in pin-edit mode with selected pins
    component.currentMode = mockPinEditMode as any;
    component.showPinLayoutEditor = true; // Dialog is open
    
    // Create a keyboard event for Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    
    // Call the handleKeyDown method
    component.handleKeyDown(enterEvent);
    
    // Verify that the pin layout editor was NOT opened
    expect(pinStateService.openLayoutEditor).not.toHaveBeenCalled();
  });

  it('should use mode manager for mode switching instead of direct mode references', () => {
    // Test that pin edit mode switching uses the mode manager
    component.switchToPinEditMode();
    
    // Verify that the mode manager's activateMode method was called
    expect(modeManagerService.activateMode).toHaveBeenCalledWith('pin-edit');
  });
});