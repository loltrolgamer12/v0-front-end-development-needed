/** @jsxImportSource react */
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import InspectorVehicularSystem from './InspectorVehicularSystem';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <div className="App">
          <InspectorVehicularSystem />
        </div>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;