import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Pin, PinModeState, PinSubMode, PinPosition, PinTextStyle, PinStyle, DEFAULT_PIN_TEXT_STYLE, DEFAULT_PIN_STYLE } from '../interfaces/pin.interface';

@Injectable({
  providedIn: 'root'
})
export class PinStateService {
  private pinsSubject = new BehaviorSubject<Map<string, Pin>>(new Map());
  private modeStateSubject = new BehaviorSubject<PinModeState>({
    subMode: 'layout',
    selectedPins: [],
    isMultiSelect: false,
    gridSnap: true,
    showGuides: true
  });
  private layoutEditorVisibleSubject = new BehaviorSubject<boolean>(false);
  private pinModeActiveSubject = new BehaviorSubject<boolean>(false);
  
  constructor() {
    // Initialize and load any saved enhanced properties
    this.initializeEnhancedProperties();
  }

  public pins$ = this.pinsSubject.asObservable();
  public modeState$ = this.modeStateSubject.asObservable();
  public layoutEditorVisible$ = this.layoutEditorVisibleSubject.asObservable();
  public pinModeActive$ = this.pinModeActiveSubject.asObservable();

  public selectedPins$: Observable<Pin[]> = combineLatest([
    this.pins$,
    this.modeState$
  ]).pipe(
    map(([pins, state]) => {
      return state.selectedPins.map(id => pins.get(id)).filter(Boolean) as Pin[];
    })
  );

  addPin(nodeId: string, position: PinPosition, label: string = ''): string {
    const id = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pin: Pin = {
      id,
      nodeId,
      label,
      position,
      textStyle: { ...DEFAULT_PIN_TEXT_STYLE },
      pinStyle: { ...DEFAULT_PIN_STYLE },
      isInput: true,
      isOutput: true,
      pinType: 'input',
      pinNumber: '',
      signalName: '',
      pinSize: 4,
      pinColor: '#000000',
      showPinNumber: false
    };

    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    newPins.set(id, pin);
    this.pinsSubject.next(newPins);

    return id;
  }

  updatePin(pinId: string, updates: Partial<Pin>): void {
    const currentPins = this.pinsSubject.value;
    const pin = currentPins.get(pinId);
    
    if (pin) {
      const newPins = new Map(currentPins);
      newPins.set(pinId, { ...pin, ...updates });
      this.pinsSubject.next(newPins);
      console.log(`Updated pin ${pinId} with:`, updates);
      
      // Persist enhanced pin properties to localStorage
      this.saveEnhancedPinProperties();
    }
  }

  updatePinPosition(pinId: string, position: PinPosition): void {
    this.updatePin(pinId, { position });
  }

  updatePinTextStyle(pinId: string, textStyle: Partial<PinTextStyle>): void {
    const currentPins = this.pinsSubject.value;
    const pin = currentPins.get(pinId);
    
    if (pin) {
      const newPins = new Map(currentPins);
      newPins.set(pinId, {
        ...pin,
        textStyle: { ...pin.textStyle, ...textStyle }
      });
      this.pinsSubject.next(newPins);
      
      // Persist enhanced pin properties to localStorage
      this.saveEnhancedPinProperties();
    }
  }

  updatePinStyle(pinId: string, pinStyle: Partial<PinStyle>): void {
    const currentPins = this.pinsSubject.value;
    const pin = currentPins.get(pinId);
    
    if (pin) {
      const newPins = new Map(currentPins);
      newPins.set(pinId, {
        ...pin,
        pinStyle: { ...pin.pinStyle, ...pinStyle }
      });
      this.pinsSubject.next(newPins);
      
      // Persist enhanced pin properties to localStorage
      this.saveEnhancedPinProperties();
    }
  }

  selectPin(pinId: string, multiSelect: boolean = false): void {
    console.log('selectPin called with:', pinId, 'multiSelect:', multiSelect);
    console.log('Current pins in store:', Array.from(this.pinsSubject.value.keys()));
    
    // Check if the pin exists in our store
    const pinExists = this.pinsSubject.value.has(pinId);
    console.log('Pin exists in store:', pinExists);
    
    if (!pinExists) {
      console.warn('Pin not found in PinStateService store. Pin ID:', pinId);
      // Don't select a pin that doesn't exist in our store
      return;
    }

    const currentState = this.modeStateSubject.value;
    
    if (multiSelect) {
      const isSelected = currentState.selectedPins.includes(pinId);
      const selectedPins = isSelected 
        ? currentState.selectedPins.filter(id => id !== pinId)
        : [...currentState.selectedPins, pinId];
      
      this.modeStateSubject.next({
        ...currentState,
        selectedPins,
        isMultiSelect: true
      });
      
      // Update pin selection state
      this.updatePinSelectionState(selectedPins);
    } else {
      this.modeStateSubject.next({
        ...currentState,
        selectedPins: [pinId],
        isMultiSelect: false
      });
      
      // Update pin selection state
      this.updatePinSelectionState([pinId]);
    }
  }
  
