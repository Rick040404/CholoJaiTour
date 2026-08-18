import React from 'react';
import { Star, MapPin, Phone, Clock, Globe, Share2, Bookmark, Navigation, CheckCircle2, ShieldCheck, Award, MessageCircle } from 'lucide-react';
import { BUSINESS_INFO } from '../data/fleetData';
import { Language } from '../types';

interface GoogleBusinessCardProps {
  lang: Language;
  onOpenBooking: () => void;
}

export const GoogleBusinessCard: React.FC<GoogleBusinessCardProps> = ({ lang, onOpenBooking }) => {
  const isBn = lang === 'bn';

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 rounded-3xl border border-indigo-100 shadow-xl p-5 sm:p-7 mb-10 transition-all hover:shadow-2xl relative overflow-hidden">
      
      {/* Decorative top accent line with Google colors */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]"></div>

      {/* Top Google Search Badge */}
      <div className="flex items-center justify-between gap-4 border-b border-indigo-100/80 pb-4 mb-4 pt-1">
        <div className="flex items-center gap-2">
          {/* Google 4 colors dots */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-2xs border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#FBBC05]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]"></span>
            <span className="text-xs font-bold text-slate-700 tracking-wide ml-1">
              Google Verified Business
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-800 text-xs font-extrabold border border-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{isBn ? 'যাচাইকৃত প্রোফাইল' : 'Verified Profile'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Details */}
        <div className="lg:col-span-8 space-y-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {BUSINESS_INFO.name}
            </h1>
            <p className="text-sm font-bold text-indigo-600 font-bengali">
              {BUSINESS_INFO.nameBn}
            </p>
          </div>

          {/* Rating & Category */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 px-2.5 py-1 rounded-lg font-extrabold text-sm border border-amber-200">
              <span className="text-slate-900 font-black">{BUSINESS_INFO.googleRating}</span>
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current drop-shadow-xs" />
                ))}
              </div>
            </div>
            <a href="#reviews" className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold">
              {BUSINESS_INFO.totalReviews} {isBn ? 'গুগল রিভিউ (১৪৮+)' : 'Google reviews (148+)'}
            </a>
            <span className="text-slate-300">•</span>
            <span className="text-slate-700 font-semibold">
              {isBn ? 'গাড়ি ভাড়া ও ট্যুর ট্রাভেল সার্ভিস' : 'Car Rental Agency & Tour Operator'}
            </span>
          </div>

          {/* Key Google Attributes */}
          <div className="space-y-2 pt-2 text-xs sm:text-sm text-slate-700 font-medium">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-900">{isBn ? 'ঠিকানা: ' : 'Address: '}</strong>
                <a 
                  href={BUSINESS_INFO.googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 hover:underline transition-colors"
                  title="Open in Google Maps"
                >
                  {isBn ? BUSINESS_INFO.addressBn : BUSINESS_INFO.address}
                </a>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="flex items-center gap-2">
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {isBn ? 'খোলা আছে' : 'Open 24 hours'}
                </span>
                <span className="text-slate-400">•</span>
                <span>{isBn ? '২৪x৭ বুকিং ও হেল্পলাইন সেবা' : '24x7 Instant Dispatch & Booking'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong className="text-slate-900">{isBn ? 'ফোন: ' : 'Phone: '}</strong>
                <a href={`tel:${BUSINESS_INFO.phone1}`} className="text-blue-600 hover:underline font-extrabold mr-2">
                  +91 {BUSINESS_INFO.phone1}
                </a>
                <span>/</span>
                <a href={`tel:${BUSINESS_INFO.phone2}`} className="text-blue-600 hover:underline font-extrabold ml-2">
                  +91 {BUSINESS_INFO.phone2}
                </a>
              </span>
            </div>
          </div>

          {/* Feature Chips with colorful accents */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              ✓ Verified Fleet
            </span>
            <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
              ✓ AC & Non-AC Available
            </span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
              ✓ 4, 7 & 9 Seaters
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              ✓ All India Commercial Permits
            </span>
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
              ✓ PhonePe / UPI Accepted
            </span>
          </div>
        </div>

        {/* Right Side: Google Action Buttons Grid */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-3 bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">
            {isBn ? 'দ্রুত যোগাযোগ ও ব্যবস্থা' : 'Quick Actions'}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${BUSINESS_INFO.phone1}`}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold text-center transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Phone className="w-4 h-4 mb-1" />
              <span>{isBn ? 'কল করুন' : 'Call Now'}</span>
            </a>

            <a
              href={`https://wa.me/91${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent('Hello Cholo Jai Travels! I would like to book a car.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold text-center transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 mb-1" />
              <span>WhatsApp</span>
            </a>

            <a
              href={BUSINESS_INFO.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold text-center transition-colors shadow-2xs group"
            >
              <Navigation className="w-4 h-4 mb-1 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>{isBn ? 'ম্যাপ ডিরেকশন' : 'Directions'}</span>
            </a>

            <button
              onClick={onOpenBooking}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold text-center transition-colors shadow-2xs"
            >
              <Bookmark className="w-4 h-4 mb-1 text-amber-600" />
              <span>{isBn ? 'বুকিং ফর্ম' : 'Book Quote'}</span>
            </button>
          </div>

          <div className="text-[11px] text-center text-slate-500 pt-1 font-medium">
            {isBn ? '⚡ দ্রুত গাড়ি নিশ্চিতকরণ • কোনো অতিরিক্ত লুকানো খরচ নেই' : '⚡ Instant confirmation • Transparent km/day billing'}
          </div>
        </div>
      </div>
    </div>
  );
};
