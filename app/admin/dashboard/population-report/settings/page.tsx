'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, X, Upload } from 'lucide-react';

const DEFAULT_CARD_GAMES = ['Pokemon', 'Yu-Gi-Oh!', 'MTG', 'One Piece'];

interface GameLogo {
  [key: string]: string;
}

export default function PopulationReportSettingsPage() {
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [customGame, setCustomGame] = useState('');
  const [availableGames, setAvailableGames] = useState<string[]>(DEFAULT_CARD_GAMES);
  const [gameLogos, setGameLogos] = useState<GameLogo>({});
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/population-report/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings?.cardGames) {
          setAvailableGames(data.settings.cardGames);
        }
        if (data.settings?.selectedGames) {
          setSelectedGames(data.settings.selectedGames);
        }
        if (data.settings?.gameLogos) {
          setGameLogos(data.settings.gameLogos);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleLogoUpload = async (game: string, file: File) => {
    setUploadingLogo(game);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('game', game);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/population-report/upload-game-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setGameLogos(prev => ({
          ...prev,
          [game]: data.logoPath
        }));
      } else {
        setError(data.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      setError('An error occurred while uploading the logo');
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleGameToggle = (game: string) => {
    setSelectedGames(prev =>
      prev.includes(game)
        ? prev.filter(g => g !== game)
        : [...prev, game]
    );
  };

  const handleAddCustomGame = () => {
    if (customGame.trim() && !availableGames.includes(customGame.trim())) {
      setAvailableGames(prev => [...prev, customGame.trim()]);
      setCustomGame('');
    }
  };

  const handleRemoveGame = (game: string) => {
    if (!DEFAULT_CARD_GAMES.includes(game)) {
      setAvailableGames(prev => prev.filter(g => g !== game));
      setSelectedGames(prev => prev.filter(g => g !== game));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/population-report/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardGames: availableGames,
          selectedGames: selectedGames,
          gameLogos: gameLogos
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('An error occurred while saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl" id="pr-settings-container">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6" id="pr-settings-form-container">
        <div className="mb-6" id="pr-settings-header">
          <h2 className="text-2xl font-bold text-white mb-2" id="pr-settings-title">
            Population Report Settings
          </h2>
          <p className="text-gray-400" id="pr-settings-subtitle">
            Configure card games and other settings for the population report
          </p>
        </div>

        {success && (
          <div className="mb-6 bg-green-900/20 border border-green-700 text-green-400 px-4 py-3 rounded-lg" id="pr-settings-success">
            Settings saved successfully!
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg" id="pr-settings-error">
            {error}
          </div>
        )}

        <div className="space-y-8" id="pr-settings-content">
          {/* Card Games Section */}
          <div id="pr-settings-card-games">
            <h3 className="text-lg font-semibold text-white mb-4" id="pr-settings-games-title">
              Card Games Configuration
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Select which card games should be available in the population report. You can add custom games below.
            </p>

            {/* Available Games with Checkboxes */}
            <div className="space-y-3 mb-6" id="pr-settings-games-list">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Available Card Games
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableGames.map((game) => (
                  <div
                    key={game}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600"
                    id={`pr-game-${game.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    <label className="flex items-center space-x-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedGames.includes(game)}
                        onChange={() => handleGameToggle(game)}
                        className="w-5 h-5 rounded border-gray-500 text-blue-600 focus:ring-2 focus:ring-blue-500 bg-gray-600"
                      />
                      {gameLogos[game] ? (
                        <img
                          src={`/api/storage/${gameLogos[game]}`}
                          alt={game}
                          className="w-6 h-6 object-contain"
                        />
                      ) : null}
                      <span className="text-white">{game}</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <label
                        className="cursor-pointer p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Upload game logo"
                      >
                        {uploadingLogo === game ? (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(game, file);
                          }}
                          disabled={uploadingLogo === game}
                        />
                      </label>
                      {!DEFAULT_CARD_GAMES.includes(game) && (
                        <button
                          onClick={() => handleRemoveGame(game)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Remove custom game"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Custom Game */}
            <div id="pr-settings-add-game">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Add Custom Card Game
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customGame}
                  onChange={(e) => setCustomGame(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomGame()}
                  placeholder="Enter custom card game name"
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="pr-input-custom-game"
                />
                <button
                  onClick={handleAddCustomGame}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  id="pr-btn-add-game"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Add custom card games that aren't in the default list
              </p>
            </div>
          </div>

          {/* Selected Games Summary */}
          <div className="bg-gray-700/50 rounded-lg p-4" id="pr-settings-summary">
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Selected Games ({selectedGames.length})
            </h4>
            {selectedGames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedGames.map(game => (
                  <span
                    key={game}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-900/30 text-blue-400 border border-blue-800"
                  >
                    {game}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No games selected</p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end pt-6 border-t border-gray-700" id="pr-settings-actions">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              id="pr-btn-save-settings"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
