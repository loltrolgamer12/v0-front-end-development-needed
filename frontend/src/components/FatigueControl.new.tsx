import React, { useState, useMemo } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';
import SearchSelect from './SearchSelect';

interface InspectionData {
  FECHA: string;
  CONDUCTOR: string;
  '¿Ha dormido al menos 7 horas en las últimas 24 horas?': string;
  '¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?': string;
  '¿Se siente en condiciones físicas y mentales para conducir?': string;
  '¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*': string;
}

interface FatigueControlProps {
  inspectionData: InspectionData[];
}

const FatigueControl: React.FC<FatigueControlProps> = ({ inspectionData }) => {
  const [showFailures, setShowFailures] = useState(false);

  const normalizeAnswer = (answer: string | undefined): string => {
    if (!answer || typeof answer !== 'string') {
      return 'No cumple';
    }
    
    const answerLower = answer.toLowerCase().trim();
    
    if (answerLower === 'cumple') {
      return 'Cumple';
    }

    if (answerLower === 'no cumple') {
      return 'No cumple';
    }
    
    if (answerLower === 'sí' || answerLower === 'si') {
      return 'Sí';
    }
    
    if (answerLower === 'no') {
      return 'No';
    }
    
    return 'No cumple';
  };

  const isFatigueFailure = (record: InspectionData): boolean => {
    const answers = {
      horasSueno: normalizeAnswer(record['¿Ha dormido al menos 7 horas en las últimas 24 horas?']),
      sintomasFatiga: normalizeAnswer(record['¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?']),
      condicionesConducir: normalizeAnswer(record['¿Se siente en condiciones físicas y mentales para conducir?']),
      medicamentos: normalizeAnswer(record['¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*'])
    };
    
    return Object.values(answers).some(answer => answer === 'No cumple');
  };

  interface FatigueData {
    fecha: string;
    conductor: string;
    horasSueno: string;
    sintomasFatiga: string;
    condicionesConducir: string;
    medicamentos: string;
    esFalla: boolean;
  }

  const mapRecordToFatigueData = (record: InspectionData): FatigueData => ({
    fecha: record.FECHA,
    conductor: record.CONDUCTOR,
    horasSueno: normalizeAnswer(record['¿Ha dormido al menos 7 horas en las últimas 24 horas?']),
    sintomasFatiga: normalizeAnswer(record['¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?']),
    condicionesConducir: normalizeAnswer(record['¿Se siente en condiciones físicas y mentales para conducir?']),
    medicamentos: normalizeAnswer(record['¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*']),
    esFalla: isFatigueFailure(record)
  });

  const fatigueFailures = useMemo(() => 
    inspectionData
      .filter(record => isFatigueFailure(record))
      .map(mapRecordToFatigueData),
    [inspectionData]
  );

  const calculateStats = () => {
    const total = inspectionData.length;
    const failures = fatigueFailures.length;
    const compliance = ((total - failures) / total) * 100;
    
    return {
      total,
      failures,
      compliance
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-semibold">{stats.total}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Cumplimiento</p>
          <p className="text-lg font-semibold text-green-600">{stats.compliance.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Fallas</p>
          <p className="text-lg font-semibold text-red-600">{stats.failures}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-end">
        <button
          className="flex items-center px-3 py-1.5 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100"
          onClick={() => setShowFailures(!showFailures)}
        >
          <Filter className="w-4 h-4 mr-1" />
          {showFailures ? 'Ver Todos' : 'Ver Fallas'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left font-medium text-gray-500">Fecha</th>
              <th className="p-2 text-left font-medium text-gray-500">Conductor</th>
              <th className="p-2 text-left font-medium text-gray-500">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(showFailures ? fatigueFailures : inspectionData.map(mapRecordToFatigueData))
              .slice(0, 5)
              .map((record, index) => (
                <tr key={index} className={`hover:bg-gray-50 ${record.esFalla ? 'bg-red-50' : ''}`}>
                  <td className="p-2 text-gray-600">{record.fecha}</td>
                  <td className="p-2 font-medium text-gray-900">{record.conductor}</td>
                  <td className="p-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      record.esFalla 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {record.esFalla ? 'No cumple' : 'Cumple'}
                    </span>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FatigueControl;