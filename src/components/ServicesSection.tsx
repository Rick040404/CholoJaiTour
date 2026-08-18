import React from 'react';
import { Compass, Plane, Heart, Mountain, Sparkles, Building, Clock, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { Language } from '../types';
import { BUSINESS_INFO } from '../data/fleetData';

interface ServicesSectionProps {
  lang: Language;
  onOpenBooking: (carName?: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ lang, onOpenBooking }) => {
  const isBn = lang === 'bn';

  const services = [
    {
      id: 'all-india',
      icon: Compass,
      title: 'All India Holiday Tours',
      titleBn: 'অল ইন্ডিয়া হলিডে ট্যুর',
      desc: 'Long-distance vacation tours to Kashmir, Himachal, Rajasthan, Puri, Varanasi, and South India with experienced highway drivers.',
      descBn: 'কাশ্মীর, হিমাচল, রাজস্থান, পুরী, বারাণসী সহ সমগ্র ভারতে পরিবার নিয়ে দীর্ঘ দূরপাল্লার ট্যুর। অভিজ্ঞ হাইওয়ে চালক সহ।',
      bestCar: 'Toyota Rumion / Mahindra Scorpio Classic',
      badge: 'Popular',
      badgeBn: 'জনপ্রিয়',
      theme: 'emerald',
      iconBg: 'bg-emerald-100 text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      btnHover: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
    },
    {
      id: 'beach-tours',
      icon: Compass,
      title: 'Digha & Mandarmani Beach Tours',
      titleBn: 'দিঘা ও মন্দারমণি সৈকত ভ্রমণ',
      desc: 'Weekend and holiday trips to Digha, Mandarmani, Tajpur, and Bakkhali beaches. Safe, comfortable rides with luggage carriers.',
      descBn: 'দিঘা, মন্দারমণি, তাজপুর ও বকখালির মতো সমুদ্র সৈকতে আরামদায়ক সফর। পর্যাপ্ত লাগেজ বহনের সুবিধাযুক্ত।',
      bestCar: 'Maruti Suzuki Ertiga / Swift Dzire',
      badge: 'Weekend Hit',
      badgeBn: 'উইকেন্ড স্পেশাল',
      theme: 'sky',
      iconBg: 'bg-sky-100 text-sky-700',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
      btnHover: 'hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300'
    },
    {
      id: 'hills',
      icon: Mountain,
      title: 'Darjeeling & Sikkim Hill Specialist',
      titleBn: 'দার্জিলিং ও সিকিম পাহাড়ি ট্যুর',
      desc: 'High ground clearance SUVs equipped for steep mountain curves, foggy roads, and North Bengal tea garden circuits.',
      descBn: 'খাড়া পাহাড়ি পথ, কুয়াশা ও আঁকাবাঁকা রাস্তার জন্য তৈরি স্করপিও ক্লাসিক এসইউভি গাড়ি। দার্জিলিং ও সিকিম ভ্রমণের সেরা সঙ্গী।',
      bestCar: 'Mahindra Scorpio Classic (9 Seater)',
      badge: 'Hill King',
      badgeBn: 'পাহাড়ের রাজা',
      theme: 'amber',
      iconBg: 'bg-amber-100 text-amber-700',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      btnHover: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
    },
    {
      id: 'weddings',
      icon: Heart,
      title: 'Wedding & Ceremony Car Rentals',
      titleBn: 'বিবাহ ও শুভ অনুষ্ঠানের গাড়ি ভাড়া',
      desc: 'Premium bridal and groom cars with flower decoration options, plus multiple car convoy arrangements for wedding guests.',
      descBn: 'বরের গাড়ি, কনে যাতায়াত এবং বরযাত্রীদের জন্য ফুল দিয়ে সুন্দর করে সাজানো প্রিমিয়াম গাড়ির সুব্যবস্থা।',
      bestCar: 'Toyota Rumion Pearl White / Swift Dzire',
      badge: 'VIP Special',
      badgeBn: 'ভিআইপি স্পেশাল',
      theme: 'rose',
      iconBg: 'bg-rose-100 text-rose-700',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      btnHover: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
    },
    {
      id: 'airport',
      icon: Plane,
      title: 'Kolkata Airport & Station Pick & Drop',
      titleBn: 'কলকাতা বিমানবন্দর ও স্টেশন পিক-ড্রপ',
      desc: 'Timely 24x7 pick and drop service for Kolkata Netaji Subhash Chandra Bose Airport (CCU), Howrah, and Sealdah stations.',
      descBn: 'কলকাতা বিমানবন্দর, হাওড়া, শিয়ালদহ ও বর্ধমান স্টেশনের জন্য সময়মতো নির্ভরযোগ্য ২৪x৭ পিকআপ ও ড্রপ সেবা।',
      bestCar: 'Maruti Swift Dzire / Toyota Rumion',
      badge: '24x7 Ready',
      badgeBn: '২৪x৭ প্রস্তুত',
      theme: 'purple',
      iconBg: 'bg-purple-100 text-purple-700',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
      btnHover: 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'
    },
    {
      id: 'hospital',
      icon: Clock,
      title: 'Emergency Medical & Hospital Transit',
      titleBn: 'জরুরী ডাক্তারখানা ও হাসপাতাল যাতায়াত',
      desc: 'Immediate round-the-clock car dispatch for medical visits to Burdwan Medical College and Kolkata multispeciality hospitals.',
      descBn: 'বর্ধমান মেডিকেল কলেজ ও কলকাতার হাসপাতালগুলিতে রোগী নিয়ে যাওয়ার জন্য দ্রুততম গাড়ি পাঠানোর ব্যবস্থা।',
      bestCar: 'Maruti WagonR / Swift Dzire',
      badge: 'Urgent Dispatch',
      badgeBn: 'জরুরী সেবা',
      theme: 'coral',
      iconBg: 'bg-orange-100 text-orange-700',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
      btnHover: 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300'
    }
  ];

  return (
    <section id="services" className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isBn ? 'আমাদের বিশেষ পরিসেবাসমূহ' : 'Comprehensive Services'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {isBn ? 'যেকোনো প্রয়োজন ও অনুষ্ঠানের জন্য সার্বিক সমাধান' : 'Tailored Car Rental Solutions For Every Journey'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
            {isBn
              ? 'পারিবারিক ট্যুর থেকে শুরু করে বিয়েবাড়ি, হাসপাতাল ও অল ইন্ডিয়া লং ট্রিপ — আমরা সবসময় আপনার পাশে।'
              : 'From vacation road trips to wedding ceremonies, airport transfers, and emergency medical transits.'}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => {
            const Icon = srv.icon;
            return (
              <div 
                key={srv.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${srv.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${srv.badgeBg}`}>
                      {isBn ? srv.badgeBn : srv.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {isBn ? srv.titleBn : srv.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 font-medium">
                    {isBn ? srv.descBn : srv.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 mb-3 font-semibold">
                    <span className="text-slate-800">{isBn ? 'সুপারিশকৃত গাড়ি: ' : 'Recommended: '}</span>
                    <span className="text-indigo-600 font-bold">{srv.bestCar}</span>
                  </div>
                  <button
                    onClick={() => onOpenBooking(srv.bestCar.split(' ')[0])}
                    className={`w-full py-2.5 rounded-xl bg-slate-50 ${srv.btnHover} text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200 active:scale-98`}
                  >
                    <span>{isBn ? 'এই সার্ভিসের বুকিং করুন' : 'Inquire for This Service'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
