export type UserRole = 'customer' | 'store' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Store {
  id: string;
  ownerId: string;
  businessName: string;
  description: string;
  logo?: string;
  banner?: string;
  categories: ('gents' | 'ladies' | 'kids')[];
  address: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  reviewCount: number;
  productCount: number;
  createdAt: Date;
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  originalPrice?: number;
  stock: number;
  sizes: string[];
  colors: string[];
  category: 'gents' | 'ladies' | 'kids';
  tags: string[];
  visible: boolean;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

export interface Order {
  id: string;
  customerId: string;
  storeId: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'card' | 'mpesa' | 'till' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress?: string;
  notes?: string;
  createdAt: Date;
}
