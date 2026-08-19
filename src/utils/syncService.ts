import { BookingLead, CarDaySchedule, NoticeBannerConfig } from '../components/AdminPanelModal';

export interface ServerSyncData {
  bookings: BookingLead[];
  schedules: CarDaySchedule[];
  notice: NoticeBannerConfig;
  adminPassword?: string;
  lastUpdated: number;
}

// Fetch all live data from server
export async function fetchLiveServerData(): Promise<ServerSyncData | null> {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    // offline or static mode fallback
    console.debug('API sync fetch error (using local cache):', err);
  }
  return null;
}

// Push a new or updated booking to the cloud server
export async function syncSaveBooking(booking: BookingLead): Promise<BookingLead[] | null> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (res.ok) {
      const data = await res.json();
      return data.bookings;
    }
  } catch (err) {
    console.debug('Failed to sync booking to server:', err);
  }
  return null;
}

// Update existing booking on cloud server
export async function syncUpdateBooking(booking: BookingLead): Promise<BookingLead[] | null> {
  try {
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (res.ok) {
      const data = await res.json();
      return data.bookings;
    }
  } catch (err) {
    console.debug('Failed to update booking on server:', err);
  }
  return null;
}

// Delete booking on cloud server
export async function syncDeleteBooking(id: string): Promise<BookingLead[] | null> {
  try {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      return data.bookings;
    }
  } catch (err) {
    console.debug('Failed to delete booking on server:', err);
  }
  return null;
}

// Save or toggle a car schedule for a specific date on cloud server
export async function syncSaveSchedule(schedule: CarDaySchedule): Promise<CarDaySchedule[] | null> {
  try {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    if (res.ok) {
      const data = await res.json();
      return data.schedules;
    }
  } catch (err) {
    console.debug('Failed to sync schedule to server:', err);
  }
  return null;
}

// Update notice banner on cloud server
export async function syncUpdateNotice(notice: NoticeBannerConfig): Promise<boolean> {
  try {
    const res = await fetch('/api/notice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notice),
    });
    return res.ok;
  } catch (err) {
    console.debug('Failed to sync notice banner:', err);
    return false;
  }
}
