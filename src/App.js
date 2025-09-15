import React, { useState } from 'react';
import FatigueControl from './components/FatigueControl';

// Datos de ejemplo para pruebas
const mockData = [
  {
    FECHA: '2025-09-14',
    CONDUCTOR: 'Juan Pérez',
    '¿Ha dormido al menos 7 horas en las últimas 24 horas?': 'Cumple',
    '¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?': 'Cumple',
    '¿Se siente en condiciones físicas y mentales para conducir?': 'Cumple',
    '¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*': 'No'
  },
  {
    FECHA: '2025-09-14',
    CONDUCTOR: 'María López',
    '¿Ha dormido al menos 7 horas en las últimas 24 horas?': 'No cumple',
    '¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?': 'Cumple',
    '¿Se siente en condiciones físicas y mentales para conducir?': 'Cumple',
    '¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*': 'Sí'
  }
];

function App() {
  return (
    <div className="container mx-auto">
      <FatigueControl inspectionData={mockData} />
    </div>
  );
}

export default App;