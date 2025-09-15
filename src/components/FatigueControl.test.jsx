import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FatigueControl from './FatigueControl';

describe('FatigueControl Component', () => {
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

  test('renders fatigue control title', () => {
    render(<FatigueControl inspectionData={mockData} />);
    expect(screen.getByText('Control de Fatiga')).toBeInTheDocument();
  });

  test('search input is present', () => {
    render(<FatigueControl inspectionData={mockData} />);
    expect(screen.getByPlaceholderText('Buscar conductor...')).toBeInTheDocument();
  });

  test('shows failures button', () => {
    render(<FatigueControl inspectionData={mockData} />);
    expect(screen.getByText('Ver Incumplimientos')).toBeInTheDocument();
  });

  test('can toggle between all records and failures', () => {
    render(<FatigueControl inspectionData={mockData} />);
    const toggleButton = screen.getByText('Ver Incumplimientos');
    
    // Click to show failures
    fireEvent.click(toggleButton);
    expect(screen.getByText('Lista de Incumplimientos de Fatiga')).toBeInTheDocument();
    
    // Click to show all records
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Lista de Incumplimientos de Fatiga')).not.toBeInTheDocument();
  });

  test('can search and select a driver', async () => {
    render(<FatigueControl inspectionData={mockData} />);
    const searchInput = screen.getByPlaceholderText('Buscar conductor...');
    
    // Type in search
    fireEvent.change(searchInput, { target: { value: 'Juan' } });
    
    // Wait for and click on the search result
    const driverOption = await screen.findByText('Juan Pérez');
    fireEvent.click(driverOption);
    
    // Verify driver details are shown in the table
    const driverHeader = screen.getByRole('heading', { name: 'Juan Pérez' });
    expect(driverHeader).toBeInTheDocument();
    
    // Verify all status cells for this driver show 'Cumple'
    // We expect to see 5 'Cumple': 4 answers + 1 overall status
    const cumpleElements = screen.getAllByText('Cumple');
    expect(cumpleElements).toHaveLength(5);
  });

  test('shows correct status for non-compliant records', async () => {
    render(<FatigueControl inspectionData={mockData} />);
    const searchInput = screen.getByPlaceholderText('Buscar conductor...');
    
    // Search for driver with non-compliant records
    fireEvent.change(searchInput, { target: { value: 'María' } });
    const driverOption = await screen.findByText('María López');
    fireEvent.click(driverOption);
    
    // Verify non-compliant status is shown
    const noCumpleElements = screen.getAllByText('No cumple');
    expect(noCumpleElements.length).toBeGreaterThan(0);
  });
});