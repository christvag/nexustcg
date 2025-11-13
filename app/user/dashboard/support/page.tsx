'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Filter,
  Send,
  Paperclip,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Calendar,
  Package,
  X,
  Star,
  ChevronRight
} from 'lucide-react';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_admin' | 'waiting_customer' | 'resolved' | 'closed';
  orderId?: string;
  createdAt: string;
  lastActivity: string;
  messageCount: number;
  isUnread: boolean;
}

interface Message {
  id: string;
  ticketId: string;
  sender: {
    name: string;
    type: 'customer' | 'admin';
    avatar?: string;
  };
  content: string;
  timestamp: string;
  attachments?: string[];
  isRead: boolean;
}

export default function UserSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: '1',
      ticketNumber: 'TICK-001',
      subject: 'Question about card grading process',
      category: 'Grading',
      priority: 'normal',
      status: 'waiting_admin',
      orderId: 'ORD-001',
      createdAt: '2024-01-15T10:30:00Z',
      lastActivity: '2024-01-15T14:20:00Z',
      messageCount: 3,
      isUnread: true
    },
    {
      id: '2',
      ticketNumber: 'TICK-002',
      subject: 'Shipping address change request',
      category: 'Shipping',
      priority: 'high',
      status: 'resolved',
      orderId: 'ORD-002',
      createdAt: '2024-01-12T09:15:00Z',
      lastActivity: '2024-01-14T16:45:00Z',
      messageCount: 5,
      isUnread: false
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      ticketId: '1',
      sender: { name: 'You', type: 'customer' },
      content: 'Hi, I have a question about the grading process for my recent order. How long does it typically take?',
      timestamp: '2024-01-15T10:30:00Z',
      isRead: true
    },
    {
      id: '2',
      ticketId: '1',
      sender: { name: 'Support Team', type: 'admin' },
      content: 'Thank you for your inquiry! The grading process typically takes 10-15 business days depending on the service level you selected. Can you provide your order number so I can check the specific details?',
      timestamp: '2024-01-15T12:00:00Z',
      isRead: true
    },
    {
      id: '3',
      ticketId: '1',
      sender: { name: 'You', type: 'customer' },
      content: 'My order number is ORD-001. I selected the standard PSA grading service.',
      timestamp: '2024-01-15T14:20:00Z',
      isRead: false
    }
  ]);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'waiting_admin':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'waiting_customer':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'waiting_admin':
        return 'bg-orange-100 text-orange-800';
      case 'waiting_customer':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const message: Message = {
      id: Date.now().toString(),
      ticketId: selectedTicket.id,
      sender: { name: 'You', type: 'customer' },
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Update ticket
    setTickets(tickets.map(ticket => 
      ticket.id === selectedTicket.id 
        ? {
            ...ticket,
            lastActivity: new Date().toISOString(),
            messageCount: ticket.messageCount + 1,
            status: 'waiting_admin'
          }
        : ticket
    ));
  };

  const handleCreateTicket = (ticketData: any) => {
    const newTicket: SupportTicket = {
      id: Date.now().toString(),
      ticketNumber: `TICK-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: ticketData.subject,
      category: ticketData.category,
      priority: ticketData.priority,
      status: 'open',
      orderId: ticketData.orderId || undefined,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 1,
      isUnread: false
    };

    const initialMessage: Message = {
      id: Date.now().toString(),
      ticketId: newTicket.id,
      sender: { name: 'You', type: 'customer' },
      content: ticketData.description,
      timestamp: new Date().toISOString(),
      isRead: true
    };

    setTickets([newTicket, ...tickets]);
    setMessages([...messages, initialMessage]);
    setShowNewTicketModal(false);
    setSelectedTicket(newTicket);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const ticketMessages = messages.filter(msg => msg.ticketId === selectedTicket?.id);

  const NewTicketModal = () => {
    const [formData, setFormData] = useState({
      subject: '',
      category: 'general',
      priority: 'normal',
      orderId: '',
      description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.subject || !formData.description) return;
      handleCreateTicket(formData);
      setFormData({
        subject: '',
        category: 'general',
        priority: 'normal',
        orderId: '',
        description: ''
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create Support Ticket</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Brief description of your issue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="general">General</option>
                  <option value="grading">Grading</option>
                  <option value="shipping">Shipping</option>
                  <option value="payment">Payment</option>
                  <option value="technical">Technical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Number (optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.orderId}
                onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                placeholder="ORD-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Please provide detailed information about your issue"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Ticket
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-200px)] flex">
      {/* Tickets Sidebar */}
      <div className="w-1/3 border-r bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center space-x-1 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>New Ticket</span>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <select
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Tickets</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_admin">Waiting for Admin</option>
            <option value="waiting_customer">Waiting for You</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              } ${ticket.isUnread ? 'bg-blue-25' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium truncate ${ticket.isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                    {ticket.subject}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {ticket.ticketNumber} • {ticket.category}
                  </p>
                </div>
                {ticket.isUnread && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                )}
              </div>

              <div className="flex items-center space-x-2 mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{ticket.messageCount} messages</span>
                <span>{new Date(ticket.lastActivity).toLocaleDateString()}</span>
              </div>
              
              {ticket.orderId && (
                <div className="flex items-center text-xs text-blue-600 mt-1">
                  <Package className="h-3 w-3 mr-1" />
                  {ticket.orderId}
                </div>
              )}
            </div>
          ))}
          
          {filteredTickets.length === 0 && (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search criteria' 
                  : "You haven't created any support tickets yet"}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Your First Ticket
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedTicket ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedTicket.subject}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span>{selectedTicket.ticketNumber}</span>
                    <span>{selectedTicket.category}</span>
                    {selectedTicket.orderId && (
                      <span className="flex items-center">
                        <Package className="h-3 w-3 mr-1" />
                        {selectedTicket.orderId}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusIcon(selectedTicket.status)}
                    <span className="ml-1">{selectedTicket.status.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {ticketMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender.type === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender.type === 'customer' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.sender.name}
                      </span>
                      <span className="text-xs opacity-75">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="text-xs opacity-75">
                            📎 {attachment}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {selectedTicket.status !== 'closed' && (
              <div className="p-4 border-t bg-white">
                <div className="flex items-center space-x-3">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </div>
                
                {selectedTicket.status === 'resolved' && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">This ticket has been resolved</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700">
                          <Star className="h-4 w-4" />
                          <span>Rate Support</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a ticket</h3>
              <p className="text-gray-500 mb-4">Choose a ticket from the sidebar to view the conversation</p>
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Ticket</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewTicketModal && <NewTicketModal />}
    </div>
  );
}