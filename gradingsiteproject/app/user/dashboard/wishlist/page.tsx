'use client';

import { useState, useEffect } from 'react';
import { Heart, Star, ShoppingCart, Trash2, Search, Filter } from 'lucide-react';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    setTimeout(() => {
      setWishlistItems([
        {
          id: 'WISH-001',
          cardName: 'Pokemon Charizard Base Set',
          category: 'pokemon',
          rarity: 'Rare',
          estimatedValue: 299.99,
          priceHistory: [
            { date: '2024-01-01', price: 280.00 },
            { date: '2024-01-15', price: 299.99 }
          ],
          image: '/api/placeholder/200/280',
          addedAt: '2024-01-10T00:00:00Z',
          inStock: true,
          priority: 'high'
        },
        {
          id: 'WISH-002',
          cardName: 'Yu-Gi-Oh Blue Eyes White Dragon',
          category: 'yugioh',
          rarity: 'Ultra Rare',
          estimatedValue: 199.99,
          priceHistory: [
            { date: '2024-01-01', price: 189.99 },
            { date: '2024-01-15', price: 199.99 }
          ],
          image: '/api/placeholder/200/280',
          addedAt: '2024-01-08T00:00:00Z',
          inStock: false,
          priority: 'medium'
        },
        {
          id: 'WISH-003',
          cardName: 'MTG Black Lotus',
          category: 'mtg',
          rarity: 'Mythic',
          estimatedValue: 15000.00,
          priceHistory: [
            { date: '2024-01-01', price: 14500.00 },
            { date: '2024-01-15', price: 15000.00 }
          ],
          image: '/api/placeholder/200/280',
          addedAt: '2024-01-05T00:00:00Z',
          inStock: true,
          priority: 'high'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const removeFromWishlist = (itemId: string) => {
    setWishlistItems(items => items.filter((item: any) => item.id !== itemId));
  };

  const updatePriority = (itemId: string, priority: string) => {
    setWishlistItems(items => 
      items.map((item: any) => 
        item.id === itemId ? { ...item, priority } : item
      )
    );
  };

  const filteredItems = wishlistItems.filter((item: any) => {
    const matchesSearch = item.cardName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
        <p className="text-gray-600">Keep track of cards you want to collect and grade</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search wishlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="pokemon">Pokemon</option>
            <option value="yugioh">Yu-Gi-Oh</option>
            <option value="mtg">Magic: The Gathering</option>
            <option value="sports">Sports Cards</option>
          </select>
        </div>
      </div>

      {/* Wishlist Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{wishlistItems.length}</p>
              <p className="text-gray-600">Total Items</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                ${wishlistItems.reduce((sum: number, item: any) => sum + item.estimatedValue, 0).toLocaleString()}
              </p>
              <p className="text-gray-600">Total Value</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {wishlistItems.filter((item: any) => item.inStock).length}
              </p>
              <p className="text-gray-600">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wishlist Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border">
          <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items in wishlist</h3>
          <p className="text-gray-500">Start adding cards to your wishlist to track them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="relative">
                <img
                  src={item.image}
                  alt={item.cardName}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="p-2 bg-white rounded-full shadow hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                    {item.priority} priority
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{item.cardName}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.category} • {item.rarity}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    ${item.estimatedValue.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium ${item.inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {item.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <select
                    value={item.priority}
                    onChange={(e) => updatePriority(item.id, e.target.value)}
                    className="flex-1 text-sm border border-gray-300 rounded px-3 py-1"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}