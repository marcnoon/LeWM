import { TestBed } from '@angular/core/testing';
import { PinSyncService } from './pin-sync.service';
import { PinStateService } from './pin-state.service';
import { GraphStateService } from './graph-state.service';

describe('PinSyncService', () => {
  let service: PinSyncService;
  let pinStateService: jasmine.SpyObj<PinStateService>;
  let graphStateService: jasmine.SpyObj<GraphStateService>;

  beforeEach(() => {
    const pinStateSpy = jasmine.createSpyObj('PinStateService', ['getPin', 'importPin', 'updatePinPosition']);
    const graphStateSpy = jasmine.createSpyObj('GraphStateService', ['getNodes', 'updateNode']);

    TestBed.configureTestingModule({
      providers: [
        PinSyncService,
        { provide: PinStateService, useValue: pinStateSpy },
        { provide: GraphStateService, useValue: graphStateSpy }
      ]
    });
    
    service = TestBed.inject(PinSyncService);
    pinStateService = TestBed.inject(PinStateService) as jasmine.SpyObj<PinStateService>;
    graphStateService = TestBed.inject(GraphStateService) as jasmine.SpyObj<GraphStateService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should sync legacy pin to enhanced system', () => {
    const mockNode = {
      id: 'test-node',
      type: 'component',
      x: 100,
      y: 100,
      width: 80,
      height: 60,
      label: 'Test Node',
      pins: [{ x: 10, y: 20, name: 'TEST_PIN' }]
    };
    
    graphStateService.getNodes.and.returnValue([mockNode]);
    pinStateService.getPin.and.returnValue(undefined);
    
    service.syncLegacyToEnhanced('test-node', { x: 10, y: 20, name: 'TEST_PIN' });
    
    expect(pinStateService.importPin).toHaveBeenCalled();
  });

  it('should sync enhanced pin to legacy system', () => {
    const mockPin = {
      id: 'test-node.TEST_PIN',
      nodeId: 'test-node',
      label: 'TEST_PIN',
      position: { x: 10, y: 20, side: 'left' as const, offset: 0 },
      pinType: 'bidirectional' as const,
      textStyle: {} as any,
      pinStyle: {} as any,
      isInput: true,
      isOutput: true,
      pinNumber: '',
      signalName: 'TEST_PIN',
      pinSize: 8,
      pinColor: '#4CAF50',
      showPinNumber: false
    };
    
    const mockNode = {
      id: 'test-node',
      type: 'component',
      x: 100,
      y: 100,
      width: 80,
      height: 60,
      label: 'Test Node',
      pins: [{ x: 5, y: 15, name: 'TEST_PIN' }]
    };
    
    graphStateService.getNodes.and.returnValue([mockNode]);
    
    service.syncEnhancedToLegacy(mockPin);
    
    expect(graphStateService.updateNode).toHaveBeenCalledWith('test-node', jasmine.objectContaining({
      pins: [{ x: 10, y: 20, name: 'TEST_PIN' }]
    }));
  });
});