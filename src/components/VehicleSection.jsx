import React, { useState } from 'react';
import SearchSelect from './SearchSelect';

const VehicleSection = ({ inspectionData }) => {
  const [showInvalidPlates, setShowInvalidPlates] = useState(false);
  const [selectedPlate, setSelectedPlate] = useState(null);

  // Función para validar formato de placa
  const isValidPlate = (plate) => {
    if (!plate || typeof plate !== 'string') return false;
    const normalizedPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return /^[A-Z]{3}\d{3}$/.test(normalizedPlate);
  };

  // Obtener todas las placas válidas
  const getValidPlates = () => {
    const plates = new Set();
    inspectionData.forEach(record => {
      if (record.PLACA && isValidPlate(record.PLACA)) {
        plates.add(record.PLACA.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
      }
    });
    return Array.from(plates);
  };

  // Obtener registros con placas inválidas
  const getInvalidPlatesData = () => {
    return inspectionData.filter(record => 
      record.PLACA && !isValidPlate(record.PLACA)
    ).map(record => ({
      placa: record.PLACA,
      conductor: record.CONDUCTOR,
      fecha: record.FECHA
    }));
  };

  // Obtener datos de una placa específica
  const getPlateData = (plate) => {
    return inspectionData.filter(record => 
      record.PLACA && record.PLACA.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === plate
    );
  };

  const handlePlateSelect = (plate) => {
    setSelectedPlate(plate);
    setShowInvalidPlates(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Sección de Vehículos</h2>

      <div className="mb-4 flex space-x-4">
        <div className="flex-1">
          <SearchSelect
            options={getValidPlates()}
            onSelect={handlePlateSelect}
            placeholder="Buscar placa..."
            value={selectedPlate}
          />
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => setShowInvalidPlates(!showInvalidPlates)}
        >
          {showInvalidPlates ? 'Ver Placas Válidas' : 'Ver Placas Inválidas'}
        </button>
      </div>

      {showInvalidPlates ? (
        <div className="mt-4 border rounded p-4">
          <h3 className="font-bold mb-2">Placas Inválidas</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Placa Inválida</th>
                  <th className="p-2">Conductor</th>
                  <th className="p-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {getInvalidPlatesData().map((record, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{record.placa}</td>
                    <td className="p-2">{record.conductor}</td>
                    <td className="p-2">{record.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedPlate && (
        <div className="mt-4 border rounded p-4">
          <h3 className="font-bold mb-2">Información de Placa: {selectedPlate}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Conductor</th>
                </tr>
              </thead>
              <tbody>
                {getPlateData(selectedPlate).map((record, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{record.FECHA}</td>
                    <td className="p-2">{record.CONDUCTOR}</td>
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

export default VehicleSection;