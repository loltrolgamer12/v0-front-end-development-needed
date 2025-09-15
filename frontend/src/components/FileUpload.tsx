import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  progress: number;
  isLoading?: boolean;
  label?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  isLoading = false, 
  label,
  className = ''
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  // Round progress to nearest 5 for CSS data attribute matching
  const progressStep = Math.round(normalizedProgress / 5) * 5;
  
  // Explicitly convert to numbers for ARIA attributes to avoid linter issues
  const ariaProps = {
    'aria-valuenow': Number(normalizedProgress),
    'aria-valuemin': Number(0),
    'aria-valuemax': Number(100),
    'aria-label': label || 'Progreso'
  };
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">{Math.round(normalizedProgress)}%</span>
        </div>
      )}
      
      <div 
        className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden"
        role="progressbar"
        {...ariaProps}
      >
        <div
          className={`progress-bar-fill h-full rounded-full transition-all duration-300 ease-out ${
            isLoading 
              ? 'bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse' 
              : 'bg-blue-600'
          }`}
          data-progress={progressStep}
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
        )}
      </div>
    </div>
  );
};

export default ProgressBar;