'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Upload, X, Image as ImageIcon, Search } from 'lucide-react';

interface FormData {
  cardId: string;
  cardGame: string;
  cardName: string;
  cardGrade: string;
  gradeName: string;
  yearCard: string;
  setName: string;
  edition: string;
  rarity: string;
  cardInfo: string;
  cardOwner: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const CARD_GAMES = ['Pokemon', 'Yu-Gi-Oh!', 'MTG', 'One Piece'];

const CARD_GRADES = [
  { value: 'Auth', label: 'Auth - Authentication', name: 'Authentic' },
  { value: '1', label: '1', name: 'Poor' },
  { value: '2', label: '2', name: 'Fair' },
  { value: '3', label: '3', name: 'Good' },
  { value: '4', label: '4', name: 'Very Good' },
  { value: '5', label: '5', name: 'Excellent' },
  { value: '6', label: '6', name: 'Near Mint' },
  { value: '7', label: '7', name: 'Near Mint+' },
  { value: '8', label: '8', name: 'Mint' },
  { value: '9', label: '9', name: 'Mint+' },
  { value: '10', label: '10', name: 'Pristine' },
];

export default function AddCardPage() {
  const [formData, setFormData] = useState<FormData>({
    cardId: '',
    cardGame: '',
    cardName: '',
    cardGrade: '',
    gradeName: '',
    yearCard: '',
    setName: '',
    edition: '',
    rarity: '',
    cardInfo: '',
    cardOwner: '',
  });
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingCardId, setLoadingCardId] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const userSearchRef = useRef<HTMLDivElement>(null);

  // Fetch next card ID on mount
  useEffect(() => {
    fetchNextCardId();
  }, []);

