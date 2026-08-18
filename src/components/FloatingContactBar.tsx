import React from 'react';
import { Phone, MessageSquare, Calculator, Car } from 'lucide-react';
import { BUSINESS_INFO } from '../data/fleetData';
import { Language } from '../types';

interface FloatingContactBarProps {
  lang: Language;
  onOpenBooking: () => void;
}

export const FloatingContactBar: React.FC<FloatingContactBarProps> = ({ lang, onOpenBooking }) => {
  const isBn = lang === 'bn';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-indigo-100 shadow-2xl p-2.5 sm:hidden">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Call Button */}
        <a
          href={`tel:${BUSINESS_INFO.phone1}`}
          className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 active:from-blue-700 active:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <Phone className="w-4 h-4" />
          <span>{isBn ? 'কল করুন' : 'Call'}</span>
        </a>

        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/91${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent('Hello Cholo Jai Tour & Travels! I want to inquire about car booking.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 active:from-emerald-700 active:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          <span>WhatsApp</span>
        </a>

        {/* Book Button */}
        <button
          onClick={onOpenBooking}
          className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 active:from-purple-700 active:to-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20"
        >
          <Car className="w-4 h-4 text-amber-300" />
          <span>{isBn ? 'বুকিং' : 'Book'}</span>
        </button>
      </div>
    </div>
  );
};
