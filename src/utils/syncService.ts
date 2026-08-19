import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebase';
import { BookingLead, CarDaySchedule, NoticeBannerConfig } from '../components/AdminPanelModal';
import { FleetCar } from '../types';

export interface ServerSyncData {
  bookings: BookingLead[];
  schedules: CarDaySchedule[];
  notice: NoticeBannerConfig;
  adminPassword?: string;
  lastUpdated: number;
}

// ----------------------------------------------------
// Realtime Subscriptions for Multi-Device Sync
// ----------------------------------------------------

/**
 * Subscribe to real-time changes of all bookings in Firestore
 */
export function subscribeToLiveBookings(callback: (bookings: BookingLead[]) => void): Unsubscribe {
  try {
    const bookingsCol = collection(db, 'bookings');
    return onSnapshot(bookingsCol, (snapshot) => {
      const liveBookings: BookingLead[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as BookingLead;
        liveBookings.push({
          ...data,
          id: docSnap.id
        });
      });
      // Sort newest first
      liveBookings.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      
      // Update local storage cache
      if (liveBookings.length > 0) {
        localStorage.setItem('cholo_jai_bookings', JSON.stringify(liveBookings));
      }
      callback(liveBookings);
    }, (error) => {
      console.warn('Firestore real-time bookings listener error:', error);
    });
  } catch (err) {
    console.warn('Failed to attach Firestore live listener for bookings:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time changes of car day schedules in Firestore
 */
export function subscribeToLiveSchedules(callback: (schedules: CarDaySchedule[]) => void): Unsubscribe {
  try {
    const schedulesCol = collection(db, 'schedules');
    return onSnapshot(schedulesCol, (snapshot) => {
      const liveSchedules: CarDaySchedule[] = [];
      snapshot.forEach((docSnap) => {
        liveSchedules.push(docSnap.data() as CarDaySchedule);
      });
      if (liveSchedules.length > 0) {
        localStorage.setItem('cholo_jai_car_schedules', JSON.stringify(liveSchedules));
      }
      callback(liveSchedules);
    }, (error) => {
      console.warn('Firestore real-time schedules listener error:', error);
    });
  } catch (err) {
    console.warn('Failed to attach Firestore live listener for schedules:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time changes of Notice Banner config
 */
export function subscribeToLiveNotice(callback: (notice: NoticeBannerConfig) => void): Unsubscribe {
  try {
    const noticeDocRef = doc(db, 'settings', 'notice');
    return onSnapshot(noticeDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as NoticeBannerConfig;
        localStorage.setItem('cholo_jai_notice_banner', JSON.stringify(data));
        callback(data);
      }
    }, (error) => {
      console.warn('Firestore real-time notice listener error:', error);
    });
  } catch (err) {
    console.warn('Failed to attach Firestore live listener for notice:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time custom fleet vehicle updates
 */
export function subscribeToLiveFleet(callback: (fleet: FleetCar[]) => void): Unsubscribe {
  try {
    const fleetDocRef = doc(db, 'settings', 'fleet');
    return onSnapshot(fleetDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.cars) && data.cars.length > 0) {
          localStorage.setItem('cholo_jai_custom_fleet', JSON.stringify(data.cars));
          callback(data.cars);
        }
      }
    }, (error) => {
      console.warn('Firestore real-time fleet listener error:', error);
    });
  } catch (err) {
    console.warn('Failed to attach Firestore live listener for fleet:', err);
    return () => {};
  }
}

// ----------------------------------------------------
// Direct Async Operations for Instant Cloud Persistence
// ----------------------------------------------------

/**
 * Fetch all initial data from cloud Firestore
 */
export async function fetchLiveServerData(): Promise<ServerSyncData | null> {
  try {
    // 1. Fetch Bookings from Firestore
    const bookingsCol = collection(db, 'bookings');
    const bookingsSnap = await getDocs(bookingsCol);
    const bookings: BookingLead[] = [];
    bookingsSnap.forEach((docSnap) => {
      bookings.push({
        ...(docSnap.data() as BookingLead),
        id: docSnap.id
      });
    });
    bookings.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

    // 2. Fetch Schedules from Firestore
    const schedulesCol = collection(db, 'schedules');
    const schedulesSnap = await getDocs(schedulesCol);
    const schedules: CarDaySchedule[] = [];
    schedulesSnap.forEach((docSnap) => {
      schedules.push(docSnap.data() as CarDaySchedule);
    });

    // 3. Fetch Settings (Notice & Admin Password)
    const noticeDoc = await getDoc(doc(db, 'settings', 'notice'));
    let notice: NoticeBannerConfig = {
      enabled: true,
      text: '🎉 Special Discount on Digha, Puri & Darjeeling Outstation Tours! Call 9153302517 for instant booking.',
      textBn: '🎉 দিঘা, পুরী ও দার্জিলিং ট্যুরের বুকিংয়ে বিশেষ সুবিধা! ২৪x৭ বুকিংয়ের জন্য ৯১৫৩৩০২৫১৭ নম্বরে সরাসরি ফোন করুন।',
      theme: 'amber'
    };
    if (noticeDoc.exists()) {
      notice = noticeDoc.data() as NoticeBannerConfig;
    }

    const authDoc = await getDoc(doc(db, 'settings', 'auth'));
    const adminPassword = authDoc.exists() ? authDoc.data().adminPassword : undefined;

    return {
      bookings,
      schedules,
      notice,
      adminPassword,
      lastUpdated: Date.now()
    };
  } catch (err) {
    console.warn('Cloud Firestore initial fetch error, falling back to local storage:', err);
    
    // Local storage fallback
    try {
      const savedBookings = JSON.parse(localStorage.getItem('cholo_jai_bookings') || '[]');
      const savedSchedules = JSON.parse(localStorage.getItem('cholo_jai_car_schedules') || '[]');
      const savedNotice = JSON.parse(localStorage.getItem('cholo_jai_notice_banner') || '{}');
      return {
        bookings: savedBookings,
        schedules: savedSchedules,
        notice: savedNotice.text ? savedNotice : {
          enabled: true,
          text: '🎉 Special Discount on Outstation Tours! Call 9153302517',
          textBn: '🎉 দিঘা ও পুরী ট্যুরে বিশেষ ছাড়! বুকিংয়ের জন্য ৯১৫৩৩০২৫১৭ নম্বরে ফোন করুন।',
          theme: 'amber'
        },
        lastUpdated: Date.now()
      };
    } catch (e) {
      return null;
    }
  }
}

/**
 * Save a new or edited booking lead to Cloud Firestore
 */
export async function syncSaveBooking(booking: BookingLead): Promise<boolean> {
  try {
    const bookingId = booking.id || `lead-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const docRef = doc(db, 'bookings', bookingId);
    await setDoc(docRef, {
      ...booking,
      id: bookingId,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Also update local cache
    const saved = JSON.parse(localStorage.getItem('cholo_jai_bookings') || '[]');
    const filtered = saved.filter((b: BookingLead) => b.id !== bookingId);
    localStorage.setItem('cholo_jai_bookings', JSON.stringify([booking, ...filtered]));

    return true;
  } catch (err) {
    console.error('Error saving booking to Firestore:', err);
    return false;
  }
}

/**
 * Update an existing booking in Cloud Firestore
 */
export async function syncUpdateBooking(booking: BookingLead): Promise<boolean> {
  return syncSaveBooking(booking);
}

/**
 * Delete a booking from Cloud Firestore
 */
export async function syncDeleteBooking(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'bookings', id);
    await deleteDoc(docRef);

    // Also update local cache
    const saved = JSON.parse(localStorage.getItem('cholo_jai_bookings') || '[]');
    const filtered = saved.filter((b: BookingLead) => b.id !== id);
    localStorage.setItem('cholo_jai_bookings', JSON.stringify(filtered));

    return true;
  } catch (err) {
    console.error('Error deleting booking from Firestore:', err);
    return false;
  }
}

/**
 * Save car schedule to Cloud Firestore
 */
export async function syncSaveSchedule(schedule: CarDaySchedule): Promise<boolean> {
  try {
    const docId = `${schedule.carId}_${schedule.dateStr}`;
    const docRef = doc(db, 'schedules', docId);
    await setDoc(docRef, {
      ...schedule,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return true;
  } catch (err) {
    console.error('Error saving schedule to Firestore:', err);
    return false;
  }
}

/**
 * Save Notice Banner to Cloud Firestore
 */
export async function syncUpdateNotice(notice: NoticeBannerConfig): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', 'notice');
    await setDoc(docRef, {
      ...notice,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    localStorage.setItem('cholo_jai_notice_banner', JSON.stringify(notice));
    return true;
  } catch (err) {
    console.error('Error updating notice banner in Firestore:', err);
    return false;
  }
}

/**
 * Save Custom Fleet to Cloud Firestore
 */
export async function syncSaveFleet(cars: FleetCar[]): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', 'fleet');
    await setDoc(docRef, {
      cars,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    localStorage.setItem('cholo_jai_custom_fleet', JSON.stringify(cars));
    return true;
  } catch (err) {
    console.error('Error saving fleet to Firestore:', err);
    return false;
  }
}

/**
 * Save custom admin password to Cloud Firestore
 */
export async function syncSaveAdminPassword(password: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', 'auth');
    await setDoc(docRef, {
      adminPassword: password,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    localStorage.setItem('cholo_jai_admin_password', password);
    return true;
  } catch (err) {
    console.error('Error saving admin password to Firestore:', err);
    return false;
  }
}
