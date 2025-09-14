import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AdvancedFilters } from '../shared/AdvancedFilters';
import { StatCard } from '../shared/StatCard';
import type { DetailItem } from '../shared/StatCard';
import type { Inspection } from '../../types/inspection';
import { Car, FileText, AlertTriangle, CheckSquare } from 'lucide-react';

const InspectorVehicularSystem: React.FC = () => {
  const { user } = useAuth();
  const { 
    data,
    filters,
    filterOptions,
    totalResults,
    totalItems,
    showFilters,
    onFilterChange,
    onSearchSubmit,
    onClearFilters
  } = useData();

  if (!user) {
    return <div>Please log in to access the system.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Inspecciones"
          value={data.totalInspections}
          icon={FileText}
          bgColor="bg-blue-50"
          textColor="text-blue-700"
          iconColor="text-blue-500"
          details={[
            {
              label: 'Inspecciones Completadas',
              value: `${data.stats.totalInspections} inspecciones`
            },
            {
              label: 'Promedio de Cumplimiento',
              value: `${data.stats.averageCompliance.toFixed(1)}%`
            },
            {
              label: 'Período',
              value: `${data.stats.dateRange.start ? new Date(data.stats.dateRange.start).toLocaleDateString() : 'N/A'} - ${data.stats.dateRange.end ? new Date(data.stats.dateRange.end).toLocaleDateString() : 'N/A'}`
            }
          ]}
        />
        <StatCard
          title="Vehículos Activos"
          value={data.activeVehicles}
          icon={Car}
          bgColor="bg-green-50"
          textColor="text-green-700"
          iconColor="text-green-500"
          details={data.inspections
            .filter(insp => insp.vehicle)
            .reduce((acc: DetailItem[], insp) => {
              const existingVehicle = acc.find(item => item.label === insp.vehicle);
              if (!existingVehicle && acc.length < 10) {
                acc.push({
                  label: insp.vehicle,
                  value: 'Activo',
                  info: `Última inspección: ${new Date(insp.timestamp || '').toLocaleDateString()}`
                });
              }
              return acc;
            }, [])}
        />
        <StatCard
          title="Alertas Críticas"
          value={data.stats.criticalFailures}
          icon={AlertTriangle}
          bgColor="bg-red-50"
          textColor="text-red-700"
          iconColor="text-red-500"
        />
        <StatCard
          title="Cumplimiento"
          value={`${data.stats.averageCompliance}%`}
          icon={CheckSquare}
          bgColor="bg-purple-50"
          textColor="text-purple-700"
          iconColor="text-purple-500"
        />
      </div>

      <AdvancedFilters
        filters={filters}
        options={filterOptions}
        onFilterChange={onFilterChange}
        onSearchSubmit={onSearchSubmit}
        onClearFilters={onClearFilters}
        totalResults={totalResults}
        totalItems={totalItems}
        showFilters={showFilters}
      />

      {/* Add inspection list, charts, etc. here */}
    </div>
  );
};

export default InspectorVehicularSystem;