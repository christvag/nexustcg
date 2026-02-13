'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, User, Loader2 } from 'lucide-react';

interface UserResult {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface UserSearchDropdownProps {
  value: string;
  onChange: (email: string) => void;
  placeholder?: string;
  id?: string;
}

export default function UserSearchDropdown({
  value,
  onChange,
  placeholder = 'Search by email or name...',
  id = 'user-search-dropdown'
}: UserSearchDropdownProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [results, setResults] = useState<UserResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update search term when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users with debounce
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResults(data.users || []);
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchUsers(newValue);
    }, 300);
  };

  const handleSelectUser = (user: UserResult) => {
    setSearchTerm(user.email);
    onChange(user.email);
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (searchTerm.length >= 2) {
      searchUsers(searchTerm);
    }
  };

  return (
    <div ref={dropdownRef} className="relative" id={id}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
          id={`${id}-input`}
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        ) : searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            id={`${id}-clear-btn`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          id={`${id}-results`}
        >
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectUser(user)}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-700 transition-colors text-left border-b border-gray-700 last:border-b-0"
              id={`${id}-result-${user.id}`}
            >
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {user.email}
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded capitalize">
                {user.role}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && results.length === 0 && searchTerm.length >= 2 && !isLoading && (
        <div
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 text-center"
          id={`${id}-no-results`}
        >
          <User className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No users found</p>
          <p className="text-xs text-gray-500 mt-1">
            You can still enter a custom email address
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Search for a user by email or name, or enter a custom email address
      </p>
    </div>
  );
}
