'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Edit2, Trash2, Eye, Calendar, X, Star } from 'lucide-react';

interface GradedCard {
  id: number;
  card_id: string;
  card_game: string;
  card_name: string;
  card_grade: string;
  grade_name: string;
  year_card: string;
  set_name: string;
  edition: string;
  rarity: string;
  card_info: string;
  date_graded: string;
  front_image_path?: string;
  back_image_path?: string;
  is_featured?: number;
}

export default function PopulationReportCardsPage() {
  const [cards, setCards] = useState<GradedCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<GradedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterRarity, setFilterRarity] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [editingCard, setEditingCard] = useState<GradedCard | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    filterCards();
  }, [searchTerm, filterGame, filterGrade, filterRarity, filterDateFrom, filterDateTo, cards]);

  useEffect(() => {
    // Update select all checkbox state
    if (filteredCards.length > 0 && selectedCards.size === filteredCards.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedCards, filteredCards]);

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/population-report/cards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCards(data.cards || []);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCards = () => {
    let filtered = [...cards];

    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.card_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.card_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.set_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterGame) {
      filtered = filtered.filter(card => card.card_game === filterGame);
    }

    if (filterGrade) {
      filtered = filtered.filter(card => card.card_grade === filterGrade);
    }

    if (filterRarity) {
      filtered = filtered.filter(card => card.rarity === filterRarity);
    }

    if (filterDateFrom) {
      filtered = filtered.filter(card => new Date(card.date_graded) >= new Date(filterDateFrom));
    }

    if (filterDateTo) {
      filtered = filtered.filter(card => new Date(card.date_graded) <= new Date(filterDateTo));
    }

    setFilteredCards(filtered);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(filteredCards.map(card => card.id)));
    }
  };

  const handleSelectCard = (id: number) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCards(newSelected);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/population-report/cards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCards();
      } else {
        alert('Failed to delete card');
      }
    } catch (error) {
      console.error('Failed to delete card:', error);
      alert('An error occurred while deleting the card');
    }
  };

  const handleEdit = (card: GradedCard) => {
    setEditingCard({ ...card });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCard(null);
    setUploadingFront(false);
    setUploadingBack(false);
  };

  const handleUpdateCard = async () => {
    if (!editingCard) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/population-report/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingCard)
      });

      if (response.ok) {
        alert('Card updated successfully');
        handleCloseEditModal();
        fetchCards();
      } else {
        const data = await response.json();
        alert(`Failed to update card: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update card:', error);
      alert('An error occurred while updating the card');
    }
  };

  const handleImageUpload = async (file: File, type: 'front' | 'back') => {
    if (!editingCard) return;

    try {
      if (type === 'front') setUploadingFront(true);
      else setUploadingBack(true);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('card_id', editingCard.card_id);
      formData.append('type', type);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/population-report/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setEditingCard({
          ...editingCard,
          [type === 'front' ? 'front_image_path' : 'back_image_path']: data.imagePath
        });
        alert('Image uploaded successfully');
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('An error occurred while uploading the image');
    } finally {
      if (type === 'front') setUploadingFront(false);
      else setUploadingBack(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCards.size === 0) {
      alert('Please select cards to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedCards.size} selected card(s)?`)) return;

    try {
      const token = localStorage.getItem('authToken');
      const deletePromises = Array.from(selectedCards).map(id =>
        fetch(`/api/admin/population-report/cards/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(deletePromises);
      setSelectedCards(new Set());
      fetchCards();
      alert('Selected cards deleted successfully');
    } catch (error) {
      console.error('Failed to delete cards:', error);
      alert('An error occurred while deleting cards');
    }
  };

  const handleToggleFeatured = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/population-report/cards/${id}/featured`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setCards(prevCards =>
          prevCards.map(card =>
            card.id === id ? { ...card, is_featured: data.is_featured ? 1 : 0 } : card
          )
        );
      } else {
        alert('Failed to update featured status');
      }
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
      alert('An error occurred while updating featured status');
    }
  };

  const formatDateToYYYYMMDD = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleBulkExport = () => {
    if (selectedCards.size === 0) {
      alert('Please select cards to export');
      return;
    }

    const selectedCardsData = filteredCards.filter(card => selectedCards.has(card.id));
    const csvContent = [
      ['id', 'type', 'name_card', 'grade', 'grade_name', 'year_card', 'set_name', 'edition', 'card_info', 'rarity', 'date_graded'],
      ...selectedCardsData.map(card => [
        card.card_id,
        card.card_game,
        card.card_name,
        card.card_grade,
        card.grade_name || '',
        card.year_card || '',
        card.set_name,
        card.edition || '',
        card.card_info || '',
        card.rarity,
        formatDateToYYYYMMDD(card.date_graded)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-cards-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const csvContent = [
      ['id', 'type', 'name_card', 'grade', 'grade_name', 'year_card', 'set_name', 'edition', 'card_info', 'rarity', 'date_graded'],
      ...filteredCards.map(card => [
        card.card_id,
        card.card_game,
        card.card_name,
        card.card_grade,
        card.grade_name || '',
        card.year_card || '',
        card.set_name,
        card.edition || '',
        card.card_info || '',
        card.rarity,
        formatDateToYYYYMMDD(card.date_graded)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `population-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueGames = Array.from(new Set(cards.map(card => card.card_game)));
  const uniqueGrades = Array.from(new Set(cards.map(card => card.card_grade)));
  const uniqueRarities = Array.from(new Set(cards.map(card => card.rarity)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" id="pr-cards-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="pr-cards-container">
      {/* Header with Search and Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4" id="pr-cards-filters">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2 lg:col-span-2" id="pr-filter-search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by card name, ID, or set..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter by Game */}
          <div id="pr-filter-game">
            <select
              value={filterGame}
              onChange={(e) => setFilterGame(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Games</option>
              {uniqueGames.map(game => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>
          </div>

          {/* Filter by Grade */}
          <div id="pr-filter-grade">
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              {uniqueGrades.sort().map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>

          {/* Filter by Rarity */}
          <div id="pr-filter-rarity">
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Rarities</option>
              {uniqueRarities.map(rarity => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </select>
          </div>

          {/* Filter by Date From */}
          <div id="pr-filter-date-from">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                placeholder="Date From"
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter by Date To */}
          <div id="pr-filter-date-to">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                placeholder="Date To"
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bulk Operations and Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-700" id="pr-cards-actions">
          <div className="flex items-center gap-4">
            <p className="text-gray-400 text-sm" id="pr-cards-count">
              Showing {filteredCards.length} of {cards.length} cards
              {selectedCards.size > 0 && (
                <span className="ml-2 text-blue-400">({selectedCards.size} selected)</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedCards.size > 0 && (
              <>
                <button
                  onClick={handleBulkExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  id="pr-btn-bulk-export"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Selected</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  id="pr-btn-bulk-delete"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Selected</span>
                </button>
              </>
            )}
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              id="pr-btn-export"
            >
              <Download className="h-4 w-4" />
              <span>Export All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden" id="pr-cards-table-container">
        <div className="overflow-x-auto">
          <table className="w-full" id="pr-cards-table">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left w-12" id="pr-th-select">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    title="Select All"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Card ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Game
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Card Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Grade Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Set
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rarity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date Graded
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCards.length > 0 ? (
                filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm" id={`pr-td-select-${card.id}`}>
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={() => handleSelectCard(card.id)}
                        className="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {card.card_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.card_game}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      <a
                        href={`/cert/${card.card_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#d83f0a] hover:text-[#d66a0a] hover:underline font-medium cursor-pointer transition-colors"
                      >
                        {card.card_name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
                        {card.card_grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {card.grade_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.year_card || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.set_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.rarity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(card.date_graded).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleFeatured(card.id)}
                          className={`p-1 transition-colors ${
                            card.is_featured
                              ? 'text-yellow-400 hover:text-yellow-300'
                              : 'text-gray-500 hover:text-yellow-400'
                          }`}
                          title={card.is_featured ? 'Remove from featured' : 'Add to featured'}
                          id={`featured-card-btn-${card.id}`}
                        >
                          <Star className={`h-4 w-4 ${card.is_featured ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleEdit(card)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit"
                          id={`edit-card-btn-${card.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                          id={`delete-card-btn-${card.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No cards found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCard && (
        <div id="edit-card-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
              <h2 className="text-2xl font-bold text-white">Edit Card</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-white"
                id="close-edit-modal-btn"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Card Images */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Front Image */}
                <div id="front-image-section">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Front Image
                  </label>
                  {editingCard.front_image_path && (
                    <img
                      src={`/api/storage/${editingCard.front_image_path}`}
                      alt="Card Front"
                      className="w-full h-48 object-contain bg-gray-900 rounded-lg mb-2"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'front')}
                    disabled={uploadingFront}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer disabled:opacity-50"
                    id="front-image-upload"
                  />
                  {uploadingFront && <p className="text-sm text-blue-400 mt-2">Uploading...</p>}
                </div>

                {/* Back Image */}
                <div id="back-image-section">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Back Image
                  </label>
                  {editingCard.back_image_path && (
                    <img
                      src={`/api/storage/${editingCard.back_image_path}`}
                      alt="Card Back"
                      className="w-full h-48 object-contain bg-gray-900 rounded-lg mb-2"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'back')}
                    disabled={uploadingBack}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer disabled:opacity-50"
                    id="back-image-upload"
                  />
                  {uploadingBack && <p className="text-sm text-blue-400 mt-2">Uploading...</p>}
                </div>
              </div>

              {/* Card Details Form */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Card ID</label>
                  <input
                    type="text"
                    value={editingCard.card_id}
                    onChange={(e) => setEditingCard({ ...editingCard, card_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    id="edit-card-id"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Card Game</label>
                  <input
                    type="text"
                    value={editingCard.card_game}
                    onChange={(e) => setEditingCard({ ...editingCard, card_game: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    id="edit-card-game"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Card Name</label>
                  <input
                    type="text"
                    value={editingCard.card_name}
                    onChange={(e) => setEditingCard({ ...editingCard, card_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    id="edit-card-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Grade</label>
                  <input
                    type="text"
                    value={editingCard.card_grade}
                    onChange={(e) => setEditingCard({ ...editingCard, card_grade: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    id="edit-card-grade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Grade Name</label>
                  <input
                    type="text"
                    value={editingCard.grade_name}
                    onChange={(e) => setEditingCard({ ...editingCard, grade_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    id="edit-grade-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                  <input
                    type="text"
                    value={editingCard.year_card}
                    onChange={(e) => setEditingCard({ ...editingCard, year_card: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    id="edit-year"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Set Name</label>
                  <input
                    type="text"
                    value={editingCard.set_name}
                    onChange={(e) => setEditingCard({ ...editingCard, set_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    id="edit-set-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Edition</label>
                  <input
                    type="text"
                    value={editingCard.edition}
                    onChange={(e) => setEditingCard({ ...editingCard, edition: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    id="edit-edition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rarity</label>
                  <input
                    type="text"
                    value={editingCard.rarity}
                    onChange={(e) => setEditingCard({ ...editingCard, rarity: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    id="edit-rarity"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Card Info</label>
                  <textarea
                    value={editingCard.card_info}
                    onChange={(e) => setEditingCard({ ...editingCard, card_info: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    id="edit-card-info"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end space-x-4 sticky bottom-0 bg-gray-800">
              <button
                onClick={handleCloseEditModal}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                id="cancel-edit-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCard}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                id="save-edit-btn"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
