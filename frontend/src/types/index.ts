// ── Pagination ────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// ── User ──────────────────────────────────────────────────
export type UserRole = 'admin' | 'organizer' | 'staff' | 'attendee';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  locale?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

// ── Organizer ─────────────────────────────────────────────
export interface Organizer {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo?: string;
  banner?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country: string;
  currency: string;
  is_active: boolean;
  events_count?: number;
  venues_count?: number;
  created_at?: string;
}

// ── Venue ─────────────────────────────────────────────────
export interface Venue {
  id: number;
  organizer_id: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  website?: string;
  phone?: string;
  email?: string;
  image?: string;
  is_online: boolean;
}

// ── Category ──────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  sort_order: number;
}

// ── Event ─────────────────────────────────────────────────
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed' | 'archived';
export type EventVisibility = 'public' | 'private' | 'unlisted';

export interface Event {
  id: number;
  organizer_id: number;
  venue_id?: number;
  category_id?: number;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  start_date: string;
  end_date?: string;
  timezone: string;
  status: EventStatus;
  visibility: EventVisibility;
  cover_image?: string;
  banner_image?: string;
  max_attendees?: number;
  is_online: boolean;
  online_url?: string;
  website?: string;
  tags?: string[];
  currency: string;
  is_featured: boolean;
  views_count: number;
  organizer?: Organizer;
  venue?: Venue;
  category?: Category;
  ticket_types?: TicketType[];
  created_at?: string;
  updated_at?: string;
}

export interface EventStats {
  total_tickets?: number;
  sold_tickets: number;
  available?: number;
  total_revenue: number;
  total_orders: number;
  checked_in: number;
  check_in_rate: number;
}

// ── TicketType ────────────────────────────────────────────
export type TicketStatus = 'active' | 'inactive' | 'sold_out';
export type TicketKind   = 'paid' | 'free' | 'donation';

export interface TicketType {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  min_per_order: number;
  max_per_order?: number;
  sale_start_date?: string;
  sale_end_date?: string;
  status: TicketStatus;
  type: TicketKind;
  is_hidden: boolean;
  sort_order: number;
  tax_rate: number;
  sold_count?: number;
  available_count?: number;
}

// ── PromoCode ─────────────────────────────────────────────
export interface PromoCode {
  id: number;
  event_id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses?: number;
  uses_count: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
}

// ── Order ─────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'partially_refunded';

export interface Order {
  id: number;
  event_id: number;
  user_id?: number;
  order_number: string;
  status: OrderStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  payment_method?: string;
  notes?: string;
  paid_at?: string;
  event?: Partial<Event>;
  items?: OrderItem[];
  created_at?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  ticket_type_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  total: number;
  ticket_type?: TicketType;
  attendees?: Attendee[];
}

// ── Attendee ──────────────────────────────────────────────
export type AttendeeStatus = 'active' | 'cancelled' | 'checked_in';

export interface Attendee {
  id: number;
  event_id: number;
  order_id: number;
  ticket_type_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  ticket_number: string;
  qr_code?: string;
  status: AttendeeStatus;
  checked_in_at?: string;
  notes?: string;
  public_id: string;
  ticket_type?: TicketType;
  order?: Partial<Order>;
}

// ── CheckInList ───────────────────────────────────────────
export interface CheckInList {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  short_code: string;
  is_active: boolean;
  ticket_types?: TicketType[];
  attendees_count?: number;
}

// ── Message ───────────────────────────────────────────────
export interface Message {
  id: number;
  event_id: number;
  user_id: number;
  subject: string;
  body: string;
  type: 'email' | 'sms';
  status: 'draft' | 'sent' | 'failed';
  sent_at?: string;
  recipients_count: number;
  created_at?: string;
}

// ── Dashboard Stats ───────────────────────────────────────
export interface DashboardStats {
  total_events: number;
  published_events: number;
  total_orders: number;
  total_revenue: number;
  total_attendees: number;
  checked_in: number;
}

export interface RevenueData {
  date: string;
  total: number;
  orders: number;
}