  private updatePinSelectionState(selectedPinIds: string[]): void {
    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    
    // Clear all selections first
    newPins.forEach((pin, id) => {
      if (pin.isSelected) {
        newPins.set(id, { ...pin, isSelected: false });
      }
    });
    
    // Set selected pins
    selectedPinIds.forEach(pinId => {
      const pin = newPins.get(pinId);
      if (pin) {
        newPins.set(pinId, { ...pin, isSelected: true });
      }
    });
    
    this.pinsSubject.next(newPins);
  }

  importPin(pin: Pin): void {
    console.log('Importing pin to PinStateService:', pin.id);
    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    
    // Apply enhanced properties if available
    const enhancedPin = this.applyEnhancedPropertiesToPin(pin);
    newPins.set(pin.id, enhancedPin);
    this.pinsSubject.next(newPins);
  }

  importPins(pins: Pin[]): void {
    console.log('Importing multiple pins to PinStateService:', pins.length);
    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    
    pins.forEach(pin => {
      // Apply enhanced properties if available
      const enhancedPin = this.applyEnhancedPropertiesToPin(pin);
      newPins.set(pin.id, enhancedPin);
    });
    
    this.pinsSubject.next(newPins);
  }

  debugPins(): void {
    console.log('PinStateService debug info:');
    console.log('Total pins:', this.pinsSubject.value.size);
    console.log('Pin IDs:', Array.from(this.pinsSubject.value.keys()));
    console.log('Selected pin IDs:', this.modeStateSubject.value.selectedPins);
  }

