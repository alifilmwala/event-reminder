/** Minimal type definitions used by the WhatsApp microservice. */

export interface Schedule {
  id:          string;
  scheduledAt: string;
  type:        string;
  status:      'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt:   string;
}
