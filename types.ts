export interface Meeting {
  date: string; // YYYY-MM-DD
  hikeBps: number;
}

export interface TurnPremiums {
  monthEnd: number;
  quarterEnd: number;
  yearEnd: number;
}

export interface Scenario {
  id: string;
  name: string;
  baseSofr: number;
  baseEffr: number | null; 
  meetings: Meeting[];
  turns: TurnPremiums;
}

export interface DailyRate {
  date: string;
  dayType: 'Business' | 'Weekend' | 'Holiday';
  baseRate: number;
  turnPremium: number;
  finalRate: number;
  isMeetingDate: boolean;
  isTurn: boolean;
}

// Generic instrument structure for Tables
export interface DerivedInstrument {
  id: string;
  name: string;
  price: number; // For Outright: 100-Rate. For Spread: Diff.
  rate: number;  // Underlying rate value (optional)
  // Sensitivity: 1.0 means 100% of the hike passes through. -1.0 means negative correlation.
  meetingSensitivities: Record<string, number>; 
}

export interface MarketData {
    monthly: {
        outrights: DerivedInstrument[];
        spreads: DerivedInstrument[];
        flies: DerivedInstrument[];
    };
    quarterly: {
        outrights: DerivedInstrument[];
        spreads: DerivedInstrument[];
        flies: DerivedInstrument[];
        deflies: DerivedInstrument[]; // Double Flies
        condors: DerivedInstrument[];
    };
}

export interface Holiday {
  date: string;
  localName: string;
  name: string;
}

// Retain for backward compat if needed, but we will mostly use MarketData
export interface MonthlyContract extends DerivedInstrument {
    month: number;
    year: number;
}
export interface QuarterlyContract extends DerivedInstrument {
    startDate: string;
    endDate: string;
}