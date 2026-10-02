// Shared data models for all integrations (WooCommerce, Freshdesk, Zoho, Unicommerce)

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'unknown';
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type StockStatus = 'instock' | 'outofstock' | 'onbackorder' | 'unknown';

export interface UnifiedCustomer {
  id?: string | number;
  name: string;
  email: string;   // Masked for privacy
  phone: string;   // Masked for privacy
  city?: string;
  state?: string;
  country?: string;
}

export interface UnifiedOrderItem {
  id: string | number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface UnifiedOrder {
  id: string | number;
  order_number: string;
  provider: 'woocommerce' | 'unicommerce' | 'zoho';
  status: string;
  payment: {
    status: PaymentStatus;
    method: string;
    method_title: string;
    transaction_id?: string;
  };
  financials: {
    currency: string;
    total: number;
    subtotal: number;
    tax_total: number;
    shipping_total: number;
  };
  customer: UnifiedCustomer;
  items: UnifiedOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface UnifiedProduct {
  id: string | number;
  name: string;
  sku: string;
  price: number;
  stock: {
    quantity: number | null;
    status: StockStatus;
  };
  categories: string[];
  description: string;
}

export interface UnifiedTicket {
  id: string | number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  requester: {
    name: string;
    email: string; // Masked for privacy
  };
  description: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  url?: string;
}

export interface PaginationInfo {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface PaginatedResult<T> {
  data: T;
  pagination: PaginationInfo;
}
