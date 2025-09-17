import React, { useState, useEffect } from 'react';
import { 
  Car, 
  ClipboardCheck, 
  FileText, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
  Activity,
  Filter
} from 'lucide-react';
import './Dashboard.css';
import '../styles/pages.css';

// Tipos para los datos del dashboard
interface DashboardStats {
  totalVehicles: number;
  totalInspections: number;
  pendingInspections: number;
  approvedInspections: number;
  rejectedInspections: number;
  conditionalInspections: number;
  averageScore: number;
  monthlyGrowth: number;
}

interface RecentInspection {
  id: string;
  vehiclePatente: string;
  inspectionNumber: string;
  date: string;
  status: 'Aprobada' | 'Rechazada' | 'Condicional';
  score: number;
  inspector: string;
}

interface ChartData {
  month: string;
  inspections: number;
  approved: number;
  rejected: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInspections, setRecentInspections] = useState<RecentInspection[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('last30days');

  // Simular datos (en producción vendría de la API)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Datos simulados
        const mockStats: DashboardStats = {
          totalVehicles: 1247,
          totalInspections: 3456,
          pendingInspections: 45,
          approvedInspections: 2890,
          rejectedInspections: 234,
          conditionalInspections: 332,
          averageScore: 84.7,
          monthlyGrowth: 12.5
        };

        const mockRecentInspections: RecentInspection[] = [
          {
            id: '1',
            vehiclePatente: 'BBDT12',
            inspectionNumber: 'INS001-2024',
            date: '2024-09-15',
            status: 'Aprobada',
            score: 95.5,
            inspector: 'Juan Pérez'
          },
          {
            id: '2',
            vehiclePatente: 'CCAR34',
            inspectionNumber: 'INS002-2024',
            date: '2024-09-14',
            status: 'Condicional',
            score: 75.8,
            inspector: 'Ana Martínez'
          },
          {
            id: '3',
            vehiclePatente: 'DDXY56',
            inspectionNumber: 'INS003-2024',
            date: '2024-09-13',
            status: 'Rechazada',
            score: 58.2,
            inspector: 'Carlos Rodríguez'
          },
          {
            id: '4',
            vehiclePatente: 'EEFG78',
            inspectionNumber: 'INS004-2024',
            date: '2024-09-12',
            status: 'Aprobada',
            score: 92.1,
            inspector: 'María González'
          },
          {
            id: '5',
            vehiclePatente: 'FFHI90',
            inspectionNumber: 'INS005-2024',
            date: '2024-09-11',
            status: 'Aprobada',
            score: 88.9,
            inspector: 'Luis Torres'
          }
        ];

        const mockChartData: ChartData[] = [
          { month: 'Ene', inspections: 245, approved: 198, rejected: 47 },
          { month: 'Feb', inspections: 267, approved: 215, rejected: 52 },
          { month: 'Mar', inspections: 298, approved: 241, rejected: 57 },
          { month: 'Abr', inspections: 312, approved: 255, rejected: 57 },
          { month: 'May', inspections: 334, approved: 271, rejected: 63 },
          { month: 'Jun', inspections: 356, approved: 289, rejected: 67 },
        ];

        setStats(mockStats);
        setRecentInspections(mockRecentInspections);
        setChartData(mockChartData);
      } catch (err) {
        setError('Error al cargar los datos del dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeFilter]);

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobada':
        return 'status-approved';
      case 'Rechazada':
        return 'status-rejected';
      case 'Condicional':
        return 'status-conditional';
      default:
        return '';
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprobada':
        return <CheckCircle size={16} />;
      case 'Rechazada':
        return <AlertTriangle size={16} />;
      case 'Condicional':
        return <Clock size={16} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner-lg"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertTriangle size={48} />
        <h2>Error al cargar el dashboard</h2>
        <p>{error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header del dashboard */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dashboard</h1>
          <p>Vista general del sistema de inspecciones vehiculares</p>
        </div>
        
        <div className="dashboard-filters">
          <label htmlFor="time-filter" className="sr-only">Filtro de tiempo</label>
          <select 
            id="time-filter"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="time-filter"
            aria-label="Seleccionar período de tiempo"
            title="Seleccionar período de tiempo para mostrar datos"
          >
            <option value="last7days">Últimos 7 días</option>
            <option value="last30days">Últimos 30 días</option>
            <option value="last3months">Últimos 3 meses</option>
            <option value="last6months">Últimos 6 meses</option>
            <option value="lastyear">Último año</option>
          </select>
          
          <button className="filter-button">
            <Filter size={18} />
            Filtros
          </button>
        </div>
      </div>

      {/* Cards de estadísticas principales */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <Car size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats?.totalVehicles.toLocaleString()}</h3>
            <p>Vehículos Registrados</p>
            <span className="stat-change positive">+{stats?.monthlyGrowth}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <ClipboardCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats?.totalInspections.toLocaleString()}</h3>
            <p>Total Inspecciones</p>
            <span className="stat-change positive">+15.2%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats?.pendingInspections}</h3>
            <p>Pendientes</p>
            <span className="stat-change negative">-5.1%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats?.averageScore}%</h3>
            <p>Puntuación Promedio</p>
            <span className="stat-change positive">+2.3%</span>
          </div>
        </div>
      </div>

      {/* Contenido principal del dashboard */}
      <div className="dashboard-content">
        {/* Inspecciones recientes */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Inspecciones Recientes</h2>
            <button className="view-all-button">Ver todas</button>
          </div>
          
          <div className="inspections-table">
            <div className="table-header">
              <span>Patente</span>
              <span>N° Inspección</span>
              <span>Fecha</span>
              <span>Estado</span>
              <span>Puntuación</span>
              <span>Inspector</span>
            </div>
            
            <div className="table-body">
              {recentInspections.map((inspection) => (
                <div key={inspection.id} className="table-row">
                  <span className="vehicle-patente">{inspection.vehiclePatente}</span>
                  <span className="inspection-number">{inspection.inspectionNumber}</span>
                  <span className="inspection-date">
                    {new Date(inspection.date).toLocaleDateString('es-CL')}
                  </span>
                  <span className={`inspection-status ${getStatusColor(inspection.status)}`}>
                    {getStatusIcon(inspection.status)}
                    {inspection.status}
                  </span>
                  <span className="inspection-score">{inspection.score}%</span>
                  <span className="inspector-name">{inspection.inspector}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico de tendencias */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Tendencia de Inspecciones</h2>
            <div className="chart-legend">
              <span className="legend-item approved">Aprobadas</span>
              <span className="legend-item rejected">Rechazadas</span>
            </div>
          </div>
          
          <div className="chart-container">
            <div className="simple-chart">
              {chartData.map((data, index) => (
                <div key={data.month} className="chart-bar">
                  <div className="bar-container">
                    <div 
                      className={`bar bar-approved bar-approved-${index}`}
                      title={`Aprobadas: ${data.approved}`}
                    />
                    <div 
                      className={`bar bar-rejected bar-rejected-${index}`}
                      title={`Rechazadas: ${data.rejected}`}
                    />
                  </div>
                  <span className="bar-label">{data.month}</span>
                </div>
              ))}
              <style>{`
                ${chartData.map((data, index) => `
                  .bar-approved-${index} { height: ${(data.approved / 400) * 100}%; }
                  .bar-rejected-${index} { height: ${(data.rejected / 400) * 100}%; }
                `).join('')}
              `}</style>
            </div>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Resumen por Estado</h2>
          </div>
          
          <div className="status-summary">
            <div className="summary-item">
              <div className="summary-icon success">
                <CheckCircle size={20} />
              </div>
              <div className="summary-content">
                <h3>{stats?.approvedInspections}</h3>
                <p>Aprobadas</p>
                <div className="summary-percentage">
                  {stats && ((stats.approvedInspections / stats.totalInspections) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon danger">
                <AlertTriangle size={20} />
              </div>
              <div className="summary-content">
                <h3>{stats?.rejectedInspections}</h3>
                <p>Rechazadas</p>
                <div className="summary-percentage">
                  {stats && ((stats.rejectedInspections / stats.totalInspections) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon warning">
                <Clock size={20} />
              </div>
              <div className="summary-content">
                <h3>{stats?.conditionalInspections}</h3>
                <p>Condicionales</p>
                <div className="summary-percentage">
                  {stats && ((stats.conditionalInspections / stats.totalInspections) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;