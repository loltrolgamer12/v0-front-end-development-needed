import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchSelect from './SearchSelect';

describe('SearchSelect Component', () => {
  const mockOptions = ['Juan Pérez', 'María López', 'Carlos Rodríguez'];
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  test('renders search input', () => {
    render(
      <SearchSelect
        options={mockOptions}
        onSelect={mockOnSelect}
        placeholder="Buscar..."
      />
    );
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  test('filters options based on input', () => {
    render(
      <SearchSelect
        options={mockOptions}
        onSelect={mockOnSelect}
        placeholder="Buscar..."
      />
    );
    
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'Juan' } });
    
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.queryByText('María López')).not.toBeInTheDocument();
  });

  test('calls onSelect when option is clicked', () => {
    render(
      <SearchSelect
        options={mockOptions}
        onSelect={mockOnSelect}
        placeholder="Buscar..."
      />
    );
    
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'Juan' } });
    
    const option = screen.getByText('Juan Pérez');
    fireEvent.click(option);
    
    expect(mockOnSelect).toHaveBeenCalledWith('Juan Pérez');
  });

  test('shows all matching options', () => {
    render(
      <SearchSelect
        options={mockOptions}
        onSelect={mockOnSelect}
        placeholder="Buscar..."
      />
    );
    
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'Juan' } });
    
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.queryByText('María López')).not.toBeInTheDocument();
  });

  test('is case insensitive', () => {
    render(
      <SearchSelect
        options={mockOptions}
        onSelect={mockOnSelect}
        placeholder="Buscar..."
      />
    );
    
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'juan' } });
    
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  test('updates input with selected value', () => {
    render(
      <SearchSelect
        options={mockOptions}
        onSelect={mockOnSelect}
        placeholder="Buscar..."
      />
    );
    
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'Juan' } });
    
    const option = screen.getByText('Juan Pérez');
    fireEvent.click(option);
    
    expect(input.value).toBe('Juan Pérez');
    expect(mockOnSelect).toHaveBeenCalledWith('Juan Pérez');
  });
});