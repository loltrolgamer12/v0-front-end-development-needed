import React from 'react';
import { Car, Plus, Search, Filter, Download } from 'lucide-react';
import '../styles/pages.css';

const Vehicles: React.FC = () => {
  return (
    <div className="vehicles-page">
      <div className="page-header">
        <div className="page-title">
          <Car size={32} />
          <div>
            <h1>Gestión de Vehículos</h1>
            <p>Administra el registro de vehículos del sistema</p>
          </div>
        </div>
        
        <div className="page-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Exportar
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Nuevo Vehículo
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="content-filters">
          <div className="search-bar">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Buscar por patente, marca o modelo..."
              className="search-input"
            />
          </div>
          
          <button className="filter-btn">
            <Filter size={18} />
            Filtros
          </button>
        </div>

        <div className="vehicles-table">
          <div className="table-header">
            <span>Patente</span>
            <span>Marca</span>
            <span>Modelo</span>
            <span>Año</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          
          <div className="table-body">
            <div className="empty-state">
              <Car size={48} />
              <h3>No hay vehículos registrados</h3>
              <p>Comienza agregando un nuevo vehículo al sistema</p>
              <button className="btn-primary">
                <Plus size={18} />
                Agregar Vehículo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vehicles;