import React, { useState } from 'react';
import { AlertTriangle, Car, Info } from 'lucide-react';
import { DetailModal, FailureItem, CriticalVehicle } from './DetailModal';

interface FailuresSummaryProps {
  failureItems: {
    id: string;
    name: string;
    failureCount: number;
    vehiclesAffected: string[];
  }[];
  criticalVehicles: {
    plate: string;
    failureCount: number;
    criticalFailures: number;
    compliance: number;
  }[];
}

const FailuresSummary: React.FC<FailuresSummaryProps> = ({
  failureItems,
  criticalVehicles,
}) => {
  const [selectedFailure, setSelectedFailure] = useState<FailureItem | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<CriticalVehicle | null>(null);

  // Simulated data fetching functions - replace with actual API calls
  const getFailureDetails = (itemId: string): FailureItem => {
    // Mock data - replace with actual API call
    return {
      id: itemId,
      name: failureItems.find(item => item.id === itemId)?.name || '',
      failureCount: failureItems.find(item => item.id === itemId)?.failureCount || 0,
      vehiclesAffected: [
        {
          plate: 'ABC-123',
          count: 5,
          lastReport: '2025-09-10',
          details: ['Requiere atención inmediata', 'Falla recurrente']
        },
        {
          plate: 'XYZ-789',
          count: 3,
          lastReport: '2025-09-12',
          details: ['Mantenimiento programado pendiente']
        }
      ]
    };
  };

  const getVehicleDetails = (plate: string): CriticalVehicle => {
    // Mock data - replace with actual API call
    return {
      plate,
      compliance: criticalVehicles.find(v => v.plate === plate)?.compliance || 0,
      totalFailures: criticalVehicles.find(v => v.plate === plate)?.failureCount || 0,
      criticalFailures: criticalVehicles.find(v => v.plate === plate)?.criticalFailures || 0,
      inspections: {
        total: 321,
        period: 321
      },
      drivers: 11,
      failingItems: [
        {
          name: 'Niveles de fluido refrigerante',
          count: 12,
          isUrgent: true
        },
        {
          name: 'Equipo de carretera',
          count: 8,
          isUrgent: false
        }
      ],
      lastInspection: '2025-07-29',
      documentation: [
        'Tecnomecánica vence en 30 días',
        'Licencia de conducción del conductor principal próxima a vencer'
      ]
    };
  };

  const handleFailureClick = (itemId: string) => {
    const details = getFailureDetails(itemId);
    setSelectedFailure(details);
  };

  const handleVehicleClick = (plate: string) => {
    const details = getVehicleDetails(plate);
    setSelectedVehicle(details);
  };

  return (
    <div className="space-y-8">
      {/* Items que Más Fallan */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Items que Más Fallan
          </h2>
          <div className="space-y-4">
            {failureItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.vehiclesAffected.length} vehículos afectados
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleFailureClick(item.id)}
                  className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded-md"
                >
                  <Info className="w-4 h-4 mr-1" />
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vehículos en Estado Crítico */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Vehículos en Estado Crítico
          </h2>
          <div className="space-y-4">
            {criticalVehicles.map((vehicle) => (
              <div
                key={vehicle.plate}
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Car className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {vehicle.plate}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {vehicle.failureCount} fallas ({vehicle.criticalFailures} críticas)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-red-600">
                    {vehicle.compliance}% cumplimiento
                  </span>
                  <button
                    onClick={() => handleVehicleClick(vehicle.plate)}
                    className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded-md"
                  >
                    <Info className="w-4 h-4 mr-1" />
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modales de Detalles */}
      <DetailModal
        isOpen={selectedFailure !== null}
        onClose={() => setSelectedFailure(null)}
        type="failure"
        data={selectedFailure!}
      />
      <DetailModal
        isOpen={selectedVehicle !== null}
        onClose={() => setSelectedVehicle(null)}
        type="vehicle"
        data={selectedVehicle!}
      />
    </div>
  );
};

export default FailuresSummary;