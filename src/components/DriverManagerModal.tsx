import React, { useState } from 'react';
import { 
  X, Car, Phone, MessageSquare, Plus, Trash2, Edit3, 
  Search, Shield, CheckCircle2, User, UserPlus, PhoneCall,
  Clock, Check, MapPin, AlertCircle
} from 'lucide-react';
import { DriverProfile, Language } from '../types';
import { syncSaveDriver, syncDeleteDriver } from '../utils/syncService';
import { FLEET_CARS } from '../data/fleetData';

interface DriverManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: DriverProfile[];
  onDriversUpdate: (drivers: DriverProfile[]) => void;
  lang: Language;
}

export const DriverManagerModal: React.FC<DriverManagerModalProps> = ({
  isOpen,
  onClose,
  drivers,
  onDriversUpdate,
  lang,
}) => {
  const isBn = lang === 'bn';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'On Trip' | 'Leave'>('All');
  
  // Add / Edit form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverProfile | null>(null);
  
  const [formData, setFormData] = useState<Partial<DriverProfile>>({
    name: '',
    phone: '',
    alternatePhone: '',
    vehicleAssigned: 'Maruti Suzuki Ertiga (7 Seater)',
    licenseNo: '',
    status: 'Available',
    address: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      alternatePhone: '',
      vehicleAssigned: 'Maruti Suzuki Ertiga (7 Seater)',
      licenseNo: '',
      status: 'Available',
      address: '',
      notes: '',
    });
    setFormError(null);
    setShowAddForm(true);
  };

  const handleOpenEdit = (driver: DriverProfile) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      alternatePhone: driver.alternatePhone || '',
      vehicleAssigned: driver.vehicleAssigned || 'Maruti Suzuki Ertiga (7 Seater)',
      licenseNo: driver.licenseNo || '',
      status: driver.status || 'Available',
      address: driver.address || '',
      notes: driver.notes || '',
    });
    setFormError(null);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setFormError(isBn ? 'ড্রাইভারের নাম প্রদান করুন।' : 'Please enter the driver name.');
      return;
    }
    if (!formData.phone?.trim() || formData.phone.trim().length < 10) {
      setFormError(isBn ? 'সঠিক ১০-সংখ্যার মোবাইল নম্বর দিন।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const now = new Date().toISOString();
    const newDriver: DriverProfile = {
      id: editingDriver?.id || `drv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      alternatePhone: formData.alternatePhone?.trim() || '',
      vehicleAssigned: formData.vehicleAssigned || '',
      licenseNo: formData.licenseNo?.trim() || '',
      status: (formData.status as any) || 'Available',
      address: formData.address?.trim() || '',
      notes: formData.notes?.trim() || '',
      createdAt: editingDriver?.createdAt || now,
      updatedAt: now,
    };

    // Save to Firestore & local state
    const success = await syncSaveDriver(newDriver);
    if (success) {
      const updated = editingDriver
        ? drivers.map((d) => (d.id === newDriver.id ? newDriver : d))
        : [newDriver, ...drivers.filter((d) => d.id !== newDriver.id)];
      onDriversUpdate(updated);
      setShowAddForm(false);
      setEditingDriver(null);
    } else {
      setFormError(isBn ? 'সংরক্ষণ করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।' : 'Failed to save driver. Please try again.');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmMsg = isBn 
      ? `আপনি কি নিশ্চিত যে "${name}" ড্রাইভার প্রোফাইল মুছে ফেলতে চান?`
      : `Are you sure you want to remove driver "${name}"?`;
    if (window.confirm(confirmMsg)) {
      await syncDeleteDriver(id);
      onDriversUpdate(drivers.filter((d) => d.id !== id));
    }
  };

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredDrivers = drivers.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (d.name && d.name.toLowerCase().includes(q)) || 
      (d.phone && d.phone.includes(q)) ||
      (d.vehicleAssigned && d.vehicleAssigned.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isBn ? 'ড্রাইভার ডিরেক্টরি ও ম্যানেজমেন্ট' : 'Drivers Directory & Management'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold">
                  {drivers.length} {isBn ? 'জন ড্রাইভার' : 'Drivers'}
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                {isBn ? 'নতুন ড্রাইভার ও ফোন নম্বর যোগ করুন এবং সরাসরি ট্রিপ পাঠান' : 'Register drivers with phone numbers for 1-click WhatsApp trip assignments'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar & Search */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'ড্রাইভারের নাম, ফোন বা গাড়ি সার্চ করুন...' : 'Search driver by name, phone or vehicle...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-blue-600 outline-none"
              >
                <option value="All">{isBn ? 'সব ড্রাইভার' : 'All Statuses'}</option>
                <option value="Available">{isBn ? '🟢 প্রস্তুত (Available)' : '🟢 Available'}</option>
                <option value="On Trip">{isBn ? '🟡 ট্রিপে আছেন (On Trip)' : '🟡 On Trip'}</option>
                <option value="Leave">{isBn ? '⚪ ছুটিতে (Leave)' : '⚪ On Leave'}</option>
              </select>

              {/* Add Driver Button */}
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isBn ? 'নতুন ড্রাইভার যোগ' : 'Add New Driver'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          
          {/* Add / Edit Driver Inline Panel */}
          {showAddForm && (
            <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-purple-50/50 rounded-2xl border-2 border-blue-200 p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 mb-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-200/80 mb-3">
                <h4 className="text-sm font-black text-blue-950 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>{editingDriver ? (isBn ? 'ড্রাইভার প্রোফাইল সম্পাদনা' : 'Edit Driver Profile') : (isBn ? 'নতুন ড্রাইভার এন্ট্রি' : 'Register New Driver')}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isBn ? 'ড্রাইভারের নাম *' : 'Driver Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ramesh Ghosh / Raju Da"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isBn ? 'হোয়াটসঅ্যাপ / মোবাইল নম্বর *' : 'WhatsApp / Mobile Number *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-xs focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isBn ? 'বিকল্প মোবাইল (ঐচ্ছিক):' : 'Alternate Phone:'}
                    </label>
                    <input
                      type="tel"
                      value={formData.alternatePhone || ''}
                      onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                      placeholder="Optional phone"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isBn ? 'বরাদ্দ / পছন্দের গাড়ি:' : 'Assigned Vehicle:'}
                    </label>
                    <select
                      value={formData.vehicleAssigned || ''}
                      onChange={(e) => setFormData({ ...formData, vehicleAssigned: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:border-blue-600 outline-none"
                    >
                      <option value="All Fleet Vehicles">{isBn ? 'সকল গাড়ি চালান' : 'All Fleet Vehicles'}</option>
                      {FLEET_CARS.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isBn ? 'বর্তমান স্ট্যাটাস:' : 'Current Status:'}
                    </label>
                    <select
                      value={formData.status || 'Available'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:border-blue-600 outline-none"
                    >
                      <option value="Available">{isBn ? '🟢 প্রস্তুত (Available)' : '🟢 Available'}</option>
                      <option value="On Trip">{isBn ? '🟡 ট্রিপে আছেন (On Trip)' : '🟡 On Trip'}</option>
                      <option value="Leave">{isBn ? '⚪ ছুটিতে (On Leave)' : '⚪ On Leave'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isBn ? 'ড্রাইভিং লাইসেন্স নং / নোট:' : 'License No / ID:'}
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNo || ''}
                      onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                      placeholder="DL No. or Aadhaar"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isBn ? 'ঠিকানা / এলাকা:' : 'Address / Base Location:'}
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Tamluk / Mechada / Ghatal"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'ড্রাইভার সংরক্ষণ করুন' : 'Save Driver')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Drivers List */}
          {filteredDrivers.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-slate-800">
                {isBn ? 'কোনো ড্রাইভার পাওয়া যায়নি' : 'No Drivers Found'}
              </h5>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isBn 
                  ? 'উপরে "নতুন ড্রাইভার যোগ" বাটনে ক্লিক করে নাম ও ফোন নম্বর দিয়ে ড্রাইভার যুক্ত করুন।' 
                  : 'Click "Add New Driver" above to register drivers with their mobile numbers.'}
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? 'প্রথম ড্রাইভার যোগ করুন' : 'Add First Driver'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDrivers.map((driver) => {
                const cleanPhone = driver.phone.replace(/\D/g, '');
                return (
                  <div
                    key={driver.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all space-y-3"
                  >
                    {/* Top Row: Name, Status & Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0">
                          {driver.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 leading-tight">
                            {driver.name}
                          </h4>
                          <span className={`inline-block text-[10px] font-extrabold px-2 py-0.2 rounded-full mt-0.5 ${
                            driver.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : driver.status === 'On Trip'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}>
                            ● {driver.status}
                          </span>
                        </div>
                      </div>

                      {/* Edit / Delete Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(driver)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Edit Driver"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id, driver.name)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Driver"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Details Info */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {/* Phone with Fast Copy & Call */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{isBn ? 'ফোন:' : 'Phone:'}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={`tel:${cleanPhone}`} 
                            className="font-bold text-blue-600 hover:underline"
                          >
                            {driver.phone}
                          </a>
                          <button
                            onClick={() => handleCopyPhone(driver.id, driver.phone)}
                            className="p-1 rounded bg-white text-slate-500 hover:text-slate-800 border border-slate-200"
                            title="Copy Phone"
                          >
                            {copiedId === driver.id ? <Check className="w-3 h-3 text-emerald-600" /> : <PhoneCall className="w-3 h-3 text-blue-600" />}
                          </button>
                        </div>
                      </div>

                      {/* Vehicle Assigned */}
                      {driver.vehicleAssigned && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Car className="w-3 h-3 text-slate-400" />
                            <span>{isBn ? 'গাড়ি:' : 'Vehicle:'}</span>
                          </span>
                          <span className="font-bold text-slate-800 truncate max-w-[180px]">
                            {driver.vehicleAssigned}
                          </span>
                        </div>
                      )}

                      {/* Address */}
                      {driver.address && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{isBn ? 'ঠিকানা:' : 'Location:'}</span>
                          </span>
                          <span className="font-medium text-slate-700 truncate max-w-[180px]">
                            {driver.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick WhatsApp Action Button */}
                    <div className="pt-1 flex gap-2">
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`নমস্কার ${driver.name} বাবু, Cholo Jai Tour & Travels থেকে যোগাযোগ করা হচ্ছে।`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>{isBn ? 'হোয়াটসঅ্যাপে মেসেজ' : 'WhatsApp Driver'}</span>
                      </a>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 border border-blue-200 transition-colors"
                        title="Call Driver"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{isBn ? 'কল' : 'Call'}</span>
                      </a>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            {isBn ? 'সমস্ত ড্রাইভারের ডেটা ক্লাউডে সুরক্ষিত সংরক্ষিত থাকে।' : 'Driver records are synced in real-time with Firestore database.'}
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
