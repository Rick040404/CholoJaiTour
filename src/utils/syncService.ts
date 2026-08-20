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
import { FleetCar, OccasionBroadcastState, CRMCustomerProfile, CustomerVisitRecord, DriverProfile } from '../types';

export interface ServerSyncData {
  bookings: BookingLead[];
  schedules: CarDaySchedule[];
  notice: NoticeBannerConfig;
  occasion?: OccasionBroadcastState;
  customers?: CRMCustomerProfile[];
  drivers?: DriverProfile[];
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
  * Subscribe to real-time changes of Occasion Broadcast State
  */
export function subscribeToLiveOccasion(callback: (occasion: OccasionBroadcastState | null) => void): Unsubscribe {
  try {
    const occasionDocRef = doc(db, 'settings', 'occasion');
    return onSnapshot(occasionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as OccasionBroadcastState;
        localStorage.setItem('cholo_jai_occasion_broadcast', JSON.stringify(data));
        callback(data);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('Firestore real-time occasion listener error:', error);
    });
  } catch (err) {
    console.warn('Failed to attach Firestore live listener for occasion:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time changes of CRM customers in Firestore
 */
export function subscribeToLiveCustomers(callback: (customers: CRMCustomerProfile[]) => void): Unsubscribe {
  try {
    const customersCol = collection(db, 'customers');
    return onSnapshot(customersCol, (snapshot) => {
      const liveCustomers: CRMCustomerProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as CRMCustomerProfile;
        liveCustomers.push({
          ...data,
          id: docSnap.id
        });
      });
      // Sort recently updated or visited first
      liveCustomers.sort((a, b) => new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime());
      
      // Update local storage cache
      if (liveCustomers.length > 0) {
        localStorage.setItem('cholo_jai_crm_customers', JSON.stringify(liveCustomers));
      }
      callback(liveCustomers);
    }, (error) => {
      console.warn('Firestore real-time customers listener error:', error);
    });
  } catch (err) {
    console.warn('Failed to attach Firestore live listener for customers:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time changes of Drivers in Firestore
 */
export function subscribeToLiveDrivers(callback: (drivers: DriverProfile[]) => void): Unsubscribe {
  try {
    const driversCol = collection(db, 'drivers');
    return onSnapshot(driversCol, (snapshot) => {
      const liveDrivers: DriverProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DriverProfile;
        liveDrivers.push({
          ...data,
          id: docSnap.id
        });
      });
      liveDrivers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      // Update local storage cache
      if (liveDrivers.length > 0) {
        localStorage.setItem('cholo_jai_drivers', JSON.stringify(liveDrivers));
      }
      callback(liveDrivers);
    }, (error) => {
      console.warn('Firestore real-time drivers listener error:', error);
    });
  } catch (err) {
    console.warn('Failed to attach Firestore live listener for drivers:', err);
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

    // 3. Fetch CRM Customers from Firestore
    const customersCol = collection(db, 'customers');
    const customersSnap = await getDocs(customersCol);
    const customers: CRMCustomerProfile[] = [];
    customersSnap.forEach((docSnap) => {
      customers.push({
        ...(docSnap.data() as CRMCustomerProfile),
        id: docSnap.id
      });
    });
    customers.sort((a, b) => new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime());

    // 4. Fetch Drivers from Firestore
    const driversCol = collection(db, 'drivers');
    const driversSnap = await getDocs(driversCol);
    const drivers: DriverProfile[] = [];
    driversSnap.forEach((docSnap) => {
      drivers.push({
        ...(docSnap.data() as DriverProfile),
        id: docSnap.id
      });
    });
    drivers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // 5. Fetch Settings (Notice & Admin Password)
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
      customers,
      drivers,
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
      const savedCustomers = JSON.parse(localStorage.getItem('cholo_jai_crm_customers') || '[]');
      const savedDrivers = JSON.parse(localStorage.getItem('cholo_jai_drivers') || '[]');
      return {
        bookings: savedBookings,
        schedules: savedSchedules,
        customers: savedCustomers,
        drivers: savedDrivers,
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

/**
 * Save Occasion Broadcast State to Cloud Firestore
 */
export async function syncUpdateOccasion(occasion: OccasionBroadcastState): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', 'occasion');
    await setDoc(docRef, {
      ...occasion,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    localStorage.setItem('cholo_jai_occasion_broadcast', JSON.stringify(occasion));
    return true;
  } catch (err) {
    console.error('Error updating occasion in Firestore:', err);
    return false;
  }
}

// ----------------------------------------------------
// CRM Customer Management Firestore Operations
// ----------------------------------------------------

/**
 * Save or update a CRM customer profile in Cloud Firestore
 */
export async function syncSaveCustomer(customer: CRMCustomerProfile): Promise<boolean> {
  try {
    const customerId = customer.id || `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const docRef = doc(db, 'customers', customerId);
    
    const customerData: CRMCustomerProfile = {
      ...customer,
      id: customerId,
      updatedAt: new Date().toISOString(),
      createdAt: customer.createdAt || new Date().toISOString()
    };

    await setDoc(docRef, customerData, { merge: true });

    // Update local storage cache
    const saved = JSON.parse(localStorage.getItem('cholo_jai_crm_customers') || '[]');
    const filtered = saved.filter((c: CRMCustomerProfile) => c.id !== customerId);
    localStorage.setItem('cholo_jai_crm_customers', JSON.stringify([customerData, ...filtered]));

    return true;
  } catch (err) {
    console.error('Error saving customer to Firestore:', err);
    return false;
  }
}

/**
 * Update CRM customer profile
 */
export async function syncUpdateCustomer(customer: CRMCustomerProfile): Promise<boolean> {
  return syncSaveCustomer(customer);
}

/**
 * Delete a CRM customer profile from Cloud Firestore
 */
export async function syncDeleteCustomer(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'customers', id);
    await deleteDoc(docRef);

    // Update local storage cache
    const saved = JSON.parse(localStorage.getItem('cholo_jai_crm_customers') || '[]');
    const filtered = saved.filter((c: CRMCustomerProfile) => c.id !== id);
    localStorage.setItem('cholo_jai_crm_customers', JSON.stringify(filtered));

    return true;
  } catch (err) {
    console.error('Error deleting customer from Firestore:', err);
    return false;
  }
}

/**
 * Add a new visit / trip record to a customer's visit history in Cloud Firestore
 */
export async function syncAddCustomerVisit(customerId: string, visit: CustomerVisitRecord): Promise<boolean> {
  try {
    const docRef = doc(db, 'customers', customerId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data() as CRMCustomerProfile;
      const history = data.visitHistory || [];
      const updatedHistory = [visit, ...history];
      
      const newTotalTrips = (data.totalTrips || history.length) + 1;
      const newTotalSpent = (data.totalSpent || 0) + (visit.fare || 0);

      const updatedCustomer: CRMCustomerProfile = {
        ...data,
        totalTrips: newTotalTrips,
        totalSpent: newTotalSpent,
        lastTripDate: visit.date || data.lastTripDate,
        lastDestination: visit.destination || data.lastDestination,
        preferredCar: visit.car || data.preferredCar,
        visitHistory: updatedHistory,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, updatedCustomer, { merge: true });

      // Update local storage cache
      const saved = JSON.parse(localStorage.getItem('cholo_jai_crm_customers') || '[]');
      const filtered = saved.filter((c: CRMCustomerProfile) => c.id !== customerId);
      localStorage.setItem('cholo_jai_crm_customers', JSON.stringify([updatedCustomer, ...filtered]));

      return true;
    }
    return false;
  } catch (err) {
    console.error('Error adding customer visit to Firestore:', err);
    return false;
  }
}

// ----------------------------------------------------
// Driver Management Firestore Operations
// ----------------------------------------------------

/**
 * Save or update a Driver profile in Cloud Firestore
 */
export async function syncSaveDriver(driver: DriverProfile): Promise<boolean> {
  try {
    const driverId = driver.id || `drv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const docRef = doc(db, 'drivers', driverId);
    
    const driverData: DriverProfile = {
      ...driver,
      id: driverId,
      updatedAt: new Date().toISOString(),
      createdAt: driver.createdAt || new Date().toISOString()
    };

    await setDoc(docRef, driverData, { merge: true });

    // Update local storage cache
    const saved = JSON.parse(localStorage.getItem('cholo_jai_drivers') || '[]');
    const filtered = saved.filter((d: DriverProfile) => d.id !== driverId);
    localStorage.setItem('cholo_jai_drivers', JSON.stringify([driverData, ...filtered]));

    return true;
  } catch (err) {
    console.error('Error saving driver to Firestore:', err);
    return false;
  }
}

/**
 * Delete a Driver profile from Cloud Firestore
 */
export async function syncDeleteDriver(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'drivers', id);
    await deleteDoc(docRef);

    // Update local storage cache
    const saved = JSON.parse(localStorage.getItem('cholo_jai_drivers') || '[]');
    const filtered = saved.filter((d: DriverProfile) => d.id !== id);
    localStorage.setItem('cholo_jai_drivers', JSON.stringify(filtered));

    return true;
  } catch (err) {
    console.error('Error deleting driver from Firestore:', err);
    return false;
  }
}

