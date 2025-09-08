'use client';

import { useState, useEffect, useRef } from 'react';
import { FaChevronDown, FaTimes } from 'react-icons/fa';

interface ComboboxItem {
  value: string;
  label: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  selectedValue: string | string[] | null;
  onSelect: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
}

export default function Combobox({ items, selectedValue, onSelect, placeholder = "Seleccione...", multiple = false }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (item: ComboboxItem) => {
    if (multiple && Array.isArray(selectedValue)) {
      const newSelected = selectedValue.includes(item.value)
        ? selectedValue.filter(v => v !== item.value)
        : [...selectedValue, item.value];
      onSelect(newSelected);
    } else {
      onSelect(item.value);
      setIsOpen(false);
    }
    setSearchTerm('');
  };

  const filteredItems = (items || []).filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDisplayValue = () => {
    if (multiple && Array.isArray(selectedValue) && selectedValue.length > 0) {
      if (selectedValue.length === 1) return items.find(i => i.value === selectedValue[0])?.label;
      return `${selectedValue.length} seleccionados`;
    }
    if (!multiple && typeof selectedValue === 'string') {
      return items.find(item => item.value === selectedValue)?.label || placeholder;
    }
    return placeholder;
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-3 pr-10 py-2 text-left border border-gray-300 bg-white rounded-md shadow-sm cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
      >
        <span className="block truncate">{getDisplayValue()}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <FaChevronDown className="h-4 w-4 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300">
          <div className="p-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md"
            />
          </div>
          <ul className="max-h-60 overflow-auto">
            {filteredItems.map(item => (
              <li
                key={item.value}
                onClick={() => handleSelect(item)}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                  multiple && Array.isArray(selectedValue) && selectedValue.includes(item.value) ? 'bg-primary text-white' : ''
                }`}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
