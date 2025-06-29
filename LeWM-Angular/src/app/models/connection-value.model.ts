export type ValueType = 'string' | 'number' | 'decimal' | 'integer' | 'boolean' | 'calculated';

export type UnitType = 
  // Electrical
  | 'voltage' | 'current' | 'resistance' | 'power' | 'frequency' | 'capacitance' | 'inductance'
  // Physical
  | 'length' | 'mass' | 'time' | 'temperature' | 'area' | 'volume' | 'velocity' | 'acceleration' | 'force'
  // Data/Digital
  | 'bits' | 'bytes' | 'bitrate' | 'percentage'
  // No unit
  | 'none';

export interface UnitDefinition {
  type: UnitType;
  symbol: string;
  name: string;
  baseUnit?: string; // For conversions
  conversionFactor?: number;
}

export interface ConnectionValue {
  key: string; // Always a string identifier
  value: string | number | boolean; // Can be any type
  valueType: ValueType;
  unitType?: UnitType;
  unitSymbol?: string; // e.g., "V", "A", "Ω", "m/s"
  description?: string;
  isCalculated?: boolean;
  calculationFormula?: string; // For calculated values
}

// Predefined unit definitions
export const UNIT_DEFINITIONS: Record<UnitType, UnitDefinition[]> = {
  voltage: [
    { type: 'voltage', symbol: 'V', name: 'Volts', baseUnit: 'V', conversionFactor: 1 },
    { type: 'voltage', symbol: 'mV', name: 'Millivolts', baseUnit: 'V', conversionFactor: 0.001 },
    { type: 'voltage', symbol: 'kV', name: 'Kilovolts', baseUnit: 'V', conversionFactor: 1000 }
  ],
  current: [
    { type: 'current', symbol: 'A', name: 'Amperes', baseUnit: 'A', conversionFactor: 1 },
    { type: 'current', symbol: 'mA', name: 'Milliamperes', baseUnit: 'A', conversionFactor: 0.001 },
    { type: 'current', symbol: 'μA', name: 'Microamperes', baseUnit: 'A', conversionFactor: 0.000001 }
  ],
  resistance: [
    { type: 'resistance', symbol: 'Ω', name: 'Ohms', baseUnit: 'Ω', conversionFactor: 1 },
    { type: 'resistance', symbol: 'kΩ', name: 'Kiloohms', baseUnit: 'Ω', conversionFactor: 1000 },
    { type: 'resistance', symbol: 'MΩ', name: 'Megaohms', baseUnit: 'Ω', conversionFactor: 1000000 }
  ],
  power: [
    { type: 'power', symbol: 'W', name: 'Watts', baseUnit: 'W', conversionFactor: 1 },
    { type: 'power', symbol: 'mW', name: 'Milliwatts', baseUnit: 'W', conversionFactor: 0.001 },
    { type: 'power', symbol: 'kW', name: 'Kilowatts', baseUnit: 'W', conversionFactor: 1000 }
  ],
  frequency: [
    { type: 'frequency', symbol: 'Hz', name: 'Hertz', baseUnit: 'Hz', conversionFactor: 1 },
    { type: 'frequency', symbol: 'kHz', name: 'Kilohertz', baseUnit: 'Hz', conversionFactor: 1000 },
    { type: 'frequency', symbol: 'MHz', name: 'Megahertz', baseUnit: 'Hz', conversionFactor: 1000000 }
  ],
  capacitance: [
    { type: 'capacitance', symbol: 'F', name: 'Farads', baseUnit: 'F', conversionFactor: 1 },
    { type: 'capacitance', symbol: 'μF', name: 'Microfarads', baseUnit: 'F', conversionFactor: 0.000001 },
    { type: 'capacitance', symbol: 'nF', name: 'Nanofarads', baseUnit: 'F', conversionFactor: 0.000000001 },
    { type: 'capacitance', symbol: 'pF', name: 'Picofarads', baseUnit: 'F', conversionFactor: 0.000000000001 }
  ],
  inductance: [
    { type: 'inductance', symbol: 'H', name: 'Henries', baseUnit: 'H', conversionFactor: 1 },
    { type: 'inductance', symbol: 'mH', name: 'Millihenries', baseUnit: 'H', conversionFactor: 0.001 },
    { type: 'inductance', symbol: 'μH', name: 'Microhenries', baseUnit: 'H', conversionFactor: 0.000001 }
  ],
  length: [
    { type: 'length', symbol: 'm', name: 'Meters', baseUnit: 'm', conversionFactor: 1 },
    { type: 'length', symbol: 'cm', name: 'Centimeters', baseUnit: 'm', conversionFactor: 0.01 },
    { type: 'length', symbol: 'mm', name: 'Millimeters', baseUnit: 'm', conversionFactor: 0.001 },
    { type: 'length', symbol: 'km', name: 'Kilometers', baseUnit: 'm', conversionFactor: 1000 }
  ],
  mass: [
    { type: 'mass', symbol: 'kg', name: 'Kilograms', baseUnit: 'kg', conversionFactor: 1 },
    { type: 'mass', symbol: 'g', name: 'Grams', baseUnit: 'kg', conversionFactor: 0.001 },
    { type: 'mass', symbol: 'mg', name: 'Milligrams', baseUnit: 'kg', conversionFactor: 0.000001 }
  ],
  time: [
    { type: 'time', symbol: 's', name: 'Seconds', baseUnit: 's', conversionFactor: 1 },
    { type: 'time', symbol: 'ms', name: 'Milliseconds', baseUnit: 's', conversionFactor: 0.001 },
    { type: 'time', symbol: 'μs', name: 'Microseconds', baseUnit: 's', conversionFactor: 0.000001 },
    { type: 'time', symbol: 'min', name: 'Minutes', baseUnit: 's', conversionFactor: 60 },
    { type: 'time', symbol: 'h', name: 'Hours', baseUnit: 's', conversionFactor: 3600 }
  ],
  temperature: [
    { type: 'temperature', symbol: '°C', name: 'Celsius', baseUnit: '°C', conversionFactor: 1 },
    { type: 'temperature', symbol: '°F', name: 'Fahrenheit', baseUnit: '°C' }, // Special conversion
    { type: 'temperature', symbol: 'K', name: 'Kelvin', baseUnit: '°C' } // Special conversion
  ],
  area: [
    { type: 'area', symbol: 'm²', name: 'Square Meters', baseUnit: 'm²', conversionFactor: 1 },
    { type: 'area', symbol: 'cm²', name: 'Square Centimeters', baseUnit: 'm²', conversionFactor: 0.0001 }
  ],
  volume: [
    { type: 'volume', symbol: 'm³', name: 'Cubic Meters', baseUnit: 'm³', conversionFactor: 1 },
    { type: 'volume', symbol: 'L', name: 'Liters', baseUnit: 'm³', conversionFactor: 0.001 },
    { type: 'volume', symbol: 'mL', name: 'Milliliters', baseUnit: 'm³', conversionFactor: 0.000001 }
  ],
  velocity: [
    { type: 'velocity', symbol: 'm/s', name: 'Meters per Second', baseUnit: 'm/s', conversionFactor: 1 },
    { type: 'velocity', symbol: 'km/h', name: 'Kilometers per Hour', baseUnit: 'm/s', conversionFactor: 0.277778 },
    { type: 'velocity', symbol: 'mph', name: 'Miles per Hour', baseUnit: 'm/s', conversionFactor: 0.44704 }
  ],
  acceleration: [
    { type: 'acceleration', symbol: 'm/s²', name: 'Meters per Second Squared', baseUnit: 'm/s²', conversionFactor: 1 }
  ],
  force: [
    { type: 'force', symbol: 'N', name: 'Newtons', baseUnit: 'N', conversionFactor: 1 },
    { type: 'force', symbol: 'kN', name: 'Kilonewtons', baseUnit: 'N', conversionFactor: 1000 }
  ],
  bits: [
    { type: 'bits', symbol: 'bit', name: 'Bits', baseUnit: 'bit', conversionFactor: 1 },
    { type: 'bits', symbol: 'kbit', name: 'Kilobits', baseUnit: 'bit', conversionFactor: 1000 },
    { type: 'bits', symbol: 'Mbit', name: 'Megabits', baseUnit: 'bit', conversionFactor: 1000000 }
  ],
  bytes: [
    { type: 'bytes', symbol: 'B', name: 'Bytes', baseUnit: 'B', conversionFactor: 1 },
    { type: 'bytes', symbol: 'KB', name: 'Kilobytes', baseUnit: 'B', conversionFactor: 1024 },
    { type: 'bytes', symbol: 'MB', name: 'Megabytes', baseUnit: 'B', conversionFactor: 1048576 },
    { type: 'bytes', symbol: 'GB', name: 'Gigabytes', baseUnit: 'B', conversionFactor: 1073741824 }
  ],
  bitrate: [
    { type: 'bitrate', symbol: 'bps', name: 'Bits per Second', baseUnit: 'bps', conversionFactor: 1 },
    { type: 'bitrate', symbol: 'kbps', name: 'Kilobits per Second', baseUnit: 'bps', conversionFactor: 1000 },
    { type: 'bitrate', symbol: 'Mbps', name: 'Megabits per Second', baseUnit: 'bps', conversionFactor: 1000000 }
  ],
  percentage: [
    { type: 'percentage', symbol: '%', name: 'Percent', baseUnit: '%', conversionFactor: 1 }
  ],
  none: [
    { type: 'none', symbol: '', name: 'No Unit', baseUnit: '', conversionFactor: 1 }
  ]
};

// Export available unit types for dropdowns
export const AVAILABLE_UNITS = Object.keys(UNIT_DEFINITIONS).map(type => ({
  type: type as UnitType,
  name: type.charAt(0).toUpperCase() + type.slice(1)
}));