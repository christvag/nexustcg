'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  ThumbsUp,
  MessageCircle,
  Share2,
  Eye,
  Star,
  TrendingUp,
  Calendar,
  User,
  Package,
  Heart,
  MoreVertical,
  Reply,
  Send,
  Image,
  Users,
  Trophy,
  Target
} from 'lucide-react';

interface PopulationCard {
  id: string;
  name: string;
  set: string;
  cardNumber: string;
  rarity: string;
  image: string;
  totalGraded: number;
  myGrade?: string;
  myCertNumber?: string;
  gradingDistribution: {
    grade: string;
    count: number;
    percentage: number;
  }[];
  marketValue: number;
  priceChange: number;
  lastUpdated: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  user: {
    name: string;
    avatar?: string;
    memberSince: string;
    totalCards: number;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies: Reply[];
  isLiked: boolean;
  grade?: string;
  certNumber?: string;
}

interface Reply {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

export default function CommunityFeatures() {
  const [populationCards, setPopulationCards] = useState<PopulationCard[]>([
    {
      id: '1',
      name: 'Charizard VMAX',
      set: 'Darkness Ablaze',
      cardNumber: '020/189',
      rarity: 'VMAX Rare',
      image: '/card1.jpg',
      totalGraded: 15420,
      myGrade: '9',
      myCertNumber: 'PSA123456789',
      gradingDistribution: [
        { grade: '10', count: 1542, percentage: 10.0 },
        { grade: '9', count: 4626, percentage: 30.0 },
        { grade: '8', count: 3084, percentage: 20.0 },
        { grade: '7', count: 2313, percentage: 15.0 },
        { grade: '6', count: 1542, percentage: 10.0 },
        { grade: 'Below 6', count: 2313, percentage: 15.0 }
      ],
      marketValue: 145.50,
      priceChange: 12.5,
      lastUpdated: '2024-01-15',
      comments: [
        {
          id: '1',
          user: {
            name: 'CardCollector92',
            avatar: '',
            memberSince: '2023-01-15',
            totalCards: 156
          },
          content: 'Just got my Charizard back from PSA! So happy with the 10 grade. The centering on this card is absolutely perfect.',
          timestamp: '2024-01-15T10:30:00Z',
          likes: 24,
          replies: [],
          isLiked: false,
          grade: '10',
          certNumber: 'PSA987654321'
        },
        {
          id: '2',
          user: {
            name: 'PokeMaster',
            avatar: '',
            memberSince: '2022-05-20',
            totalCards: 89
          },
          content: 'The population for 10s seems to be increasing lately. Wonder if PSA standards have changed or if people are getting better at identifying mint cards.',
          timestamp: '2024-01-14T15:20:00Z',
          likes: 18,
          replies: [
            {
              id: '1',
              user: {
                name: 'GradingExpert',
                avatar: ''
              },
              content: "I think it's a combination of both. People are learning what to look for, and the recent prints have better quality control.",
              timestamp: '2024-01-14T16:00:00Z',
              likes: 7,
              isLiked: false
            }
          ],
          isLiked: true
        }
      ]
    },
    {
      id: '2',
      name: 'Pikachu V',
      set: 'Vivid Voltage',
      cardNumber: '043/185',
      rarity: 'Ultra Rare',
      image: '/card2.jpg',
      totalGraded: 8932,
      gradingDistribution: [
        { grade: '10', count: 1786, percentage: 20.0 },
        { grade: '9', count: 2680, percentage: 30.0 },
        { grade: '8', count: 1786, percentage: 20.0 },
        { grade: '7', count: 1340, percentage: 15.0 },
        { grade: '6', count: 893, percentage: 10.0 },
        { grade: 'Below 6', count: 447, percentage: 5.0 }
      ],
      marketValue: 85.00,
      priceChange: -5.2,
      lastUpdated: '2024-01-14',
      comments: []
    }
  ]);

  const [activeTab, setActiveTab] = useState('population');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<PopulationCard | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [newReply, setNewReply] = useState('');

  const handleLikeComment = (cardId: string, commentId: string) => {
    setPopulationCards(cards =>
      cards.map(card =>
        card.id === cardId
          ? {
              ...card,
              comments: card.comments.map(comment =>
                comment.id === commentId
                  ? {
                      ...comment,
                      isLiked: !comment.isLiked,
                      likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
                    }
                  : comment
              )
            }
          : card
      )
    );
  };

  const handleAddComment = (cardId: string) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: {
        name: 'You',
        memberSince: '2023-01-15',
        totalCards: 42
      },
      content: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: [],
      isLiked: false
    };

