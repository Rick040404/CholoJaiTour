import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Lock, ShieldCheck, Car, Calendar, Phone, MessageSquare, 
  Settings, CheckCircle2, AlertCircle, Clock, Trash2, Edit3, Plus, 
  Sparkles, Megaphone, Save, LogOut, ChevronRight, Eye, EyeOff, RefreshCw,
  MapPin, Check, ChevronDown, User, Tag, Search, Filter, Share2, Copy,
  ArrowRight, DollarSign, CalendarDays, Key, Shield, Navigation, Receipt, FileText, Send, Users,
  Bell, BellRing, CheckCheck, ShieldAlert, KeyRound, History, Unlock, AlertTriangle, Timer, Smartphone,
  Mic, UserCheck
} from 'lucide-react';
import { FLEET_CARS, BUSINESS_INFO } from '../data/fleetData';
import { FleetCar, Language, CRMCustomerProfile, DriverProfile } from '../types';
import { 
  getBengaliDate, 
  toBengaliNumber, 
  BengaliDateInfo,
  formatStringToBengaliDate,
  getBengaliDateFromString,
  formatFullBengaliDate
} from '../utils/bengaliCalendar';
import { 
  fetchLiveServerData, 
  syncSaveBooking, 
  syncUpdateBooking, 
  syncDeleteBooking, 
  syncSaveSchedule, 
  syncUpdateNotice,
  syncSaveFleet,
  syncSaveAdminPassword,
  subscribeToLiveBookings,
  subscribeToLiveSchedules,
  subscribeToLiveNotice,
  subscribeToLiveFleet,
  subscribeToLiveCustomers,
  subscribeToLiveDrivers
} from '../utils/syncService';
import {
  verifyAdminPassword,
  saveNewAdminPassword,
  getSecurityState,
  recordFailedAttempt,
  recordSuccessfulLogin,
  isSessionValid,
  invalidateAdminSession,
  touchSession,
  getMasterRecoveryKey,
  verifyAndResetViaMasterKey,
  getAuditLogs,
  addAuditLog,
  evaluatePasswordStrength,
  SecurityAuditLog
} from '../utils/security';
import { InvoiceGenerator } from './InvoiceGenerator';
import { CRMManager } from './CRMManager';
import { DriverManagerModal } from './DriverManagerModal';
import { AssignDriverModal } from './AssignDriverModal';
import { LocalTripBookingModal } from './LocalTripBookingModal';
import { BengaliVoiceAssignModal } from './BengaliVoiceAssignModal';
import { 
  createBengaliSpeechRecognizer, 
  parseBengaliVoiceCommand, 
  isSpeechRecognitionSupported,
  POPULAR_LOCAL_DESTINATIONS,
  generateDriverWhatsAppDispatchSlip
} from '../utils/voiceRecognition';

export interface BookingLead {
  id: string;
  name: string;
  phone: string;
  car: string;
  pickup: string;
  destination: string;
  date: string;
  timeSlot?: string;
  tripType: string;
  isAc: boolean;
  advanceAmount?: string;
  fareEstimate?: string;
  status: 'New' | 'Confirmed' | 'Advance Paid' | 'Completed' | 'Cancelled';
  createdAt: string;
  notes?: string;
  assignedDriver?: string;
  assignedDriverPhone?: string;
}

export interface CarDaySchedule {
  carId: string;
  dateStr: string; // YYYY-MM-DD
  status: 'Available' | 'Booked' | 'In Service' | 'Driver Assigned';
  customerName?: string;
  customerPhone?: string;
  pickup?: string;
  destination?: string;
  timeSlot?: string;
  fareEstimate?: string;
  advanceAmount?: string;
  driverName?: string;
  driverPhone?: string;
  tripType?: string;
  notes?: string;
}

export interface NoticeBannerConfig {
  enabled: boolean;
  text: string;
  textBn: string;
  theme: 'blue' | 'amber' | 'emerald' | 'rose' | 'purple';
}

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onUpdateCars?: (cars: FleetCar[]) => void;
  noticeConfig?: NoticeBannerConfig;
  onUpdateNotice?: (config: NoticeBannerConfig) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  lang,
  onUpdateCars,
  noticeConfig,
  onUpdateNotice,
}) => {
  const isBn = lang === 'bn';

  // Auth & Advanced Security State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return isSessionValid();
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Rate Limiting & Lockout State
  const [securityState, setSecurityState] = useState(() => getSecurityState());
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(() => {
    const state = getSecurityState();
    if (state.lockoutUntil && state.lockoutUntil > Date.now()) {
      return Math.ceil((state.lockoutUntil - Date.now()) / 1000);
    }
    return 0;
  });

  // Session Duration (auto-lock minutes: default 60 mins)
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('cholo_jai_admin_auto_lock_mins');
    return saved ? parseInt(saved, 10) : 60;
  });

  // Emergency Recovery Modal State
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [recoveryMasterKeyInput, setRecoveryMasterKeyInput] = useState<string>('');
  const [recoveryNewPassInput, setRecoveryNewPassInput] = useState<string>('');
  const [showRecoveryPass, setShowRecoveryPass] = useState<boolean>(false);
  const [recoveryStatus, setRecoveryStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Security Audit Logs
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(() => getAuditLogs());

  // Custom Password State
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [oldPassInput, setOldPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changePassStatus, setChangePassStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedMasterKey, setCopiedMasterKey] = useState<boolean>(false);

  // Lockout Countdown Interval
  useEffect(() => {
    if (lockoutRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setSecurityState(getSecurityState());
          setPinError(false);
          setPinErrorMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemainingSeconds]);

  // Inactivity Auto-Lock & Session Validator
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleUserActivity = () => {
      touchSession();
    };
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Periodic check for session expiration
    const sessionCheckInterval = setInterval(() => {
      if (!isSessionValid()) {
        setIsAuthenticated(false);
        setPinErrorMessage(isBn ? 'সেশন মেয়াদ শেষ! পুনরায় লগইন করুন।' : 'Session expired due to inactivity. Please log in again.');
      }
    }, 20000);

    return () => {
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearInterval(sessionCheckInterval);
    };
  }, [isAuthenticated, isBn]);

  // Active Tab: Overview (4-day dispatch matrix), Future Bookings, CRM, Invoices, Announcements, Settings
  const [activeTab, setActiveTab] = useState<'overview' | 'future' | 'crm' | 'invoices' | 'announcements' | 'settings'>('overview');
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<BookingLead | null>(null);

  // CRM Customers State (persisted in Firestore)
  const [crmCustomers, setCrmCustomers] = useState<CRMCustomerProfile[]>(() => {
    const saved = localStorage.getItem('cholo_jai_crm_customers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  // Drivers Directory State (persisted in Firestore)
  const [drivers, setDrivers] = useState<DriverProfile[]>(() => {
    const saved = localStorage.getItem('cholo_jai_drivers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [showDriversModal, setShowDriversModal] = useState<boolean>(false);
  const [assignDriverBooking, setAssignDriverBooking] = useState<BookingLead | null>(null);

  // 4-Day Matrix Local Trip & Voice Dispatch States
  const [showLocalTripModal, setShowLocalTripModal] = useState<boolean>(false);
  const [localTripSelectedCarId, setLocalTripSelectedCarId] = useState<string | undefined>(undefined);
  const [localTripSelectedDateStr, setLocalTripSelectedDateStr] = useState<string | undefined>(undefined);

  const [showVoiceAssignModal, setShowVoiceAssignModal] = useState<boolean>(false);
  const [voiceAssignTargetBooking, setVoiceAssignTargetBooking] = useState<BookingLead | null>(null);
  const [voiceAssignTargetCarId, setVoiceAssignTargetCarId] = useState<string | null>(null);
  const [voiceAssignTargetDateStr, setVoiceAssignTargetDateStr] = useState<string | null>(null);

  const handleOpenInvoiceForBooking = (b: BookingLead) => {
    setSelectedBookingForInvoice(b);
    setActiveTab('invoices');
  };

  // Local Fleet State (all 6 cars)
  const [cars, setCars] = useState<FleetCar[]>(() => {
    const saved = localStorage.getItem('cholo_jai_custom_fleet');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return FLEET_CARS; }
    }
    return FLEET_CARS;
  });

  // Selected Day in 4-Day Matrix: 0=Today, 1=Tomorrow, 2=Day+2, 3=Day+3
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Helper date generators
  const getFutureDateString = (offsetDays: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 4 Upcoming Days Memoized with Bengali calendar info
  const upcoming4Days = useMemo(() => {
    const days = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const bnDate = getBengaliDate(d);
      const weekdayEn = d.toLocaleDateString('en-US', { weekday: 'short' });
      const weekdayFull = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      
      let labelEn = 'Day ' + (i + 1);
      let labelBn = 'দিন ' + toBengaliNumber(i + 1);
      if (i === 0) {
        labelEn = 'Today';
        labelBn = 'আজ';
      } else if (i === 1) {
        labelEn = 'Tomorrow';
        labelBn = 'আগামীকাল';
      } else if (i === 2) {
        labelEn = 'Day 3';
        labelBn = 'পরশু';
      } else if (i === 3) {
        labelEn = 'Day 4';
        labelBn = '৪র্থ দিন';
      }

      days.push({
        offset: i,
        date: d,
        dateStr,
        labelEn,
        labelBn,
        weekdayEn,
        weekdayFull,
        dayNum,
        monthShort,
        bengaliDate: bnDate,
      });
    }
    return days;
  }, []);

  // 4-Day Matrix Car Schedules State (persisted in localStorage and cloud synced)
  const [scheduleBookings, setScheduleBookings] = useState<CarDaySchedule[]>(() => {
    const saved = localStorage.getItem('cholo_jai_car_schedules');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('cholo_jai_car_schedules', JSON.stringify(scheduleBookings));
  }, [scheduleBookings]);

  // Real-time Cloud Multi-Device Sync
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  const syncDataFromServer = async () => {
    setIsCloudSyncing(true);
    try {
      const serverData = await fetchLiveServerData();
      if (serverData) {
        if (Array.isArray(serverData.bookings)) {
          setBookings(serverData.bookings);
          localStorage.setItem('cholo_jai_admin_bookings', JSON.stringify(serverData.bookings));
        }
        if (Array.isArray(serverData.schedules)) {
          setScheduleBookings(serverData.schedules);
          localStorage.setItem('cholo_jai_car_schedules', JSON.stringify(serverData.schedules));
        }
        if (Array.isArray(serverData.customers)) {
          setCrmCustomers(serverData.customers);
          localStorage.setItem('cholo_jai_crm_customers', JSON.stringify(serverData.customers));
        }
        if (Array.isArray(serverData.drivers)) {
          setDrivers(serverData.drivers);
          localStorage.setItem('cholo_jai_drivers', JSON.stringify(serverData.drivers));
        }
        if (serverData.notice) {
          setNotice(serverData.notice);
          if (onUpdateNotice) onUpdateNotice(serverData.notice);
        }
        const now = new Date();
        setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.debug('Sync error:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    // Initial fetch on modal open or mount
    syncDataFromServer();

    // Real-time Firestore snapshot listeners for instant multi-device sync
    const unsubBookings = subscribeToLiveBookings((liveBookings) => {
      if (liveBookings) {
        setBookings(liveBookings);
        const now = new Date();
        setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    });

    const unsubSchedules = subscribeToLiveSchedules((liveSchedules) => {
      if (liveSchedules) {
        setScheduleBookings(liveSchedules);
      }
    });

    const unsubNotice = subscribeToLiveNotice((liveNotice) => {
      if (liveNotice) {
        setNotice(liveNotice);
        if (onUpdateNotice) onUpdateNotice(liveNotice);
      }
    });

    const unsubFleet = subscribeToLiveFleet((liveFleet) => {
      if (liveFleet && Array.isArray(liveFleet) && liveFleet.length > 0) {
        setCars(liveFleet);
        if (onUpdateCars) onUpdateCars(liveFleet);
      }
    });

    const unsubCustomers = subscribeToLiveCustomers((liveCustomers) => {
      if (liveCustomers && Array.isArray(liveCustomers)) {
        setCrmCustomers(liveCustomers);
      }
    });

    const unsubDrivers = subscribeToLiveDrivers((liveDrivers) => {
      if (liveDrivers && Array.isArray(liveDrivers)) {
        setDrivers(liveDrivers);
      }
    });

    const onFocusOrVisible = () => {
      syncDataFromServer();
    };

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      unsubBookings();
      unsubSchedules();
      unsubNotice();
      unsubFleet();
      unsubCustomers();
      unsubDrivers();
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [isOpen]);

  // Schedule Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedCarForSchedule, setSelectedCarForSchedule] = useState<FleetCar | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState<CarDaySchedule>({
    carId: '',
    dateStr: '',
    status: 'Booked',
    customerName: '',
    customerPhone: '',
    pickup: 'Jamalpur, Purba Bardhaman',
    destination: '',
    timeSlot: 'Morning (06:00 AM)',
    fareEstimate: '',
    advanceAmount: '',
    driverName: '',
    driverPhone: '',
    tripType: 'Outstation Tour',
    notes: ''
  });

  // Get car schedule for a specific date
  const getCarSchedule = (carId: string, dateStr: string): CarDaySchedule => {
    const found = scheduleBookings.find(s => s.carId === carId && s.dateStr === dateStr);
    return found || {
      carId,
      dateStr,
      status: 'Available'
    };
  };

  // Quick toggle car status (Available -> Booked -> Driver Assigned -> In Service -> Available)
  const handleQuickToggleCarStatus = (carId: string, dateStr: string) => {
    const current = getCarSchedule(carId, dateStr);
    const cycle: Record<CarDaySchedule['status'], CarDaySchedule['status']> = {
      'Available': 'Booked',
      'Booked': 'Driver Assigned',
      'Driver Assigned': 'In Service',
      'In Service': 'Available'
    };
    const nextStatus = cycle[current.status] || 'Available';
    const updated: CarDaySchedule = {
      ...current,
      status: nextStatus
    };
    setScheduleBookings(prev => {
      const filtered = prev.filter(s => !(s.carId === carId && s.dateStr === dateStr));
      return [...filtered, updated];
    });
    // Cloud sync to other devices
    syncSaveSchedule(updated);
  };

  // Open schedule modal
  const handleOpenScheduleModal = (car: FleetCar, dateStr: string) => {
    const existing = getCarSchedule(car.id, dateStr);
    setSelectedCarForSchedule(car);
    setScheduleFormData({
      carId: car.id,
      dateStr: dateStr,
      status: existing.status === 'Available' ? 'Booked' : existing.status,
      customerName: existing.customerName || '',
      customerPhone: existing.customerPhone || '',
      pickup: existing.pickup || 'Jamalpur, Purba Bardhaman',
      destination: existing.destination || '',
      timeSlot: existing.timeSlot || 'Morning (06:00 AM)',
      fareEstimate: existing.fareEstimate || '',
      advanceAmount: existing.advanceAmount || '',
      driverName: existing.driverName || '',
      driverPhone: existing.driverPhone || '',
      tripType: existing.tripType || 'Outstation Tour',
      notes: existing.notes || ''
    });
    setScheduleModalOpen(true);
  };

  // Save schedule modal
  const handleSaveScheduleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleBookings(prev => {
      const filtered = prev.filter(s => !(s.carId === scheduleFormData.carId && s.dateStr === scheduleFormData.dateStr));
      return [...filtered, scheduleFormData];
    });
    // Cloud sync to other devices
    syncSaveSchedule(scheduleFormData);
    setScheduleModalOpen(false);
  };

  // Open Local Trip Booking Modal
  const handleOpenLocalTripModal = (carId?: string, dateStr?: string) => {
    setLocalTripSelectedCarId(carId || cars[0]?.id);
    setLocalTripSelectedDateStr(dateStr || currentActiveDay.dateStr);
    setShowLocalTripModal(true);
  };

  // Handle Save from LocalTripBookingModal
  const handleSaveLocalTripBooking = (newBooking: BookingLead, scheduleData: CarDaySchedule) => {
    // 1. Save to bookings list and cloud
    setBookings(prev => [newBooking, ...prev]);
    syncSaveBooking(newBooking);

    // 2. Save to 4-day matrix schedule and cloud
    setScheduleBookings(prev => {
      const filtered = prev.filter(s => !(s.carId === scheduleData.carId && s.dateStr === scheduleData.dateStr));
      return [...filtered, scheduleData];
    });
    syncSaveSchedule(scheduleData);

    // 3. If driver assigned and has phone, option to prompt WhatsApp
    if (scheduleData.driverPhone) {
      setAssignDriverBooking(newBooking);
    }
  };

  // Open Bengali Voice Assign Modal
  const handleOpenVoiceAssign = (booking?: BookingLead | null, carId?: string, dateStr?: string) => {
    setVoiceAssignTargetBooking(booking || null);
    setVoiceAssignTargetCarId(carId || null);
    setVoiceAssignTargetDateStr(dateStr || currentActiveDay.dateStr);
    setShowVoiceAssignModal(true);
  };

  // Handle Save from Bengali Voice Modal (full trip: from, to, time, passenger name, phone, driver, fare, notes)
  const handleSaveVoiceTripBooking = (
    newBooking: BookingLead,
    assignedDriverName?: string,
    assignedDriverPhone?: string
  ) => {
    // 1. Save to bookings list and cloud
    setBookings(prev => [newBooking, ...prev]);
    syncSaveBooking(newBooking);

    // 2. Find matching car or first car to update in matrix
    const matchedCar = cars.find(c => c.name === newBooking.car || newBooking.car.includes(c.name) || newBooking.car.includes(c.id)) || cars[0];
    const targetDate = newBooking.date || currentActiveDay.dateStr;

    const scheduleData: CarDaySchedule = {
      carId: matchedCar.id,
      dateStr: targetDate,
      status: assignedDriverName ? 'Driver Assigned' : 'Booked',
      customerName: newBooking.name,
      customerPhone: newBooking.phone,
      pickup: newBooking.pickup,
      destination: newBooking.destination,
      timeSlot: newBooking.timeSlot || '07:00 AM',
      fareEstimate: newBooking.fareEstimate || '1200',
      driverName: assignedDriverName,
      driverPhone: assignedDriverPhone,
      notes: newBooking.notes || ''
    };

    setScheduleBookings(prev => {
      const filtered = prev.filter(s => !(s.carId === matchedCar.id && s.dateStr === targetDate));
      return [...filtered, scheduleData];
    });
    syncSaveSchedule(scheduleData);

    // 3. If driver assigned, prompt WhatsApp dispatch
    if (assignedDriverName && assignedDriverPhone) {
      setAssignDriverBooking(newBooking);
    }
  };

  // Direct WhatsApp Trip Dispatch to Driver from 4-Day Matrix
  const handleSendWhatsAppDispatchToDriver = (schedule: CarDaySchedule, car: FleetCar) => {
    const carDisplay = `${car.seats} • ${car.category} (${car.acType})`;
    const msg = generateDriverWhatsAppDispatchSlip({
      dateFormatted: `${currentActiveDay.weekdayFull}, ${currentActiveDay.dayNum} ${currentActiveDay.monthShort} (বাংলা: ${currentActiveDay.bengaliDate.dayBn} ${currentActiveDay.bengaliDate.monthBn})`,
      timeSlot: schedule.timeSlot || '07:00 AM',
      customerName: schedule.customerName || 'সম্মানিত যাত্রী',
      customerPhone: schedule.customerPhone || '9153302517',
      pickup: schedule.pickup || 'জামালপুর',
      destination: schedule.destination || 'বর্ধমান স্টেশন',
      vehicleCategory: carDisplay,
      driverName: schedule.driverName,
      notes: schedule.notes
    });

    const targetPhone = schedule.driverPhone ? schedule.driverPhone.replace(/\D/g, '') : '9153302517';
    const cleanNumber = targetPhone.length === 10 ? `91${targetPhone}` : targetPhone;
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Clear / Cancel a car booking on specific date in 4-Day Matrix
  const handleClearCarSchedule = (carId: string, dateStr: string) => {
    const clearedSchedule: CarDaySchedule = {
      carId,
      dateStr,
      status: 'Available',
      customerName: '',
      customerPhone: '',
      pickup: '',
      destination: '',
      timeSlot: '07:00 AM',
      fareEstimate: '',
      driverName: '',
      driverPhone: '',
      notes: ''
    };
    setScheduleBookings(prev => {
      const filtered = prev.filter(s => !(s.carId === carId && s.dateStr === dateStr));
      return [...filtered, clearedSchedule];
    });
    syncSaveSchedule(clearedSchedule);
  };

  // Comprehensive Bookings Lead state (starts clean / loaded from localStorage)
  const [bookings, setBookings] = useState<BookingLead[]>(() => {
    const saved = localStorage.getItem('cholo_jai_admin_bookings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  // Future Booking Search & Filter States
  const [futureSearch, setFutureSearch] = useState('');
  const [futureCarFilter, setFutureCarFilter] = useState('All');
  const [futureStatusFilter, setFutureStatusFilter] = useState('All');
  const [futureDateFilter, setFutureDateFilter] = useState('all-future');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [remindedBookings, setRemindedBookings] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('cholo_jai_reminded_bookings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Notice State
  const [notice, setNotice] = useState<NoticeBannerConfig>(() => {
    return noticeConfig || {
      enabled: true,
      text: '🎉 Special Discount on Digha, Puri & Darjeeling Outstation Tours! Call 9153302517 for 24x7 instant booking.',
      textBn: '🎉 দিঘা, পুরী ও দার্জিলিং ট্যুরের বুকিংয়ে বিশেষ সুবিধা! ২৪x৭ বুকিংয়ের জন্য ৯১৫৩৩০২৫১৭ নম্বরে সরাসরি ফোন করুন।',
      theme: 'amber'
    };
  });

  // Quick offline booking modal (for Future Bookings & Leads)
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [newBooking, setNewBooking] = useState<Partial<BookingLead>>({
    name: '',
    phone: '',
    car: 'Mahindra Scorpio Classic (9 Seater)',
    pickup: 'Jamalpur, Purba Bardhaman',
    destination: '',
    date: getFutureDateString(2),
    timeSlot: 'Morning (06:00 AM)',
    tripType: 'Outstation Tour',
    isAc: true,
    advanceAmount: '',
    fareEstimate: '',
    status: 'Confirmed',
    notes: ''
  });

  // Editing existing booking modal
  const [editingBooking, setEditingBooking] = useState<BookingLead | null>(null);

  // Live Bengali & English Date info for Header & Views
  const todayBengali = useMemo(() => getBengaliDate(new Date()), []);

  // Save Bookings to LocalStorage
  useEffect(() => {
    localStorage.setItem('cholo_jai_admin_bookings', JSON.stringify(bookings));
  }, [bookings]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingSeconds > 0) return;
    if (!pinInput.trim()) return;

    setIsLoggingIn(true);
    try {
      const isValid = await verifyAdminPassword(pinInput);
      if (isValid) {
        recordSuccessfulLogin(autoLockMinutes);
        setIsAuthenticated(true);
        setPinError(false);
        setPinErrorMessage('');
        setPinInput('');
        setSecurityState(getSecurityState());
        setAuditLogs(getAuditLogs());
      } else {
        const failureResult = recordFailedAttempt();
        setSecurityState(getSecurityState());
        setAuditLogs(getAuditLogs());
        setPinError(true);

        if (failureResult.isLocked) {
          setLockoutRemainingSeconds(failureResult.lockoutSeconds);
          setPinErrorMessage(
            isBn 
              ? `অতিরিক্ত ভুল চেষ্টার কারণে সিস্টেম সাময়িকভাবে ${failureResult.lockoutSeconds} সেকেন্ডের জন্য লক করা হয়েছে!` 
              : `System temporarily locked for ${failureResult.lockoutSeconds} seconds due to repeated failed attempts!`
          );
        } else {
          setPinErrorMessage(
            isBn 
              ? `ভুল পাসওয়ার্ড! আর ${failureResult.remainingAttempts} বার ভুল হলে সিস্টেম লক হয়ে যাবে।` 
              : `Incorrect password! ${failureResult.remainingAttempts} attempts remaining before temporary security lock.`
          );
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOldValid = await verifyAdminPassword(oldPassInput);
    if (!isOldValid) {
      setChangePassStatus({
        type: 'error',
        message: isBn ? 'বর্তমান পাসওয়ার্ডটি সঠিক নয়!' : 'Current password is incorrect!'
      });
      return;
    }

    if (newPassInput.trim().length < 6) {
      setChangePassStatus({
        type: 'error',
        message: isBn ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (অক্ষর ও সংখ্যার মিশ্রণ বাঞ্ছনীয়)।' : 'New password must be at least 6 characters.'
      });
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setChangePassStatus({
        type: 'error',
        message: isBn ? 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!' : 'New password and confirmation do not match!'
      });
      return;
    }

    await saveNewAdminPassword(newPassInput.trim());
    syncSaveAdminPassword(newPassInput.trim());
    setAuditLogs(getAuditLogs());

    setOldPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setChangePassStatus({
      type: 'success',
      message: isBn ? '🔒 পাসওয়ার্ড সফলভাবে SHA-256 এনক্রিপ্ট করে আপডেট ও ক্লাউডে সিঙ্ক করা হয়েছে!' : '🔒 Password updated, SHA-256 hashed, and synced successfully!'
    });
    setTimeout(() => {
      setIsChangingPass(false);
      setChangePassStatus(null);
    }, 2500);
  };

  const handleLogout = () => {
    invalidateAdminSession('Admin manually logged out');
    setIsAuthenticated(false);
    setPinInput('');
    setAuditLogs(getAuditLogs());
  };

  const handleRevokeAllSessions = () => {
    invalidateAdminSession('All admin sessions revoked from settings');
    setIsAuthenticated(false);
    setPinInput('');
    setAuditLogs(getAuditLogs());
    alert(isBn ? 'সমস্ত অ্যাক্টিভ সেশন বাতিল করা হয়েছে। পুনরায় পাসওয়ার্ড দিয়ে প্রবেশ করুন।' : 'All active sessions revoked. Please log in again.');
  };

  const handleEmergencyRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryMasterKeyInput.trim() || !recoveryNewPassInput.trim()) return;

    if (recoveryNewPassInput.trim().length < 6) {
      setRecoveryStatus({
        type: 'error',
        message: isBn ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'New password must be at least 6 characters.'
      });
      return;
    }

    const resetSuccess = verifyAndResetViaMasterKey(recoveryMasterKeyInput, recoveryNewPassInput);
    if (resetSuccess) {
      syncSaveAdminPassword(recoveryNewPassInput.trim());
      setRecoveryStatus({
        type: 'success',
        message: isBn ? 'মাস্টার কি যাচাই হয়েছে এবং পাসওয়ার্ড রিসেট সফল হয়েছে!' : 'Master Key verified & password successfully reset!'
      });
      setLockoutRemainingSeconds(0);
      setSecurityState(getSecurityState());
      setAuditLogs(getAuditLogs());

      setTimeout(() => {
        setShowRecoveryModal(false);
        setRecoveryMasterKeyInput('');
        setRecoveryNewPassInput('');
        setRecoveryStatus(null);
        recordSuccessfulLogin(autoLockMinutes);
        setIsAuthenticated(true);
      }, 1500);
    } else {
      setRecoveryStatus({
        type: 'error',
        message: isBn ? 'ভুল মাস্টার রিকভারি কি (Invalid Master Key)!' : 'Invalid Emergency Master Recovery Key!'
      });
    }
  };

  const handleSaveNotice = () => {
    if (onUpdateNotice) {
      onUpdateNotice(notice);
    }
    localStorage.setItem('cholo_jai_notice_banner', JSON.stringify(notice));
    syncUpdateNotice(notice);
    alert(isBn ? 'ঘোষণা সফলভাবে আপডেট হয়েছে এবং সব ডিভাইসে সিঙ্ক করা হয়েছে!' : 'Announcement banner updated and synced across all devices!');
  };

  // Add Direct Booking Lead or Future Booking
  const handleAddBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.name || !newBooking.phone) return;

    const defaultDate = getFutureDateString(1);
    const created: BookingLead = {
      id: `b-${Date.now().toString().slice(-4)}`,
      name: newBooking.name || 'New Customer',
      phone: newBooking.phone || '',
      car: newBooking.car || 'Mahindra Scorpio Classic (9 Seater)',
      pickup: newBooking.pickup || 'Jamalpur / Bardhaman',
      destination: newBooking.destination || 'Outstation',
      date: newBooking.date || defaultDate,
      timeSlot: newBooking.timeSlot || 'Full Day',
      tripType: newBooking.tripType || 'Outstation Tour',
      isAc: newBooking.isAc ?? true,
      advanceAmount: newBooking.advanceAmount || '',
      fareEstimate: newBooking.fareEstimate || '',
      status: (newBooking.status as any) || 'Confirmed',
      createdAt: 'Just now',
      notes: newBooking.notes || ''
    };

    setBookings([created, ...bookings]);
    // Cloud sync to other devices
    syncSaveBooking(created);

    setShowAddBooking(false);
    setNewBooking({
      name: '',
      phone: '',
      car: 'Mahindra Scorpio Classic (9 Seater)',
      pickup: 'Jamalpur, Purba Bardhaman',
      destination: '',
      date: getFutureDateString(2),
      timeSlot: 'Morning (06:00 AM)',
      tripType: 'Outstation Tour',
      isAc: true,
      advanceAmount: '',
      fareEstimate: '',
      status: 'Confirmed',
      notes: ''
    });
  };

  const handleUpdateBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    setBookings(bookings.map(b => b.id === editingBooking.id ? editingBooking : b));
    // Cloud sync to other devices
    syncUpdateBooking(editingBooking);
    setEditingBooking(null);
  };

  const handleDeleteBooking = (id: string) => {
    if (window.confirm(isBn ? 'আপনি কি এই বুকিংটি মুছে ফেলতে চান?' : 'Delete this booking record?')) {
      setBookings(bookings.filter(b => b.id !== id));
      // Cloud sync to other devices
      syncDeleteBooking(id);
    }
  };

  const handleCopyBookingDetails = (b: BookingLead) => {
    const bnDate = formatFullBengaliDate(b.date);
    const text = `🚕 *CHOLO JAI TOUR & TRAVELS - TRIP SHEET* 🚕\n` +
      `📅 *Date / তারিখ:* ${b.date} (${bnDate})\n` +
      `👤 *Customer / যাত্রী:* ${b.name}\n` +
      `📞 *Phone / মোবাইল:* ${b.phone}\n` +
      `🚗 *Vehicle / গাড়ি:* ${b.car} (${b.isAc ? 'AC' : 'Non-AC'})\n` +
      `📍 *Pickup / পিকআপ:* ${b.pickup}\n` +
      `🏁 *Destination / গন্তব্য:* ${b.destination}\n` +
      `⏰ *Time Slot / সময়:* ${b.timeSlot || 'As agreed'}\n` +
      `💰 *Estimated Fare:* ₹${b.fareEstimate || 'Meter/Agreed'}\n` +
      `💵 *Advance Paid:* ₹${b.advanceAmount || '0'}\n` +
      `📌 *Status:* ${b.status}\n` +
      (b.notes ? `📝 *Notes:* ${b.notes}\n` : '') +
      `\n📞 *Jamalpur Hub 24x7 Helpline:* 9153302517 / 6296267402`;

    navigator.clipboard.writeText(text);
    setCopiedId(b.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Send WhatsApp Trip Reminder to Customer
  const handleSendTripReminder = (b: BookingLead) => {
    const bnDate = formatFullBengaliDate(b.date);
    const cleanPhone = b.phone.replace(/\D/g, '');
    const bDate = new Date(b.date + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = bDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let timingWord = 'আসন্ন';
    if (diffDays === 0) timingWord = 'আজকের';
    else if (diffDays === 1) timingWord = 'আগামীকালের';
    else if (diffDays > 1) timingWord = `${toBengaliNumber(diffDays)} দিন পরের`;

    const reminderMsg = `🚕 *CHOLO JAI TOUR & TRAVELS - যাত্রা রিমাইন্ডার* 🚕\n\n` +
      `নমস্কার *${b.name}* মহাশয়/মহাশয়া,\n` +
      `চলো যাই ট্যুর এন্ড ট্রাভেলস থেকে আপনার *${timingWord}* যাত্রার বুকিং নিশ্চিতকরণ ও রিমাইন্ডার দেওয়া হচ্ছে:\n\n` +
      `📅 *যাত্রার তারিখ:* ${b.date} (${bnDate})\n` +
      `⏰ *নির্ধারিত সময়:* ${b.timeSlot || 'সকাল / প্রাতঃকাল'}\n` +
      `📍 *পিকআপ লোকেশন:* ${b.pickup}\n` +
      `🏁 *গন্তব্য স্থান:* ${b.destination}\n` +
      `🚗 *বরাদ্দ গাড়ি:* ${b.car} (${b.isAc ? 'AC Comfort' : 'Non-AC'})\n` +
      `💰 *আনুমানিক ভাড়া:* ₹${b.fareEstimate || 'মিটার / নির্ধারিত'}\n` +
      `💵 *অগ্রিম জমা:* ₹${b.advanceAmount || '0'}\n` +
      `📌 *বুকিং স্ট্যাটাস:* ${b.status}\n\n` +
      `✅ আপনার গাড়ি ও চালক সম্পূর্ণ প্রস্তুত রাখা হয়েছে।\n` +
      `যাত্রার পূর্বে যেকোনো তথ্যের জন্য বা পিকআপ সহায়তা পেতে নির্দ্বিধায় যোগাযোগ করুন:\n` +
      `📞 *জামালপুর হাব হেল্পলাইন:* 9153302517 / 6296267402\n\n` +
      `ধন্যবাদ! চলো যাই-এর সাথে আপনার যাত্রা আরামদায়ক ও শুভ হোক। 🙏`;

    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(reminderMsg)}`;
    window.open(url, '_blank');

    // Record reminder sent timestamp
    const nowIso = new Date().toISOString();
    setRemindedBookings(prev => {
      const updated = { ...prev, [b.id]: nowIso };
      localStorage.setItem('cholo_jai_reminded_bookings', JSON.stringify(updated));
      return updated;
    });
  };

  // Send WhatsApp Driver Trip Sheet Dispatch
  const handleSendDriverTripSheet = (b: BookingLead) => {
    const bnDate = formatFullBengaliDate(b.date);
    const tripSheetMsg = `🚕 *CHOLO JAI - ড্রাইভার ট্রিপ শিট (DUTY SLIP)* 🚕\n\n` +
      `👤 *যাত্রীর নাম:* ${b.name}\n` +
      `📞 *যাত্রীর ফোন:* ${b.phone}\n` +
      `📅 *তারিখ:* ${b.date} (${bnDate})\n` +
      `⏰ *পিকআপ সময়:* ${b.timeSlot || 'সময়মত'}\n` +
      `📍 *পিকআপ:* ${b.pickup}\n` +
      `🏁 *গন্তব্য:* ${b.destination}\n` +
      `🚗 *গাড়ি:* ${b.car} (${b.isAc ? 'AC' : 'Non-AC'})\n` +
      `💰 *ভাড়া:* ₹${b.fareEstimate || 'নির্ধারিত'}\n` +
      `💵 *অগ্রিম কালেকশন:* ₹${b.advanceAmount || '0'}\n` +
      (b.notes ? `📝 *বিশেষ নির্দেশ:* ${b.notes}\n` : '') +
      `\n⚠️ সময়মত পৌঁছে যাত্রীর সাথে ভদ্র ব্যবহার নিশ্চিত করুন।\n` +
      `📞 কন্ট্রোল রুম: 9153302517`;

    const url = `https://wa.me/?text=${encodeURIComponent(tripSheetMsg)}`;
    window.open(url, '_blank');
  };

  // Today Date in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Upcoming reminders (Trips today, tomorrow, or in next 2 days)
  const upcomingReminders = useMemo(() => {
    return bookings.filter(b => {
      if (b.status === 'Cancelled' || b.status === 'Completed') return false;
      const bDate = new Date(b.date + 'T00:00:00');
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffTime = bDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 2;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [bookings]);

  // Filtered Future Bookings
  const filteredFutureBookings = useMemo(() => {
    return bookings.filter(b => {
      // Date filter
      if (futureDateFilter === 'reminders-needed') {
        const bDate = new Date(b.date + 'T00:00:00');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffTime = bDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > 2) return false;
      } else if (futureDateFilter === 'all-future') {
        if (b.date < todayStr) return false;
      } else if (futureDateFilter === 'next-7-days') {
        const next7Str = getFutureDateString(7);
        if (b.date < todayStr || b.date > next7Str) return false;
      } else if (futureDateFilter === 'this-month') {
        const d = new Date();
        const curMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!b.date.startsWith(curMonthStr)) return false;
      }

      // Search
      if (futureSearch.trim()) {
        const q = futureSearch.toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchPhone = b.phone.includes(q);
        const matchDest = b.destination.toLowerCase().includes(q);
        const matchCar = b.car.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDest && !matchCar) return false;
      }

      // Car filter
      if (futureCarFilter !== 'All') {
        if (!b.car.toLowerCase().includes(futureCarFilter.toLowerCase())) {
          return false;
        }
      }

      // Status filter
      if (futureStatusFilter !== 'All') {
        if (b.status !== futureStatusFilter) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [bookings, futureSearch, futureCarFilter, futureStatusFilter, futureDateFilter, todayStr]);

  if (!isOpen) return null;

  const currentActiveDay = upcoming4Days[selectedDayOffset] || upcoming4Days[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-3 md:p-6 overflow-hidden">
      <div className="bg-white rounded-none sm:rounded-3xl max-w-6xl w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden shadow-2xl border-0 sm:border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header Strip with vibrant gradient & Live Bengali/English Date */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white p-3 sm:p-4 md:p-5 shadow-md shrink-0">
          <div className="flex items-center justify-between gap-2">
            
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-lg md:text-xl font-black tracking-tight truncate">
                    {isBn ? 'চলো যাই • অ্যাডমিন প্যানেল' : 'Cholo Jai • Admin Panel'}
                  </h3>
                  <span className="hidden xs:inline-block px-2 py-0.5 rounded-full bg-emerald-400/25 text-emerald-300 text-[10px] sm:text-xs font-extrabold border border-emerald-400/30">
                    {isBn ? 'লাইভ' : 'Live'}
                  </span>
                  {/* Multi-Device Live Sync Icon Only */}
                  <button 
                    onClick={() => syncDataFromServer()}
                    className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer border border-white/20 active:scale-95 shrink-0"
                    title={isBn ? 'ক্লাউড সিঙ্ক রিফ্রেশ' : 'Cloud Sync Refresh'}
                  >
                    <RefreshCw className={`w-3 h-3 text-cyan-300 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* English & Bengali Date Badges in Header */}
              <div className="hidden sm:flex flex-col items-end text-right">
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-xl border border-white/20 shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold text-amber-200">
                    {todayBengali.formattedBn}
                  </span>
                </div>
                <span className="text-[10px] text-blue-200 font-semibold mt-0.5">
                  {todayBengali.formattedEn}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {isAuthenticated && (
                  <button
                    onClick={() => setShowDriversModal(true)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-sm border border-amber-300/80 active:scale-95 cursor-pointer"
                    title={isBn ? 'ড্রাইভার ডিরেক্টরি ও নতুন ড্রাইভার যোগ' : 'Drivers Directory & Add New Driver'}
                  >
                    <Car className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                    <span>{isBn ? 'ড্রাইভার' : 'Drivers'}</span>
                    {drivers.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black">
                        {drivers.length}
                      </span>
                    )}
                  </button>
                )}

                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-colors border border-white/20 cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{isBn ? 'লগআউট' : 'Logout'}</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors border border-white/20 active:scale-95 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Content Body */}
        {!isAuthenticated ? (
          /* Secure Login Screen */
          <div className="p-6 sm:p-10 text-center max-w-md mx-auto my-auto space-y-6 w-full animate-in fade-in zoom-in-95">
            
            {/* Lockout Screen when rate limit / brute-force triggered */}
            {lockoutRemainingSeconds > 0 ? (
              <div className="space-y-5 bg-rose-50/80 border border-rose-200 p-6 rounded-3xl shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-rose-600 text-white mx-auto flex items-center justify-center shadow-xl shadow-rose-600/30 animate-bounce">
                  <ShieldAlert className="w-8 h-8 text-amber-300" />
                </div>

                <div>
                  <h4 className="text-lg font-black text-rose-950">
                    {isBn ? '⚠️ সিকিউরিটি লক কার্যকর' : '⚠️ Security Lock Active'}
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 font-medium leading-relaxed">
                    {isBn 
                      ? 'অতিরিক্ত বার ভুল পাসওয়ার্ড চেষ্টার কারণে ব্রুট-ফোর্স প্রতিরোধ ব্যবস্থা স্বয়ংক্রিয়ভাবে সক্রিয় হয়েছে।' 
                      : 'Anti-brute-force rate limiting triggered due to multiple failed login attempts.'}
                  </p>
                </div>

                {/* Animated Countdown Timer */}
                <div className="bg-white px-5 py-3.5 rounded-2xl border border-rose-200/80 shadow-xs inline-flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-rose-600 animate-spin" />
                    {isBn ? 'লক খোলার বাকি সময়:' : 'Cooldown Remaining:'}
                  </span>
                  <span className="text-2xl font-black font-mono text-rose-900 tracking-wider mt-0.5">
                    {Math.floor(lockoutRemainingSeconds / 60)}:{(lockoutRemainingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-xs font-black text-indigo-700 hover:text-indigo-900 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isBn ? 'জরুরি মাস্টার কি দিয়ে আনলক করুন' : 'Unlock via Emergency Master Key'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Secure Login Form */
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white mx-auto flex items-center justify-center shadow-xl shadow-blue-500/25 border border-white/20">
                  <Lock className="w-8 h-8 text-amber-300" />
                </div>

                <div>
                  <h4 className="text-xl font-black text-slate-900">
                    {isBn ? 'অ্যাডমিন সিকিউরিটি অ্যাক্সেস' : 'Admin Security Access'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    {isBn 
                      ? 'গাড়ির বুকিং ও শিডিউল পরিচালনা করতে আপনার গোপন পাসওয়ার্ড দিন' 
                      : 'Enter your confidential owner password to access bookings & dispatch'}
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          setPinError(false);
                          setPinErrorMessage('');
                        }}
                        placeholder={isBn ? 'পাসওয়ার্ড লিখুন' : 'Enter Admin Password'}
                        className={`w-full px-4 py-3.5 rounded-2xl border text-center text-lg font-bold tracking-widest outline-none transition-all pr-12 ${
                          pinError 
                            ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-400' 
                            : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-slate-50'
                        }`}
                        autoFocus
                        disabled={isLoggingIn}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {pinError && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start justify-center gap-1.5 text-left">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{pinErrorMessage || (isBn ? 'ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।' : 'Incorrect password. Please try again.')}</span>
                      </div>
                    )}
                  </div>

                  {/* Session Duration Selector */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                    <span className="font-semibold">{isBn ? 'অটো-লক সময়:' : 'Auto-lock duration:'}</span>
                    <select
                      value={autoLockMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setAutoLockMinutes(val);
                        localStorage.setItem('cholo_jai_admin_auto_lock_mins', val.toString());
                      }}
                      className="bg-slate-100 text-slate-800 font-bold px-2 py-1 rounded-lg border border-slate-200 text-[11px] outline-none"
                    >
                      <option value={15}>{isBn ? '১৫ মিনিট (উচ্চ নিরাপত্তা)' : '15 min (High Security)'}</option>
                      <option value={60}>{isBn ? '১ ঘন্টা (স্ট্যান্ডার্ড)' : '1 Hour (Standard)'}</option>
                      <option value={240}>{isBn ? '৪ ঘন্টা' : '4 Hours'}</option>
                      <option value={720}>{isBn ? '১২ ঘন্টা' : '12 Hours'}</option>
                      <option value={1440}>{isBn ? '২৪ ঘন্টা (এই ডিভাইসে)' : '24 Hours (This device)'}</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-98 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isLoggingIn && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{isBn ? 'প্যানেলে প্রবেশ করুন →' : 'Unlock Dashboard →'}</span>
                  </button>

                  <div className="pt-2 flex items-center justify-between gap-2 text-[11px] border-t border-slate-100 mt-4">
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isBn ? 'SHA-256 এনক্রিপ্টেড' : 'SHA-256 Encrypted'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(true)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                    >
                      {isBn ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password / Master Key'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Navigation Tabs */}
            <div className="bg-slate-100/95 border-b border-slate-200 px-2 sm:px-4 md:px-6 pt-1.5 sm:pt-2 shrink-0 overflow-x-auto no-scrollbar">
              <div className="flex space-x-1.5 sm:space-x-2 min-w-max">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-white text-blue-700 border-t-blue-600 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{isBn ? '৪ দিনের শিডিউল' : '4-Day Matrix'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('future')}
                  className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'future'
                      ? 'bg-white text-purple-700 border-t-purple-600 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{isBn ? 'ভবিষ্যৎ বুকিং' : 'Future Bookings'}</span>
                  {bookings.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700 font-black">
                      {bookings.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('crm')}
                  className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'crm'
                      ? 'bg-white text-blue-700 border-t-blue-600 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{isBn ? 'কাস্টমার CRM' : 'Customer CRM'}</span>
                  {crmCustomers.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-black">
                      {crmCustomers.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedBookingForInvoice(null);
                    setActiveTab('invoices');
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'invoices'
                      ? 'bg-white text-emerald-700 border-t-emerald-600 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isBn ? 'ইনভয়েস বিল' : 'Invoice Bill'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'announcements'
                      ? 'bg-white text-amber-700 border-t-amber-500 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Megaphone className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{isBn ? 'নোটিশ ব্যানার' : 'Announcements'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-white text-slate-800 border-t-slate-700 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>{isBn ? 'সেটিংস' : 'Settings'}</span>
                </button>
              </div>
            </div>

            {/* Scrollable Tab Content View */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50/50">

              {/* TAB 1: 4-DAY DISPATCH MATRIX - SIMPLE & CLEAN TRIP SCHEDULE (NO CAR GRID) */}
              {activeTab === 'overview' && (() => {
                // Active Day Scheduled Trips
                const activeSchedules = scheduleBookings.filter(s => s.dateStr === currentActiveDay.dateStr && Boolean(s.customerName || s.destination || s.driverName));
                const activeLeads = bookings.filter(b => b.date === currentActiveDay.dateStr);

                // Consolidated trips list
                const dayTrips = [
                  ...activeSchedules.map(s => {
                    const carObj = cars.find(c => c.id === s.carId);
                    return {
                      id: `sched-${s.carId}-${s.dateStr}`,
                      type: 'schedule' as const,
                      carId: s.carId,
                      carName: carObj?.name || 'Cab / Car',
                      customerName: s.customerName || '',
                      customerPhone: s.customerPhone || '',
                      pickup: s.pickup || 'জামালপুর',
                      destination: s.destination || 'বর্ধমান স্টেশন',
                      timeSlot: s.timeSlot || '07:00 AM',
                      fareEstimate: s.fareEstimate || '1200',
                      driverName: s.driverName || '',
                      driverPhone: s.driverPhone || '',
                      notes: s.notes || '',
                      status: s.status || 'Booked',
                      rawSchedule: s
                    };
                  }),
                  ...activeLeads
                    .filter(b => !activeSchedules.some(s => s.customerPhone && b.phone && s.customerPhone.replace(/\D/g, '') === b.phone.replace(/\D/g, '')))
                    .map(b => ({
                      id: `lead-${b.id}`,
                      type: 'lead' as const,
                      carId: b.car,
                      carName: b.car,
                      customerName: b.name,
                      customerPhone: b.phone,
                      pickup: b.pickup,
                      destination: b.destination,
                      timeSlot: b.timeSlot || '07:00 AM',
                      fareEstimate: b.fareEstimate || '1200',
                      driverName: b.driverName || '',
                      driverPhone: b.driverPhone || '',
                      notes: b.notes || '',
                      status: b.status || 'Confirmed',
                      rawLead: b
                    }))
                ];

                return (
                  <div className="space-y-4">
                    {/* Top Simple Header & Fast Trip Actions */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-blue-600" />
                          <span>{isBn ? '৪ দিনের ট্রিপ শিডিউল ও ডেসপ্যাচ' : '4-Day Trip Schedule & Dispatch'}</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {isBn ? 'তারিখ নির্বাচন করে ট্রিপ বুক করুন ও ড্রাইভারকে সরাসরি হোয়াটসঅ্যাপে ডেসপ্যাচ পাঠান' : 'Select date to view trips, book voice trips or dispatch to drivers via WhatsApp'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Bengali Voice Booking Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenVoiceAssign(null, undefined, currentActiveDay.dateStr)}
                          className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                        >
                          <Mic className="w-4 h-4 text-amber-300 animate-pulse" />
                          <span>{isBn ? 'ভয়েসে ট্রিপ বুক করুন' : 'Voice Book Trip'}</span>
                        </button>

                        {/* Manual / Card Trip Booking Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenLocalTripModal(undefined, currentActiveDay.dateStr)}
                          className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{isBn ? '+ নতুন ট্রিপ যোগ করুন' : '+ Add New Trip'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 4 Simple Date Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {upcoming4Days.map((day) => {
                        const isSelected = selectedDayOffset === day.offset;
                        const schedCount = scheduleBookings.filter(s => s.dateStr === day.dateStr && Boolean(s.customerName || s.destination || s.driverName)).length;
                        const leadCount = bookings.filter(b => b.date === day.dateStr).length;
                        const tripCount = Math.max(schedCount, leadCount);

                        return (
                          <button
                            key={day.offset}
                            onClick={() => setSelectedDayOffset(day.offset)}
                            className={`p-3 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/30'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? 'text-amber-300' : 'text-blue-600'}`}>
                                {isBn ? day.labelBn : day.labelEn}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-white/20 text-slate-100' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {day.weekdayShortEn || day.weekdayEn}
                              </span>
                            </div>

                            <p className="text-sm font-black">
                              {day.dayNum} {day.monthShort}
                            </p>

                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/40 text-[10px] font-semibold">
                              <span className={isSelected ? 'text-slate-300' : 'text-slate-500 font-bengali'}>
                                {day.bengaliDate.dayBn} {day.bengaliDate.monthBn}
                              </span>
                              <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                                tripCount > 0 
                                  ? (isSelected ? 'bg-amber-400 text-slate-950' : 'bg-indigo-100 text-indigo-800')
                                  : (isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-100 text-slate-500')
                              }`}>
                                {tripCount > 0 ? `${toBengaliNumber(tripCount)} ট্রিপ` : (isBn ? 'ফাঁকা' : 'Free')}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Day Detail Banner */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        <span className="font-black text-slate-900">
                          {currentActiveDay.weekdayFull}, {currentActiveDay.dayNum} {currentActiveDay.monthShort} {currentActiveDay.date.getFullYear()}
                        </span>
                        <span className="text-slate-600 font-bengali font-normal">
                          (বাংলা: {currentActiveDay.bengaliDate.formattedBn})
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        {isBn ? `মোট ট্রিপ: ${toBengaliNumber(dayTrips.length)} টি` : `Total Trips: ${dayTrips.length}`}
                      </span>
                    </div>

                    {/* Trip Schedule Cards Grid (No Cars) */}
                    {dayTrips.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dayTrips.map((trip) => {
                          const isAssigned = Boolean(trip.driverName);

                          return (
                            <div
                              key={trip.id}
                              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs overflow-hidden flex flex-col justify-between transition-all"
                            >
                              {/* Trip Header */}
                              <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0">
                                    <User className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                      {trip.customerName || (isBn ? 'সম্মানিত যাত্রী' : 'Passenger')}
                                    </h4>
                                    {trip.customerPhone && (
                                      <div className="flex items-center gap-2 text-[11px] mt-0.5">
                                        <a
                                          href={`tel:${trip.customerPhone}`}
                                          className="text-blue-600 font-bold hover:underline"
                                        >
                                          {trip.customerPhone}
                                        </a>
                                        <a
                                          href={`https://wa.me/91${trip.customerPhone.replace(/\D/g, '')}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] font-bold border border-emerald-200"
                                        >
                                          WhatsApp
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                                  isAssigned 
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {isAssigned ? (isBn ? '🟣 ড্রাইভার বরাদ্দ' : 'Dispatched') : (isBn ? '🔵 বুকড' : 'Booked')}
                                </span>
                              </div>

                              {/* Trip Route & Times */}
                              <div className="p-3.5 space-y-2 text-xs flex-1">
                                {/* Route */}
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                    {isBn ? 'রুট (পিকআপ ➔ গন্তব্য):' : 'Route:'}
                                  </span>
                                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                                    <span className="truncate">{trip.pickup || 'জামালপুর'}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span className="text-indigo-900 font-black truncate">{trip.destination || 'বর্ধমান'}</span>
                                  </div>
                                </div>

                                {/* Time Slot & Fare */}
                                <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[11px]">
                                  <div className="flex items-center gap-1 font-bold text-slate-700">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{trip.timeSlot || '07:00 AM'}</span>
                                  </div>
                                  <div className="font-black text-emerald-700">
                                    ভাড়া: ₹{trip.fareEstimate || '1200'}
                                  </div>
                                </div>

                                {/* Assigned Driver */}
                                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/50 border border-purple-100 text-[11px]">
                                  <span className="text-slate-600 font-medium">{isBn ? 'ড্রাইভার:' : 'Driver:'}</span>
                                  <span className={`font-bold ${isAssigned ? 'text-purple-900 font-black' : 'text-amber-700 font-semibold'}`}>
                                    {isAssigned ? `${trip.driverName} ${trip.driverPhone ? `(${trip.driverPhone})` : ''}` : (isBn ? 'ড্রাইভার বাকি' : 'Unassigned')}
                                  </span>
                                </div>

                                {/* Notes if any */}
                                {trip.notes && (
                                  <p className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded-lg border border-slate-200">
                                    {trip.notes}
                                  </p>
                                )}
                              </div>

                              {/* Card Action Footer */}
                              <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2">
                                {/* WhatsApp Slip to Driver */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const msg = generateDriverWhatsAppDispatchSlip({
                                      dateFormatted: `${currentActiveDay.weekdayFull}, ${currentActiveDay.dayNum} ${currentActiveDay.monthShort} (বাংলা: ${currentActiveDay.bengaliDate.dayBn} ${currentActiveDay.bengaliDate.monthBn})`,
                                      timeSlot: trip.timeSlot || '07:00 AM',
                                      customerName: trip.customerName || 'সম্মানিত যাত্রী',
                                      customerPhone: trip.customerPhone || '9153302517',
                                      pickup: trip.pickup || 'জামালপুর',
                                      destination: trip.destination || 'বর্ধমান স্টেশন',
                                      vehicleCategory: 'Car / Cab',
                                      driverName: trip.driverName,
                                      notes: trip.notes
                                    });
                                    const targetPhone = trip.driverPhone ? trip.driverPhone.replace(/\D/g, '') : '9153302517';
                                    const cleanNumber = targetPhone.length === 10 ? `91${targetPhone}` : targetPhone;
                                    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
                                    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                                  }}
                                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                  <span>{isBn ? 'ড্রাইভারকে হোয়াটসঅ্যাপ স্লিপ পাঠান' : 'Send Slip to Driver WhatsApp'}</span>
                                </button>

                                <div className="flex items-center gap-1.5">
                                  {/* Voice Edit */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenVoiceAssign(trip.type === 'lead' ? trip.rawLead : null, trip.carId, currentActiveDay.dateStr)}
                                    className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Mic className="w-3 h-3 text-indigo-600" />
                                    <span>{isBn ? 'ভয়েস এডিট' : 'Voice Edit'}</span>
                                  </button>

                                  {/* Manual Edit */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (trip.type === 'lead' && trip.rawLead) {
                                        setEditingBooking(trip.rawLead);
                                      } else if (trip.type === 'schedule' && trip.rawSchedule) {
                                        const matchingCar = cars.find(c => c.id === trip.carId) || cars[0];
                                        handleOpenScheduleModal(matchingCar, currentActiveDay.dateStr);
                                      }
                                    }}
                                    className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3 text-slate-600" />
                                    <span>{isBn ? 'এডিট' : 'Edit'}</span>
                                  </button>

                                  {/* Cancel / Delete */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (trip.type === 'schedule') {
                                        handleClearCarSchedule(trip.carId, currentActiveDay.dateStr);
                                      } else if (trip.type === 'lead' && trip.rawLead) {
                                        handleDeleteBooking(trip.rawLead.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 cursor-pointer"
                                    title="Delete / Cancel Trip"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Empty State for Date with no trips */
                      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                          <CalendarDays className="w-7 h-7" />
                        </div>

                        <div className="space-y-1 max-w-md mx-auto">
                          <h4 className="text-base font-black text-slate-900">
                            {isBn ? 'এই তারিখে কোনো ট্রিপ নেই' : 'No Trips Booked on this Date'}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {isBn 
                              ? 'বাংলা ভয়েস কমান্ড বা বুকিং ফর্ম ব্যবহার করে সহজেই নতুন ট্রিপ যোগ করুন।' 
                              : 'Use Bengali voice command or booking form to add new trips for this date.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenVoiceAssign(null, undefined, currentActiveDay.dateStr)}
                            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          >
                            <Mic className="w-4 h-4 text-amber-300" />
                            <span>{isBn ? '🎙️ ভয়েসে ট্রিপ বুক করুন' : '🎙️ Voice Book Trip'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenLocalTripModal(undefined, currentActiveDay.dateStr)}
                            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{isBn ? '+ ট্রিপ যোগ করুন' : '+ Add Trip'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAB 2: FUTURE BOOKINGS VIEW (WITH ALL DETAILS & BENGALI CALENDAR DATES) */}
              {activeTab === 'future' && (
                <div className="space-y-6">
                  
                  {/* FUTURE BOOKINGS REMINDERS HUB BANNER */}
                  {upcomingReminders.length > 0 ? (
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-amber-500/20 border border-amber-400/40">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 animate-bounce">
                            <BellRing className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base sm:text-lg font-black tracking-tight">
                                {isBn ? '🔔 আসন্ন ট্রিপ রিমাইন্ডার সতর্কতা' : '🔔 Upcoming Trip Reminders'}
                              </h4>
                              <span className="bg-white text-amber-950 px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs">
                                {isBn ? `${toBengaliNumber(upcomingReminders.length)} টি আসন্ন বুকিং` : `${upcomingReminders.length} Trips Soon`}
                              </span>
                            </div>
                            <p className="text-xs text-white/90 font-medium mt-0.5">
                              {isBn 
                                ? 'আজ ও আগামী ২ দিনের ট্রিপের জন্য গ্রাহক ও ড্রাইভারকে হোয়াটসঅ্যাপে সময়মত রিমাইন্ডার পাঠান।' 
                                : 'Send WhatsApp journey reminders to customers and drivers for trips in the next 48 hours.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            onClick={() => setFutureDateFilter('reminders-needed')}
                            className="px-3.5 py-2 rounded-xl bg-white text-amber-900 hover:bg-amber-50 font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Filter className="w-3.5 h-3.5" />
                            <span>{isBn ? 'রিমাইন্ডার তালিকা দেখুন' : 'View Reminders'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Quick Reminder Dispatch Carousel/List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3.5 pt-3.5 border-t border-white/20">
                        {upcomingReminders.slice(0, 3).map((remBooking) => {
                          const bDate = new Date(remBooking.date + 'T00:00:00');
                          const now = new Date();
                          now.setHours(0,0,0,0);
                          const dDiff = Math.ceil((bDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          const isSent = Boolean(remindedBookings[remBooking.id]);

                          return (
                            <div 
                              key={`rem-${remBooking.id}`}
                              className="bg-black/15 backdrop-blur-xs rounded-xl p-2.5 border border-white/20 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-xs text-white truncate">
                                    {remBooking.name}
                                  </span>
                                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                                    dDiff === 0 ? 'bg-red-500 text-white' : dDiff === 1 ? 'bg-amber-300 text-amber-950' : 'bg-white/30 text-white'
                                  }`}>
                                    {dDiff === 0 ? (isBn ? 'আজ' : 'Today') : dDiff === 1 ? (isBn ? 'কাল' : 'Tmrw') : `${dDiff}d`}
                                  </span>
                                </div>
                                <div className="text-[11px] text-white/80 truncate">
                                  {remBooking.destination} • {remBooking.car}
                                </div>
                              </div>

                              <button
                                onClick={() => handleSendTripReminder(remBooking)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                                  isSent 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                    : 'bg-white text-slate-900 hover:bg-white/90 shadow-xs'
                                }`}
                                title={isBn ? 'গ্রাহককে হোয়াটসঅ্যাপ রিমাইন্ডার পাঠান' : 'Send WhatsApp Reminder'}
                              >
                                {isSent ? <CheckCheck className="w-3.5 h-3.5 text-emerald-200" /> : <Bell className="w-3.5 h-3.5 text-amber-600" />}
                                <span>{isSent ? (isBn ? 'প্রেরিত' : 'Sent') : (isBn ? 'রিমাইন্ড' : 'Remind')}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs sm:text-sm font-black">
                            {isBn ? '✅ সব ভবিষ্যৎ ট্রিপ শিডিউল আপ-টু-ডেট' : '✅ All Upcoming Bookings Are Up-to-Date'}
                          </h5>
                          <p className="text-[11px] text-emerald-700">
                            {isBn ? 'পরবর্তী ৪৮ ঘণ্টার জন্য কোনো অমীমাংসিত জরুরি রিমাইন্ডার বাকি নেই।' : 'No urgent reminders pending for the next 48 hours.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Action Bar with Search, Filters & Add Booking Button */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-600" />
                          <span>{isBn ? 'ভবিষ্যৎ ও অগ্রিম বুকিং রেজিস্টার' : 'Future & Advance Bookings Register'}</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          {isBn ? 'ইংরেজি ও বাংলা ক্যালেন্ডার অনুযায়ী তারিখ, গাড়ি ও কাস্টমার তালিকা' : 'Track and dispatch future bookings with auto-converted Bengali calendar dates'}
                        </p>
                      </div>

                      <button
                        onClick={() => setShowAddBooking(true)}
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 active:scale-95 transition-all self-start md:self-auto cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isBn ? 'নতুন ভবিষ্যৎ বুকিং যোগ করুন' : 'Add Advance Booking'}</span>
                      </button>
                    </div>

                    {/* Filter controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={futureSearch}
                          onChange={(e) => setFutureSearch(e.target.value)}
                          placeholder={isBn ? 'নাম, ফোন বা গন্তব্য সার্চ...' : 'Search name, phone, city...'}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none bg-slate-50"
                        />
                      </div>

                      {/* Date Range Filter */}
                      <select
                        value={futureDateFilter}
                        onChange={(e) => setFutureDateFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:border-purple-600 outline-none"
                      >
                        <option value="reminders-needed">{isBn ? '🔔 রিমাইন্ডার প্রয়োজন (আজ ও আগামীকালের ট্রিপ)' : '🔔 Reminders Needed (Today & Soon)'}</option>
                        <option value="all-future">{isBn ? '📅 সব ভবিষ্যৎ বুকিং (All Future)' : '📅 All Future Dates'}</option>
                        <option value="next-7-days">{isBn ? '📅 পরবর্তী ৭ দিন (Next 7 Days)' : '📅 Next 7 Days'}</option>
                        <option value="this-month">{isBn ? '📅 চলতি মাস (This Month)' : '📅 This Month'}</option>
                        <option value="all">{isBn ? '📅 সমস্ত রেকর্ড (All Records)' : '📅 All Records (History)'}</option>
                      </select>

                      {/* Car Filter */}
                      <select
                        value={futureCarFilter}
                        onChange={(e) => setFutureCarFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:border-purple-600 outline-none"
                      >
                        <option value="All">{isBn ? '🚗 সব গাড়ি (All Fleet)' : '🚗 All Vehicles'}</option>
                        <option value="Ertiga">Maruti Ertiga (7 Seater)</option>
                        <option value="Rumion">Toyota Rumion</option>
                        <option value="Scorpio">Mahindra Scorpio (9 Seater)</option>
                        <option value="Wagon R">Maruti Wagon R</option>
                        <option value="Dzire">Swift Dzire</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={futureStatusFilter}
                        onChange={(e) => setFutureStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:border-purple-600 outline-none"
                      >
                        <option value="All">{isBn ? '🏷️ সব স্ট্যাটাস (All Status)' : '🏷️ All Statuses'}</option>
                        <option value="Confirmed">{isBn ? 'কনফার্ম (Confirmed)' : 'Confirmed'}</option>
                        <option value="Advance Paid">{isBn ? 'অগ্রিম প্রাপ্ত (Advance Paid)' : 'Advance Paid'}</option>
                        <option value="New">{isBn ? 'নতুন অনুসন্ধান (New Lead)' : 'New Lead'}</option>
                        <option value="Completed">{isBn ? 'সম্পন্ন (Completed)' : 'Completed'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Future Bookings List */}
                  {filteredFutureBookings.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h5 className="text-base font-bold text-slate-800">
                        {isBn ? 'কোনো ভবিষ্যৎ বুকিং পাওয়া যায়নি' : 'No Future Bookings Found'}
                      </h5>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {isBn 
                          ? 'নতুন অগ্রিম বুকিং যোগ করতে "নতুন ভবিষ্যৎ বুকিং যোগ করুন" বাটনে ক্লিক করুন।' 
                          : 'Click the "Add Advance Booking" button above to schedule customer trips.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredFutureBookings.map((booking) => {
                        const bengaliDateStr = formatFullBengaliDate(booking.date);
                        
                        // Calculate days remaining
                        const bDate = new Date(booking.date + 'T00:00:00');
                        const now = new Date();
                        now.setHours(0,0,0,0);
                        const diffTime = bDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let relativeDayLabel = '';
                        if (diffDays === 0) relativeDayLabel = isBn ? 'আজকের ট্রিপ' : 'Today';
                        else if (diffDays === 1) relativeDayLabel = isBn ? 'আগামীকাল' : 'Tomorrow';
                        else if (diffDays > 1) relativeDayLabel = isBn ? `${toBengaliNumber(diffDays)} দিন বাকি` : `${diffDays} days away`;
                        else relativeDayLabel = isBn ? 'অতীত ট্রিপ' : 'Past Trip';

                        const isReminderSent = Boolean(remindedBookings[booking.id]);

                        return (
                          <div 
                            key={booking.id}
                            className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3 ${
                              diffDays === 0 ? 'border-red-300 ring-2 ring-red-100' :
                              diffDays === 1 ? 'border-amber-300 ring-2 ring-amber-50' :
                              'border-slate-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              
                              {/* Left: Date with Dual Calendar (English & Bengali) */}
                              <div className="flex items-start gap-3">
                                <div className={`w-12 h-12 rounded-2xl text-white flex flex-col items-center justify-center shrink-0 shadow-sm ${
                                  diffDays === 0 ? 'bg-gradient-to-tr from-red-600 to-rose-700' :
                                  diffDays === 1 ? 'bg-gradient-to-tr from-amber-600 to-orange-600' :
                                  'bg-gradient-to-tr from-purple-700 to-indigo-600'
                                }`}>
                                  <span className="text-[10px] font-extrabold uppercase leading-none">
                                    {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                                  </span>
                                  <span className="text-lg font-black leading-tight">
                                    {new Date(booking.date + 'T00:00:00').getDate()}
                                  </span>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-black text-slate-900">
                                      {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>

                                    {/* TIME DISPLAY AFTER DATE */}
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 text-xs font-black border border-indigo-200 shadow-2xs">
                                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                      <span>{booking.timeSlot || (isBn ? 'সকাল' : 'Morning')}</span>
                                    </span>

                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                      diffDays === 0 
                                        ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse' 
                                        : diffDays === 1
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                                    }`}>
                                      {relativeDayLabel}
                                    </span>

                                    {isReminderSent && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                                        <span>{isBn ? 'রিমাইন্ডার প্রেরিত' : 'Reminded'}</span>
                                      </span>
                                    )}
                                  </div>

                                  {/* Bengali Date Display Badge */}
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                    <span className="text-xs font-black text-purple-950 font-bengali">
                                      বাংলা তারিখ: {bengaliDateStr}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Booking Status & Quick Actions */}
                              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                                  booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                  booking.status === 'Advance Paid' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                  booking.status === 'New' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                  booking.status === 'Completed' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                  'bg-rose-100 text-rose-800 border-rose-300'
                                }`}>
                                  ● {booking.status}
                                </span>

                                {/* Assign Driver Button */}
                                <button
                                  onClick={() => setAssignDriverBooking(booking)}
                                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                                  title={isBn ? 'ড্রাইভার বরাদ্দ করুন ও হোয়াটসঅ্যাপে ট্রিপ ডিটেইলস পাঠান' : 'Assign Driver and send customer name, location, mobile & car to WhatsApp'}
                                >
                                  <Car className="w-3.5 h-3.5 text-blue-100" />
                                  <span>{isBn ? 'ড্রাইভার বরাদ্দ' : 'Assign Driver'}</span>
                                </button>

                                {/* WhatsApp Reminder Dispatch Button */}
                                <button
                                  onClick={() => handleSendTripReminder(booking)}
                                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                                    isReminderSent
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                      : diffDays <= 1
                                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse'
                                      : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300'
                                  }`}
                                  title={isBn ? 'গ্রাহককে হোয়াটসঅ্যাপ যাত্রা রিমাইন্ডার পাঠান' : 'Send WhatsApp Reminder to Customer'}
                                >
                                  <Bell className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{isBn ? 'রিমাইন্ডার' : 'Reminder'}</span>
                                </button>

                                <button
                                  onClick={() => handleOpenInvoiceForBooking(booking)}
                                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                  title="গ্রাহকের ইনভয়েস বিল তৈরি করুন ও হোয়াটসঅ্যাপে পাঠান"
                                >
                                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="hidden sm:inline">{isBn ? 'ইনভয়েস' : 'Invoice'}</span>
                                </button>

                                <button
                                  onClick={() => handleCopyBookingDetails(booking)}
                                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    copiedId === booking.id
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                  title="WhatsApp Trip Sheet কপি করুন"
                                >
                                  {copiedId === booking.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => setEditingBooking(booking)}
                                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                                  title="Edit Booking"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteBooking(booking.id)}
                                  className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                                  title="Delete Booking"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Assigned Driver Status Banner if present */}
                            {booking.assignedDriver && (
                              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs text-blue-950 font-bold">
                                <div className="flex items-center gap-2 truncate">
                                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shrink-0">
                                    <Car className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="truncate">
                                    <span className="text-slate-500 font-medium text-[10px] uppercase block leading-none">{isBn ? 'বরাদ্দ ড্রাইভার' : 'Assigned Driver'}</span>
                                    <span className="font-black text-blue-950">{booking.assignedDriver}</span>
                                    {booking.assignedDriverPhone && (
                                      <span className="ml-1 text-slate-600 font-bold">({booking.assignedDriverPhone})</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {booking.assignedDriverPhone && (
                                    <a
                                      href={`https://wa.me/91${booking.assignedDriverPhone.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-2xs"
                                      title="WhatsApp Driver"
                                    >
                                      <MessageSquare className="w-3 h-3 fill-current" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                  <button
                                    onClick={() => setAssignDriverBooking(booking)}
                                    className="px-2 py-1 rounded-lg bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold cursor-pointer"
                                  >
                                    {isBn ? 'পরিবর্তন' : 'Reassign'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Middle Grid: Customer, Route, Vehicle & Fare */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              {/* Customer Details */}
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'কাস্টমার / যাত্রী' : 'Customer'}</span>
                                <p className="font-extrabold text-slate-900">{booking.name}</p>
                                <div className="flex items-center gap-2">
                                  <a href={`tel:${booking.phone}`} className="font-bold text-blue-600 hover:underline">
                                    {booking.phone}
                                  </a>
                                  <a 
                                    href={`https://wa.me/91${booking.phone.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-emerald-600 hover:text-emerald-700"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                  </a>
                                </div>
                              </div>

                              {/* Route Details */}
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'রুট ও সময়' : 'Route & Timing'}</span>
                                <div className="font-bold text-slate-800 flex items-center gap-1 truncate">
                                  <span className="truncate">{booking.pickup}</span>
                                  <ArrowRight className="w-3 h-3 text-purple-600 shrink-0" />
                                  <span className="truncate text-purple-700">{booking.destination}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  ⏰ {booking.timeSlot || 'Full Day'} • {booking.tripType}
                                </p>
                              </div>

                              {/* Vehicle */}
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'বরাদ্দ গাড়ি' : 'Vehicle'}</span>
                                <p className="font-extrabold text-slate-900 truncate">{booking.car}</p>
                                <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-extrabold border border-purple-200">
                                  {booking.isAc ? 'AC Comfort' : 'Non-AC'}
                                </span>
                              </div>

                              {/* Financials */}
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'ভাড়া ও অগ্রিম' : 'Fare & Advance'}</span>
                                <p className="font-extrabold text-slate-900">
                                  {booking.fareEstimate ? `₹${booking.fareEstimate}` : 'Meter / Fixed'}
                                </p>
                                <p className="text-[11px] text-emerald-700 font-bold">
                                  {booking.advanceAmount ? `✓ Adv: ₹${booking.advanceAmount}` : 'No advance recorded'}
                                </p>
                              </div>
                            </div>

                            {booking.notes && (
                              <div className="bg-slate-50 p-2 rounded-xl text-xs text-slate-600 border border-slate-100 flex items-start gap-2">
                                <span className="font-bold text-slate-700 shrink-0">{isBn ? 'নোট:' : 'Notes:'}</span>
                                <span>{booking.notes}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* TAB: CRM DATA MANAGEMENT & INTEGRATED BROADCAST SENDER */}
              {activeTab === 'crm' && (
                <CRMManager
                  customers={crmCustomers}
                  bookings={bookings}
                  lang={lang}
                  onRefresh={syncDataFromServer}
                />
              )}

              {/* TAB: INVOICE & BILL GENERATOR */}
              {activeTab === 'invoices' && (
                <InvoiceGenerator
                  lang={lang}
                  prefillBooking={selectedBookingForInvoice}
                  onBack={() => setActiveTab('future')}
                />
              )}

              {/* TAB 3: PROMO & ANNOUNCEMENT BANNER */}
              {activeTab === 'announcements' && (
                <div className="space-y-6 max-w-3xl">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Megaphone className="w-5 h-5 text-amber-500" />
                          <span>{isBn ? 'ওয়েবসাইট টপ নোটিশ ও অফার ব্যানার' : 'Website Notice Banner'}</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          {isBn ? 'ওয়েবসাইটের একদম উপরে গুরুত্বপূর্ণ ঘোষণা বা ছাড় প্রদর্শন করুন' : 'Display announcements or discounts at the top header'}
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notice.enabled}
                          onChange={(e) => setNotice({ ...notice, enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {isBn ? 'বাংলা নোটিশ টেক্সট:' : 'Bengali Notice Text:'}
                        </label>
                        <input
                          type="text"
                          value={notice.textBn}
                          onChange={(e) => setNotice({ ...notice, textBn: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {isBn ? 'ইংরেজি নোটিশ টেক্সট:' : 'English Notice Text:'}
                        </label>
                        <input
                          type="text"
                          value={notice.text}
                          onChange={(e) => setNotice({ ...notice, text: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {isBn ? 'কালার থিম:' : 'Banner Theme:'}
                        </label>
                        <div className="flex gap-2">
                          {(['amber', 'blue', 'emerald', 'rose', 'purple'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setNotice({ ...notice, theme: t })}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize border ${
                                notice.theme === t
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live Preview */}
                      <div className="pt-3">
                        <span className="text-xs font-bold text-slate-500 mb-1 block">{isBn ? 'লাইভ প্রিভিউ:' : 'Live Preview:'}</span>
                        <div className={`p-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-between gap-2 ${
                          notice.theme === 'amber' ? 'bg-gradient-to-r from-amber-600 to-orange-600' :
                          notice.theme === 'emerald' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' :
                          notice.theme === 'rose' ? 'bg-gradient-to-r from-rose-600 to-pink-600' :
                          notice.theme === 'purple' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' :
                          'bg-gradient-to-r from-blue-600 to-indigo-600'
                        }`}>
                          <div className="flex items-center gap-2 truncate">
                            <Megaphone className="w-4 h-4 shrink-0" />
                            <span className="truncate">{notice.textBn || notice.text}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">Call 24x7</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleSaveNotice}
                          className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isBn ? 'ব্যানার সংরক্ষণ করুন' : 'Save Notice Banner'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SETTINGS & PASSWORD */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-2xl">
                  
                  {/* Agency Information & Google Maps Card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-slate-700" />
                      <span>{isBn ? 'এজেন্সি প্রোফাইল ও গুগল ম্যাপ লোকেশন' : 'Agency Profile & Google Maps'}</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 font-bold">{isBn ? 'ব্যবসার নাম:' : 'Business Name:'}</span>
                        <span className="font-extrabold text-slate-900">{BUSINESS_INFO.name} ({BUSINESS_INFO.nameBn})</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 font-bold">{isBn ? 'মূল ঠিকানা:' : 'Office Address:'}</span>
                        <span className="font-extrabold text-slate-900 text-right">{BUSINESS_INFO.addressBn}</span>
                      </div>

                      {/* Google Maps Direct Location Link Card */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block">
                              Google Maps Verified Location
                            </span>
                            <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                              {BUSINESS_INFO.googleMapsUrl}
                            </span>
                          </div>
                        </div>

                        <a
                          href={BUSINESS_INFO.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>{isBn ? 'গুগল ম্যাপে দেখুন ↗' : 'Open in Maps ↗'}</span>
                        </a>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 font-bold">{isBn ? 'হটলাইন নম্বর:' : 'Contact Numbers:'}</span>
                        <span className="font-extrabold text-blue-600">{BUSINESS_INFO.phone1} / {BUSINESS_INFO.phone2}</span>
                      </div>
                    </div>
                  </div>

                  {/* Password & Cryptographic Security */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Key className="w-5 h-5 text-indigo-600" />
                          <span>{isBn ? 'অ্যাডমিন পাসওয়ার্ড ও SHA-256 সিকিউরিটি' : 'Admin Password & Security'}</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          {isBn ? 'লগইন পাসওয়ার্ড আপডেট করুন (SHA-256 এনক্রিপ্টেড)' : 'Update your owner password with real-time strength validation'}
                        </p>
                      </div>

                      {!isChangingPass && (
                        <button
                          onClick={() => {
                            setIsChangingPass(true);
                            setChangePassStatus(null);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                        >
                          {isBn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                        </button>
                      )}
                    </div>

                    {isChangingPass && (
                      <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-3 border-t border-slate-100">
                        {changePassStatus && (
                          <div className={`p-2.5 rounded-xl text-xs font-bold ${
                            changePassStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {changePassStatus.message}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {isBn ? 'বর্তমান পাসওয়ার্ড:' : 'Current Password:'}
                          </label>
                          <div className="relative">
                            <input
                              type={showOldPass ? 'text' : 'password'}
                              value={oldPassInput}
                              onChange={(e) => setOldPassInput(e.target.value)}
                              placeholder="Enter current password"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-600 outline-none pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPass(!showOldPass)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                              {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              {isBn ? 'নতুন পাসওয়ার্ড:' : 'New Password:'}
                            </label>
                            <div className="relative">
                              <input
                                type={showNewPass ? 'text' : 'password'}
                                value={newPassInput}
                                onChange={(e) => setNewPassInput(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-600 outline-none pr-10"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPass(!showNewPass)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                              >
                                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              {isBn ? 'কনফার্ম পাসওয়ার্ড:' : 'Confirm Password:'}
                            </label>
                            <input
                              type="password"
                              value={confirmPassInput}
                              onChange={(e) => setConfirmPassInput(e.target.value)}
                              placeholder="Confirm new password"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-600 outline-none"
                              required
                            />
                          </div>
                        </div>

                        {/* Password Strength Meter */}
                        {newPassInput && (() => {
                          const strength = evaluatePasswordStrength(newPassInput);
                          return (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-600">
                                  {isBn ? 'পাসওয়ার্ড শক্তি মান:' : 'Password Strength:'}
                                </span>
                                <span className="font-extrabold capitalize" style={{ color: strength.color }}>
                                  {strength.label}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-300 rounded-full"
                                  style={{ 
                                    width: `${(strength.score / 5) * 100}%`,
                                    backgroundColor: strength.color 
                                  }}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1">
                                <span className={strength.checks.length ? 'text-emerald-600 font-bold' : ''}>
                                  {strength.checks.length ? '✓' : '•'} {isBn ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters'}
                                </span>
                                <span className={strength.checks.hasNumber ? 'text-emerald-600 font-bold' : ''}>
                                  {strength.checks.hasNumber ? '✓' : '•'} {isBn ? 'সংখ্যা (০-৯)' : 'Includes numbers'}
                                </span>
                                <span className={strength.checks.hasUpper ? 'text-emerald-600 font-bold' : ''}>
                                  {strength.checks.hasUpper ? '✓' : '•'} {isBn ? 'বড় হাতের অক্ষর' : 'Uppercase letters'}
                                </span>
                                <span className={strength.checks.hasSymbol ? 'text-emerald-600 font-bold' : ''}>
                                  {strength.checks.hasSymbol ? '✓' : '•'} {isBn ? 'স্পেশাল চিহ্ন (@#$)' : 'Symbols & special chars'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                          >
                            {isBn ? 'পাসওয়ার্ড সেভ করুন' : 'Save New Password'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsChangingPass(false);
                              setChangePassStatus(null);
                            }}
                            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                          >
                            {isBn ? 'বাতিল' : 'Cancel'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Emergency Master Recovery Key Card */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {isBn ? 'জরুরি মাস্টার রিকভারি কি (Emergency Master Key)' : 'Emergency Master Recovery Key'}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {isBn ? 'পাসওয়ার্ড ভুলে গেলে বা অ্যাকাউন্ট লক হলে এই কি ব্যবহার করে সাথে সাথে রিসেট করতে পারবেন।' : 'Confidential owner master key for instant account rescue & password reset.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(getMasterRecoveryKey());
                          setCopiedMasterKey(true);
                          setTimeout(() => setCopiedMasterKey(false), 2000);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 shrink-0 cursor-pointer"
                      >
                        {copiedMasterKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedMasterKey ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি কি' : 'Copy Key')}</span>
                      </button>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-indigo-900 tracking-wider">
                        {getMasterRecoveryKey()}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {isBn ? 'সক্রিয় ও স্থায়ী' : 'Active & Permanent'}
                      </span>
                    </div>
                  </div>

                  {/* Active Session & Auto-Lock Configuration */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Timer className="w-5 h-5 text-blue-600" />
                      <span>{isBn ? 'অ্যাক্টিভ সেশন ও অটো-লক পলিসি' : 'Active Session & Auto-Lock Policy'}</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div>
                          <span className="text-slate-800 font-bold block">{isBn ? 'অটো-লক নিষ্ক্রিয়তার সময়:' : 'Inactivity Auto-Lock Duration:'}</span>
                          <span className="text-[11px] text-slate-500">{isBn ? 'কোনো মাউস বা কিবোর্ড স্পর্শ না থাকলে স্বয়ংক্রিয় লক হবে' : 'Automatically locks panel after period of inactivity'}</span>
                        </div>
                        <select
                          value={autoLockMinutes}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setAutoLockMinutes(val);
                            localStorage.setItem('cholo_jai_admin_auto_lock_mins', val.toString());
                          }}
                          className="bg-white text-slate-800 font-bold px-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-600"
                        >
                          <option value={15}>{isBn ? '১৫ মিনিট' : '15 Minutes'}</option>
                          <option value={60}>{isBn ? '১ ঘন্টা (প্রস্তাবিত)' : '1 Hour (Recommended)'}</option>
                          <option value={240}>{isBn ? '৪ ঘন্টা' : '4 Hours'}</option>
                          <option value={720}>{isBn ? '১২ ঘন্টা' : '12 Hours'}</option>
                          <option value={1440}>{isBn ? '২৪ ঘন্টা' : '24 Hours'}</option>
                        </select>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-slate-800 block">{isBn ? 'বর্তমান সেশন সমাপ্তি ও লক:' : 'Session Invalidation:'}</span>
                          <span className="text-[11px] text-slate-500">{isBn ? 'সব ডিভাইসের অ্যাডমিন অ্যাক্সেস সাথে সাথে লক করুন' : 'Revoke authorization token and lock dashboard now'}</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleRevokeAllSessions}
                          className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{isBn ? 'সব সেশন বাতিল ও লক করুন' : 'Revoke & Lock Dashboard'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security Audit Log */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-600" />
                        <span>{isBn ? 'সিকিউরিটি অডিট লগ (Security Audit Trail)' : 'Security Audit Trail'}</span>
                      </h4>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {auditLogs.length} {isBn ? 'টি রেকর্ড' : 'Events'}
                      </span>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                      {auditLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">{isBn ? 'কোনো অডিট লগ রেকর্ড নেই।' : 'No security events recorded yet.'}</p>
                      ) : (
                        auditLogs.slice(0, 15).map((log) => (
                          <div key={log.id} className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  log.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                                  log.status === 'danger' ? 'bg-rose-100 text-rose-800' :
                                  log.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {log.action}
                                </span>
                                <span className="text-[11px] text-slate-700 font-medium truncate">
                                  {log.details}
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Clear Data Reset */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-rose-600" />
                      <span>{isBn ? 'ডেটা ম্যানেজমেন্ট ও রিসেট' : 'Data Management'}</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isBn 
                        ? 'আপনার ব্রাউজারে সংরক্ষিত বুকিং ও শিডিউল ডেটা মুছে ফেলতে পারেন।' 
                        : 'Reset or clear all saved bookings and custom schedules from this browser.'}
                    </p>
                    <div>
                      <button
                        onClick={() => {
                          if (window.confirm(isBn ? 'আপনি কি নিশ্চিত যে সমস্ত বুকিং ডেটা মুছে ফেলতে চান?' : 'Are you sure you want to remove all bookings?')) {
                            setBookings([]);
                            setScheduleBookings([]);
                            localStorage.removeItem('cholo_jai_admin_bookings');
                            localStorage.removeItem('cholo_jai_car_schedules');
                            alert(isBn ? 'সকল বুকিং সফলভাবে মুছে ফেলা হয়েছে।' : 'All bookings have been cleared.');
                          }
                        }}
                        className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                      >
                        {isBn ? 'সমস্ত বুকিং ডেটা ক্লিয়ার করুন' : 'Clear All Bookings Data'}
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* SCHEDULE CAR ASSIGNMENT MODAL (FOR TAB 1 4-DAY DISPATCH MATRIX) */}
      {scheduleModalOpen && selectedCarForSchedule && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-4">
            
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Car className="w-5 h-5 text-amber-300" />
                <div>
                  <h4 className="text-sm sm:text-base font-black">
                    {selectedCarForSchedule.seats} • {selectedCarForSchedule.category}
                  </h4>
                  <p className="text-xs text-blue-100 font-bengali">
                    {formatFullBengaliDate(scheduleFormData.dateStr)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScheduleBooking} className="p-4 sm:p-5 space-y-3.5 text-xs">
              
              {/* Status Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গাড়ির বর্তমান স্ট্যাটাস:' : 'Car Status:'}</label>
                <select
                  value={scheduleFormData.status}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-extrabold text-xs focus:border-blue-600 outline-none bg-slate-50"
                >
                  <option value="Available">{isBn ? '🟢 প্রস্তুত (Available)' : '🟢 Available'}</option>
                  <option value="Booked">{isBn ? '🟡 বুকিং কনফার্ম (Booked)' : '🟡 Booked'}</option>
                  <option value="Driver Assigned">{isBn ? '🔵 ড্রাইভার নিয়োজিত (Driver Assigned)' : '🔵 Driver Assigned'}</option>
                  <option value="In Service">{isBn ? '⚪ সার্ভিসিং / গ্যারেজে (In Service)' : '⚪ In Service'}</option>
                </select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'যাত্রীর নাম:' : 'Customer Name:'}</label>
                  <input
                    type="text"
                    value={scheduleFormData.customerName}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, customerName: e.target.value })}
                    placeholder="Customer Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'মোবাইল নম্বর:' : 'Phone Number:'}</label>
                  <input
                    type="tel"
                    value={scheduleFormData.customerPhone}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, customerPhone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Route */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'পিকআপ স্থান:' : 'Pickup Location:'}</label>
                  <input
                    type="text"
                    value={scheduleFormData.pickup}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, pickup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গন্তব্য:' : 'Destination:'}</label>
                  <input
                    type="text"
                    value={scheduleFormData.destination}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, destination: e.target.value })}
                    placeholder="e.g. Digha / Kolkata / Mayapur"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Driver Details with Quick Directory and Voice Assign */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isBn ? 'ড্রাইভার অ্যাসাইন ও তথ্য:' : 'Driver Information:'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleModalOpen(false);
                      handleOpenVoiceAssign(null, scheduleFormData.carId, scheduleFormData.dateStr);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Mic className="w-3 h-3 text-amber-300 animate-pulse" />
                    <span>{isBn ? 'ভয়েসে বলুন' : 'Voice Input'}</span>
                  </button>
                </div>

                {/* Quick Driver Pills */}
                {drivers.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">{isBn ? 'তালিকা:' : 'Quick:'}</span>
                    {drivers.slice(0, 4).map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setScheduleFormData({
                          ...scheduleFormData,
                          driverName: d.name,
                          driverPhone: d.phone
                        })}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 text-[11px] font-bold shrink-0 transition-all"
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{isBn ? 'ড্রাইভারের নাম:' : 'Driver Name:'}</label>
                    <input
                      type="text"
                      value={scheduleFormData.driverName}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, driverName: e.target.value })}
                      placeholder="Driver Name"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{isBn ? 'ড্রাইভারের ফোন:' : 'Driver Phone:'}</label>
                    <input
                      type="tel"
                      value={scheduleFormData.driverPhone}
                      onChange={(e) => setScheduleFormData({ ...scheduleFormData, driverPhone: e.target.value })}
                      placeholder="Driver Mobile"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'আনুমানিক মোট ভাড়া (₹):' : 'Estimated Fare (₹):'}</label>
                  <input
                    type="text"
                    value={scheduleFormData.fareEstimate}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, fareEstimate: e.target.value })}
                    placeholder="e.g. 4500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'অগ্রিম জমা (₹):' : 'Advance Received (₹):'}</label>
                  <input
                    type="text"
                    value={scheduleFormData.advanceAmount}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, advanceAmount: e.target.value })}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'অতিরিক্ত বিবরণ:' : 'Trip Notes:'}</label>
                <input
                  type="text"
                  value={scheduleFormData.notes}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, notes: e.target.value })}
                  placeholder="Special instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 active:scale-98"
                >
                  {isBn ? 'শিডিউল সেভ করুন' : 'Save Schedule'}
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ADD FUTURE BOOKING MODAL */}
      {showAddBooking && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-4">
            
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-amber-300" />
                <h4 className="text-sm sm:text-base font-black">
                  {isBn ? 'নতুন ভবিষ্যৎ / অগ্রিম বুকিং এন্ট্রি' : 'New Advance Booking Entry'}
                </h4>
              </div>
              <button
                onClick={() => setShowAddBooking(false)}
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBookingSubmit} className="p-4 sm:p-5 space-y-3 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'যাত্রীর নাম *' : 'Customer Name *'}</label>
                  <input
                    type="text"
                    required
                    value={newBooking.name || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })}
                    placeholder="Customer Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'মোবাইল নম্বর *' : 'Phone Number *'}</label>
                  <input
                    type="tel"
                    required
                    value={newBooking.phone || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  />
                </div>
              </div>

              {/* Date & Time Selection with Bengali Calendar Live Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isBn ? 'যাত্রার তারিখ (Date of Journey) *' : 'Journey Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newBooking.date || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:border-purple-600 outline-none"
                  />
                  {newBooking.date && (
                    <div className="mt-1.5 p-1.5 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-600 shrink-0" />
                      <span className="text-[10px] text-purple-950 font-black truncate">
                        বাংলা: {formatFullBengaliDate(newBooking.date)}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isBn ? 'যাত্রার সময় (Departure Time) *' : 'Journey Time *'}
                  </label>
                  <input
                    type="text"
                    value={newBooking.timeSlot || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, timeSlot: e.target.value })}
                    placeholder="e.g. 06:00 AM / 02:30 PM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-purple-600 outline-none"
                  />
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {['06:00 AM', '08:30 AM', '02:00 PM', '07:00 PM', 'Full Day'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewBooking({ ...newBooking, timeSlot: t })}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গাড়ির মডেল:' : 'Vehicle:'}</label>
                  <select
                    value={newBooking.car || 'Maruti Suzuki Ertiga (7 Seater)'}
                    onChange={(e) => setNewBooking({ ...newBooking, car: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  >
                    <option value="Maruti Suzuki Ertiga (7 Seater)">Maruti Suzuki Ertiga (7 Seater)</option>
                    <option value="Toyota Rumion - White (7 Seater)">Toyota Rumion - White (7 Seater)</option>
                    <option value="Toyota Rumion - Silver (7 Seater)">Toyota Rumion - Silver (7 Seater)</option>
                    <option value="Mahindra Scorpio Classic (9 Seater)">Mahindra Scorpio (9 Seater)</option>
                    <option value="Maruti Suzuki Wagon R (5 Seater)">Maruti Wagon R (5 Seater)</option>
                    <option value="Maruti Swift Dzire (5 Seater)">Swift Dzire (5 Seater)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'ট্রিপের ধরন:' : 'Trip Type:'}</label>
                  <select
                    value={newBooking.tripType || 'Outstation Tour'}
                    onChange={(e) => setNewBooking({ ...newBooking, tripType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  >
                    <option value="Outstation Tour">Outstation Tour (দিঘা / পুরী / দার্জিলিং)</option>
                    <option value="Wedding / Biyebari">Wedding / বিয়েবাড়ি</option>
                    <option value="Airport Transfer">Airport Drop / Pickup</option>
                    <option value="Hospital / Emergency">Hospital / Emergency</option>
                    <option value="Local Day Trip">Local Day Trip</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'পিকআপ স্থান:' : 'Pickup Location:'}</label>
                  <input
                    type="text"
                    value={newBooking.pickup || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, pickup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গন্তব্য:' : 'Destination:'}</label>
                  <input
                    type="text"
                    value={newBooking.destination || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, destination: e.target.value })}
                    placeholder="e.g. Digha / Tarapith / Puri"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'মোট আনুমানিক ভাড়া (₹):' : 'Estimated Fare (₹):'}</label>
                  <input
                    type="text"
                    value={newBooking.fareEstimate || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, fareEstimate: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'অগ্রিম জমা (₹):' : 'Advance Received (₹):'}</label>
                  <input
                    type="text"
                    value={newBooking.advanceAmount || ''}
                    onChange={(e) => setNewBooking({ ...newBooking, advanceAmount: e.target.value })}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/25 active:scale-98"
                >
                  {isBn ? 'বুকিং নিশ্চিত করুন' : 'Confirm Advance Booking'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBooking(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-4">
            
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-black">
                {isBn ? 'বুকিং বিবরণ সম্পাদনা' : 'Edit Booking Details'}
              </h4>
              <button
                onClick={() => setEditingBooking(null)}
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBookingSubmit} className="p-4 sm:p-5 space-y-3 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'যাত্রীর নাম:' : 'Customer Name:'}</label>
                  <input
                    type="text"
                    required
                    value={editingBooking.name || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'মোবাইল নম্বর:' : 'Phone Number:'}</label>
                  <input
                    type="tel"
                    required
                    value={editingBooking.phone || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'তারিখ (Date):' : 'Date:'}</label>
                  <input
                    type="date"
                    required
                    value={editingBooking.date || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  {editingBooking.date && (
                    <div className="mt-1.5 p-1.5 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="text-[10px] text-blue-950 font-bold truncate">
                        বাংলা: {formatFullBengaliDate(editingBooking.date)}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'যাত্রার সময় (Time):' : 'Journey Time:'}</label>
                  <input
                    type="text"
                    value={editingBooking.timeSlot || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, timeSlot: e.target.value })}
                    placeholder="e.g. 06:00 AM / 02:30 PM"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {['06:00 AM', '08:30 AM', '02:00 PM', '07:00 PM', 'Full Day'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditingBooking({ ...editingBooking, timeSlot: t })}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-[10px] font-bold text-slate-600 cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'বুকিং স্ট্যাটাস:' : 'Booking Status:'}</label>
                  <select
                    value={editingBooking.status || 'Confirmed'}
                    onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Advance Paid">Advance Paid</option>
                    <option value="New">New Lead</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গাড়ির মডেল:' : 'Vehicle:'}</label>
                  <input
                    type="text"
                    value={editingBooking.car || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, car: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গন্তব্য:' : 'Destination:'}</label>
                  <input
                    type="text"
                    value={editingBooking.destination || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, destination: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'আনুমানিক ভাড়া (₹):' : 'Estimated Fare (₹):'}</label>
                  <input
                    type="text"
                    value={editingBooking.fareEstimate || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, fareEstimate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'অগ্রিম জমা (₹):' : 'Advance Received (₹):'}</label>
                <input
                  type="text"
                  value={editingBooking.advanceAmount || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, advanceAmount: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md"
                >
                  {isBn ? 'আপডেট সংরক্ষণ করুন' : 'Update Booking'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingBooking) {
                      handleOpenInvoiceForBooking(editingBooking);
                      setEditingBooking(null);
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ইনভয়েস বিল' : 'Invoice'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DRIVERS DIRECTORY MODAL */}
      <DriverManagerModal
        isOpen={showDriversModal}
        onClose={() => setShowDriversModal(false)}
        drivers={drivers}
        onDriversUpdate={(updated) => {
          setDrivers(updated);
          localStorage.setItem('cholo_jai_drivers', JSON.stringify(updated));
        }}
        lang={lang}
      />

      {/* ASSIGN DRIVER & WHATSAPP DISPATCH MODAL */}
      <AssignDriverModal
        isOpen={Boolean(assignDriverBooking)}
        onClose={() => setAssignDriverBooking(null)}
        booking={assignDriverBooking}
        drivers={drivers}
        onAssignSuccess={(updatedBooking) => {
          setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
          setAssignDriverBooking(null);
        }}
        onAddDriver={(newDriver) => {
          const updated = [newDriver, ...drivers.filter(d => d.id !== newDriver.id)];
          setDrivers(updated);
          localStorage.setItem('cholo_jai_drivers', JSON.stringify(updated));
        }}
        lang={lang}
      />

      {/* 4-DAY MATRIX LOCAL TRIP BOOKING MODAL */}
      <LocalTripBookingModal
        isOpen={showLocalTripModal}
        onClose={() => setShowLocalTripModal(false)}
        onSaveBooking={handleSaveLocalTripBooking}
        cars={cars}
        drivers={drivers}
        selectedCarId={localTripSelectedCarId}
        selectedDateStr={localTripSelectedDateStr}
        lang={lang}
      />

      {/* 4-DAY MATRIX BENGALI VOICE RECOGNITION TRIP BOOKING & DRIVER MODAL */}
      <BengaliVoiceAssignModal
        isOpen={showVoiceAssignModal}
        onClose={() => {
          setShowVoiceAssignModal(false);
          setVoiceAssignTargetBooking(null);
          setVoiceAssignTargetCarId(null);
        }}
        drivers={drivers}
        cars={cars}
        selectedCarId={voiceAssignTargetCarId || cars[0]?.id}
        selectedDateStr={voiceAssignTargetDateStr || currentActiveDay.dateStr}
        targetBooking={voiceAssignTargetBooking}
        onSaveVoiceBooking={handleSaveVoiceTripBooking}
        lang={lang}
      />

      {/* EMERGENCY MASTER RECOVERY MODAL */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {isBn ? 'জরুরি মাস্টার কি রিকভারি' : 'Emergency Master Recovery'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isBn ? 'মাস্টার কি দিয়ে অ্যাকাউন্ট আনলক ও নতুন পাসওয়ার্ড সেট' : 'Rescue account & reset master password'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryModal(false);
                  setRecoveryStatus(null);
                  setRecoveryMasterKeyInput('');
                  setRecoveryNewPassInput('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEmergencyRecoverySubmit} className="space-y-4 text-xs">
              {recoveryStatus && (
                <div className={`p-3 rounded-xl font-bold flex items-start gap-2 ${
                  recoveryStatus.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{recoveryStatus.message}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isBn ? 'জরুরি মাস্টার রিকভারি কি (Master Key):' : 'Emergency Master Key:'}
                </label>
                <input
                  type="text"
                  value={recoveryMasterKeyInput}
                  onChange={(e) => setRecoveryMasterKeyInput(e.target.value)}
                  placeholder="e.g. CJ-ADMIN-8555-SECURE"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-indigo-600 outline-none uppercase"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isBn ? 'নতুন পাসওয়ার্ড দিন:' : 'Set New Admin Password:'}
                </label>
                <div className="relative">
                  <input
                    type={showRecoveryPass ? 'text' : 'password'}
                    value={recoveryNewPassInput}
                    onChange={(e) => setRecoveryNewPassInput(e.target.value)}
                    placeholder={isBn ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:border-indigo-600 outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecoveryPass(!showRecoveryPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showRecoveryPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/25 active:scale-98 cursor-pointer"
                >
                  {isBn ? 'রিসেট করে আনলক করুন →' : 'Reset & Unlock Now →'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryModal(false);
                    setRecoveryStatus(null);
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
