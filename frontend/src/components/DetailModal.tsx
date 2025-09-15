import React, { useState } from 'react';
import { AlertTriangle, Clock, Car, Wrench, X, Info } from 'lucide-react';

interface FailureItem {
  id: string;
  name: string;
  failureCount: number;
  vehiclesAffected: {
    plate: string;
    count: number;
    lastReport: string;
    details: string[];
  }[];
}

interface CriticalVehicle {
  plate: string;
  compliance: number;
  totalFailures: number;
  criticalFailures: number;
  inspections: {
    total: number;
    period: number;
  };
  drivers: number;
  failingItems: {
    name: string;
    count: number;
    isUrgent: boolean;
  }[];
  lastInspection: string;
  documentation: string[];
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'failure' | 'vehicle';
  data: FailureItem | CriticalVehicle;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, type, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {type === 'failure' 
              ? `Detalles de Falla: ${(data as FailureItem).name}`
              : `Detalles de Vehículo: ${(data as CriticalVehicle).plate}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {type === 'failure' ? (
            <FailureDetails item={data as FailureItem} />
          ) : (
            <VehicleDetails vehicle={data as CriticalVehicle} />
          )}
        </div>
      </div>
    </div>
  );
};

const FailureDetails: React.FC<{ item: FailureItem }> = ({ item }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
          <p className="text-sm text-gray-500">Total de fallas: {item.failureCount}</p>
        </div>
        <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          {item.vehiclesAffected.length} vehículos afectados
        </span>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Vehículos Afectados</h4>
        <div className="grid gap-4">
          {item.vehiclesAffected.map((vehicle) => (
            <div
              key={vehicle.plate}
              className="bg-gray-50 rounded-lg p-4 border"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-gray-900">{vehicle.plate}</h5>
                  <p className="text-sm text-gray-500">
                    Ocurrencias: {vehicle.count}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Último reporte:</p>
                  <p className="text-sm font-medium text-gray-900">
                    {vehicle.lastReport}
                  </p>
                </div>
              </div>
              {vehicle.details.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Detalles adicionales:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {vehicle.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const VehicleDetails: React.FC<{ vehicle: CriticalVehicle }> = ({ vehicle }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Información General</h3>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cumplimiento</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vehicle.compliance}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fallas Críticas</p>
                <p className="text-lg font-semibold text-red-600">
                  {vehicle.criticalFailures}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Inspecciones</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vehicle.inspections.total}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Conductores</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vehicle.drivers}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900">Última Inspección</h3>
            <p className="text-sm text-gray-600 mt-1">
              {vehicle.lastInspection}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Items que Fallan
          </h3>
          <div className="space-y-3">
            {vehicle.failingItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  item.isUrgent ? 'bg-red-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {item.isUrgent && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        item.isUrgent ? 'text-red-900' : 'text-gray-900'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-sm ${
                      item.isUrgent ? 'text-red-600' : 'text-gray-500'
                    }`}
                  >
                    {item.count} ocurrencias
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {vehicle.documentation.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Documentación
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="space-y-2">
              {vehicle.documentation.map((doc, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-sm">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Wrench className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Recomendación de Mantenimiento
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Debido al alto número de fallas críticas y el bajo cumplimiento,
                  se recomienda programar un mantenimiento correctivo inmediato.
                  Priorizar la revisión de los items críticos identificados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DetailModal };
export type { FailureItem, CriticalVehicle };