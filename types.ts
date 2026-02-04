
export enum CoverageLevel {
  EXCELLENT = 'Excellente',
  GOOD = 'Bonne',
  AVERAGE = 'Moyenne',
  WEAK = 'Faible',
  NONE = 'Aucune'
}

export interface AuditorMetadata {
  name: string;
  postalCode: string;
  city: string;
  team: 'SGS' | 'VIT' | 'Ext';
  type: 'ST' | 'SAL';
}

export interface AuditEntry {
  auditor: string;
  department: string;
  count2024: number;
  count2025: number;
}

export interface DepartmentStats {
  id: string;
  total2025: number;
  total2024: number;
  auditorsCount: number;
  isHomeBaseFor: string[];
  auditors: { name: string; count25: number; count24: number; isBase: boolean }[];
  score: number;
  level: CoverageLevel;
}

export interface GeoJsonFeature {
  type: string;
  properties: {
    code: string;
    nom: string;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}
