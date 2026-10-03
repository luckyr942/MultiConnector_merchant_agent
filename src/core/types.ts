// Shared data models for all merchant integrations (WooCommerce, Freshdesk, Zoho, Unicommerce)

export type ProviderType = 'woocommerce' | 'freshdesk' | 'zoho' | 'unicommerce';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'unknown';
export type OrderStatus = 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed' | 'unknown';
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type StockStatus = 'instock' | 'outofstock' | 'onbackorder' | 'unknown';

// Customer profile details with PII masking
export interface UnifiedCustomer {
  id?: string | number;
  name: string;
  email: string;   // Masked for privacy
  phone: string;   // Masked for privacy
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

// Item entry in a customer order
export interface UnifiedOrderItem {
  id: string | number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

// Shipping address and tracking information
export interface UnifiedShippingDetail {
  carrier?: string;
  tracking_number?: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

// Normalized merchant order object
export interface UnifiedOrder {
  id: string | number;
  order_number: string;
  provider: ProviderType;
  status: OrderStatus | string;
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
  shipping?: UnifiedShippingDetail;
  items: UnifiedOrderItem[];
  created_at: string;
  updated_at: string;
}

// Normalized catalog product
export interface UnifiedProduct {
  id: string | number;
  name: string;
  sku: string;
  price: number;
  regular_price?: number;
  sale_price?: number;
  stock: {
    quantity: number | null;
    status: StockStatus;
  };
  categories: string[];
  description: string;
}

// Inventory stock details by SKU
export interface UnifiedInventoryItem {
  sku: string;
  name: string;
  product_id?: string | number;
  stock_quantity: number | null;
  stock_status: StockStatus;
  warehouse_location?: string;
  in_stock: boolean;
}

// Support ticket representation
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

// Single comment/reply inside a ticket thread
export interface UnifiedTicketConversation {
  id: string | number;
  ticket_id: string | number;
  body_text: string;
  incoming: boolean;
  private: boolean;
  user_id?: string | number;
  created_at: string;
}

// Search and filter parameters
export interface OrderSearchParams {
  query?: string;
  status?: OrderStatus | string;
  payment_status?: PaymentStatus;
  limit?: number;
  page?: number;
}

export interface ProductSearchParams {
  query?: string;
  sku?: string;
  limit?: number;
  page?: number;
}

export interface TicketSearchParams {
  query?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  limit?: number;
  page?: number;
}

// Pagination metadata
export interface PaginationInfo {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

// Paginated API response wrapper
export interface PaginatedResult<T> {
  data: T;
  pagination: PaginationInfo;
}
