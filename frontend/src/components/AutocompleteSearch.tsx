import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface AutocompleteSearchProps {
             <button
              key={index}
              id={`suggestion-${index}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                highlightedIndex === index ? 'bg-gray-100' : ''
              }`}
              role="option"
              type="button"
              aria-selected={highlightedIndex === index ? 'true' : 'false'}>er: string;
  onSearch: (query: string) => void;
  suggestions: string[];
  label?: string;
  className?: string;
  initialValue?: string;
}

const AutocompleteSearch: React.FC<AutocompleteSearchProps> = ({
  placeholder,
  onSearch,
  suggestions,
  label,
  className = '',
  initialValue = ''
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = suggestions.filter(item =>
      item.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [query, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          handleSelect(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label htmlFor="autocomplete-input" className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id="autocomplete-input"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls="suggestions-list"
          aria-activedescendant={highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined}
          className="w-full px-4 py-2 pl-10 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
            type="button"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div
          id="suggestions-list"
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
          role="listbox"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              id={`suggestion-${index}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                highlightedIndex === index ? 'bg-gray-100' : ''
              }`}
              role="option"
              aria-selected={highlightedIndex === index ? 'true' : 'false'}
            >
              <span className="text-gray-800">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteSearch;