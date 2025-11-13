'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Edit2, Trash2, Eye } from 'lucide-react';

interface GradedCard {
  id: number;
  card_id: string;
  card_game: string;
  card_name: string;
  card_grade: string;
  set_name: string;
  edition: string;
  rarity: string;
  card_info: string;
  card_owner: string;
  date_graded: string;
}

export default function PopulationReportCardsPage() {
  const [cards, setCards] = useState<GradedCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<GradedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    filterCards();
  }, [searchTerm, filterGame, filterGrade, cards]);

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
        card.card_owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.set_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterGame) {
      filtered = filtered.filter(card => card.card_game === filterGame);
    }

    if (filterGrade) {
      filtered = filtered.filter(card => card.card_grade === filterGrade);
    }

    setFilteredCards(filtered);
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

  const handleExport = () => {
    const csvContent = [
      ['Card ID', 'Game', 'Name', 'Grade', 'Set', 'Edition', 'Rarity', 'Owner', 'Date Graded'],
      ...filteredCards.map(card => [
        card.card_id,
        card.card_game,
        card.card_name,
        card.card_grade,
        card.set_name,
        card.edition,
        card.rarity,
        card.card_owner,
        new Date(card.date_graded).toLocaleDateString()
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2" id="pr-filter-search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by card name, ID, owner, or set..."
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
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700" id="pr-cards-actions">
          <p className="text-gray-400 text-sm" id="pr-cards-count">
            Showing {filteredCards.length} of {cards.length} cards
          </p>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            id="pr-btn-export"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden" id="pr-cards-table-container">
        <div className="overflow-x-auto">
          <table className="w-full" id="pr-cards-table">
            <thead className="bg-gray-900/50">
              <tr>
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
                  Set
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rarity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Owner
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
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {card.card_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.card_game}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {card.card_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
                        {card.card_grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.set_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.rarity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.card_owner}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(card.date_graded).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No cards found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
