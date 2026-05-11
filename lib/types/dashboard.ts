export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface ShippingAddress {
  id: number;
  userId: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category?: string;
  setName?: string;
  cardNumber?: string;
  rarity?: string;
  condition?: string;
  basePrice: number;
  currentPrice: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentGateway?: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  shippingAddressId?: number;
  trackingNumber?: string;
  shippedDate?: Date;
  deliveredDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
  tracking?: OrderTracking[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  gradingService?: string;
  grade?: string;
  certNumber?: string;
  product?: Product;
}

export interface OrderTracking {
  id: number;
  orderId: number;
  status: string;
  location?: string;
  description?: string;
  trackingDate: Date;
  createdAt: Date;
}

export interface PopulationReport {
  id: number;
  productId: number;
  totalGraded: number;
  grades: {
    [key: string]: number;
  };
  lastUpdated: Date;
  createdAt: Date;
  product?: Product;
  comments?: PopulationComment[];
}

export interface PopulationComment {
  id: number;
  populationReportId: number;
  userId: number;
  parentCommentId?: number;
  content: string;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  user?: User;
  replies?: PopulationComment[];
}

export interface PaymentConfiguration {
  id: number;
  gatewayName: 'stripe' | 'paypal';
  configKey: string;
  configValue: string;
  isEncrypted: boolean;
  isActive: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title?: string;
  message?: string;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface StoreSetting {
  id: number;
  settingKey: string;
  settingValue?: string;
  settingType?: string;
  category?: string;
  description?: string;
  updatedBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  lowStockProducts: number;
  recentOrders: Order[];
}