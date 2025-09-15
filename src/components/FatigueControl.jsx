import React, { useState, useMemo, useEffect } from 'react';
import SearchSelect from './SearchSelect';

const clearLocalData = () => {
  localStorage.clear();
  sessionStorage.clear();
};

const FatigueControl = ({ inspectionData }) => {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [showFailures, setShowFailures] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Restaurar el estado desde localStorage al iniciar
  useEffect(() => {
    const savedDriver = localStorage.getItem('selectedDriver');
    const savedShowFailures = localStorage.getItem('showFailures');
    const savedShowDetails = localStorage.getItem('showDetails');

    if (savedDriver) setSelectedDriver(savedDriver);
    if (savedShowFailures) setShowFailures(savedShowFailures === 'true');
    if (savedShowDetails) setShowDetails(savedShowDetails === 'true');
  }, []);

  useEffect(() => {
    // Limpiar datos cuando se cierra la ventana o se navega fuera
    const handleUnload = () => {
      clearLocalData();
    };

    // Limpiar datos cuando la pestaña pierde el foco
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearLocalData();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getDrivers = useMemo(() => {
    const drivers = new Set();
    inspectionData.forEach(record => {
      if (record.CONDUCTOR) {
        drivers.add(record.CONDUCTOR);
      }
    });
    return Array.from(drivers);
  }, [inspectionData]);

  const normalizeAnswer = (answer) => {
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

  const isFatigueFailure = (record) => {
    const answers = {
      horasSueno: normalizeAnswer(record['¿Ha dormido al menos 7 horas en las últimas 24 horas?']),
      sintomasFatiga: normalizeAnswer(record['¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?']),
      condicionesConducir: normalizeAnswer(record['¿Se siente en condiciones físicas y mentales para conducir?']),
      medicamentos: normalizeAnswer(record['¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*'])
    };
    
    return Object.values(answers).some(answer => answer === 'No cumple');
  };

  const mapRecordToFatigueData = (record) => ({
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

  const driverFatigueData = useMemo(() => 
    selectedDriver
      ? inspectionData
          .filter(record => record.CONDUCTOR === selectedDriver)
          .map(mapRecordToFatigueData)
      : [],
    [inspectionData, selectedDriver]
  );

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
    setShowFailures(false);
    setShowDetails(true);
    // Guardar el estado actual en localStorage
    localStorage.setItem('selectedDriver', driver);
    localStorage.setItem('showFailures', 'false');
    localStorage.setItem('showDetails', 'true');
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <img src="/logo.jpeg" alt="Logo" className="h-12 mr-4" />
        <h2 className="text-xl font-bold">Control de Fatiga</h2>
      </div>
      
      <div className="mb-4 flex space-x-4">
        <div className="flex-1">
          <SearchSelect
            options={getDrivers}
            onSelect={handleDriverSelect}
            placeholder="Buscar conductor..."
            value={selectedDriver}
          />
        </div>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded"
          onClick={() => {
            setShowFailures(!showFailures);
            setShowDetails(false);
          }}
        >
          {showFailures ? 'Ver Todos los Registros' : 'Ver Incumplimientos'}
        </button>
      </div>

      {showFailures ? (
        <div className="mt-4 border rounded p-4">
          <h3 className="font-bold mb-2 text-red-600">Lista de Incumplimientos de Fatiga</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Conductor</th>
                  <th className="p-2">7h Sueño</th>
                  <th className="p-2">Sin Síntomas</th>
                  <th className="p-2">Condiciones</th>
                  <th className="p-2">Medicamentos</th>
                </tr>
              </thead>
              <tbody>
                {fatigueFailures.map((record, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{record.fecha}</td>
                    <td className="p-2">{record.conductor}</td>
                    <td className={`p-2 ${record.horasSueno === 'No' ? 'text-red-600 font-bold' : ''}`}>
                      {record.horasSueno === 'No' ? 'No cumple' : 'Cumple'}
                    </td>
                    <td className={`p-2 ${record.sintomasFatiga === 'No' ? 'text-red-600 font-bold' : ''}`}>
                      {record.sintomasFatiga === 'No' ? 'No cumple' : 'Cumple'}
                    </td>
                    <td className={`p-2 ${record.condicionesConducir === 'No' ? 'text-red-600 font-bold' : ''}`}>
                      {record.condicionesConducir === 'No' ? 'No cumple' : 'Cumple'}
                    </td>
                    <td className={`p-2 ${record.medicamentos === 'Sí' ? 'text-red-600 font-bold' : ''}`}>
                      {record.medicamentos === 'Sí' ? 'No cumple' : 'Cumple'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : showDetails && selectedDriver && (
        <div className="mt-4 border rounded p-4">
          <h3 className="font-bold mb-2">{selectedDriver}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Fecha</th>
                  <th className="p-2">7h Sueño</th>
                  <th className="p-2">Sin Síntomas</th>
                  <th className="p-2">Condiciones</th>
                  <th className="p-2">Medicamentos</th>
                  <th className="p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {driverFatigueData.map((record, index) => (
                  <tr key={index} className={`border-b ${record.esFalla ? 'bg-red-50' : ''}`}>
                    <td className="p-2">{record.fecha}</td>
                    <td className={`p-2 ${record.horasSueno === 'No' ? 'text-red-600 font-bold' : ''}`}>
                      {record.horasSueno === 'No' ? 'No cumple' : 'Cumple'}
                    </td>
                    <td className={`p-2 ${record.sintomasFatiga === 'No' ? 'text-red-600 font-bold' : ''}`}>
                      {record.sintomasFatiga === 'No' ? 'No cumple' : 'Cumple'}
                    </td>
                    <td className={`p-2 ${record.condicionesConducir === 'No' ? 'text-red-600 font-bold' : ''}`}>
                      {record.condicionesConducir === 'No' ? 'No cumple' : 'Cumple'}
                    </td>
                    <td className={`p-2 ${record.medicamentos === 'Sí' ? 'text-red-600 font-bold' : ''}`}>
                      {record.medicamentos === 'Sí' ? 'No cumple' : 'Cumple'}
                    </td>
                    <td className={`p-2 ${record.esFalla ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                      {record.esFalla ? 'No cumple' : 'Cumple'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FatigueControl;