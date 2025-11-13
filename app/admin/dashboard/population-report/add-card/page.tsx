'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Upload, X, Image as ImageIcon } from 'lucide-react';

interface FormData {
  cardId: string;
  cardGame: string;
  cardName: string;
  cardGrade: string;
  setName: string;
  edition: string;
  rarity: string;
  cardInfo: string;
  cardOwner: string;
}

const CARD_GAMES = ['Pokemon', 'Yu-Gi-Oh!', 'MTG', 'One Piece'];
const CARD_GRADES = [
  { value: 'A', label: 'A - Authentication' },
  { value: '1', label: '1 - Poor' },
  { value: '2', label: '2 - Fair' },
  { value: '3', label: '3 - Good' },
  { value: '4', label: '4 - Very Good' },
  { value: '5', label: '5 - Excellent' },
  { value: '6', label: '6 - Near Mint' },
  { value: '7', label: '7 - Near Mint+' },
  { value: '8', label: '8 - Mint' },
  { value: '9', label: '9 - Mint+' },
  { value: '10', label: '10 - Pristine' },
];

export default function AddCardPage() {
  const [formData, setFormData] = useState<FormData>({
    cardId: '',
    cardGame: '',
    cardName: '',
    cardGrade: '',
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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        // Reset form
        setFormData({
          cardId: '',
          cardGame: '',
          cardName: '',
          cardGrade: '',
          setName: '',
          edition: '',
          rarity: '',
          cardInfo: '',
          cardOwner: '',
        });
        removeFrontImage();
        removeBackImage();

        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to add card');
      }
    } catch (error) {
      console.error('Failed to add card:', error);
      setError('An error occurred while adding the card');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      cardId: '',
      cardGame: '',
      cardName: '',
      cardGrade: '',
      setName: '',
      edition: '',
      rarity: '',
      cardInfo: '',
      cardOwner: '',
    });
    removeFrontImage();
    removeBackImage();
    setError('');
    setSuccess(false);
  };

  return (
    <div className="max-w-6xl" id="pr-add-card-container">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6" id="pr-add-card-form-container">
        <div className="mb-6" id="pr-add-card-header">
          <h2 className="text-2xl font-bold text-white mb-2" id="pr-add-card-title">Add Graded Card</h2>
          <p className="text-gray-400" id="pr-add-card-subtitle">
            Submit a new graded card to the population report
          </p>
        </div>

        {success && (
          <div className="mb-6 bg-green-900/20 border border-green-700 text-green-400 px-4 py-3 rounded-lg" id="pr-add-card-success">
            Card added successfully!
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg" id="pr-add-card-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" id="pr-add-card-form">
          {/* Card Images Upload Section */}
          <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600" id="pr-card-images-section">
            <h3 className="text-lg font-semibold text-white mb-4" id="pr-images-title">Card Images</h3>
            <p className="text-sm text-gray-400 mb-4">Upload front and back images of the graded card</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front Image */}
              <div id="pr-front-image-container">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Front Image
                </label>
                {!frontPreview ? (
                  <div
                    onClick={() => frontInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    id="pr-front-upload-area"
                  >
                    <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">Click to upload front image</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    <input
                      ref={frontInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFrontImageChange}
                      className="hidden"
                      id="pr-front-image-input"
                    />
                  </div>
                ) : (
                  <div className="relative" id="pr-front-preview-container">
                    <img
                      src={frontPreview}
                      alt="Front preview"
                      className="w-full h-64 object-contain bg-gray-900 rounded-lg"
                      id="pr-front-preview-image"
                    />
                    <button
                      type="button"
                      onClick={removeFrontImage}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      id="pr-front-remove-btn"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Back Image */}
              <div id="pr-back-image-container">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Back Image
                </label>
                {!backPreview ? (
                  <div
                    onClick={() => backInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    id="pr-back-upload-area"
                  >
                    <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">Click to upload back image</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    <input
                      ref={backInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackImageChange}
                      className="hidden"
                      id="pr-back-image-input"
                    />
                  </div>
                ) : (
                  <div className="relative" id="pr-back-preview-container">
                    <img
                      src={backPreview}
                      alt="Back preview"
                      className="w-full h-64 object-contain bg-gray-900 rounded-lg"
                      id="pr-back-preview-image"
                    />
                    <button
                      type="button"
                      onClick={removeBackImage}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      id="pr-back-remove-btn"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="pr-form-grid-1">
            {/* Card ID */}
            <div id="pr-field-card-id">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cardId"
                value={formData.cardId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., TC-2024-001"
              />
            </div>

            {/* Card Game */}
            <div id="pr-field-card-game">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Game <span className="text-red-500">*</span>
              </label>
              <select
                name="cardGame"
                value={formData.cardGame}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a game</option>
                {CARD_GAMES.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="pr-form-grid-2">
            {/* Card Name */}
            <div id="pr-field-card-name">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cardName"
                value={formData.cardName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Pikachu VMAX"
              />
            </div>

            {/* Card Grade */}
            <div id="pr-field-card-grade">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Grade <span className="text-red-500">*</span>
              </label>
              <select
                name="cardGrade"
                value={formData.cardGrade}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select grade</option>
                {CARD_GRADES.map(grade => (
                  <option key={grade.value} value={grade.value}>{grade.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="pr-form-grid-3">
            {/* Set Name */}
            <div id="pr-field-set-name">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Set Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="setName"
                value={formData.setName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Vivid Voltage"
              />
            </div>

            {/* Edition */}
            <div id="pr-field-edition">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Edition
              </label>
              <input
                type="text"
                name="edition"
                value={formData.edition}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1st Edition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="pr-form-grid-4">
            {/* Rarity */}
            <div id="pr-field-rarity">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rarity <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rarity"
                value={formData.rarity}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Secret Rare, Holo Rare"
              />
            </div>

            {/* Card Owner */}
            <div id="pr-field-card-owner">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Owner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cardOwner"
                value={formData.cardOwner}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Owner name"
              />
            </div>
          </div>

          {/* Card Info */}
          <div id="pr-field-card-info">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Card Information
            </label>
            <textarea
              name="cardInfo"
              value={formData.cardInfo}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional card information, notes, or special characteristics..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700" id="pr-form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              id="pr-btn-reset"
            >
              <X className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              id="pr-btn-submit"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Add Card</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
