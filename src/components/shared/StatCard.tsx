import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface DetailItem {
  label: string;
  value: string;
  info?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  bgColor?: string;
  textColor?: string;
  iconColor?: string;
  subValue?: string;
  iconBgColor?: string;
  details?: DetailItem[];
  onShowDetails?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  bgColor = 'bg-white',
  textColor = 'text-gray-800',
  iconColor = 'text-blue-600',
  subValue,
  iconBgColor = 'bg-blue-100',
  details = [],
  onShowDetails
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const handleMoreInfo = () => {
    setShowDetails(true);
    if (onShowDetails) {
      onShowDetails();
    }
  };

  return (
    <div className={`${bgColor} rounded-xl p-6 shadow-sm border relative`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue && (
            <p className="text-xs text-blue-600">
              {subValue}
            </p>
          )}
        </div>
        <div className={`${iconBgColor} rounded-lg p-3`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      
      {details && details.length > 0 && (
        <button
          onClick={handleMoreInfo}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          Ver más información
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{title} - Detalles</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {details?.map((detail, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{detail.label}:</span>
                    <span className="font-medium">{detail.value}</span>
                  </div>
                  {detail.info && (
                    <p className="text-sm text-gray-500 mt-1">{detail.info}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;