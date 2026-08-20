import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, UserPlus, Phone, MapPin, Calendar, Car, Search, Filter, 
  Plus, Edit3, Trash2, CheckCircle2, MessageSquare, Send, Upload, 
  Image as ImageIcon, Sparkles, ExternalLink, ChevronRight, X, 
  Copy, Check, DollarSign, Clock, Tag, ShieldCheck, RefreshCw, FileText,
  AlertCircle, ChevronDown, Award, Briefcase, Heart, Star
} from 'lucide-react';
import { CRMCustomerProfile, CustomerVisitRecord, Language, BookingLead } from '../types';
import { 
  syncSaveCustomer, 
  syncUpdateCustomer, 
  syncDeleteCustomer, 
  syncAddCustomerVisit 
} from '../utils/syncService';
import { toBengaliNumber } from '../utils/bengaliCalendar';

interface CRMManagerProps {
  customers: CRMCustomerProfile[];
  bookings?: BookingLead[];
  lang: Language;
  onRefresh?: () => void;
}

export const CRMManager: React.FC<CRMManagerProps> = ({
  customers,
  bookings = [],
  lang,
  onRefresh
}) => {
  const isBn = lang === 'bn';

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected customer for detail view / editing
  const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomerProfile | null>(null);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);

  // Broadcast & Message Sender inside CRM
  const [isBroadcastPanelOpen, setIsBroadcastPanelOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'selected'>('all');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState(
    'নমস্কার! চলো যাই ট্যুর এন্ড ট্রাভেলসের পক্ষ থেকে আপনাকে জানাই আন্তরিক শুভেচ্ছা। দিঘা, পুরী, দার্জিলিং ও ভারতের যেকোনো স্থানে ভ্রমণের জন্য আমাদের এসি গাড়ি বুকিং চলছে। ২৪x৭ হেল্পলাইন: ৯১৫৩৩০২৫১৭'
  );
  const [broadcastPictureUrl, setBroadcastPictureUrl] = useState(
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85'
  );
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [sentCustomerIds, setSentCustomerIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State for Adding / Editing Customer
  const [formData, setFormData] = useState<Partial<CRMCustomerProfile>>({
    name: '',
    phone: '',
    alternatePhone: '',
    address: '',
    email: '',
    category: 'Regular',
    notes: '',
    preferredCar: 'Maruti Ertiga'
  });

  // Form State for Adding Visit History
  const [visitFormData, setVisitFormData] = useState<Partial<CustomerVisitRecord>>({
    date: new Date().toISOString().split('T')[0],
    pickup: 'Kolkata',
    destination: 'Digha',
    car: 'Maruti Ertiga',
    tripType: 'Round Trip',
    fare: 4500,
    advanceAmount: 1000,
    status: 'Completed',
    notes: ''
  });

  // Preset templates for CRM Message Sender
  const messagePresets = [
    {
      title: isBn ? '🎉 উৎসবের শুভেচ্ছা' : '🎉 Festival Greeting',
      msg: isBn 
        ? 'নমস্কার! চলো যাই ট্যুর এন্ড ট্রাভেলস-এর পক্ষ থেকে আপনাকে ও আপনার পরিবারকে জানাই উৎসবের আন্তরিক প্রীতি ও শুভেচ্ছা। যেকোনো ভ্রমণের জন্য আমাদের প্রিমিয়াম এসি গাড়ি প্রস্তুত। ২৪x৭ হেল্পলাইন: ৯১৫৩৩০২৫১৭'
        : 'Greetings from Cholo Jai Tour & Travels! Wishing you and your family a wonderful festive season. Clean & comfortable AC cars available 24x7. Helpline: 9153302517',
      img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85'
    },
    {
      title: isBn ? '🏖️ দিঘা ও পুরী অফার' : '🏖️ Digha & Puri Offer',
      msg: isBn
        ? 'চলো যাই ট্যুর স্পেশাল! দিঘা, পুরী, মন্দারমণি ও দার্জিলিং ট্যুরের জন্য বিশেষ ছাড় চলছে। অভিজ্ঞ ড্রাইভার সহ এসি গাড়ি বুকিং করতে সরাসরি কল করুন: ৯১৫৩৩০২৫১৭'
        : 'Special Holiday Offer from Cholo Jai! Book comfortable AC rides for Digha, Puri & Darjeeling at best rates. Call 9153302517',
      img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85'
    },
    {
      title: isBn ? '🚗 বিয়ের লাক্সারি গাড়ি' : '🚗 Wedding & Event Car',
      msg: isBn
        ? 'বিবাহ বা বিশেষ পারিবারিক অনুষ্ঠানের জন্য সুসজ্জিত লাক্সারি এসি গাড়ি বুকিং চলছে। নিশ্চিন্ত ও নিরাপদ যাত্রার জন্য যোগাযোগ করুন: ৯১৫৩৩০২৫১৭'
        : 'Decorated luxury AC cars available for Weddings & Family Events. Punctual service with experienced drivers. Call 9153302517',
      img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85'
    }
  ];

  // Helper to sync from bookings if CRM is empty
  const handleAutoImportFromBookings = async () => {
    if (!bookings || bookings.length === 0) return;
    
    // Group by phone
    const phoneMap = new Map<string, CRMCustomerProfile>();

    // First load existing
    customers.forEach(c => {
      const clean = c.phone.replace(/\D/g, '').slice(-10);
      if (clean) phoneMap.set(clean, c);
    });

    for (const b of bookings) {
      const rawPhone = b.phone;
      const cleanPhone = rawPhone?.replace(/\D/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length < 10) continue;

      const visit: CustomerVisitRecord = {
        tripId: b.id,
        date: b.date || new Date().toISOString().split('T')[0],
        pickup: b.pickup || 'Kolkata',
        destination: b.destination || 'Outstation',
        car: b.car || 'Ertiga',
        tripType: b.tripType || 'Round Trip',
        fare: b.fareEstimate ? parseFloat(b.fareEstimate) : 0,
        advanceAmount: b.advanceAmount ? parseFloat(b.advanceAmount) : 0,
        status: b.status === 'Completed' ? 'Completed' : b.status === 'Cancelled' ? 'Cancelled' : 'Confirmed',
        notes: b.notes || ''
      };

      if (phoneMap.has(cleanPhone)) {
        const existing = phoneMap.get(cleanPhone)!;
        const history = existing.visitHistory || [];
        const exists = history.some(v => v.tripId === b.id);
        if (!exists) {
          existing.visitHistory = [visit, ...history];
          existing.totalTrips = (existing.totalTrips || 0) + 1;
          existing.totalSpent = (existing.totalSpent || 0) + (visit.fare || 0);
          existing.lastTripDate = visit.date;
          existing.lastDestination = visit.destination;
          phoneMap.set(cleanPhone, existing);
          await syncSaveCustomer(existing);
        }
      } else {
        const newCust: CRMCustomerProfile = {
          id: `crm-${cleanPhone}`,
          name: b.name || `Customer ${cleanPhone.slice(-4)}`,
          phone: cleanPhone,
          category: 'Regular',
          totalTrips: 1,
          totalSpent: visit.fare || 0,
          lastTripDate: visit.date,
          lastDestination: visit.destination,
          preferredCar: visit.car,
          visitHistory: [visit],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        phoneMap.set(cleanPhone, newCust);
        await syncSaveCustomer(newCust);
      }
    }

    if (onRefresh) onRefresh();
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const q = searchTerm.toLowerCase().trim();
    return customers.filter(c => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.lastDestination && c.lastDestination.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [customers, searchTerm]);

  // Selected customers for broadcast
  const broadcastRecipients = useMemo(() => {
    if (broadcastTarget === 'all') {
      return customers;
    } else {
      return customers.filter(c => selectedCustomerIds.includes(c.id));
    }
  }, [customers, broadcastTarget, selectedCustomerIds]);

  // Handle Add Customer Submit
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const cleanPhone = formData.phone.replace(/\D/g, '').slice(-10);
    const newCustomer: CRMCustomerProfile = {
      id: `crm-${cleanPhone}-${Date.now()}`,
      name: formData.name.trim(),
      phone: cleanPhone,
      alternatePhone: formData.alternatePhone?.trim() || '',
      address: formData.address?.trim() || '',
      email: formData.email?.trim() || '',
      category: formData.category || 'Regular',
      notes: formData.notes?.trim() || '',
      preferredCar: formData.preferredCar || 'Maruti Ertiga',
      totalTrips: 0,
      totalSpent: 0,
      lastTripDate: new Date().toISOString().split('T')[0],
      visitHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await syncSaveCustomer(newCustomer);
    setIsAddCustomerModalOpen(false);
    setFormData({ name: '', phone: '', alternatePhone: '', address: '', email: '', category: 'Regular', notes: '' });
  };

  // Handle Edit Customer Submit
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !formData.name || !formData.phone) return;

    const cleanPhone = formData.phone.replace(/\D/g, '').slice(-10);
    const updated: CRMCustomerProfile = {
      ...selectedCustomer,
      name: formData.name.trim(),
      phone: cleanPhone,
      alternatePhone: formData.alternatePhone?.trim() || '',
      address: formData.address?.trim() || '',
      email: formData.email?.trim() || '',
      category: formData.category || 'Regular',
      notes: formData.notes?.trim() || '',
      preferredCar: formData.preferredCar || selectedCustomer.preferredCar || 'Maruti Ertiga',
      updatedAt: new Date().toISOString()
    };

    await syncUpdateCustomer(updated);
    setSelectedCustomer(updated);
    setIsEditCustomerModalOpen(false);
  };

  // Handle Delete Customer
  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm(isBn ? 'আপনি কি এই কাস্টমার রেকর্ড মুছে ফেলতে চান?' : 'Are you sure you want to delete this customer profile?')) {
      await syncDeleteCustomer(id);
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
    }
  };

  // Handle Add Visit History Submit
  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const visit: CustomerVisitRecord = {
      tripId: `trip-${Date.now()}`,
      date: visitFormData.date || new Date().toISOString().split('T')[0],
      pickup: visitFormData.pickup || 'Kolkata',
      destination: visitFormData.destination || 'Outstation',
      car: visitFormData.car || 'Maruti Ertiga',
      tripType: visitFormData.tripType || 'Round Trip',
      fare: Number(visitFormData.fare) || 0,
      advanceAmount: Number(visitFormData.advanceAmount) || 0,
      status: visitFormData.status || 'Completed',
      notes: visitFormData.notes?.trim() || ''
    };

    await syncAddCustomerVisit(selectedCustomer.id, visit);
    
    // Update local state for immediate feedback
    const updatedHistory = [visit, ...(selectedCustomer.visitHistory || [])];
    const updatedCust: CRMCustomerProfile = {
      ...selectedCustomer,
      totalTrips: (selectedCustomer.totalTrips || 0) + 1,
      totalSpent: (selectedCustomer.totalSpent || 0) + (visit.fare || 0),
      lastTripDate: visit.date,
      lastDestination: visit.destination,
      preferredCar: visit.car,
      visitHistory: updatedHistory,
      updatedAt: new Date().toISOString()
    };
    setSelectedCustomer(updatedCust);
    setIsAddVisitModalOpen(false);
    setVisitFormData({
      date: new Date().toISOString().split('T')[0],
      pickup: 'Kolkata',
      destination: 'Digha',
      car: 'Maruti Ertiga',
      tripType: 'Round Trip',
      fare: 4500,
      advanceAmount: 1000,
      status: 'Completed',
      notes: ''
    });
  };

  // Handle Image Upload for Message Sender
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setBroadcastPictureUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Send WhatsApp to a customer
  const handleSendWhatsApp = (customer: CRMCustomerProfile, customMsg?: string, customImg?: string) => {
    const targetPhone = customer.phone.replace(/\D/g, '').slice(-10);
    const textToSend = customMsg || broadcastMessage;
    const imgToSend = customImg || broadcastPictureUrl;
    
    let fullText = `${textToSend}`;
    if (imgToSend && !imgToSend.startsWith('data:')) {
      fullText += `\n\n🖼️ View Image/Offer: ${imgToSend}`;
    }
    
    const waUrl = `https://wa.me/91${targetPhone}?text=${encodeURIComponent(fullText)}`;
    window.open(waUrl, '_blank');

    if (!sentCustomerIds.includes(customer.id)) {
      setSentCustomerIds(prev => [...prev, customer.id]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CRM ACTION BAR: SEARCH, STATS & INTEGRATED BROADCAST TOGGLE */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>{isBn ? 'কাস্টমার রিলেশনশিপ ও ভিজিট হিস্ট্রি (CRM)' : 'Customer CRM & Trip History'}</span>
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200">
                {isBn ? `${toBengaliNumber(customers.length)} জন কাস্টমার` : `${customers.length} Customers`}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isBn ? 'ক্লাউড ফায়ারস্টোরে সংরক্ষিত কাস্টমার ডেটা, ট্রিপ রেকর্ড এবং হোয়াটসঅ্যাপ মেসেজ ব্রডকাস্টার' : 'Manage customer contacts, visit/trip history in Firestore, and send WhatsApp messages & pictures'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Integrated Message & Picture Sender under CRM */}
            <button
              onClick={() => setIsBroadcastPanelOpen(!isBroadcastPanelOpen)}
              className={`py-2 px-3.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isBroadcastPanelOpen 
                  ? 'bg-purple-700 text-white shadow-purple-500/20 ring-2 ring-purple-400' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/20'
              }`}
            >
              <Send className="w-4 h-4 text-white" />
              <span>{isBn ? 'ছবি ও মেসেজ ব্রডকাস্টার' : 'Send Message & Picture'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                {customers.length}
              </span>
            </button>

            {/* Add New Customer */}
            <button
              onClick={() => {
                setFormData({ name: '', phone: '', alternatePhone: '', address: '', email: '', category: 'Regular', notes: '' });
                setIsAddCustomerModalOpen(true);
              }}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isBn ? 'নতুন কাস্টমার যোগ' : 'Add Customer'}</span>
            </button>

            {/* Sync / Import from bookings button if CRM is new */}
            {customers.length === 0 && bookings.length > 0 && (
              <button
                onClick={handleAutoImportFromBookings}
                className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 border border-blue-200 transition-all cursor-pointer"
                title={isBn ? 'পুরোনো বুকিং থেকে কাস্টমার লিস্ট তৈরি করুন' : 'Generate CRM from Bookings'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isBn ? 'বুকিং থেকে সিঙ্ক' : 'Import from Bookings'}</span>
              </button>
            )}
          </div>
        </div>

        {/* INTEGRATED CUSTOMER MESSAGE & PICTURE SENDER PANEL (Directly under CRM) */}
        {isBroadcastPanelOpen && (
          <div className="bg-gradient-to-br from-purple-50 via-indigo-50/50 to-blue-50 rounded-2xl p-4 sm:p-5 border border-purple-200/80 shadow-inner space-y-4">
            
            <div className="flex items-center justify-between gap-2 border-b border-purple-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-black text-purple-950">
                    {isBn ? 'কাস্টমার মেসেজ ও ছবি ব্রডকাস্টার (CRM WhatsApp Sender)' : 'CRM Customer WhatsApp Message & Picture Sender'}
                  </h5>
                  <p className="text-[11px] text-purple-700 font-medium">
                    {isBn 
                      ? 'যেকোনো উৎসব বা ট্যুর অফারের ছবি ও শুভেচ্ছা বার্তা কাস্টমারদের হোয়াটসঅ্যাপে সরাসরি পাঠান' 
                      : 'Send promotional offers, festive greetings, and high-res picture cards to your CRM customer base'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBroadcastPanelOpen(false)}
                className="p-1 rounded-lg text-purple-500 hover:text-purple-800 hover:bg-purple-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-purple-900">
                {isBn ? '⚡ এক ক্লিকে টেমপ্লেট নির্বাচন:' : '⚡ Quick Templates:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {messagePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setBroadcastMessage(preset.msg);
                      setBroadcastPictureUrl(preset.img);
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-100/60 text-left border border-purple-100 hover:border-purple-300 transition-all shadow-2xs group cursor-pointer"
                  >
                    <div className="font-extrabold text-xs text-purple-950 flex items-center justify-between">
                      <span>{preset.title}</span>
                      <Sparkles className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience & Compose */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Message Composer */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'মেসেজ টেক্সট:' : 'Message Text:'}
                  </label>
                  <textarea
                    rows={4}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed"
                    placeholder={isBn ? 'কাস্টমারদের জন্য মেসেজ লিখুন...' : 'Write message for customers...'}
                  />
                </div>

                {/* Picture Attachment Options */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'ছবির লিংক অথবা ছবি আপলোড করুন:' : 'Picture URL or Local File Upload:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={broadcastPictureUrl}
                      onChange={(e) => setBroadcastPictureUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-purple-600"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5 text-purple-600" />
                      <span>{uploadedImageName ? 'ছবি পরিবর্তন' : 'আপলোড'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Target & Image Live Preview */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'প্রাপক নির্বাচন (Target Audience):' : 'Target Audience:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBroadcastTarget('all')}
                      className={`p-2 rounded-xl text-xs font-extrabold text-center border transition-all cursor-pointer ${
                        broadcastTarget === 'all'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isBn ? `সকল কাস্টমার (${customers.length})` : `All (${customers.length})`}
                    </button>

                    <button
                      type="button"
                      onClick={() => setBroadcastTarget('selected')}
                      className={`p-2 rounded-xl text-xs font-extrabold text-center border transition-all cursor-pointer ${
                        broadcastTarget === 'selected'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isBn ? `নির্বাচিত (${selectedCustomerIds.length})` : `Selected (${selectedCustomerIds.length})`}
                    </button>
                  </div>
                </div>

                {/* Picture Preview */}
                {broadcastPictureUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-purple-200 bg-black/5 h-28 flex items-center justify-center">
                    <img 
                      src={broadcastPictureUrl} 
                      alt="Broadcast Preview" 
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute bottom-1 right-2 bg-slate-950/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {isBn ? 'ছবি প্রিভিউ' : 'Picture Card Preview'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick WhatsApp Dispatch List */}
            <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {isBn 
                    ? `মোট প্রাপক: ${broadcastRecipients.length} জন কাস্টমার প্রস্তুত` 
                    : `Ready to dispatch to ${broadcastRecipients.length} customer(s)`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {broadcastRecipients.slice(0, 3).map(rec => (
                  <button
                    key={rec.id}
                    onClick={() => handleSendWhatsApp(rec)}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    title={`Send to ${rec.name}`}
                  >
                    <Send className="w-3 h-3 text-white" />
                    <span>{rec.name.split(' ')[0]}</span>
                    {sentCustomerIds.includes(rec.id) && <Check className="w-3 h-3 text-amber-300" />}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* SEARCH BAR */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isBn ? 'নাম, ফোন নম্বর বা গন্তব্য দিয়ে কাস্টমার খুঁজুন...' : 'Search customer by name, phone, city, address...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:border-blue-600 focus:bg-white outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* CUSTOMER DIRECTORY & DETAIL SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT / MAIN: CUSTOMER DIRECTORY LIST */}
        <div className={`${selectedCustomer ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12'} space-y-3`}>
          
          <div className="flex items-center justify-between text-xs font-black text-slate-500 px-1">
            <span>
              {isBn ? `কাস্টমার তালিকা (${filteredCustomers.length} জন)` : `Customer Directory (${filteredCustomers.length})`}
            </span>
            {isBroadcastPanelOpen && (
              <button
                onClick={() => {
                  if (selectedCustomerIds.length === filteredCustomers.length) {
                    setSelectedCustomerIds([]);
                  } else {
                    setSelectedCustomerIds(filteredCustomers.map(c => c.id));
                  }
                }}
                className="text-purple-700 hover:underline cursor-pointer font-bold"
              >
                {selectedCustomerIds.length === filteredCustomers.length 
                  ? (isBn ? 'সবগুলো আনচেক' : 'Deselect All') 
                  : (isBn ? 'সবগুলো চেক করুন' : 'Select All')}
              </button>
            )}
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">
                {isBn ? 'কোনো কাস্টমার রেকর্ড পাওয়া যায়নি' : 'No customer records found'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isBn 
                  ? 'নতুন কাস্টমার যোগ করতে উপরের "নতুন কাস্টমার যোগ" বাটনে ক্লিক করুন অথবা বুকিং থেকে সিঙ্ক করুন।' 
                  : 'Click "Add Customer" above or import existing passenger records from bookings.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                const isCheckedForBroadcast = selectedCustomerIds.includes(cust.id);
                const tripsCount = cust.totalTrips || cust.visitHistory?.length || 0;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className={`bg-white p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected 
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      
                      <div className="flex items-start gap-3 min-w-0">
                        
                        {/* Broadcast Checkbox (if broadcast open) or Category Avatar */}
                        {isBroadcastPanelOpen ? (
                          <input
                            type="checkbox"
                            checked={isCheckedForBroadcast}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (isCheckedForBroadcast) {
                                setSelectedCustomerIds(prev => prev.filter(id => id !== cust.id));
                              } else {
                                setSelectedCustomerIds(prev => [...prev, cust.id]);
                              }
                            }}
                            className="w-4 h-4 rounded-md text-purple-600 focus:ring-purple-500 mt-1 cursor-pointer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 bg-blue-100 text-blue-800 border border-blue-200">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-sm sm:text-base font-black text-slate-900 truncate">
                              {cust.name}
                            </h5>
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 flex-wrap">
                            <span className="font-bold text-blue-700 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {cust.phone}
                            </span>
                            
                            {cust.lastDestination && (
                              <span className="text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {cust.lastDestination}
                              </span>
                            )}

                            <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-md text-[11px]">
                              {isBn ? `${toBengaliNumber(tripsCount)} টি ট্রিপ` : `${tripsCount} trips`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Send WhatsApp & Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendWhatsApp(cust);
                          }}
                          className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-emerald-200 shadow-2xs"
                          title={isBn ? 'হোয়াটসঅ্যাপ মেসেজ পাঠান' : 'Send WhatsApp'}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-blue-600' : 'group-hover:translate-x-0.5'}`} />
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT / DETAIL PANEL: CUSTOMER PROFILE & VISIT / TRIP HISTORY */}
        {selectedCustomer && (
          <div className="lg:col-span-6 xl:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
            
            {/* Header with Customer Summary & Quick Call/WhatsApp */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg sm:text-xl font-black text-slate-900">
                    {selectedCustomer.name}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {isBn ? `${toBengaliNumber(selectedCustomer.visitHistory?.length || selectedCustomer.totalTrips || 0)} টি ট্রিপ সম্পন্ন` : `${selectedCustomer.visitHistory?.length || selectedCustomer.totalTrips || 0} Trips Logged`}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
                  <a 
                    href={`tel:+91${selectedCustomer.phone}`}
                    className="font-extrabold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    +91 {selectedCustomer.phone}
                  </a>

                  {selectedCustomer.alternatePhone && (
                    <span className="text-slate-500">
                      Alt: +91 {selectedCustomer.alternatePhone}
                    </span>
                  )}

                  {selectedCustomer.address && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedCustomer.address}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendWhatsApp(selectedCustomer)}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                  title="WhatsApp Message"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    setFormData({
                      name: selectedCustomer.name,
                      phone: selectedCustomer.phone,
                      alternatePhone: selectedCustomer.alternatePhone || '',
                      address: selectedCustomer.address || '',
                      email: selectedCustomer.email || '',
                      category: selectedCustomer.category || 'Regular',
                      notes: selectedCustomer.notes || '',
                      preferredCar: selectedCustomer.preferredCar || 'Maruti Ertiga'
                    });
                    setIsEditCustomerModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  title={isBn ? 'এডিট করুন' : 'Edit Customer'}
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                  title={isBn ? 'মুছে ফেলুন' : 'Delete Customer'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Details Info Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {isBn ? 'মোট ট্রিপ সংখ্যা' : 'Total Trips'}
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-700 mt-1 truncate">
                  {isBn ? `${toBengaliNumber(selectedCustomer.visitHistory?.length || selectedCustomer.totalTrips || 0)} টি ট্রিপ` : `${selectedCustomer.visitHistory?.length || selectedCustomer.totalTrips || 0} Trips`}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {isBn ? 'পছন্দের গাড়ি' : 'Preferred Car'}
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-800 mt-1 truncate">
                  {selectedCustomer.preferredCar || 'Maruti Ertiga'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {isBn ? 'সাম্প্রতিক গন্তব্য' : 'Last Destination'}
                </div>
                <div className="text-xs sm:text-sm font-black text-blue-700 mt-1 truncate">
                  {selectedCustomer.lastDestination || (isBn ? 'রেকর্ড নেই' : 'N/A')}
                </div>
              </div>
            </div>

            {/* Notes Section if available */}
            {selectedCustomer.notes && (
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 text-xs text-amber-900 font-medium">
                <span className="font-bold text-amber-950 block mb-0.5">{isBn ? '📝 নোট:' : '📝 Notes:'}</span>
                {selectedCustomer.notes}
              </div>
            )}

            {/* VISIT / TRIP HISTORY TIMELINE */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{isBn ? 'ভিজিট ও ট্রিপ হিস্ট্রি (Firestore Log)' : 'Visit & Trip History (Firestore Log)'}</span>
                </h5>

                <button
                  onClick={() => setIsAddVisitModalOpen(true)}
                  className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'নতুন ট্রিপ রেকর্ড যোগ' : 'Add Trip Record'}</span>
                </button>
              </div>

              {(!selectedCustomer.visitHistory || selectedCustomer.visitHistory.length === 0) ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/80 text-center text-xs text-slate-500 font-medium">
                  {isBn ? 'এই কাস্টমারের কোনো ভিজিট হিস্ট্রি এখনও রেকর্ড করা হয়নি।' : 'No trip records logged for this customer yet.'}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {selectedCustomer.visitHistory.map((visit, vIdx) => (
                    <div 
                      key={vIdx} 
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-2xs transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="font-black text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{visit.date}</span>
                          <span className="text-[10px] text-slate-500 font-bold px-1.5 py-0.5 bg-slate-200/70 rounded">
                            {visit.tripType || 'Trip'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            visit.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            visit.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {visit.status}
                          </span>
                          
                          {visit.fare ? (
                            <span className="font-black text-emerald-700">
                              ₹{visit.fare.toLocaleString('en-IN')}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 flex items-center gap-1.5 font-bold flex-wrap">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>{visit.pickup}</span>
                        <span className="text-slate-400">➔</span>
                        <span className="text-blue-700">{visit.destination}</span>
                        <span className="text-slate-400 font-normal">|</span>
                        <Car className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="text-slate-600 font-medium">{visit.car}</span>
                      </div>

                      {visit.notes && (
                        <p className="text-[11px] text-slate-500 bg-white p-1.5 rounded-lg border border-slate-100 italic">
                          "{visit.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* MODAL 1: ADD NEW CUSTOMER */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <h4 className="font-black text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <span>{isBn ? 'নতুন কাস্টমার প্রোফাইল যোগ করুন' : 'Add New Customer Profile'}</span>
              </h4>
              <button 
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isBn ? 'কাস্টমারের নাম *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isBn ? 'উদা: সুমন ব্যানার্জী' : 'e.g. Suman Banerjee'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9153302517"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'বিকল্প ফোন' : 'Alt Phone'}
                  </label>
                  <input
                    type="tel"
                    value={formData.alternatePhone || ''}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    placeholder="7001416035"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'ইমেল (ঐচ্ছিক)' : 'Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'পছন্দের গাড়ি' : 'Preferred Car'}
                  </label>
                  <input
                    type="text"
                    value={formData.preferredCar || ''}
                    onChange={(e) => setFormData({ ...formData, preferredCar: e.target.value })}
                    placeholder="Maruti Ertiga / Scorpio"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isBn ? 'ঠিকানা / এলাকা' : 'Address / City'}
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={isBn ? 'কলকাতা, পশ্চিমবঙ্গ' : 'Kolkata, WB'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isBn ? 'বিশেষ নোট / পছন্দ' : 'Special Notes / Preferences'}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={isBn ? 'নোট লিখুন...' : 'Notes...'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  {isBn ? 'সংরক্ষণ করুন' : 'Save to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CUSTOMER */}
      {isEditCustomerModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="font-black text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <span>{isBn ? 'কাস্টমার প্রোফাইল এডিট' : 'Edit Customer Profile'}</span>
              </h4>
              <button 
                onClick={() => setIsEditCustomerModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isBn ? 'কাস্টমারের নাম *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'বিকল্প ফোন' : 'Alt Phone'}
                  </label>
                  <input
                    type="tel"
                    value={formData.alternatePhone || ''}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'ইমেল (ঐচ্ছিক)' : 'Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'পছন্দের গাড়ি' : 'Preferred Car'}
                  </label>
                  <input
                    type="text"
                    value={formData.preferredCar || ''}
                    onChange={(e) => setFormData({ ...formData, preferredCar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isBn ? 'ঠিকানা / এলাকা' : 'Address / City'}
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isBn ? 'বিশেষ নোট / পছন্দ' : 'Special Notes'}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  {isBn ? 'আপডেট করুন' : 'Update in Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD VISIT / TRIP RECORD */}
      {isAddVisitModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <h4 className="font-black text-base flex items-center gap-2">
                <Car className="w-5 h-5" />
                <span>{isBn ? 'নতুন ট্রিপ / ভিজিট রেকর্ড যোগ করুন' : 'Log New Trip / Visit'}</span>
              </h4>
              <button 
                onClick={() => setIsAddVisitModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="p-5 space-y-3.5">
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80 text-xs font-bold text-emerald-950 flex items-center justify-between">
                <span>{isBn ? 'কাস্টমার:' : 'Customer:'} {selectedCustomer.name}</span>
                <span className="text-emerald-700">{selectedCustomer.phone}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'যাত্রার তারিখ *' : 'Trip Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={visitFormData.date || ''}
                    onChange={(e) => setVisitFormData({ ...visitFormData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'গাড়ির নাম' : 'Vehicle'}
                  </label>
                  <input
                    type="text"
                    value={visitFormData.car || ''}
                    onChange={(e) => setVisitFormData({ ...visitFormData, car: e.target.value })}
                    placeholder="Maruti Ertiga"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'পিকআপ স্থান' : 'Pickup'}
                  </label>
                  <input
                    type="text"
                    required
                    value={visitFormData.pickup || ''}
                    onChange={(e) => setVisitFormData({ ...visitFormData, pickup: e.target.value })}
                    placeholder="Kolkata / Airport"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'গন্তব্য স্থান' : 'Destination'}
                  </label>
                  <input
                    type="text"
                    required
                    value={visitFormData.destination || ''}
                    onChange={(e) => setVisitFormData({ ...visitFormData, destination: e.target.value })}
                    placeholder="Digha / Mandarmani"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'মোট ভাড়া (₹)' : 'Total Fare (₹)'}
                  </label>
                  <input
                    type="number"
                    value={visitFormData.fare !== undefined && visitFormData.fare !== null ? visitFormData.fare : ''}
                    onChange={(e) => setVisitFormData({ ...visitFormData, fare: Number(e.target.value) })}
                    placeholder="4500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isBn ? 'স্ট্যাটাস' : 'Status'}
                  </label>
                  <select
                    value={visitFormData.status || 'Completed'}
                    onChange={(e) => setVisitFormData({ ...visitFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Advance Paid">Advance Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isBn ? 'ট্রিপ নোট' : 'Trip Notes'}
                </label>
                <input
                  type="text"
                  value={visitFormData.notes || ''}
                  onChange={(e) => setVisitFormData({ ...visitFormData, notes: e.target.value })}
                  placeholder={isBn ? 'উদা: ২ দিন দিঘা ট্যুর' : 'e.g. 2 Days Digha Tour'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVisitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  {isBn ? 'হিস্ট্রি সেভ করুন' : 'Log Visit to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
