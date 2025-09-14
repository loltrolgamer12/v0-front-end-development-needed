export interface InspectionItem {
  value: string;
  isCritical: boolean;
  compliant: boolean;
  originalValue: string;
}

export interface Inspection {
  id: number;
  timestamp: string | null;
  date: Date;
  year: string;
  month: string;
  day: string;
  inspector: string;
  vehicle: string;
  contract: string;
  location: string;
  mileage: number;
  shift: string;
  observations: string;
  items: Record<string, InspectionItem>;
  compliance: number;
  criticalFailures: number;
  totalItems: number;
  compliantItems: number;
  riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  hasCriticalItems: boolean;
  status: 'active' | 'inactive';
  lastInspection?: string;
}

export interface SystemStats {
  totalInspections: number;
  totalRawRecords: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  averageCompliance: number;
  criticalFailures: number;
  riskDistribution: {
    Bajo: number;
    Medio: number;
    Alto: number;
    Crítico: number;
  };
  uniqueCounts: {
    inspectors: number;
    vehicles: number;
    locations: number;
    contracts: number;
    shifts: number;
    inspectionItems: number;
    criticalItems: number;
  };
}