  clearSelection(): void {
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      selectedPins: [],
      isMultiSelect: false
    });
    
    // Clear pin selection state
    this.updatePinSelectionState([]);
  }

  clearAll(): void {
    console.log('Clearing all pins from PinStateService');
    this.pinsSubject.next(new Map());
    this.clearSelection();
  }

  setSubMode(subMode: PinSubMode): void {
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      subMode
    });
  }
  
  toggleGridSnap(): void {
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      gridSnap: !currentState.gridSnap
    });
  }
  
  setGridSnap(enabled: boolean): void {
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      gridSnap: enabled
    });
  }

  deletePin(pinId: string): void {
    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    newPins.delete(pinId);
    this.pinsSubject.next(newPins);
    
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      selectedPins: currentState.selectedPins.filter(id => id !== pinId)
    });
  }

  getPinsForNode(nodeId: string): Observable<Pin[]> {
    return this.pins$.pipe(
      map(pins => Array.from(pins.values()).filter(pin => pin.nodeId === nodeId))
    );
  }

  // Bridge method: Get a single pin by ID
  getPin(pinId: string): Pin | undefined {
    return this.pinsSubject.value.get(pinId);
  }

  // Bridge method: Import a legacy pin to the enhanced system
  importLegacyPin(nodeId: string, legacyPin: any): void {
    const pinId = `${nodeId}.${legacyPin.name}`;
    
    // Check if pin already exists
    if (this.getPin(pinId)) {
      console.log(`Pin ${pinId} already exists in enhanced system`);
      return;
    }

    // Create enhanced pin from legacy pin
    const enhancedPin: Pin = {
      id: pinId,
      nodeId: nodeId,
      label: legacyPin.name,
      position: {
        x: legacyPin.x || 0,
        y: legacyPin.y || 0,
        side: this.detectPinSide(legacyPin),
        offset: 0
      },
      textStyle: { ...DEFAULT_PIN_TEXT_STYLE },
      pinStyle: { ...DEFAULT_PIN_STYLE },
      isInput: true,
      isOutput: true,
      isSelected: false,
      pinType: legacyPin.type || 'bidirectional',
      pinNumber: legacyPin.pinNumber || '',
      signalName: legacyPin.signalName || legacyPin.name,
      pinSize: legacyPin.pinSize || 8,
      pinColor: legacyPin.pinColor || '#4CAF50',
      showPinNumber: legacyPin.showPinNumber || false,
      dataType: legacyPin.dataType
    };

    console.log(`Importing legacy pin ${pinId} to enhanced system`);
    this.importPin(enhancedPin);
  }

  // Helper method to detect which side of the node a pin is on
  private detectPinSide(pin: any): 'top' | 'right' | 'bottom' | 'left' {
    // Simple detection based on position - this could be made more sophisticated
    const x = pin.x || 0;
    const y = pin.y || 0;
    
    // For now, default to left side since most legacy pins seem to be on the left
    if (x <= 10) return 'left';
    if (x >= 70) return 'right'; 
    if (y <= 10) return 'top';
    return 'bottom';
  }

  openLayoutEditor(): void {
    const selectedPinIds = this.modeStateSubject.value.selectedPins;
    console.log('Opening layout editor with selected pin IDs:', selectedPinIds);
    
    if (selectedPinIds.length > 0) {
      const selectedPins = this.getSelectedPins();
      console.log('Retrieved selected pins for editor:', selectedPins.length, selectedPins.map(p => ({ id: p.id, label: p.label })));
      this.layoutEditorVisibleSubject.next(true);
    } else {
      console.warn('No pins selected when trying to open layout editor');
    }
  }

  closeLayoutEditor(): void {
    console.log('Closing pin layout editor');
    this.layoutEditorVisibleSubject.next(false);
  }

  setPinModeActive(active: boolean): void {
    console.log('Setting pin mode active:', active);
    this.pinModeActiveSubject.next(active);
  }

  batchUpdatePins(updates: { pinId: string; changes: Partial<Pin> }[]): void {
    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    
    updates.forEach(({ pinId, changes }) => {
      const pin = newPins.get(pinId);
      if (pin) {
        newPins.set(pinId, { ...pin, ...changes });
      }
    });
    
    this.pinsSubject.next(newPins);
    
    // Persist enhanced pin properties to localStorage
    this.saveEnhancedPinProperties();
  }

  handleKeyboard(event: KeyboardEvent): boolean {
    const currentState = this.modeStateSubject.value;
    const isActive = this.pinModeActiveSubject.value;
    
    console.log('PinStateService handleKeyboard:', {
      key: event.key,
      selectedPins: currentState.selectedPins.length,
      pinModeActive: isActive,
      target: (event.target as Element)?.tagName,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey
    });
    
    if (!isActive) {
      console.log('Pin mode not active, ignoring keyboard event');
      return false;
    }
    
    if (event.key === 'Enter' && currentState.selectedPins.length > 0) {
      console.log('Opening layout editor - Enter key pressed with', currentState.selectedPins.length, 'selected pins');
      this.openLayoutEditor();
      return true;
    }
    
    if (event.key === 'Escape') {
      if (currentState.selectedPins.length > 0) {
        console.log('Clearing selection - Escape key pressed');
        this.clearSelection();
        return true;
      }
    }
    
    console.log('No action taken for key:', event.key);
    return false;
  }

  getSelectedPins(): Pin[] {
    const selectedPinIds = this.modeStateSubject.value.selectedPins;
    const currentPins = this.pinsSubject.value;
    
    console.log('Getting selected pins:', {
      selectedPinIds,
      totalPins: currentPins.size,
      availablePinIds: Array.from(currentPins.keys())
    });
    
    const result = selectedPinIds
      .map(id => currentPins.get(id))
      .filter(Boolean) as Pin[];
    
    console.log('Returning selected pins:', result.length, result.map(p => ({ id: p.id, label: p.label })));
    return result;
  }

  /**
   * Validates that pin data is consistent between PinStateService and legacy system
   * @param graphStateService Reference to GraphStateService for validation
   */
  validatePinConsistency(graphStateService: any): { inconsistencies: string[]; isValid: boolean } {
    const inconsistencies: string[] = [];
    const currentPins = this.pinsSubject.value;
    const nodes = graphStateService.getNodes();
    
    console.log('🔍 Validating pin consistency between systems...');
    
    // Check each pin in PinStateService against legacy system
    Array.from(currentPins.values()).forEach(pin => {
      const [nodeId, pinName] = pin.id.split('.');
      const node = nodes.find((n: any) => n.id === nodeId);
      
      if (node && node.pins) {
        const legacyPin = node.pins.find((p: any) => p.name === pinName);
        if (legacyPin) {
          // Check position consistency
          if (legacyPin.x !== pin.position.x || legacyPin.y !== pin.position.y) {
            const msg = `Position mismatch for ${pin.id}: PinState(${pin.position.x},${pin.position.y}) vs Legacy(${legacyPin.x},${legacyPin.y})`;
            inconsistencies.push(msg);
            console.warn(`⚠️ ${msg}`);
          }
        } else {
          const msg = `Pin ${pin.id} exists in PinStateService but not in legacy system`;
          inconsistencies.push(msg);
          console.warn(`⚠️ ${msg}`);
        }
      } else {
        const msg = `Node ${nodeId} not found in legacy system for pin ${pin.id}`;
        inconsistencies.push(msg);
        console.warn(`⚠️ ${msg}`);
      }
    });
    
    const isValid = inconsistencies.length === 0;
    console.log(`🔍 Pin consistency validation: ${isValid ? '✅ VALID' : `❌ ${inconsistencies.length} issues found`}`);
    
    return { inconsistencies, isValid };
  }

  /**
   * Save enhanced pin properties to localStorage
   */
  private saveEnhancedPinProperties(): void {
    try {
      const currentPins = this.pinsSubject.value;
      const enhancedPinData: { [pinId: string]: any } = {};
      
      // Extract enhanced properties for each pin
      Array.from(currentPins.values()).forEach(pin => {
        enhancedPinData[pin.id] = {
          textStyle: pin.textStyle,
          pinStyle: pin.pinStyle,
          pinType: pin.pinType,
          isInput: pin.isInput,
          isOutput: pin.isOutput,
          dataType: pin.dataType,
          pinNumber: pin.pinNumber,
          signalName: pin.signalName,
          pinSize: pin.pinSize,
          pinColor: pin.pinColor,
          showPinNumber: pin.showPinNumber
        };
      });
      
      localStorage.setItem('lewm-enhanced-pin-properties', JSON.stringify(enhancedPinData));
      console.log('💾 Saved enhanced pin properties to localStorage');
    } catch (error) {
      console.error('Failed to save enhanced pin properties:', error);
    }
  }

  /**
   * Load enhanced pin properties from localStorage
   */
  private loadEnhancedPinProperties(): { [pinId: string]: any } {
    try {
      const saved = localStorage.getItem('lewm-enhanced-pin-properties');
      if (saved) {
        const enhancedData = JSON.parse(saved);
        console.log('📥 Loaded enhanced pin properties from localStorage');
        return enhancedData;
      }
    } catch (error) {
      console.error('Failed to load enhanced pin properties:', error);
    }
    return {};
  }

  /**
   * Apply enhanced properties to a pin when importing from legacy system
   */
  private applyEnhancedPropertiesToPin(pin: Pin): Pin {
    const enhancedData = this.loadEnhancedPinProperties();
    const saved = enhancedData[pin.id];
    
    if (saved) {
      console.log(`🎨 Applying enhanced properties to pin ${pin.id}`);
      return {
        ...pin,
        textStyle: saved.textStyle || pin.textStyle,
        pinStyle: saved.pinStyle || pin.pinStyle,
        pinType: saved.pinType || pin.pinType,
        isInput: saved.isInput !== undefined ? saved.isInput : pin.isInput,
        isOutput: saved.isOutput !== undefined ? saved.isOutput : pin.isOutput,
        dataType: saved.dataType || pin.dataType,
        pinNumber: saved.pinNumber || pin.pinNumber,
        signalName: saved.signalName || pin.signalName,
        pinSize: saved.pinSize || pin.pinSize,
        pinColor: saved.pinColor || pin.pinColor,
        showPinNumber: saved.showPinNumber !== undefined ? saved.showPinNumber : pin.showPinNumber
      };
    }
    
    return pin;
  }

  /**
   * Initialize enhanced properties system
   */
  private initializeEnhancedProperties(): void {
    console.log('🎨 Initializing enhanced pin properties system');
    // Enhanced properties will be loaded automatically when pins are imported
  }

  /**
   * Clear saved enhanced pin properties from localStorage
   */
  clearEnhancedPinProperties(): void {
    localStorage.removeItem('lewm-enhanced-pin-properties');
    console.log('🗑️ Cleared enhanced pin properties from localStorage');
  }
}
