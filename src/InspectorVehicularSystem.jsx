import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import FatigueControl from './components/FatigueControl';
import VehicleSection from './components/VehicleSection';

function InspectorVehicularSystem() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('vehicles');

  useEffect(() => {
    loadInspectionData();
  }, []);

  const loadInspectionData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setData(jsonData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Sistema de Inspección Vehicular</h1>

      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              className={`mr-4 py-2 px-4 ${
                activeTab === 'vehicles'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('vehicles')}
            >
              Vehículos
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === 'fatigue'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('fatigue')}
            >
              Control de Fatiga
            </button>
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'vehicles' ? (
          <VehicleSection inspectionData={data} />
        ) : (
          <FatigueControl inspectionData={data} />
        )}
      </div>
    </div>
  );
}

export default InspectorVehicularSystem;