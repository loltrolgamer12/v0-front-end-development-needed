import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';

interface ProblemItem {
  name: string;
  percentage: number;
  count: string;
  vehicles: Array<{
    plate: string;
    lastInspection: string;
    status: string;
  }>;
}

interface ProblematicItemsProps {
  items: ProblemItem[];
}

const ProblematicItems: React.FC<ProblematicItemsProps> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<ProblemItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleItemClick = (item: ProblemItem) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  return (
    <div className="relative">
      {/* Lista principal de ítems problemáticos */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Items Más Problemáticos</h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.count}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-red-600 font-medium">{item.percentage}%</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalles */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{selectedItem.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedItem.count} | {selectedItem.percentage}% de incidencia
                </p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cerrar detalles"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-700">Vehículos Afectados</h4>
                  <span className="text-sm text-gray-500">
                    {selectedItem.vehicles.length} vehículos
                  </span>
                </div>
                <div className="divide-y">
                  {selectedItem.vehicles.map((vehicle, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{vehicle.plate}</p>
                        <p className="text-sm text-gray-500">
                          Última inspección: {vehicle.lastInspection}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium
                        ${vehicle.status === 'Crítico' ? 'bg-red-100 text-red-700' :
                          vehicle.status === 'Alto' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'}`}
                      >
                        {vehicle.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <p className="text-sm text-gray-500 text-center">
                Los vehículos listados requieren atención inmediata
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblematicItems;