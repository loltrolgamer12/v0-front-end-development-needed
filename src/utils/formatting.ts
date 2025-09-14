/**
 * Utility functions for data formatting and calculations
 */

/**
 * Get the name of a month in Spanish
 * @param month - Month number (1-12)
 * @returns Month name in Spanish
 */
export const getMonthName = (month: number): string => {
  const months = [
    '',
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];
  return months[month] || '';
};

/**
 * Calculate risk level based on compliance percentage
 * @param compliance - Compliance percentage (0-100)
 * @returns Risk level classification
 */
export const calculateRiskLevel = (compliance: number): 'Bajo' | 'Medio' | 'Alto' | 'Crítico' => {
  if (compliance >= 98) return 'Bajo';
  if (compliance >= 95) return 'Medio';
  if (compliance >= 90) return 'Alto';
  return 'Crítico';
};

/**
 * Format a date string to local format
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | null): string => {
  if (!date) return 'Sin fecha';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Fecha inválida';
  }
};

/**
 * Calculate days since a given date
 * @param date - Date to calculate from
 * @returns Number of days or 999 if invalid date
 */
export const calculateDaysSince = (date: string | Date | null): number => {
  if (!date) return 999;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const timeDiff = Date.now() - dateObj.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  } catch {
    return 999;
  }
};

/**
 * Format a number as a percentage
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Get status color classes based on status
 * @param status - Status string
 * @returns Object with Tailwind CSS classes
 */
export const getStatusColors = (status: string): {
  bg: string;
  border: string;
  text: string;
} => {
  switch (status) {
    case 'success':
    case 'verde':
    case 'Bajo':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700'
      };
    case 'warning':
    case 'amarillo':
    case 'Medio':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700'
      };
    case 'danger':
    case 'rojo':
    case 'Alto':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700'
      };
    case 'Crítico':
      return {
        bg: 'bg-red-100',
        border: 'border-red-300',
        text: 'text-red-800'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700'
      };
  }
};