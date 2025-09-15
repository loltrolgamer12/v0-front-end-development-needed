import React, { useState, useEffect } from 'react';

interface SearchSelectProps {
  options: string[];
  onSelect: (option: string) => void;
  placeholder?: string;
  value?: string;
}

const SearchSelect: React.FC<SearchSelectProps> = ({ options, onSelect, placeholder = 'Buscar...', value = '' }) => {
  const [search, setSearch] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    const searchTerm = search.toLowerCase();
    const filtered = options.filter(option => 
      option.toLowerCase().includes(searchTerm)
    );
    setFilteredOptions(filtered);
    setShowDropdown(filtered.length > 0);
  }, [search, options]);

  const handleSelect = (option: string) => {
    setSearch(option);
    setShowDropdown(false);
    onSelect(option);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 border rounded"
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;