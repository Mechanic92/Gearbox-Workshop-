import { eq, and, sql, between } from 'drizzle-orm';
import * as schema from './schema';

/**
 * Booking Availability Calculator
 * 
 * Calculates available time slots for bookings based on:
 * - Business hours
 * - Bay capacity
 * - Existing bookings and jobs
 * - Service duration
 * - Buffer time between jobs
 */

interface BusinessHours {
  [day: string]: { open: string; close: string } | null;
}

interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  reason?: string; // Why unavailable
}

interface AvailabilityParams {
  ledgerId: number;
  date: Date;
  serviceType: string;
  serviceDuration: number; // minutes
  bayCount?: number;
  bufferTime?: number; // minutes between jobs
}

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: '08:00', close: '17:00' },
  tuesday: { open: '08:00', close: '17:00' },
  wednesday: { open: '08:00', close: '17:00' },
  thursday: { open: '08:00', close: '17:00' },
  friday: { open: '08:00', close: '17:00' },
  saturday: { open: '09:00', close: '13:00' },
  sunday: null, // Closed
};

const SLOT_INTERVAL = 30; // minutes
const DEFAULT_BAY_COUNT = 2;
const DEFAULT_BUFFER_TIME = 15; // minutes

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function timeToMinutes(time: string): number {
  if (!time) return 0;
  // Handle HH:MM or ISO date time
  const timeStr = time.includes('T') ? time.split('T')[1].substring(0, 5) : time;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function generateTimeSlots(
  openTime: string,
  closeTime: string,
  serviceDuration: number
): string[] {
  const slots: string[] = [];
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  
  let currentMinutes = openMinutes;
  
  // Generate slots until we can't fit the service duration before closing
  while (currentMinutes + serviceDuration <= closeMinutes) {
    slots.push(minutesToTime(currentMinutes));
    currentMinutes += SLOT_INTERVAL;
  }
  
  return slots;
}

export async function calculateAvailability(
  params: AvailabilityParams,
  db: any // Drizzle database instance
): Promise<TimeSlot[]> {
  const {
    ledgerId,
    date,
    serviceType,
    serviceDuration,
    bayCount = DEFAULT_BAY_COUNT,
    bufferTime = DEFAULT_BUFFER_TIME,
  } = params;

  const dayName = getDayName(date);
  const businessHours = DEFAULT_BUSINESS_HOURS[dayName];

  // If closed on this day
  if (!businessHours) {
    return [];
  }

  // Generate all possible time slots for the day
  const allSlots = generateTimeSlots(
    businessHours.open,
    businessHours.close,
    serviceDuration
  );

  // Define day start and end for query
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get existing bookings for this date using Drizzle
  const existingBookings = await db.query.bookings.findMany({
    where: and(
      eq(schema.bookings.ledgerId, ledgerId),
      between(schema.bookings.scheduledDate, startOfDay, endOfDay),
      sql`${schema.bookings.status} IN ('pending', 'confirmed')`
    )
  });

  // Get existing jobs for this date using Drizzle
  const existingJobs = await db.query.jobs.findMany({
    where: and(
      eq(schema.jobs.ledgerId, ledgerId),
      between(schema.jobs.createdAt, startOfDay, endOfDay), // Assuming creation date or we need a 'scheduledDate' for jobs
      sql`${schema.jobs.status} NOT IN ('completed', 'cancelled')`
    )
  });

  // Calculate availability for each slot
  const availability: TimeSlot[] = allSlots.map((slotTime) => {
    const slotMinutes = timeToMinutes(slotTime);
    const slotEndMinutes = slotMinutes + serviceDuration + bufferTime;

    // Count how many bays are occupied during this slot
    let occupiedBays = 0;

    // Check bookings
    for (const booking of existingBookings) {
      const bookingStart = dateToMinutes(booking.scheduledDate);
      const bookingEnd = bookingStart + (booking.duration || 60) + bufferTime;

      // Check if there's overlap
      if (
        (slotMinutes >= bookingStart && slotMinutes < bookingEnd) ||
        (slotEndMinutes > bookingStart && slotEndMinutes <= bookingEnd) ||
        (slotMinutes <= bookingStart && slotEndMinutes >= bookingEnd)
      ) {
        occupiedBays++;
      }
    }

    // Check jobs
    for (const job of existingJobs) {
      // In a real system, jobs would have a scheduled start time.
      // If the job table doesn't have a specific scheduledTime, 
      // we might need to use its appointment time if it came from a booking.
      // For now, we'll assume jobs start at 8am if no time is available.
      const jobStart = job.startedAt ? dateToMinutes(job.startedAt) : timeToMinutes('08:00');
      const jobDuration = 120; // Default job duration or from metadata
      const jobEnd = jobStart + jobDuration + bufferTime;

      if (
        (slotMinutes >= jobStart && slotMinutes < jobEnd) ||
        (slotEndMinutes > jobStart && slotEndMinutes <= jobEnd) ||
        (slotMinutes <= jobStart && slotEndMinutes >= jobEnd)
      ) {
        occupiedBays++;
      }
    }

    const available = occupiedBays < bayCount;

    return {
      time: slotTime,
      available,
      reason: available ? undefined : 'All bays occupied',
    };
  });

  return availability;
}

// Helper to get next available date
export async function getNextAvailableDate(
  ledgerId: number,
  serviceType: string,
  serviceDuration: number,
  db: any,
  startDate: Date = new Date()
): Promise<{ date: Date; slots: TimeSlot[] } | null> {
  const maxDaysToCheck = 30;
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < maxDaysToCheck; i++) {
    const availability = await calculateAvailability(
      {
        ledgerId,
        date: currentDate,
        serviceType,
        serviceDuration,
      },
      db
    );

    const availableSlots = availability.filter((slot) => slot.available);

    if (availableSlots.length > 0) {
      return {
        date: new Date(currentDate),
        slots: availableSlots,
      };
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return null; // No availability found in next 30 days
}
