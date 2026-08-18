import React from 'react';
import { Phone, MessageSquare, Car, MapPin, Globe, Sparkles, Navigation, ShieldCheck, Megaphone } from 'lucide-react';
import { BUSINESS_INFO } from '../data/fleetData';
import { Language } from '../types';
import { NoticeBannerConfig } from './AdminPanelModal';

interface NavbarProps {
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenBooking: (carName?: string) => void;
  onOpenAdmin: () => void;
  noticeConfig?: NoticeBannerConfig;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  lang, 
  setLang, 
  onOpenBooking, 
  onOpenAdmin,
  noticeConfig 
}) => {
  const isBn = lang === 'bn';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      
      {/* Top Dynamic Notice Banner if Enabled */}
      {noticeConfig?.enabled && (
        <div className={`text-white text-xs py-1.5 px-4 font-semibold shadow-inner transition-colors ${
          noticeConfig.theme === 'amber' ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700' :
          noticeConfig.theme === 'emerald' ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700' :
          noticeConfig.theme === 'rose' ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700' :
          noticeConfig.theme === 'purple' ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700' :
          'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <Megaphone className="w-3.5 h-3.5 shrink-0 animate-bounce" />
              <span className="truncate">{isBn ? noticeConfig.textBn : noticeConfig.text}</span>
            </div>
            <a
              href={`tel:${BUSINESS_INFO.phone1}`}
              className="shrink-0 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-bold transition-colors"
            >
              {isBn ? 'কল করুন' : 'Call 24x7'}
            </a>
          </div>
        </div>
      )}

      {/* Google-like top notice bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              {isBn ? 'সব গাড়ি প্রস্তুত' : 'Fleet Ready'}
            </span>
            <span className="hidden sm:inline text-blue-100 font-medium">
              {isBn ? 'ভারতের যেকোনো প্রান্তে ভ্রমণ ও অনুষ্ঠানের জন্য ২৪x৭ গাড়ি ভাড়া' : '24x7 Car Rental for All India Tours & Wedding Events'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <a 
              href={`tel:${BUSINESS_INFO.phone1}`} 
              className="flex items-center gap-1.5 hover:text-amber-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span>{BUSINESS_INFO.phone1}</span>
            </a>
            <span className="text-blue-400">|</span>
            <a 
              href={`tel:${BUSINESS_INFO.phone2}`} 
              className="hidden md:flex items-center gap-1.5 hover:text-amber-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span>{BUSINESS_INFO.phone2}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Business Name */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                  Cholo Jai
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Verified
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {isBn ? 'চলো যাই ট্যুর এন্ড ট্রাভেলস্ • জামালপুর' : 'Tour & Travels • Jamalpur, Burdwan'}
              </p>
            </div>
          </a>

          {/* Center Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#fleet" className="hover:text-blue-600 transition-colors">
              {isBn ? 'গাড়ির তালিকা' : 'Our Fleet'}
            </a>
            <a href="#services" className="hover:text-blue-600 transition-colors">
              {isBn ? 'ট্যুর ও সার্ভিস' : 'Tour Services'}
            </a>
            <a href="#reviews" className="hover:text-blue-600 transition-colors">
              {isBn ? 'রিভিউ' : 'Reviews'}
            </a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">
              {isBn ? 'ঠিকানা ও যোগাযোগ' : 'Contact & Location'}
            </a>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Admin Panel Button */}
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 hover:from-purple-100 hover:to-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95"
              title={isBn ? 'অ্যাডমিন কন্ট্রোল প্যানেল' : 'Owner Admin Panel'}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">{isBn ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}</span>
              <span className="sm:hidden">{isBn ? 'অ্যাডমিন' : 'Admin'}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              title="Toggle Language / ভাষা পরিবর্তন"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* WhatsApp Quick Quote */}
            <a
              href={`https://wa.me/91${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent('Hello Cholo Jai Tour & Travels! I would like to inquire about car rental booking.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp</span>
            </a>

            {/* Book Now button */}
            <button
              onClick={() => onOpenBooking()}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/25 transition-all active:scale-95"
            >
              <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{isBn ? 'বুকিং' : 'Book'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

