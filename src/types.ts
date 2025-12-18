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
}

export interface Constants {
  nominal: ConstantValues;
  optimized: ConstantValues;
}

export interface Lens {
  id: string;
  manufacturer: string;
  name: string;
  specifications: Specifications;
  availability: Availability;
  constants: Constants;
}

export enum FilterTab {
  BASIC = 'BASIC',
  ADVANCED = 'ADVANCED',
  CALCULATOR = 'CALCULATOR'
}

export interface BasicFilters {
  manufacturer: string;
  opticConcept: string;
  toric: string; // 'all', 'yes', 'no'
}

export interface AdvancedFilters {
  filterMinSphere: number;
  filterMaxSphere: number;
  isPreloaded: boolean;
  isYellowFilter: boolean;
  hydroType: string; // 'all', 'hydrophilic', 'hydrophobic'
  keyword: string;
}