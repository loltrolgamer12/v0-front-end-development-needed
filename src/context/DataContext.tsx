import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Inspection, SystemStats } from '../types/inspection';

interface ProcessedData {
  inspections: Inspection[];
  rawInspections: any[];
  columns: string[];
  uniqueValues: Record<string, string[]>;
  stats: SystemStats;
  totalInspections: number;
  activeVehicles: number;
  criticalAlerts: number;
  itemAnalysis: {
    critical: number;
    noncritical: number;
    total: number;
  };
  metadata: {
    fileName: string;
    fileSize: number;
    processedAt: string;
    processingTime: number;
  };
}

interface DateRange {
  start: string;
  end: string;
}

interface Filters {
  search: string;
  inspector: string;
  vehicle: string;
  location: string;
  contract: string;
  shift: string;
  year: string;
  month: string;
  day: string;
  complianceMin: number;
  complianceMax: number;
  dateRange: DateRange;
  riskLevel: string;
  criticalItemsOnly: boolean;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
  status?: 'active' | 'inactive';
  lastInspection?: string;
}

interface FilterOptions {
  inspectors: FilterOption[];
  vehicles: FilterOption[];
  locations: FilterOption[];
  contracts: FilterOption[];
  shifts: FilterOption[];
  years: FilterOption[];
  status: FilterOption[];
  riskLevels: FilterOption[];
}

interface DataContextType {
  data: ProcessedData;
  filters: Filters;
  filterOptions: FilterOptions;
  totalResults: number;
  totalItems: number;
  showFilters: boolean;
  onFilterChange: (key: keyof Filters, value: string | number | boolean | DateRange) => void;
  onSearchSubmit: (searchText: string) => void;
  onClearFilters: () => void;
}

const defaultFilters: Filters = {
  search: '',
  inspector: '',
  vehicle: '',
  location: '',
  contract: '',
  shift: '',
  year: '',
  month: '',
  day: '',
  complianceMin: 0,
  complianceMax: 100,
  dateRange: {
    start: '',
    end: ''
  },
  riskLevel: '',
  criticalItemsOnly: false,
  status: '',
  sortBy: '',
  sortOrder: 'asc'
};

const defaultData: ProcessedData = {
  inspections: [],
  rawInspections: [],
  columns: [],
  uniqueValues: {},
  stats: {
    totalInspections: 0,
    totalRawRecords: 0,
    dateRange: {
      start: null,
      end: null
    },
    averageCompliance: 0,
    criticalFailures: 0,
    riskDistribution: {
      Bajo: 0,
      Medio: 0,
      Alto: 0,
      Crítico: 0
    },
    uniqueCounts: {
      inspectors: 0,
      vehicles: 0,
      locations: 0,
      contracts: 0,
      shifts: 0,
      inspectionItems: 0,
      criticalItems: 0
    }
  },
  totalInspections: 0,
  activeVehicles: 0,
  criticalAlerts: 0,
  itemAnalysis: {
    critical: 0,
    noncritical: 0,
    total: 0
  },
  metadata: {
    fileName: '',
    fileSize: 0,
    processedAt: '',
    processingTime: 0
  }
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ProcessedData>(defaultData);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    inspectors: [],
    vehicles: [],
    locations: [],
    contracts: [],
    shifts: [],
    years: [],
    status: [],
    riskLevels: []
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof Filters, value: string | number | boolean | DateRange) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (key === 'dateRange' && typeof value === 'object') {
        newFilters.dateRange = value as DateRange;
      } else if (typeof value !== 'object') {
        // Type assertion to ensure we only set non-object values to non-dateRange keys
        (newFilters[key] as typeof value) = value;
      }
      return newFilters;
    });
  };

  const handleSearchSubmit = (searchText: string) => {
    setFilters(prev => ({ ...prev, search: searchText }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const getFilteredData = useCallback(() => {
    let filtered = [...data.inspections];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(insp => 
        (insp.inspector && insp.inspector.toLowerCase().includes(searchTerm)) ||
        (insp.vehicle && insp.vehicle.toLowerCase().includes(searchTerm)) ||
        (insp.location && insp.location.toLowerCase().includes(searchTerm)) ||
        (insp.contract && insp.contract.toLowerCase().includes(searchTerm)) ||
        (insp.observations && insp.observations.toLowerCase().includes(searchTerm))
      );
    }

    // Apply individual filters
    if (filters.inspector) filtered = filtered.filter(insp => insp.inspector === filters.inspector);
    if (filters.vehicle) filtered = filtered.filter(insp => insp.vehicle === filters.vehicle);
    if (filters.location) filtered = filtered.filter(insp => insp.location === filters.location);
    if (filters.contract) filtered = filtered.filter(insp => insp.contract === filters.contract);
    if (filters.shift) filtered = filtered.filter(insp => insp.shift === filters.shift);
    if (filters.year) filtered = filtered.filter(insp => insp.year === filters.year);

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(insp => {
        const inspDate = new Date(insp.date);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && endDate) {
          return inspDate >= startDate && inspDate <= endDate;
        } else if (startDate) {
          return inspDate >= startDate;
        } else if (endDate) {
          return inspDate <= endDate;
        }
        return true;
      });
    }

    // Apply risk level filter
    if (filters.riskLevel) {
      filtered = filtered.filter(insp => insp.riskLevel === filters.riskLevel);
    }

    // Apply critical items filter
    if (filters.criticalItemsOnly) {
      filtered = filtered.filter(insp => insp.hasCriticalItems);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(insp => insp.status === filters.status);
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof typeof a];
        const bValue = b[filters.sortBy as keyof typeof b];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return filters.sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return filters.sortOrder === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }

        if (aValue instanceof Date && bValue instanceof Date) {
          return filters.sortOrder === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        return 0;
      });
    }

    return filtered;
  }, [data.inspections, filters]);

  const filteredData = getFilteredData();
  const totalResults = filteredData.length;
  const totalItems = data.inspections.length;

  return (
    <DataContext.Provider
      value={{
        data,
        filters,
        filterOptions,
        totalResults,
        totalItems,
        showFilters,
        onFilterChange: handleFilterChange,
        onSearchSubmit: handleSearchSubmit,
        onClearFilters: handleClearFilters
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export type { Filters };
export default DataContext;