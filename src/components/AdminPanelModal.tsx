import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Lock, ShieldCheck, Car, Calendar, Phone, MessageSquare, 
  Settings, CheckCircle2, AlertCircle, Clock, Trash2, Edit3, Plus, 
  Sparkles, Megaphone, Save, LogOut, ChevronRight, Eye, EyeOff, RefreshCw,
  MapPin, Check, ChevronDown, User, Tag, Search, Filter, Share2, Copy,
  ArrowRight, DollarSign, CalendarDays, Key, Shield, Navigation, Receipt, FileText
} from 'lucide-react';
import { FLEET_CARS, BUSINESS_INFO } from '../data/fleetData';
import { FleetCar, Language } from '../types';
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
  subscribeToLiveFleet
} from '../utils/syncService';
import { InvoiceGenerator } from './InvoiceGenerator';

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

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cholo_jai_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom Password State
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('cholo_jai_admin_password') || '04048555';
  });
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [oldPassInput, setOldPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changePassStatus, setChangePassStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active Tab: Overview (4-day dispatch matrix), Future Bookings, Invoices, Announcements, Settings
  const [activeTab, setActiveTab] = useState<'overview' | 'future' | 'invoices' | 'announcements' | 'settings'>('overview');
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<BookingLead | null>(null);

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
        if (serverData.notice) {
          setNotice(serverData.notice);
          if (onUpdateNotice) onUpdateNotice(serverData.notice);
        }
        if (serverData.adminPassword) {
          setAdminPassword(serverData.adminPassword);
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPass = localStorage.getItem('cholo_jai_admin_password') || '04048555';
    if (pinInput.trim() === currentPass || pinInput.trim() === '04048555') {
      setIsAuthenticated(true);
      setPinError(false);
      localStorage.setItem('cholo_jai_admin_auth', 'true');
    } else {
      setPinError(true);
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPass = localStorage.getItem('cholo_jai_admin_password') || '04048555';
    if (oldPassInput.trim() !== currentPass && oldPassInput.trim() !== '04048555') {
      setChangePassStatus({
        type: 'error',
        message: isBn ? 'বর্তমান পাসওয়ার্ডটি সঠিক নয়!' : 'Current password is incorrect!'
      });
      return;
    }
    if (newPassInput.trim().length < 4) {
      setChangePassStatus({
        type: 'error',
        message: isBn ? 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' : 'New password must be at least 4 characters.'
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

    localStorage.setItem('cholo_jai_admin_password', newPassInput.trim());
    setAdminPassword(newPassInput.trim());
    // Sync password to Firestore
    syncSaveAdminPassword(newPassInput.trim());

    setOldPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setChangePassStatus({
      type: 'success',
      message: isBn ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' : 'Password updated successfully!'
    });
    setTimeout(() => {
      setIsChangingPass(false);
      setChangePassStatus(null);
    }, 2000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cholo_jai_admin_auth');
    setPinInput('');
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

  // Today Date in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Filtered Future Bookings
  const filteredFutureBookings = useMemo(() => {
    return bookings.filter(b => {
      // Date filter
      if (futureDateFilter === 'all-future') {
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-2 sm:my-4 max-h-[96vh] sm:max-h-[92vh] flex flex-col">
        
        {/* Header Strip with vibrant gradient & Live Bengali/English Date */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white p-3.5 sm:p-5 shadow-md shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-xl font-black tracking-tight">
                    {isBn ? 'চলো যাই • অ্যাডমিন কন্ট্রোল প্যানেল' : 'Cholo Jai • Owner Admin Panel'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/25 text-emerald-300 text-[10px] sm:text-xs font-extrabold border border-emerald-400/30">
                    {isBn ? 'মালিক পোর্টাল' : 'Live Portal'}
                  </span>
                  {/* Multi-Device Live Sync Icon Only */}
                  <button 
                    onClick={() => syncDataFromServer()}
                    className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer border border-white/20 active:scale-95"
                    title={isBn ? 'ক্লাউড সিঙ্ক রিফ্রেশ' : 'Cloud Sync Refresh'}
                  >
                    <RefreshCw className={`w-3 h-3 text-cyan-300 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-white/15 pt-2 sm:pt-0 sm:border-0">
              
              {/* English & Bengali Date Badges in Header */}
              <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-xl border border-white/20 shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold text-amber-200">
                    {todayBengali.formattedBn}
                  </span>
                </div>
                <span className="text-[10px] text-blue-200 font-semibold mt-0.5 hidden sm:inline">
                  {todayBengali.formattedEn}
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-colors border border-white/20"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isBn ? 'লগআউট' : 'Logout'}</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors border border-white/20 active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Content Body */}
        {!isAuthenticated ? (
          /* Login Pin Screen */
          <div className="p-6 sm:p-12 text-center max-w-md mx-auto my-auto space-y-6">
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
                    }}
                    placeholder={isBn ? 'পাসওয়ার্ড লিখুন' : 'Enter Admin Password'}
                    className={`w-full px-4 py-3.5 rounded-2xl border text-center text-lg font-bold tracking-widest outline-none transition-all pr-12 ${
                      pinError 
                        ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-400' 
                        : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-slate-50'
                    }`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-xs text-rose-600 font-bold mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।' : 'Incorrect password. Please try again.'}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-98"
              >
                {isBn ? 'প্যানেলে প্রবেশ করুন →' : 'Unlock Dashboard →'}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Navigation Tabs */}
            <div className="bg-slate-100/90 border-b border-slate-200 px-3 sm:px-6 pt-2 shrink-0 overflow-x-auto">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 py-2.5 px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'bg-white text-blue-700 border-t-blue-600 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <span>{isBn ? '৪ দিনের ডিসপ্যাচ ও শিডিউল' : '4-Day Dispatch Matrix'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('future')}
                  className={`flex items-center gap-2 py-2.5 px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap ${
                    activeTab === 'future'
                      ? 'bg-white text-purple-700 border-t-purple-600 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>{isBn ? 'ভবিষ্যৎ ও অগ্রিম বুকিং' : 'Future Bookings'}</span>
                  {bookings.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 font-black">
                      {bookings.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedBookingForInvoice(null);
                    setActiveTab('invoices');
                  }}
                  className={`flex items-center gap-2 py-2.5 px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap ${
                    activeTab === 'invoices'
                      ? 'bg-white text-emerald-700 border-t-emerald-600 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? 'ইনভয়েস ও বিল জেনারেটর' : 'Invoice Generator'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`flex items-center gap-2 py-2.5 px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap ${
                    activeTab === 'announcements'
                      ? 'bg-white text-amber-700 border-t-amber-500 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Megaphone className="w-4 h-4 text-amber-500" />
                  <span>{isBn ? 'ঘোষণা ব্যানার' : 'Announcements'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2 py-2.5 px-3.5 rounded-t-xl text-xs sm:text-sm font-black border-t-2 border-x transition-all whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-white text-slate-800 border-t-slate-700 border-x-slate-200 shadow-xs'
                      : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-700" />
                  <span>{isBn ? 'এজেন্সি ও পাসওয়ার্ড' : 'Settings & Password'}</span>
                </button>
              </div>
            </div>

            {/* Scrollable Tab Content View */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50/50">

              {/* TAB 1: 4-DAY DISPATCH MATRIX WITH BENGALI CALENDAR DATES */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Top 4-Day Selector Bar */}
                  <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-blue-600" />
                        <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                          {isBn ? '৪ দিনের বুকিং ক্যালেন্ডার ও গাড়ি বরাদ্দ' : '4-Day Booking & Dispatch Selector'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {isBn ? 'যেকোনো দিনে ক্লিক করে গাড়ির শিডিউল পরিবর্তন করুন' : 'Click a date tab to inspect or assign cars'}
                      </span>
                    </div>

                    {/* 4 Day Tabs with Bengali & English Date info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      {upcoming4Days.map((day) => {
                        const isSelected = selectedDayOffset === day.offset;
                        // Count statuses for this day
                        const daySchedules = scheduleBookings.filter(s => s.dateStr === day.dateStr);
                        const bookedCount = daySchedules.filter(s => s.status === 'Booked' || s.status === 'Driver Assigned').length;
                        const availableCount = cars.length - bookedCount - daySchedules.filter(s => s.status === 'In Service').length;

                        return (
                          <button
                            key={day.offset}
                            onClick={() => setSelectedDayOffset(day.offset)}
                            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                              isSelected
                                ? 'bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 text-white border-blue-600 shadow-md scale-[1.02]'
                                : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-amber-300' : 'text-blue-600'}`}>
                                  {isBn ? day.labelBn : day.labelEn}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {day.weekdayShortEn || day.weekdayEn}
                                </span>
                              </div>

                              <p className={`text-sm sm:text-base font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {day.dayNum} {day.monthShort}
                              </p>

                              {/* Bengali Date Badge inside tab */}
                              <p className={`text-[11px] font-bold mt-0.5 truncate ${isSelected ? 'text-amber-200 font-bengali' : 'text-indigo-600 font-bengali'}`}>
                                {day.bengaliDate.dayBn} {day.bengaliDate.monthBn}, {day.bengaliDate.yearBn}
                              </p>
                            </div>

                            <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] font-bold">
                              <span className={isSelected ? 'text-emerald-300' : 'text-emerald-700'}>
                                ✓ {availableCount} {isBn ? 'খালি' : 'Avail'}
                              </span>
                              {bookedCount > 0 && (
                                <span className={isSelected ? 'text-amber-300' : 'text-amber-700'}>
                                  ● {bookedCount} {isBn ? 'বুক' : 'Booked'}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day Detail Header Banner */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-black">
                          {isBn ? currentActiveDay.labelBn : currentActiveDay.labelEn}
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-slate-900">
                          {currentActiveDay.weekdayFull}, {currentActiveDay.dayNum} {currentActiveDay.monthShort} {currentActiveDay.date.getFullYear()}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="text-xs sm:text-sm font-extrabold text-purple-950 font-bengali">
                          বাংলা তারিখ: {currentActiveDay.bengaliDate.formattedBn}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs text-slate-500 font-medium hidden md:inline">
                        {isBn ? 'স্ট্যাটাস বদলাতে বাটনে চাপুন:' : 'Toggle status in 1 click:'}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {isBn ? 'প্রস্তুত' : 'Avail'}
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                          {isBn ? 'বুকড' : 'Booked'}
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-300">
                          {isBn ? 'ড্রাইভার' : 'Driver'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 6 Cars Matrix Grid for Current Selected Day */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cars.map((car) => {
                      const schedule = getCarSchedule(car.id, currentActiveDay.dateStr);
                      const isAvailable = schedule.status === 'Available';
                      const isBooked = schedule.status === 'Booked';
                      const isDriverAssigned = schedule.status === 'Driver Assigned';
                      const isInService = schedule.status === 'In Service';

                      return (
                        <div
                          key={car.id}
                          className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden flex flex-col justify-between ${
                            isAvailable
                              ? 'border-emerald-200 hover:border-emerald-400'
                              : isBooked
                              ? 'border-amber-300 bg-amber-50/20'
                              : isDriverAssigned
                              ? 'border-indigo-300 bg-indigo-50/20'
                              : 'border-slate-300 bg-slate-100/50'
                          }`}
                        >
                          <div>
                            {/* Car Card Header with Image & Title */}
                            <div className="p-4 border-b border-slate-100 flex items-start gap-3">
                              <img
                                src={car.image}
                                alt={car.name}
                                className="w-16 h-12 object-cover rounded-xl border border-slate-200 shadow-2xs shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                    {car.seats}
                                  </span>
                                  {/* Status Badge */}
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                    isAvailable
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : isBooked
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : isDriverAssigned
                                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                      : 'bg-slate-200 text-slate-700 border-slate-300'
                                  }`}>
                                    {isAvailable ? (isBn ? '● প্রস্তুত (খালি)' : '● Available') :
                                     isBooked ? (isBn ? '● বুকিং কনফার্ম' : '● Booked') :
                                     isDriverAssigned ? (isBn ? '● ড্রাইভার রেডি' : '● Assigned') :
                                     (isBn ? '● গ্যারেজে' : '● In Service')}
                                  </span>
                                </div>

                                <h5 className="text-sm font-black text-slate-900 mt-1 truncate">
                                  {isBn ? car.nameBn : car.name}
                                </h5>
                                <p className="text-[11px] text-slate-500 font-medium truncate">
                                  {car.acType} • {car.category}
                                </p>
                              </div>
                            </div>

                            {/* Booking or Available Status Details */}
                            <div className="p-4 space-y-2 text-xs">
                              {isAvailable ? (
                                <div className="py-4 text-center text-slate-400 space-y-1">
                                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                                  <p className="font-bold text-slate-700 text-xs">
                                    {isBn ? 'গাড়িটি ট্রিপের জন্য প্রস্তুত' : 'Ready for New Booking'}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {isBn ? 'বুকিং যোগ করতে নিচের বাটনে চাপুন' : 'Click assign to set trip details'}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                                  {/* Customer & Route */}
                                  {schedule.customerName && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500 font-semibold">{isBn ? 'যাত্রী:' : 'Customer:'}</span>
                                      <span className="font-black text-slate-900">{schedule.customerName}</span>
                                    </div>
                                  )}

                                  {schedule.customerPhone && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500 font-semibold">{isBn ? 'ফোন:' : 'Phone:'}</span>
                                      <div className="flex items-center gap-2">
                                        <a href={`tel:${schedule.customerPhone}`} className="font-bold text-blue-600 hover:underline">
                                          {schedule.customerPhone}
                                        </a>
                                        <a 
                                          href={`https://wa.me/91${schedule.customerPhone.replace(/\D/g, '')}`} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="text-emerald-600 hover:text-emerald-700"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {schedule.destination && (
                                    <div className="pt-1 border-t border-slate-100">
                                      <span className="text-[10px] text-slate-400 font-bold block">{isBn ? 'রুট / গন্তব্য:' : 'Trip Route:'}</span>
                                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] mt-0.5">
                                        <span className="truncate">{schedule.pickup || 'Jamalpur'}</span>
                                        <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span className="truncate text-indigo-700">{schedule.destination}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Driver Info if Assigned */}
                                  {schedule.driverName && (
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                      <span className="text-slate-500 font-semibold">{isBn ? 'ড্রাইভার:' : 'Driver:'}</span>
                                      <span className="font-black text-indigo-900">
                                        {schedule.driverName} {schedule.driverPhone ? `(${schedule.driverPhone})` : ''}
                                      </span>
                                    </div>
                                  )}

                                  {/* Fare & Advance */}
                                  {(schedule.fareEstimate || schedule.advanceAmount) && (
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                      <span className="text-slate-500 font-semibold">{isBn ? 'ভাড়া / অগ্রিম:' : 'Fare / Adv:'}</span>
                                      <span className="font-black text-slate-900">
                                        ₹{schedule.fareEstimate || '0'} {schedule.advanceAmount ? `(Adv: ₹${schedule.advanceAmount})` : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                            <button
                              onClick={() => handleQuickToggleCarStatus(car.id, currentActiveDay.dateStr)}
                              className="flex-1 py-2 px-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                              title="Toggle Status"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                              <span className="truncate">{isBn ? 'স্ট্যাটাস বদলান' : 'Quick Toggle'}</span>
                            </button>

                            <button
                              onClick={() => handleOpenScheduleModal(car, currentActiveDay.dateStr)}
                              className="flex-1 py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="truncate">{isBn ? 'শিডিউল এডিট' : 'Assign / Edit'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: FUTURE BOOKINGS VIEW (WITH ALL DETAILS & BENGALI CALENDAR DATES) */}
              {activeTab === 'future' && (
                <div className="space-y-6">
                  
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
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 active:scale-95 transition-all self-start md:self-auto"
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

                        return (
                          <div 
                            key={booking.id}
                            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              
                              {/* Left: Date with Dual Calendar (English & Bengali) */}
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
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
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                      diffDays <= 1 
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                                    }`}>
                                      {relativeDayLabel}
                                    </span>
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
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                                  booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                  booking.status === 'Advance Paid' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                  booking.status === 'New' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                  booking.status === 'Completed' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                  'bg-rose-100 text-rose-800 border-rose-300'
                                }`}>
                                  ● {booking.status}
                                </span>

                                <button
                                  onClick={() => handleOpenInvoiceForBooking(booking)}
                                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                                  title="গ্রাহকের ইনভয়েস বিল তৈরি করুন ও হোয়াটসঅ্যাপে পাঠান"
                                >
                                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="hidden sm:inline">{isBn ? 'ইনভয়েস বিল' : 'Invoice'}</span>
                                </button>

                                <button
                                  onClick={() => handleCopyBookingDetails(booking)}
                                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                                    copiedId === booking.id
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                  title="WhatsApp Trip Sheet কপি করুন"
                                >
                                  {copiedId === booking.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span className="hidden sm:inline">{copiedId === booking.id ? 'কপি হয়েছে' : 'Trip Sheet'}</span>
                                </button>

                                <button
                                  onClick={() => setEditingBooking(booking)}
                                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                                  title="Edit Booking"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteBooking(booking.id)}
                                  className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors"
                                  title="Delete Booking"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

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

                  {/* Password Management */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Key className="w-5 h-5 text-indigo-600" />
                          <span>{isBn ? 'অ্যাডমিন পাসওয়ার্ড পরিবর্তন' : 'Change Admin Password'}</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          {isBn ? 'আপনার লগইন সিকিউরিটি পাসওয়ার্ড আপডেট করুন' : 'Update the secure login password for this admin panel'}
                        </p>
                      </div>

                      {!isChangingPass && (
                        <button
                          onClick={() => {
                            setIsChangingPass(true);
                            setChangePassStatus(null);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors"
                        >
                          {isBn ? 'পাসওয়ার্ড বদলান' : 'Change'}
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
                          <input
                            type="password"
                            value={oldPassInput}
                            onChange={(e) => setOldPassInput(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-600 outline-none"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              {isBn ? 'নতুন পাসওয়ার্ড:' : 'New Password:'}
                            </label>
                            <input
                              type="password"
                              value={newPassInput}
                              onChange={(e) => setNewPassInput(e.target.value)}
                              placeholder="Min 4 characters"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-600 outline-none"
                              required
                            />
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

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                          >
                            {isBn ? 'পাসওয়ার্ড সেভ করুন' : 'Save New Password'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsChangingPass(false);
                              setChangePassStatus(null);
                            }}
                            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                          >
                            {isBn ? 'বাতিল' : 'Cancel'}
                          </button>
                        </div>
                      </form>
                    )}
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
                        className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
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
                    {isBn ? selectedCarForSchedule.nameBn : selectedCarForSchedule.name}
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

              {/* Driver Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'ড্রাইভারের নাম:' : 'Driver Name:'}</label>
                  <input
                    type="text"
                    value={scheduleFormData.driverName}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, driverName: e.target.value })}
                    placeholder="Driver Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'ড্রাইভারের ফোন:' : 'Driver Phone:'}</label>
                  <input
                    type="tel"
                    value={scheduleFormData.driverPhone}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, driverPhone: e.target.value })}
                    placeholder="Driver Mobile"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 outline-none"
                  />
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
                    value={newBooking.name}
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
                    value={newBooking.phone}
                    onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  />
                </div>
              </div>

              {/* Date Selection with Bengali Calendar Live Preview */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isBn ? 'যাত্রার তারিখ (Date of Journey) *' : 'Journey Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={newBooking.date}
                  onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:border-purple-600 outline-none"
                />
                {newBooking.date && (
                  <div className="mt-1.5 p-2 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="text-[11px] text-purple-950 font-black">
                      বাংলা ক্যালেন্ডার: {formatFullBengaliDate(newBooking.date)}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গাড়ির মডেল:' : 'Vehicle:'}</label>
                  <select
                    value={newBooking.car}
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
                    value={newBooking.tripType}
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
                    value={newBooking.pickup}
                    onChange={(e) => setNewBooking({ ...newBooking, pickup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গন্তব্য:' : 'Destination:'}</label>
                  <input
                    type="text"
                    value={newBooking.destination}
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
                    value={newBooking.fareEstimate}
                    onChange={(e) => setNewBooking({ ...newBooking, fareEstimate: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'অগ্রিম জমা (₹):' : 'Advance Received (₹):'}</label>
                  <input
                    type="text"
                    value={newBooking.advanceAmount}
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
                    value={editingBooking.name}
                    onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'মোবাইল নম্বর:' : 'Phone Number:'}</label>
                  <input
                    type="tel"
                    required
                    value={editingBooking.phone}
                    onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'বুকিং স্ট্যাটাস:' : 'Status:'}</label>
                  <select
                    value={editingBooking.status}
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
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'তারিখ:' : 'Date:'}</label>
                  <input
                    type="date"
                    required
                    value={editingBooking.date}
                    onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                  {editingBooking.date && (
                    <div className="mt-1.5 p-1.5 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="text-[10px] text-blue-950 font-bold">
                        বাংলা ক্যালেন্ডার: {formatFullBengaliDate(editingBooking.date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গাড়ির মডেল:' : 'Vehicle:'}</label>
                  <input
                    type="text"
                    value={editingBooking.car}
                    onChange={(e) => setEditingBooking({ ...editingBooking, car: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গন্তব্য:' : 'Destination:'}</label>
                  <input
                    type="text"
                    value={editingBooking.destination}
                    onChange={(e) => setEditingBooking({ ...editingBooking, destination: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isBn ? 'আনুমানিক ভাড়া (₹):' : 'Estimated Fare (₹):'}</label>
                  <input
                    type="text"
                    value={editingBooking.fareEstimate || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, fareEstimate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
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

    </div>
  );
};
