'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import UserSearchDropdown from '@/components/UserSearchDropdown';

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
  cardNumber: string;
  cardInfo: string;
  cardOwner: string;
  language: string;
  customLanguage: string;
}

interface GameOption {
  id: string;
  name: string;
  logo_path?: string;
}

const DEFAULT_CARD_GAMES = ['Pokemon', 'Yu-Gi-Oh!', 'MTG', 'One Piece'];

const CARD_GRADES = [
  { value: 'Auth', label: 'Auth - Authentication', name: 'Authentic' },
  { value: '1', label: '1', name: 'POOR' },
  { value: '2', label: '2', name: 'FAIR' },
  { value: '3', label: '3', name: 'GOOD' },
  { value: '4', label: '4', name: 'VG' },
  { value: '5', label: '5', name: 'EX' },
  { value: '6', label: '6', name: 'EX/NM' },
  { value: '7', label: '7', name: 'NM' },
  { value: '8', label: '8', name: 'NM-MT' },
  { value: '9', label: '9', name: 'MINT' },
  { value: '10', label: '10', name: 'GEM MINT' },
  { value: '10+', label: '10+', name: 'PRISTINE' },
];

const CARD_LANGUAGES = [
  'English',
  'Japanese',
  'Korean',
  'Traditional Chinese',
  'Simplified Chinese',
  'German',
  'French',
  'Italian',
  'Spanish',
  'Portuguese',
  'Other',
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
    cardNumber: '',
    cardInfo: '',
    cardOwner: '',
    language: 'English',
    customLanguage: '',
  });
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingCardId, setLoadingCardId] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cardGames, setCardGames] = useState<string[]>(DEFAULT_CARD_GAMES);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Fetch next card ID and games on mount
  useEffect(() => {
    fetchNextCardId();
    fetchCardGames();
  }, []);

  const fetchCardGames = async () => {
    try {
      const response = await fetch('/api/population-report/games', { cache: 'no-store' });
      const data = await response.json();
      if (data.success && data.games && data.games.length > 0) {
        setCardGames(data.games.map((game: GameOption) => game.name));
      }
    } catch (err) {
      console.error('Failed to fetch card games:', err);
      // Keep default games on error
    }
  };

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
      // Use customLanguage if "Other" is selected, otherwise use the selected language
      const finalLanguage = formData.language === 'Other' ? formData.customLanguage : formData.language;
      const submitData = {
        ...formData,
        language: finalLanguage,
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
          cardNumber: '',
          cardInfo: '',
          cardOwner: '',
          language: 'English',
          customLanguage: '',
        }));
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
        {/* Serial Number */}
        <div id="serial-number-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Serial Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="cardId"
            value={formData.cardId}
            onChange={handleChange}
            disabled={loadingCardId}
            required
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-lg focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
            placeholder="Auto-generated"
          />
          <p className="text-xs text-gray-500 mt-1">8-digit serial number (auto-generated, but editable)</p>
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
              {cardGames.map(game => (
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
              Set Name
            </label>
            <input
              type="text"
              name="setName"
              value={formData.setName}
              onChange={handleChange}
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

        {/* Rarity & Card Number */}
        <div id="rarity-cardnumber-fields" className="grid grid-cols-2 gap-4">
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

          <div id="card-number-field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Card Number
            </label>
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
              placeholder="e.g., 4/102"
            />
          </div>
        </div>

        {/* Language */}
        <div id="language-fields" className="grid grid-cols-2 gap-4">
          <div id="language-field">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Language
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
            >
              {CARD_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {formData.language === 'Other' && (
            <div id="custom-language-field">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Specify Language <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customLanguage"
                value={formData.customLanguage}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#d83f0a] focus:border-transparent"
                placeholder="e.g., Thai, Dutch, etc."
              />
            </div>
          )}
        </div>

        {/* Card Owner */}
        <div id="card-owner-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card Owner (Email)
          </label>
          <UserSearchDropdown
            value={formData.cardOwner}
            onChange={(email) => setFormData(prev => ({ ...prev, cardOwner: email }))}
            placeholder="Search user by email or name..."
            id="add-card-owner-search"
          />
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