    setPopulationCards(cards =>
      cards.map(card =>
        card.id === cardId
          ? { ...card, comments: [comment, ...card.comments] }
          : card
      )
    );

    setNewComment('');
  };

  const handleAddReply = (cardId: string, commentId: string) => {
    if (!newReply.trim()) return;

    const reply: Reply = {
      id: Date.now().toString(),
      user: {
        name: 'You'
      },
      content: newReply,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false
    };

    setPopulationCards(cards =>
      cards.map(card =>
        card.id === cardId
          ? {
              ...card,
              comments: card.comments.map(comment =>
                comment.id === commentId
                  ? { ...comment, replies: [...comment.replies, reply] }
                  : comment
              )
            }
          : card
      )
    );

    setNewReply('');
    setReplyTo(null);
  };

  const filteredCards = populationCards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.set.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CardDetailModal = ({ card }: { card: PopulationCard }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="h-32 w-24 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{card.name}</h3>
                <p className="text-gray-600">{card.set} - {card.cardNumber}</p>
                <p className="text-sm text-gray-500">{card.rarity}</p>
                
                {card.myGrade && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Your Card</div>
                    <div className="text-sm text-blue-700">
                      Grade: {card.myGrade} • Cert: {card.myCertNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">${card.marketValue}</div>
              <div className={`text-sm flex items-center ${
                card.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                {card.priceChange >= 0 ? '+' : ''}{card.priceChange}%
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Population Distribution */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Grading Distribution ({card.totalGraded.toLocaleString()} total)</h4>
            <div className="space-y-2">
              {card.gradingDistribution.map((grade) => (
                <div key={grade.grade} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Grade {grade.grade}</span>
                  <div className="flex items-center space-x-3 flex-1 mx-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${grade.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {grade.count.toLocaleString()} ({grade.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Community Discussion ({card.comments.length})</h4>
            
            {/* Add Comment */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this card's population or your grading experience..."
                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Image className="h-4 w-4" />
                  <span>Add photos</span>
                </div>
                <button
                  onClick={() => handleAddComment(card.id)}
                  disabled={!newComment.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Post Comment</span>
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              {card.comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">{comment.user.name}</span>
                        <span className="text-xs text-gray-500">
                          {comment.user.totalCards} cards • Member since {new Date(comment.user.memberSince).getFullYear()}
                        </span>
                        {comment.grade && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            Grade {comment.grade}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-3">{comment.content}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleLikeComment(card.id, comment.id)}
                          className={`flex items-center space-x-1 hover:text-blue-600 ${
                            comment.isLiked ? 'text-blue-600' : ''
                          }`}
                        >
                          <ThumbsUp className={`h-4 w-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                          <span>{comment.likes}</span>
                        </button>
                        
                        <button
                          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <Reply className="h-4 w-4" />
                          <span>Reply</span>
                        </button>
                        
                        <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                      </div>

                      {/* Reply Form */}
                      {replyTo === comment.id && (
                        <div className="mt-3 ml-4 p-3 bg-gray-50 rounded-lg">
                          <textarea
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              onClick={() => setReplyTo(null)}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAddReply(card.id, comment.id)}
                              disabled={!newReply.trim()}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="mt-4 ml-4 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start space-x-3">
                              <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-sm text-gray-900">{reply.user.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{reply.content}</p>
                                <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>{reply.likes}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t">
          <button
            onClick={() => setSelectedCard(null)}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Community Hub</h2>
        <p className="text-gray-600 mt-1">Connect with collectors and discuss population reports</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'population', label: 'Population Reports', icon: TrendingUp },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'achievements', label: 'Achievements', icon: Target }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Population Reports Tab */}
          {activeTab === 'population' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search cards..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCards.map((card) => (
                  <div key={card.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="h-24 w-18 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{card.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{card.set} - {card.cardNumber}</p>
                        
                        {card.myGrade && (
                          <div className="mb-2 p-2 bg-blue-50 rounded">
                            <div className="text-xs text-blue-600">Your Grade: {card.myGrade}</div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{card.totalGraded.toLocaleString()} graded</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">${card.marketValue}</span>
                            <span className={`text-xs ${
                              card.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {card.priceChange >= 0 ? '+' : ''}{card.priceChange}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center space-x-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{card.comments.length}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>245</span>
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedCard(card)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Top Collectors */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    <h3 className="font-semibold text-gray-900">Top Collectors</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'CardMaster99', cards: 2456, grade: '9.2 avg' },
                      { name: 'PokemonPro', cards: 1892, grade: '8.9 avg' },
                      { name: 'GradedGuru', cards: 1654, grade: '9.1 avg' }
                    ].map((user, index) => (
                      <div key={user.name} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.cards} cards • {user.grade}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Active */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Most Active</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'CommunityHelper', comments: 156, likes: 892 },
                      { name: 'GradingExpert', comments: 134, likes: 734 },
                      { name: 'You', comments: 12, likes: 45 }
                    ].map((user, index) => (
                      <div key={user.name} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.comments} comments • {user.likes} likes</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Your Stats */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Star className="h-6 w-6 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Your Stats</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-gray-900">42 Cards Graded</div>
                      <div className="text-sm text-gray-600">8.7 average grade</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">12 Comments</div>
                      <div className="text-sm text-gray-600">45 total likes received</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Rank #247</div>
                      <div className="text-sm text-gray-600">Out of 1,523 members</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { 
                    title: 'First Grade 10', 
                    description: 'Receive your first perfect grade',
                    icon: '🎯',
                    earned: true,
                    date: '2024-01-10'
                  },
                  { 
                    title: 'Community Helper', 
                    description: 'Help 10 members with comments',
                    icon: '🤝',
                    earned: true,
                    date: '2024-01-05'
                  },
                  { 
                    title: 'Grading Veteran', 
                    description: 'Grade 50+ cards',
                    icon: '🏆',
                    earned: false,
                    progress: '42/50'
                  },
                  { 
                    title: 'Popular Comment', 
                    description: 'Receive 25+ likes on a comment',
                    icon: '❤️',
                    earned: false,
                    progress: '15/25'
                  },
                  { 
                    title: 'Set Collector', 
                    description: 'Complete a full set in PSA 9+',
                    icon: '📦',
                    earned: false
                  },
                  { 
                    title: 'Market Expert', 
                    description: 'Track 100+ population reports',
                    icon: '📊',
                    earned: false,
                    progress: '23/100'
                  }
                ].map((achievement) => (
                  <div key={achievement.title} className={`p-4 rounded-lg border-2 ${
                    achievement.earned 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <h3 className={`font-medium ${
                          achievement.earned ? 'text-green-900' : 'text-gray-700'
                        }`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${
                          achievement.earned ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    
                    {achievement.earned ? (
                      <div className="flex items-center text-sm text-green-600">
                        <Trophy className="h-4 w-4 mr-1" />
                        Earned on {achievement.date}
                      </div>
                    ) : achievement.progress ? (
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(parseInt(achievement.progress.split('/')[0]) / parseInt(achievement.progress.split('/')[1])) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Not yet earned</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCard && <CardDetailModal card={selectedCard} />}
    </div>
  );
}