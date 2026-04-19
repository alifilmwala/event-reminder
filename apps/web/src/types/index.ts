// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript types — no Prisma dependency
// ─────────────────────────────────────────────────────────────────────────────

export interface Guest {
  id:          string;
  name:        string;
  mobile:      string;       // E.164: +91XXXXXXXXXX
  tableNumber: string;
  token:       string;       // 256-bit base64url secure token
  linkVisited: boolean;
  visitedAt:   string | null; // ISO 8601
  createdAt:   string;        // ISO 8601
}

export interface Message {
  id:        string;
  guestId:   string;
  status:    'PENDING' | 'SENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  sentAt:    string | null;
  errorMsg:  string | null;
  retries:   number;
  createdAt: string;
}

export interface EventConfig {
  id:          string;
  name:        string;
  date:        string; // ISO 8601
  venue:       string;
  description: string;
}

export interface Schedule {
  id:          string;
  scheduledAt: string; // ISO 8601
  type:        'REMINDER' | 'DAY_BEFORE' | 'SAME_DAY_MORNING' | 'CUSTOM';
  status:      'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt:   string;
}

// ─── View / composite types ───────────────────────────────────────────────────

export interface GuestWithStats extends Guest {
  latestMessage: Pick<Message, 'status' | 'sentAt' | 'errorMsg'> | null;
}

// Keep alias so existing code still compiles
export type GuestWithLatestMessage = GuestWithStats;

export interface DashboardStats {
  totalGuests:     number;
  sentCount:       number;
  pendingCount:    number;
  failedCount:     number;
  linkVisitedCount: number;
}

// ─── API response helpers ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

export type WhatsAppStatus = 'CONNECTED' | 'QR_PENDING' | 'DISCONNECTED' | 'INITIALIZING';

export interface WhatsAppStatusResponse {
  status: WhatsAppStatus;
  phone?: string;
}

/** Payload the web app assembles and sends to the WA service for a batch */
export interface BatchGuestPayload {
  guestId:     string;
  messageId:   string;
  name:        string;
  mobile:      string;
  tableNumber: string;
  link:        string;
}
