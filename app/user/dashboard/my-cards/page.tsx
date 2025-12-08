'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Calendar } from 'lucide-react';
import Link from 'next/link';

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
  card_number: string;
  card_info: string;
  language: string;
  date_graded: string;
  front_image?: string;
  back_image?: string;
}

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
];

export default function MyCardsPage() {
  const [cards, setCards] = useState<GradedCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<GradedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterRarity, setFilterRarity] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      fetchUserCards(user.email);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    filterCards();
  }, [searchTerm, filterGame, filterGrade, filterRarity, filterLanguage, filterDateFrom, filterDateTo, cards]);

  const fetchUserCards = async (userEmail: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/user/my-cards?email=${encodeURIComponent(userEmail)}`, {
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

    if (filterLanguage) {
      filtered = filtered.filter(card => (card.language || 'English') === filterLanguage);
    }

    if (filterDateFrom) {
      filtered = filtered.filter(card => new Date(card.date_graded) >= new Date(filterDateFrom));
    }

    if (filterDateTo) {
      filtered = filtered.filter(card => new Date(card.date_graded) <= new Date(filterDateTo));
    }

    setFilteredCards(filtered);
  };

  const formatDateToYYYYMMDD = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleExport = () => {
    const csvContent = [
      ['Serial Number', 'Game', 'Card Name', 'Grade', 'Grade Name', 'Year', 'Set', 'Rarity', 'Card Number', 'Language', 'Date Graded'],
      ...filteredCards.map(card => [
        card.card_id,
        card.card_game,
        card.card_name,
        card.card_grade,
        card.grade_name || '',
        card.year_card || '',
        card.set_name,
        card.rarity,
        card.card_number || '',
        card.language || 'English',
        formatDateToYYYYMMDD(card.date_graded)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-graded-cards-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueGames = Array.from(new Set(cards.map(card => card.card_game)));
  const uniqueGrades = Array.from(new Set(cards.map(card => card.card_grade)));
  const uniqueRarities = Array.from(new Set(cards.map(card => card.rarity)));

  if (!currentUser && !loading) {
    return (
      <div className="space-y-6" id="my-cards-login-required">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-white mb-4">Login Required</h3>
          <p className="text-gray-400 mb-6">
            Please log in to view your graded cards.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Login / Create Account
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" id="my-cards-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="my-cards-container">
      {/* Header */}
      <div id="my-cards-header">
        <h2 className="text-2xl font-bold text-white">My Graded Cards</h2>
        <p className="text-gray-400 mt-1">View all your professionally graded cards</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4" id="my-cards-filters">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2 lg:col-span-2" id="my-cards-filter-search">
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
          <div id="my-cards-filter-game">
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
          <div id="my-cards-filter-grade">
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
          <div id="my-cards-filter-rarity">
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

          {/* Filter by Language */}
          <div id="my-cards-filter-language">
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Languages</option>
              {CARD_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Filter by Date From */}
          <div id="my-cards-filter-date-from">
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
          <div id="my-cards-filter-date-to">
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

        {/* Stats and Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-700" id="my-cards-actions">
          <div className="flex items-center gap-4">
            <p className="text-gray-400 text-sm" id="my-cards-count">
              Showing {filteredCards.length} of {cards.length} cards
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              id="my-cards-btn-export"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden" id="my-cards-table-container">
        <div className="overflow-x-auto">
          <table className="w-full" id="my-cards-table">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-serial">
                  Serial Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-game">
                  Game
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-name">
                  Card Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-grade">
                  Grade
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-grade-name">
                  Grade Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-year">
                  Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-set">
                  Set
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-rarity">
                  Rarity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-card-number">
                  Card Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-language">
                  Language
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-date">
                  Date Graded
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider" id="my-cards-th-view">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCards.length > 0 ? (
                filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-700/50 transition-colors" id={`my-card-row-${card.id}`}>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {card.card_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.card_game}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      <Link
                        href={`/cert/${card.card_id}`}
                        className="text-[#d83f0a] hover:text-[#d66a0a] hover:underline font-medium cursor-pointer transition-colors"
                      >
                        {card.card_name}
                      </Link>
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
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.card_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {card.language || 'English'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(card.date_graded).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/cert/${card.card_id}`}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center"
                        title="View Certificate"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    {cards.length === 0 ? (
                      <div>
                        <p className="mb-2">You don't have any graded cards yet.</p>
                        <Link href="/packages" className="text-blue-400 hover:text-blue-300">
                          Submit cards for grading
                        </Link>
                      </div>
                    ) : (
                      'No cards match your filters'
                    )}
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
