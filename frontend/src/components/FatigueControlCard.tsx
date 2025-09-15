import React, { useState } from 'react';
import { Clock, AlertTriangle, Info } from 'lucide-react';
import ProgressBar from '../common/ProgressBar/ProgressBar';

interface FatigueControlCardProps {
  conductor: {
    nombre: string;
    ultimoDescanso: string;
    horasConducidas: number;
    horasDescanso: number;
    alertas: string[];
    riesgoFatiga: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
    ubicacionActual: string;
    vehiculo: string;
    turno: string;
  };
}

const FatigueControlCard: React.FC<FatigueControlCardProps> = ({ conductor }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getRiesgoColor = (riesgo: string) => {
    switch (riesgo) {
      case 'Bajo':
        return 'bg-green-100 text-green-800';
      case 'Medio':
        return 'bg-yellow-100 text-yellow-800';
      case 'Alto':
        return 'bg-orange-100 text-orange-800';
      case 'Crítico':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (horas: number, limite: number) => {
    const porcentaje = (horas / limite) * 100;
    if (porcentaje < 50) return 'bg-green-500';
    if (porcentaje < 75) return 'bg-yellow-500';
    if (porcentaje < 90) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {conductor.nombre}
          </h3>
          <p className="text-sm text-gray-500">{conductor.vehiculo} - {conductor.ubicacionActual}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getRiesgoColor(
            conductor.riesgoFatiga
          )}`}
        >
          {conductor.riesgoFatiga}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Horas Conducidas (Últimas 24h)</span>
            <span>{conductor.horasConducidas}h / 12h</span>
          </div>
          <ProgressBar
            value={conductor.horasConducidas}
            maxValue={12}
            label="Horas conducidas en últimas 24 horas"
            colorClass={getProgressColor(conductor.horasConducidas, 12)}
          />
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Descanso Acumulado</span>
            <span>{conductor.horasDescanso}h / 8h</span>
          </div>
          <ProgressBar
            value={conductor.horasDescanso}
            maxValue={8}
            label="Horas de descanso acumuladas"
            colorClass={getProgressColor(8 - conductor.horasDescanso, 8)}
          />
        </div>
      </div>

      {/* ... resto del código igual ... */}
    </div>
  );
};

export default FatigueControlCard;