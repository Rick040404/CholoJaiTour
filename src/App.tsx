/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { GoogleBusinessCard } from './components/GoogleBusinessCard';
import { FleetSection } from './components/FleetSection';
import { ServicesSection } from './components/ServicesSection';
import { ReviewsSection } from './components/ReviewsSection';
import { ContactSection } from './components/ContactSection';
import { BookingModal } from './components/BookingModal';
import { AdminPanelModal, NoticeBannerConfig } from './components/AdminPanelModal';
import { FloatingContactBar } from './components/FloatingContactBar';
import { Language, FleetCar } from './types';
import { FLEET_CARS } from './data/fleetData';
import { subscribeToLiveNotice, subscribeToLiveFleet, fetchLiveServerData } from './utils/syncService';

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [bookingCar, setBookingCar] = useState<string>('');
  const [customFleet, setCustomFleet] = useState<FleetCar[]>(() => {
    const saved = localStorage.getItem('cholo_jai_custom_fleet');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return FLEET_CARS; }
    }
    return FLEET_CARS;
  });

  // Top Notice Banner state synced with Firestore & localStorage
  const [noticeConfig, setNoticeConfig] = useState<NoticeBannerConfig>(() => {
    const saved = localStorage.getItem('cholo_jai_notice_banner');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      enabled: true,
      text: '🎉 Special Discount on Digha, Puri & Darjeeling Outstation Tours! Call 9153302517 for instant booking.',
      textBn: '🎉 দিঘা, পুরী ও দার্জিলিং ট্যুরের বুকিংয়ে বিশেষ সুবিধা! ২৪x৭ বুকিংয়ের জন্য ৯১৫৩৩০২৫১৭ নম্বরে সরাসরি ফোন করুন।',
      theme: 'amber'
    };
  });

  // Real-time Cloud Synchronization with Firestore for all devices
  useEffect(() => {
    // Initial fetch
    fetchLiveServerData().then(data => {
      if (data?.notice) {
        setNoticeConfig(data.notice);
      }
    });

    // Real-time Firestore subscriptions (syncs across primary & secondary devices)
    const unsubNotice = subscribeToLiveNotice((liveNotice) => {
      if (liveNotice) setNoticeConfig(liveNotice);
    });

    const unsubFleet = subscribeToLiveFleet((liveFleet) => {
      if (liveFleet && Array.isArray(liveFleet)) setCustomFleet(liveFleet);
    });

    return () => {
      unsubNotice();
      unsubFleet();
    };
  }, []);

  const handleOpenBooking = (carName?: string) => {
    if (carName) {
      setBookingCar(carName);
    }
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Google-styled Top Navigation */}
      <Navbar 
        lang={lang} 
        setLang={setLang} 
        onOpenBooking={handleOpenBooking}
        onOpenAdmin={() => setIsAdminOpen(true)}
        noticeConfig={noticeConfig}
      />

      {/* Main Content */}
      <main className="flex-1 pb-16 sm:pb-0">
        
        {/* Hero Section */}
        <HeroSection 
          lang={lang} 
          onOpenBooking={handleOpenBooking} 
        />

        {/* Google Business Profile Snapshot in Max Width Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <GoogleBusinessCard 
            lang={lang} 
            onOpenBooking={() => handleOpenBooking()} 
          />
        </div>

        {/* Fleet Details & Specs */}
        <FleetSection 
          lang={lang} 
          onOpenBooking={handleOpenBooking} 
        />

        {/* Tour & Rental Services */}
        <ServicesSection 
          lang={lang} 
          onOpenBooking={handleOpenBooking} 
        />

        {/* Customer Google Reviews */}
        <ReviewsSection 
          lang={lang} 
        />

        {/* Contact, Map Location & FAQs */}
        <ContactSection 
          lang={lang} 
        />

      </main>

      {/* Interactive Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        lang={lang}
        preselectedCar={bookingCar}
      />

      {/* Admin Control Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        lang={lang}
        noticeConfig={noticeConfig}
        onUpdateNotice={(newNotice) => setNoticeConfig(newNotice)}
      />

      {/* Floating 1-tap Contact Bar for Mobile */}
      <FloatingContactBar 
        lang={lang} 
        onOpenBooking={() => handleOpenBooking()} 
      />
    </div>
  );
}