  // Handle user search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (userSearchQuery.length >= 2) {
        searchUsers();
      } else {
        setUserSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNextCardId = async () => {
    try {
      setLoadingCardId(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/population-report/next-card-id', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, cardId: data.nextCardId }));
      }
    } catch (err) {
      console.error('Error fetching next card ID:', err);
    } finally {
      setLoadingCardId(false);
    }
  };

  const searchUsers = async () => {
    try {
      setSearchingUsers(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(userSearchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setUserSearchResults(data.users);
        setShowUserDropdown(true);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const selectUser = (user: User) => {
    const displayName = user.username || `${user.first_name} ${user.last_name}`;
    setFormData(prev => ({ ...prev, cardOwner: displayName }));
    setUserSearchQuery(displayName);
    setShowUserDropdown(false);
    setUserSearchResults([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGrade = e.target.value;
    const gradeData = CARD_GRADES.find(g => g.value === selectedGrade);

    setFormData(prev => ({
      ...prev,
      cardGrade: selectedGrade,
      gradeName: gradeData?.name || ''
    }));
  };

  const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFrontImage = () => {
    setFrontImage(null);
    setFrontPreview('');
    if (frontInputRef.current) {
      frontInputRef.current.value = '';
    }
  };

  const removeBackImage = () => {
    setBackImage(null);
    setBackPreview('');
    if (backInputRef.current) {
      backInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('authToken');

      // Prepare form data with images
      const submitData = {
        ...formData,
        frontImage: frontPreview,
        backImage: backPreview
      };

      const response = await fetch('/api/admin/population-report/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Fetch next card ID for the next submission
        await fetchNextCardId();
        // Reset form (keeping cardId from fetch)
        setFormData(prev => ({
          cardId: prev.cardId,
          cardGame: '',
          cardName: '',
          cardGrade: '',
          gradeName: '',
          yearCard: '',
          setName: '',
          edition: '',
          rarity: '',
          cardInfo: '',
          cardOwner: '',
        }));
        setUserSearchQuery('');
        removeFrontImage();
        removeBackImage();

        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to add card');
      }
    } catch (err) {
      console.error('Error submitting card:', err);
      setError('An error occurred while adding the card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="add-card-page" className="p-6 max-w-4xl">
      <div id="add-card-header" className="mb-6">
        <h1 className="text-2xl font-bold text-white">Add New Card</h1>
        <p className="text-gray-400 mt-1">Submit a new graded card to the population report</p>
      </div>

      {success && (
        <div id="add-card-success" className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <p className="text-green-400">Card added successfully!</p>
        </div>
      )}

      {error && (
        <div id="add-card-error" className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form id="add-card-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Card ID */}
        <div id="card-id-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card No. <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="cardId"
            value={formData.cardId}
            readOnly
            disabled={loadingCardId}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-lg cursor-not-allowed opacity-75"
            placeholder="Auto-generated"
          />
          <p className="text-xs text-gray-500 mt-1">Automatically generated 8-digit card number</p>
        </div>

        {/* Card Game & Card Name */}
        <div id="game-name-fields" className="grid grid-cols-2 gap-4">
          <div id="card-game-field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Card Game <span className="text-red-500">*</span>
            </label>
            <select
              name="cardGame"
              value={formData.cardGame}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
            >
              <option value="">Select a game</option>
              {CARD_GAMES.map(game => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>
          </div>

          <div id="card-name-field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Card Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cardName"
              value={formData.cardName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
              placeholder="e.g., Charizard"
            />
          </div>
        </div>

        {/* Card Grade & Grade Name */}
        <div id="grade-fields" className="grid grid-cols-2 gap-4">
          <div id="card-grade-field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Card Grade <span className="text-red-500">*</span>
            </label>
            <select
              name="cardGrade"
              value={formData.cardGrade}
              onChange={handleGradeChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
            >
              <option value="">Select grade</option>
              {CARD_GRADES.map(grade => (
                <option key={grade.value} value={grade.value}>{grade.label}</option>
              ))}
            </select>
          </div>

          <div id="grade-name-field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Grade Name
            </label>
            <input
              type="text"
              name="gradeName"
              value={formData.gradeName}
              readOnly
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
              placeholder="Auto-filled"
            />
          </div>
        </div>

        {/* Year, Set Name, Edition */}
        <div id="details-fields" className="grid grid-cols-3 gap-4">
          <div id="year-field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Year
            </label>
            <input
              type="text"
              name="yearCard"
              value={formData.yearCard}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
              placeholder="e.g., 1999"
            />
          </div>

          <div id="set-name-field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Set Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="setName"
              value={formData.setName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
              placeholder="e.g., Base Set"
            />
          </div>

          <div id="edition-field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Edition
            </label>
            <input
              type="text"
              name="edition"
              value={formData.edition}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
              placeholder="e.g., 1st Edition"
            />
          </div>
        </div>

        {/* Rarity */}
        <div id="rarity-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rarity <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="rarity"
            value={formData.rarity}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
            placeholder="e.g., Rare Holo"
          />
        </div>

        {/* Card Owner with Search */}
        <div id="card-owner-field" ref={userSearchRef} className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card Owner <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => {
                setUserSearchQuery(e.target.value);
                setFormData(prev => ({ ...prev, cardOwner: e.target.value }));
              }}
              onFocus={() => userSearchResults.length > 0 && setShowUserDropdown(true)}
              required
              className="w-full px-4 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
              placeholder="Search by username, email, or name..."
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Type to search for users in the database</p>

          {/* User Dropdown */}
          {showUserDropdown && userSearchResults.length > 0 && (
            <div id="user-search-dropdown" className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchingUsers ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#d83f0a] mx-auto"></div>
                </div>
              ) : (
                userSearchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {user.username || `${user.first_name} ${user.last_name}`}
                        </p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div id="card-info-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Additional Information
          </label>
          <textarea
            name="cardInfo"
            value={formData.cardInfo}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent resize-none"
            placeholder="Any additional notes about this card..."
          />
        </div>

        {/* Image Uploads */}
        <div id="image-uploads" className="grid grid-cols-2 gap-4">
          {/* Front Image */}
          <div id="front-image-upload">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Front Image
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4">
              {frontPreview ? (
                <div className="relative">
                  <img src={frontPreview} alt="Front preview" className="w-full h-48 object-contain rounded" />
                  <button
                    type="button"
                    onClick={removeFrontImage}
                    className="absolute top-2 right-2 p-1 bg-red-600 rounded-full hover:bg-red-700"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => frontInputRef.current?.click()}
                  className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-800/50 rounded"
                >
                  <ImageIcon className="h-12 w-12 text-gray-600 mb-2" />
                  <p className="text-sm text-gray-400">Click to upload front image</p>
                </div>
              )}
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={handleFrontImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Back Image */}
          <div id="back-image-upload">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Back Image
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4">
              {backPreview ? (
                <div className="relative">
                  <img src={backPreview} alt="Back preview" className="w-full h-48 object-contain rounded" />
                  <button
                    type="button"
                    onClick={removeBackImage}
                    className="absolute top-2 right-2 p-1 bg-red-600 rounded-full hover:bg-red-700"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => backInputRef.current?.click()}
                  className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-800/50 rounded"
                >
                  <ImageIcon className="h-12 w-12 text-gray-600 mb-2" />
                  <p className="text-sm text-gray-400">Click to upload back image</p>
                </div>
              )}
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackImageChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div id="submit-section" className="flex items-center space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Add Card
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
