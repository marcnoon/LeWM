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
      isOutput: true
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
    }
  }

  selectPin(pinId: string, multiSelect: boolean = false): void {
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
    } else {
      this.modeStateSubject.next({
        ...currentState,
        selectedPins: [pinId],
        isMultiSelect: false
      });
    }
  }

  clearSelection(): void {
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      selectedPins: [],
      isMultiSelect: false
    });
  }

  setSubMode(subMode: PinSubMode): void {
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      subMode
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

  openLayoutEditor(): void {
    console.log('Opening pin layout editor');
    this.layoutEditorVisibleSubject.next(true);
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
}
