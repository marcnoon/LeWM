export interface PinPosition {
  x: number;
  y: number;
  side: 'top' | 'right' | 'bottom' | 'left';
  offset: number; // 0-1 along the side
}

export interface PinTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string;
  orientation: number; // rotation in degrees
  alignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'middle' | 'bottom';
  offset: { x: number; y: number }; // offset from pin position
}

export interface PinStyle {
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
  borderWidth: number;
  borderColor: string;
}

export interface Pin {
  id: string;
  nodeId: string;
  label: string;
  position: PinPosition;
  textStyle: PinTextStyle;
  pinStyle: PinStyle;
  isInput: boolean;
  isOutput: boolean;
  dataType?: string;
  isSelected?: boolean;
}

export type PinSubMode = 'layout' | 'text' | 'properties';

export interface PinModeState {
  subMode: PinSubMode;
  selectedPins: string[];
  isMultiSelect: boolean;
  gridSnap: boolean;
  showGuides: boolean;
  previewPin?: Partial<Pin>;
}

export const DEFAULT_PIN_TEXT_STYLE: PinTextStyle = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  fontWeight: 'normal',
  color: '#000000',
  orientation: 0,
  alignment: 'center',
  verticalAlignment: 'middle',
  offset: { x: 0, y: 0 }
};

export const DEFAULT_PIN_STYLE: PinStyle = {
  size: 8,
  color: '#4CAF50',
  shape: 'circle',
  borderWidth: 1,
  borderColor: '#2E7D32'
};
