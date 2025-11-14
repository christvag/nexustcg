'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  MessageSquare,
  Send,
  Paperclip,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Archive,
  MoreVertical,
  Phone,
  Mail,
  Eye
} from 'lucide-react';

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'waiting_admin' | 'resolved' | 'closed';
  category: string;
  assignedTo?: string;
  lastMessage: string;
  lastActivity: string;
  messageCount: number;
  isUnread: boolean;
  orderId?: string;
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

export default function MessagingSystem() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok && data.tickets) {
        const mappedTickets = data.tickets.map((ticket: any) => ({
          id: String(ticket.id),
          ticketNumber: ticket.id,
          subject: ticket.subject,
          customer: {
            name: ticket.customerName,
            email: ticket.customerEmail
          },
          priority: ticket.priority as 'low' | 'normal' | 'high' | 'urgent',
          status: ticket.status as 'open' | 'in_progress' | 'waiting_customer' | 'waiting_admin' | 'resolved' | 'closed',
          category: ticket.category,
          assignedTo: ticket.assignedTo,
          lastMessage: ticket.messages[0]?.content || '',
          lastActivity: ticket.lastActivity,
          messageCount: ticket.messages.length,
          isUnread: false,
          orderId: ticket.orderId
        }));
        setTickets(mappedTickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      ticketId: '1',
      sender: { name: 'John Doe', type: 'customer' },
      content: 'I received my card back but the grade seems incorrect. I expected at least a 9 but got a 7.',
      timestamp: '2024-01-15T10:30:00Z',
      isRead: true
    },
    {
      id: '2',
      ticketId: '1',
      sender: { name: 'Admin User', type: 'admin' },
      content: 'Thank you for contacting us. Can you please provide the certificate number so I can review the grading details?',
      timestamp: '2024-01-15T11:00:00Z',
      isRead: true
    }
  ]);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(tickets[0] || null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'waiting_customer':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting_admin':
        return 'bg-orange-100 text-orange-800';
      case 'resolved':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const message: Message = {
      id: Date.now().toString(),
      ticketId: selectedTicket.id,
      sender: { name: 'Admin User', type: 'admin' },
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
            lastMessage: newMessage,
            lastActivity: new Date().toISOString(),
            messageCount: ticket.messageCount + 1,
            status: 'waiting_customer'
          }
        : ticket
    ));
  };

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus as any }
        : ticket
    ));
  };

  const handlePriorityChange = (ticketId: string, newPriority: string) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, priority: newPriority as any }
        : ticket
    ));
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const ticketMessages = messages.filter(msg => msg.ticketId === selectedTicket?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex">
      {/* Tickets Sidebar */}
      <div className="w-1/3 border-r bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Tickets</h3>
          
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
          <div className="flex space-x-2">
            <select
              className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting Customer</option>
              <option value="resolved">Resolved</option>
            </select>
            
            <select
              className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
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
                    {ticket.ticketNumber} • {ticket.customer.name}
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

              <p className="text-xs text-gray-600 truncate mb-1">
                {ticket.lastMessage}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{ticket.messageCount} messages</span>
                <span>{new Date(ticket.lastActivity).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedTicket ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedTicket.subject}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{selectedTicket.customer.name}</span>
                      <span>{selectedTicket.customer.email}</span>
                      {selectedTicket.orderId && (
                        <span>Order: {selectedTicket.orderId}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <select
                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getPriorityColor(selectedTicket.priority)}`}
                    value={selectedTicket.priority}
                    onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  
                  <select
                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(selectedTicket.status)}`}
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_customer">Waiting Customer</option>
                    <option value="waiting_admin">Waiting Admin</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {ticketMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender.type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender.type === 'admin' 
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
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a ticket</h3>
              <p className="text-gray-500">Choose a ticket from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}