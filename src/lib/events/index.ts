import { EventEmitter } from 'eventemitter3';

/**
 * Gearbox Fintech Event Bus
 * 
 * Lightweight, non-invasive event-driven architecture to hook 
 * the AI Ops Engine into the core platform without breaking logic.
 */

export const eventBus = new EventEmitter();

// ============================================================================
// EVENT TYPE DEFINITIONS
// ============================================================================

export interface InvoiceCreatedEvent {
  invoiceId: number;
  ledgerId: number;
  customerId: number;
  jobNumber?: string;
  amount: number;
  dueDate: Date;
  customerEmail?: string;
  customerName?: string;
}

export interface BookingConfirmedEvent {
  bookingId: number;
  ledgerId: number;
  customerId?: number;
  serviceId: number;
  scheduledDate: Date;
  customerEmail?: string;
  customerName?: string;
  vehicleInfo?: any;
}

export interface JobStatusChangedEvent {
  jobId: number;
  ledgerId: number;
  oldStatus: string;
  newStatus: string;
  customerId?: number;
  jobNumber: string;
  finalPrice?: number;
}

export interface PaymentReceivedEvent {
  invoiceId: number;
  ledgerId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  customerId?: number;
}

export interface DVIReadyEvent {
  inspectionId: number;
  jobId?: number;
  vehicleId?: number;
  ledgerId: number;
  inspectionNumber: string;
}

/**
 * Event Constants
 */
export const EVENTS = {
  INVOICE_CREATED: 'invoice.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  JOB_STATUS_CHANGED: 'job.status_changed',
  PAYMENT_RECEIVED: 'payment.received',
  DVI_READY: 'dvi.ready',
} as const;
