
// --- Type Definitions for Rules ---
export type LensStatus = 'transparente' | 'presbicia' | 'disfuncional' | 'catarata';

export interface Rule {
  result: string;
  conditions: {
    ageGroup?: number[];
    laGroup?: number[];
    lensStatus?: LensStatus[];
    specialConditions?: string[]; // Must match all specified conditions
    negatedConditions?: string[]; // Must NOT match any specified conditions
  };
}

export interface SphereRange {
  from: number;
  to: number;
  increment: number;
}

export interface Availability {
  sphereRanges: SphereRange[];
  additions: number[];
  minSphere: number; // Absolute start value (e.g., -10)
  maxSphere: number; // Absolute end value (e.g., 30)
  totalDiopterRange: number; // Calculated field: Max To - Min From
}

export interface Specifications {
  singlePiece: boolean;
  opticMaterial: string;
  hapticMaterial: string;
  preloaded: boolean;
  foldable: boolean;
  incisionWidth: number | null;
  injectorSize: number | null;
  hydro: string;
  filter: string;
  refractiveIndex: number | null;
  abbeNumber: number | null;
  achromatic: boolean;
  opticDiameter: number | null;
  hapticDiameter: number | null;
  opticConcept: string;
  hapticDesign: string;
  intendedLocation: string;
  opticDesign: string;
  aberration: string;
  saCorrection: number | null;
  toric: boolean;
  technology?: string;
}

export interface ConstantValues {
  ultrasound?: number | null;
  srkt?: number | null;
  haigis_a0?: number | null;
  haigis_a1?: number | null;
  haigis_a2?: number | null;
  hoffer_q?: number | null;
  holladay_1?: number | null;
  barrett?: number | null;
  pacd?: number | null;
  sf?: number | null;
}

export interface Constants {
  sourceType: 'nominal' | 'ulib' | null;
  source: ConstantValues;
  optimized: ConstantValues;
}

export interface Lens {
  id: string;
  manufacturer: string;
  name: string;
  note?: string; // Campo opcional para notas personalizadas
  specifications: Specifications;
  availability: Availability;
  constants: Constants;
}

export enum FilterTab {
  BASIC = 'BASIC',
  ADVANCED = 'ADVANCED',
  DR_ALFONSO = 'DR_ALFONSO'
}

export interface BasicFilters {
  manufacturer: string;
  clinicalConcept: string; // New field
  opticConcept: string;
  toric: string; // 'all', 'yes', 'no'
  technology: string;
}

export interface AdvancedFilters {
  filterMinSphere: number;
  filterMaxSphere: number;
  isPreloaded: boolean;
  isYellowFilter: boolean;
  hydroType: string; // 'all', 'hydrophilic', 'hydrophobic'
  keyword: string;
}

export interface DrAlfonsoInputs {
  age: string;
  axialLength: string;
  lensStatus: 'any' | 'transparente' | 'presbicia' | 'disfuncional' | 'catarata' | 'otro';
  refraction: 'any' | 'hipermetrope_extremo' | 'hipermetrope_alto' | 'emetrope' | 'miope_alto' | 'miope_extremo';
  lensMaterial: 'any' | 'hidrofilico' | 'hidrofobico';
  hapticDesign: string;
  opticConcept: string;
  toric: 'any' | 'yes' | 'no';
  technology: string;
  
  // New grouped conditions
  lvc: string;
  udva: string;
  contactLenses: string;
  anteriorChamber: string;
  retina: string;
}
