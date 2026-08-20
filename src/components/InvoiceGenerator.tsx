import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Send, 
  Printer, 
  Phone, 
  MapPin, 
  Calendar, 
  Car as CarIcon, 
  User, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft,
  Plus,
  Trash2,
  Receipt,
  IndianRupee,
  Clock,
  Share2,
  X,
  CreditCard,
  Building2,
  AlertCircle,
  Eye,
  Edit3
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { BookingLead, FleetCar, Language } from '../types';
import { BUSINESS_INFO, FLEET_CARS } from '../data/fleetData';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  tripStartDate: string;
  tripEndDate?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  pickupLocation: string;
  dropLocation: string;
  carName: string;
  carRegistrationNo?: string;
  driverName?: string;
  driverPhone?: string;
  tripType: string;
  isAc: boolean;
  baseFare: number;
  tollParkingAmount: number;
  driverAllowance: number;
  otherCharges: number;
  otherChargesDescription?: string;
  discountAmount: number;
  advancePaid: number;
  paymentMode: 'Cash' | 'UPI / PhonePe' | 'Bank Transfer' | 'Pending';
  paymentStatus: 'Paid in Full' | 'Advance Paid' | 'Payment Due' | 'Unpaid';
  specialNotes: string;
}

interface InvoiceGeneratorProps {
  lang: Language;
  prefillBooking?: BookingLead | null;
  onBack?: () => void;
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  lang,
  prefillBooking,
  onBack
}) => {
  const isBn = lang === 'bn';
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);
  const [showShareGuideModal, setShowShareGuideModal] = useState(false);
  const [lastDownloadedFilename, setLastDownloadedFilename] = useState('');
  // Mobile tab toggle: 'form' or 'preview'
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  // Today Date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Initialize Invoice Data
  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const dateCode = todayStr.replace(/-/g, '').slice(2);
    
    if (prefillBooking) {
      const baseFareNum = Number(prefillBooking.fareEstimate) || 3500;
      const advanceNum = Number(prefillBooking.advanceAmount) || 0;
      return {
        invoiceNumber: `CJ-${dateCode}-${randomId}`,
        invoiceDate: todayStr,
        tripStartDate: prefillBooking.date || todayStr,
        tripEndDate: prefillBooking.date || todayStr,
        customerName: prefillBooking.name || '',
        customerPhone: prefillBooking.phone || '',
        customerAddress: 'কাড়ালাঘাট / জামালপুর, পূর্ব বর্ধমান',
        pickupLocation: prefillBooking.pickup || 'জামালপুর, পূর্ব বর্ধমান',
        dropLocation: prefillBooking.destination || 'কলকাতা বিমানবন্দর / দিঘা',
        carName: prefillBooking.car || 'Mahindra Scorpio Classic (9 Seater)',
        carRegistrationNo: 'WB 42 (All-India Tourist Permit)',
        driverName: 'অভিজ্ঞ চালক (Chauffeur)',
        driverPhone: BUSINESS_INFO.phone1,
        tripType: prefillBooking.tripType || 'Outstation Round Trip',
        isAc: prefillBooking.isAc ?? true,
        baseFare: baseFareNum,
        tollParkingAmount: 0,
        driverAllowance: 0,
        otherCharges: 0,
        otherChargesDescription: 'State Permit / Border Tax',
        discountAmount: 0,
        advancePaid: advanceNum,
        paymentMode: advanceNum > 0 ? 'UPI / PhonePe' : 'Cash',
        paymentStatus: advanceNum >= baseFareNum ? 'Paid in Full' : advanceNum > 0 ? 'Advance Paid' : 'Payment Due',
        specialNotes: 'Fuel & Driver included. Toll & Parking included as per estimate. AC 24/7.'
      };
    }

    return {
      invoiceNumber: `CJ-${dateCode}-${randomId}`,
      invoiceDate: todayStr,
      tripStartDate: todayStr,
      tripEndDate: todayStr,
      customerName: 'সম্মানিত যাত্রী (Customer Name)',
      customerPhone: '9876543210',
      customerAddress: 'জামালপুর, পূর্ব বর্ধমান, পশ্চিমবঙ্গ',
      pickupLocation: 'জামালপুর / কাড়ালাঘাট, পূর্ব বর্ধমান',
      dropLocation: 'কলকাতা বিমানবন্দর / দিঘা / তারাপীঠ',
      carName: 'Mahindra Scorpio Classic (9 Seater)',
      carRegistrationNo: 'WB 42 (Commercial Tourist Permit)',
      driverName: 'অমিত দাস (Chauffeur)',
      driverPhone: BUSINESS_INFO.phone1,
      tripType: 'Outstation Tour / Event',
      isAc: true,
      baseFare: 4500,
      tollParkingAmount: 400,
      driverAllowance: 300,
      otherCharges: 0,
      otherChargesDescription: 'Fastag / Entry Tax',
      discountAmount: 200,
      advancePaid: 1000,
      paymentMode: 'UPI / PhonePe',
      paymentStatus: 'Advance Paid',
      specialNotes: 'AC will remain active throughout the journey. Safe & sanitized vehicle.'
    };
  });

  // Calculate totals
  const subTotal = (Number(invoice.baseFare) || 0) + 
                   (Number(invoice.tollParkingAmount) || 0) + 
                   (Number(invoice.driverAllowance) || 0) + 
                   (Number(invoice.otherCharges) || 0);

  const grandTotal = Math.max(0, subTotal - (Number(invoice.discountAmount) || 0));
  const remainingDue = Math.max(0, grandTotal - (Number(invoice.advancePaid) || 0));

  // Field change handler
  const handleInputChange = (field: keyof InvoiceData, value: any) => {
    setInvoice(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper to compile ultra crystal-clear, high-resolution PDF Blob & File using lossless PNG supersampling & jsPDF
  const generatePdfObject = async (): Promise<{ pdf: jsPDF; file: File; filename: string } | null> => {
    if (!invoicePrintRef.current) return null;
    
    // Temporarily ensure container is visible and rendered at native printable width
    const originalDisplay = invoicePrintRef.current.style.display;
    invoicePrintRef.current.style.display = 'block';

    try {
      // 3.5x Pixel Ratio lossless PNG supersampling guarantees ultra crisp 300+ DPI text and razor sharp lines
      const imgData = await toPng(invoicePrintRef.current, {
        pixelRatio: 3.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: '',
        style: {
          transform: 'none',
          margin: '0'
        }
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (invoicePrintRef.current.offsetHeight * pdfWidth) / invoicePrintRef.current.offsetWidth;

      // Add lossless PNG with zero compression blur or artifacts
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 296), undefined, 'FAST');
      
      const safeName = invoice.customerName ? invoice.customerName.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'Customer';
      const filename = `Cholo_Jai_Invoice_${invoice.invoiceNumber}_${safeName}.pdf`;

      const blob = pdf.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });

      return { pdf, file, filename };
    } finally {
      invoicePrintRef.current.style.display = originalDisplay;
    }
  };

  // 1. Download PDF directly
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await generatePdfObject();
      if (!result) return;
      const { pdf, filename } = result;
      pdf.save(filename);
      setLastDownloadedFilename(filename);
      setPdfSuccess(isBn ? `📄 ${filename} স্বচ্ছ ও স্পষ্ট PDF ডাউনলোড হয়েছে!` : `📄 ${filename} crystal-clear PDF downloaded!`);
      setTimeout(() => setPdfSuccess(null), 5000);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Could not generate PDF. Please try again or use the Print button.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Share PDF via WhatsApp (Native File Share on Mobile / Auto-download + WhatsApp on Desktop)
  const handleSharePdfToWhatsApp = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await generatePdfObject();
      if (!result) return;
      const { pdf, file, filename } = result;
      setLastDownloadedFilename(filename);

      const rawPhone = invoice.customerPhone.replace(/[^0-9]/g, '');
      const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

      const message = 
`🚕 *চলো যাই ট্যুর এণ্ড ট্রাভেলস্ (Cholo Jai Tour & Travels)* 🚕
━━━━━━━━━━━━━━━━━━━━
📄 *অফিসিয়াল ট্রিপ ইনভয়েস ও মেমো (PDF Attached)*
🧾 *ইনভয়েস নং:* ${invoice.invoiceNumber}
📅 *তারিখ (Date):* ${invoice.invoiceDate}
👤 *যাত্রী (Customer):* ${invoice.customerName}
📞 *মোবাইল (Phone):* ${invoice.customerPhone}
📍 *রুট (Route):* ${invoice.pickupLocation} ➔ ${invoice.dropLocation}
🚗 *বরাদ্দ গাড়ি (Car):* ${invoice.carName} (${invoice.isAc ? 'AC' : 'Non-AC'})
━━━━━━━━━━━━━━━━━━━━
💰 *ভাড়ার হিসাব (Fare Summary):*
💵 *মোট ভাড়া (Total Fare):* ₹${grandTotal.toFixed(2)}
✅ *অগ্রিম জমা (Advance Received):* ₹${Number(invoice.advancePaid).toFixed(2)}
⚠️ *বাকি টাকা (Due Balance):* ₹${remainingDue.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━
📞 *যোগাযোগ:* ${BUSINESS_INFO.phone1} / ${BUSINESS_INFO.phone2}
💳 *PhonePe / GPay:* ${BUSINESS_INFO.phone1}
📍 কাড়ালাঘাট : জামালপুর : পূর্ব বর্ধমান
_ধন্যবাদ! আপনার যাত্রা নিরাপদ ও আনন্দদায়ক হোক।_`;

      // Try Native Web Share API with File (Mobile Chrome, Safari, WhatsApp on Mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Cholo Jai Invoice - ${invoice.customerName}`,
            text: message
          });
          setPdfSuccess(isBn ? '✅ HD PDF ইনভয়েস সফলভাবে হোয়াটসঅ্যাপে পাঠানো হয়েছে!' : '✅ HD PDF Invoice sent to WhatsApp!');
          setTimeout(() => setPdfSuccess(null), 5000);
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            return; // User cancelled
          }
          console.warn('Native share error, switching to download & WhatsApp link:', err);
        }
      }

      // Fallback for Desktop / Standard Browsers:
      pdf.save(filename);

      const whatsappUrl = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      setShowShareGuideModal(true);
      setPdfSuccess(isBn ? `📄 ${filename} ডাউনলোড হয়েছে এবং হোয়াটসঅ্যাপ ওপেন হয়েছে!` : `📄 ${filename} downloaded & WhatsApp opened!`);
    } catch (error) {
      console.error('Failed to share PDF:', error);
      alert('PDF তৈরিতে সমস্যা হয়েছে। দয়া করে PDF ডাউনলোড বাটন ব্যবহার করুন।');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-4">
      
      {/* Top Header & Action Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-3.5 sm:p-4 rounded-2xl text-white shadow-md">
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <Receipt className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black tracking-tight leading-tight">
                {isBn ? 'ইনভয়েস ও ট্রিপ মেমো' : 'Trip Invoice Generator'}
              </h3>
              <p className="text-[11px] sm:text-xs text-blue-100 font-medium">
                {isBn ? 'স্বচ্ছ HD প্রিন্ট ও হোয়াটসঅ্যাপ শেয়ার' : 'Crystal-Clear HD PDF & WhatsApp Share'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Group (Desktop View) */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap w-full sm:w-auto">
          
          {/* Main Action: WhatsApp PDF Share */}
          <button
            onClick={handleSharePdfToWhatsApp}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all shadow-lg shadow-emerald-900/30 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="PDF ফাইল তৈরি করে হোয়াটসঅ্যাপে শেয়ার করুন"
          >
            <Send className={`w-4 h-4 ${isGeneratingPdf ? 'animate-spin' : ''}`} />
            <span>{isGeneratingPdf ? (isBn ? 'PDF তৈরি হচ্ছে...' : 'Building PDF...') : (isBn ? 'হোয়াটসঅ্যাপে পাঠান' : 'Send WhatsApp PDF')}</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer border border-white/20"
          >
            <Download className="w-4 h-4" />
            <span>{isBn ? 'HD PDF ডাউনলোড' : 'Download HD PDF'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="hidden md:inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors border border-white/20 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher (Form vs Live Preview) */}
      <div className="flex lg:hidden bg-slate-200 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'form'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isBn ? '১. বিলের তথ্য এডিট' : '1. Edit Details'}</span>
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'preview'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isBn ? '২. ইনভয়েস প্রিভিউ' : '2. Preview Invoice'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {pdfSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{pdfSuccess}</span>
          </div>
          <button 
            onClick={() => setPdfSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: Left Editor & Right Live Printable Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls & Form Inputs (5 Cols on Desktop, conditionally shown on mobile) */}
        <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'form' ? 'block' : 'hidden lg:block'}`}>
          
          {/* Passenger Information */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>{isBn ? '১. যাত্রীর তথ্য (Customer Details)' : '1. Customer Details'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'যাত্রীর নাম:' : 'Customer Name:'}</label>
                <input
                  type="text"
                  value={invoice.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-600 focus:outline-hidden"
                  placeholder="e.g. Rahul Mukherjee"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'মোবাইল নম্বর:' : 'Phone Number:'}</label>
                <input
                  type="tel"
                  value={invoice.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-600 focus:outline-hidden"
                  placeholder="10 digit number"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'বিল নম্বর:' : 'Invoice No:'}</label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'ঠিকানা / জেলা:' : 'Customer Address:'}</label>
                <input
                  type="text"
                  value={invoice.customerAddress}
                  onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:border-blue-600 focus:outline-hidden"
                  placeholder="e.g. Jamalpur, Purba Bardhaman"
                />
              </div>
            </div>
          </div>

          {/* Route & Vehicle Details */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <CarIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>{isBn ? '২. ভ্রমণ ও গাড়ি বরাদ্দ (Trip & Vehicle)' : '2. Trip & Vehicle'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'পিকআপ স্থান:' : 'Pickup:'}</label>
                <input
                  type="text"
                  value={invoice.pickupLocation}
                  onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গন্তব্য স্থান:' : 'Drop:'}</label>
                <input
                  type="text"
                  value={invoice.dropLocation}
                  onChange={(e) => handleInputChange('dropLocation', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'যাত্রার তারিখ:' : 'Trip Date:'}</label>
                <input
                  type="date"
                  value={invoice.tripStartDate}
                  onChange={(e) => handleInputChange('tripStartDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গাড়ির মডেল:' : 'Select Car:'}</label>
                <select
                  value={invoice.carName}
                  onChange={(e) => handleInputChange('carName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-white"
                >
                  {FLEET_CARS.map(car => (
                    <option key={car.id} value={`${car.name} (${car.seats})`}>
                      {car.name} ({car.seats})
                    </option>
                  ))}
                  <option value="Custom Vehicle / Taxi">Custom Vehicle</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গাড়ির নম্বর / পারমিট:' : 'Car Reg No:'}</label>
                <input
                  type="text"
                  value={invoice.carRegistrationNo}
                  onChange={(e) => handleInputChange('carRegistrationNo', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'চালকের নাম ও ফোন:' : 'Driver & Phone:'}</label>
                <input
                  type="text"
                  value={invoice.driverName}
                  onChange={(e) => handleInputChange('driverName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700">{isBn ? 'এয়ার কন্ডিশন (AC):' : 'AC Cooling:'}</span>
                <button
                  type="button"
                  onClick={() => handleInputChange('isAc', !invoice.isAc)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    invoice.isAc ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {invoice.isAc ? '✓ AC Active' : 'Non-AC'}
                </button>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? '৩. ভাড়ার হিসেব ও পেমেন্ট (Fare & Billing)' : '3. Fare & Billing'}</span>
            </h4>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'মূল ভাড়া (Base Fare):' : 'Base Fare (₹):'}</label>
                <input
                  type="number"
                  value={invoice.baseFare}
                  onChange={(e) => handleInputChange('baseFare', Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'টোল ও পার্কিং (Toll):' : 'Toll / Parking (₹):'}</label>
                <input
                  type="number"
                  value={invoice.tollParkingAmount}
                  onChange={(e) => handleInputChange('tollParkingAmount', Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'ড্রাইভার বাটা / নাইট:' : 'Driver Allowance (₹):'}</label>
                <input
                  type="number"
                  value={invoice.driverAllowance}
                  onChange={(e) => handleInputChange('driverAllowance', Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'অন্যান্য / ট্যাক্স:' : 'Other Charges (₹):'}</label>
                <input
                  type="number"
                  value={invoice.otherCharges}
                  onChange={(e) => handleInputChange('otherCharges', Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-800 mb-1">{isBn ? 'ডিসকাউন্ট / ছাড়:' : 'Discount (₹):'}</label>
                <input
                  type="number"
                  value={invoice.discountAmount}
                  onChange={(e) => handleInputChange('discountAmount', Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-emerald-800 font-bold bg-emerald-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-blue-900 mb-1">{isBn ? 'অগ্রিম জমা (Advance):' : 'Advance Paid (₹):'}</label>
                <input
                  type="number"
                  value={invoice.advancePaid}
                  onChange={(e) => handleInputChange('advancePaid', Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 text-blue-900 font-bold bg-blue-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'পেমেন্ট স্ট্যাটাস:' : 'Payment Status:'}</label>
                <select
                  value={invoice.paymentStatus}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-white"
                >
                  <option value="Paid in Full">Paid in Full (পরিশোধিত)</option>
                  <option value="Advance Paid">Advance Paid (অগ্রিম প্রাপ্ত)</option>
                  <option value="Payment Due">Payment Due (বাকি আছে)</option>
                  <option value="Unpaid">Unpaid (অপরিশোধিত)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isBn ? 'পেমেন্ট মাধ্যম:' : 'Payment Mode:'}</label>
                <select
                  value={invoice.paymentMode}
                  onChange={(e) => handleInputChange('paymentMode', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-white"
                >
                  <option value="UPI / PhonePe">UPI / PhonePe / GPay</option>
                  <option value="Cash">Cash (নগদ)</option>
                  <option value="Bank Transfer">Bank Transfer / IMPS</option>
                  <option value="Pending">Pending at Trip End</option>
                </select>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-bold mt-2">
              <div>
                <span className="text-slate-400">{isBn ? 'মোট ভাড়া:' : 'Total:'}</span>
                <span className="ml-1 text-sm font-black text-amber-400">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400">{isBn ? 'বাকি:' : 'Due:'}</span>
                <span className="ml-1 text-sm font-black text-rose-400">₹{remainingDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Switch to preview button for mobile */}
          <button
            onClick={() => setMobileTab('preview')}
            className="w-full lg:hidden py-3 px-4 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <Eye className="w-4 h-4" />
            <span>{isBn ? 'প্রিভিউ দেখুন ও PDF বানান →' : 'View Preview & Generate PDF →'}</span>
          </button>

        </div>

        {/* RIGHT COLUMN: Live Printable Document Sheet (7 Cols on Desktop, conditionally shown on mobile) */}
        <div className={`lg:col-span-7 flex justify-center bg-slate-200/80 p-2 sm:p-4 rounded-3xl overflow-x-auto shadow-inner ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          
          {/* Printable Invoice Paper (A4-Proportioned with High-Definition Razor-Sharp Typography & Styling) */}
          <div 
            ref={invoicePrintRef}
            className="bg-white text-slate-950 w-full min-w-[650px] max-w-[700px] p-6 sm:p-8 shadow-2xl rounded-sm border-2 border-slate-300 font-sans relative antialiased"
            style={{ 
              minHeight: '920px',
              WebkitFontSmoothing: 'antialiased',
              textRendering: 'geometricPrecision'
            }}
          >
            
            {/* Header: Logo, Agency Name & Contact */}
            <div className="flex justify-between items-start pb-4 border-b-2 border-blue-950 gap-4">
              
              {/* Left Brand Identity */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-950 text-white flex items-center justify-center font-black shadow-md shrink-0">
                    <CarIcon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-blue-950 tracking-tight leading-none">
                      CHOLO JAI
                    </h2>
                    <p className="text-xs font-black text-blue-900 tracking-wider pt-0.5">
                      TOUR & TRAVELS
                    </p>
                  </div>
                </div>

                <p className="text-[12px] font-bold text-slate-800 font-bengali pt-1">
                  চলো যাই ট্যুর এণ্ড ট্রাভেলস্ • সর্বভারতীয় কার রেন্টাল সার্ভিস
                </p>
                <p className="text-[11px] text-slate-600 font-semibold leading-tight">
                  কাড়ালাঘাট : জামালপুর : পূর্ব বর্ধমান, পশ্চিমবঙ্গ - ৭১৩৪০৮
                </p>
              </div>

              {/* Right Invoice Meta & Phone */}
              <div className="text-right space-y-1">
                <span className="inline-block px-3 py-1 rounded-md bg-blue-950 text-white text-[11px] font-black uppercase tracking-wider">
                  OFFICIAL TRIP INVOICE
                </span>
                <p className="text-xs font-bold text-slate-900">
                  <span className="text-slate-600 font-semibold">Bill No:</span> {invoice.invoiceNumber}
                </p>
                <p className="text-xs font-bold text-slate-900">
                  <span className="text-slate-600 font-semibold">Date:</span> {invoice.invoiceDate}
                </p>
                <p className="text-xs font-black text-blue-950 pt-0.5">
                  📞 {BUSINESS_INFO.phone1} / {BUSINESS_INFO.phone2}
                </p>
              </div>
            </div>

            {/* Customer & Route Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-300 text-xs">
              
              {/* Passenger Info */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black text-blue-950 uppercase tracking-wider">
                  BILLED TO (যাত্রী বিবরণ)
                </span>
                <p className="font-black text-sm text-slate-950">{invoice.customerName}</p>
                <p className="font-bold text-blue-900">📱 {invoice.customerPhone}</p>
                <p className="text-[11px] text-slate-700 font-medium">{invoice.customerAddress}</p>
              </div>

              {/* Journey Details */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black text-blue-950 uppercase tracking-wider">
                  JOURNEY & VEHICLE (ভ্রমণ ও গাড়ি)
                </span>
                <p className="font-black text-slate-950">
                  {invoice.pickupLocation} <span className="text-blue-700">➔</span> {invoice.dropLocation}
                </p>
                <p className="font-bold text-slate-800">
                  🚗 {invoice.carName} ({invoice.isAc ? 'AC' : 'Non-AC'})
                </p>
                <p className="text-[11px] text-slate-700 font-medium">
                  📅 {invoice.tripStartDate} • {invoice.tripType}
                </p>
              </div>

            </div>

            {/* Itemized Table of Charges */}
            <div className="py-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-950 text-white font-bold">
                    <th className="p-2.5 text-left rounded-l-lg">SL.</th>
                    <th className="p-2.5 text-left">Description / সেবা বিবরণ</th>
                    <th className="p-2.5 text-center">Type / Route</th>
                    <th className="p-2.5 text-right rounded-r-lg">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  
                  {/* Base Fare */}
                  <tr>
                    <td className="p-2.5 font-bold text-slate-600">1</td>
                    <td className="p-2.5 font-bold text-slate-950">
                      Vehicle Hire Charges (মূল গাড়ি ভাড়া)
                      <div className="text-[10px] font-medium text-slate-600">
                        {invoice.carName} • Fuel & Chauffeur Included
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-semibold text-slate-700">{invoice.tripType}</td>
                    <td className="p-2.5 text-right font-black text-slate-950">
                      ₹{Number(invoice.baseFare).toFixed(2)}
                    </td>
                  </tr>

                  {/* Toll / Parking */}
                  {Number(invoice.tollParkingAmount) > 0 && (
                    <tr>
                      <td className="p-2.5 font-bold text-slate-600">2</td>
                      <td className="p-2.5 font-bold text-slate-950">
                        Fastag Toll & Airport / Station Parking
                      </td>
                      <td className="p-2.5 text-center font-semibold text-slate-700">Highway & Tolls</td>
                      <td className="p-2.5 text-right font-black text-slate-950">
                        ₹{Number(invoice.tollParkingAmount).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Driver Allowance */}
                  {Number(invoice.driverAllowance) > 0 && (
                    <tr>
                      <td className="p-2.5 font-bold text-slate-600">3</td>
                      <td className="p-2.5 font-bold text-slate-950">
                        Driver Night Stay & Outstation Allowance
                      </td>
                      <td className="p-2.5 text-center font-semibold text-slate-700">Bata</td>
                      <td className="p-2.5 text-right font-black text-slate-950">
                        ₹{Number(invoice.driverAllowance).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Other charges */}
                  {Number(invoice.otherCharges) > 0 && (
                    <tr>
                      <td className="p-2.5 font-bold text-slate-600">4</td>
                      <td className="p-2.5 font-bold text-slate-950">
                        {invoice.otherChargesDescription || 'Permit / Entry Tax'}
                      </td>
                      <td className="p-2.5 text-center font-semibold text-slate-700">Extra</td>
                      <td className="p-2.5 text-right font-black text-slate-950">
                        ₹{Number(invoice.otherCharges).toFixed(2)}
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

            {/* Financial Summary & Payment Badges */}
            <div className="grid grid-cols-2 gap-4 pt-2 pb-4 border-t border-slate-300">
              
              {/* Payment Details */}
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-black text-slate-600 uppercase">Payment Method</p>
                  <p className="font-extrabold text-slate-900">
                    💳 {invoice.paymentMode}
                  </p>
                  <p className="text-[11px] text-slate-700 font-medium">
                    PhonePe / GPay / Paytm: <span className="font-bold text-blue-950">{BUSINESS_INFO.phone1}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                    invoice.paymentStatus === 'Paid in Full' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                    invoice.paymentStatus === 'Advance Paid' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                    'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    ● {invoice.paymentStatus}
                  </span>
                  <span className="text-[11px] text-slate-600 font-semibold">
                    Govt. Tourist Permit
                  </span>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700 font-medium">
                  <span>Subtotal (উপমোট):</span>
                  <span className="font-bold text-slate-950">₹{subTotal.toFixed(2)}</span>
                </div>

                {Number(invoice.discountAmount) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-800 font-bold">
                    <span>Discount (ছাড়):</span>
                    <span>- ₹{Number(invoice.discountAmount).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-300 text-sm font-black text-slate-950">
                  <span>Total Fare (মোট মূল্য):</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200 text-blue-950 font-bold">
                  <span>Advance Paid (অগ্রিম জমা):</span>
                  <span>- ₹{Number(invoice.advancePaid).toFixed(2)}</span>
                </div>

                <div className="flex justify-between py-1.5 bg-rose-50 border border-rose-200 px-2 rounded-lg text-rose-900 text-sm font-black">
                  <span>Balance Due (বাকি টাকা):</span>
                  <span>₹{remainingDue.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Terms & Official Seal / Signature Footer */}
            <div className="pt-6 border-t border-slate-300 flex justify-between items-end">
              
              {/* Terms */}
              <div className="space-y-1 max-w-[280px]">
                <p className="text-[10px] font-bold text-slate-600 uppercase">Terms & Conditions</p>
                <p className="text-[9px] text-slate-600 leading-tight font-medium">
                  • 24/7 AC sanitized vehicle with verified commercial chauffeur.
                  • Smoking or alcoholic beverages strictly prohibited in vehicle.
                  • Emergency 24x7 Helpline: {BUSINESS_INFO.phone1}.
                </p>
              </div>

              {/* Official Stamp & Sign */}
              <div className="text-center space-y-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-blue-950 flex flex-col items-center justify-center p-1 text-blue-950 rotate-[-5deg]">
                  <span className="text-[6px] font-black uppercase text-center leading-none">
                    CHOLO JAI TRAVELS
                  </span>
                  <CarIcon className="w-4 h-4 text-blue-950 my-0.5" />
                  <span className="text-[5px] font-black uppercase text-center leading-none">
                    VERIFIED AGENCY
                  </span>
                </div>
                
                <div className="w-32 h-[1px] bg-slate-800 mt-2"></div>
                <p className="text-[10px] font-black text-slate-900">
                  Authorized Signatory
                </p>
                <p className="text-[9px] text-slate-600 font-semibold">
                  Cholo Jai Tour & Travels
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Floating Bottom Action Bar for Mobile Devices */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex sm:hidden gap-2 shadow-2xl">
        <button
          onClick={handleSharePdfToWhatsApp}
          disabled={isGeneratingPdf}
          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isGeneratingPdf ? 'PDF তৈরি হচ্ছে...' : 'হোয়াটসঅ্যাপে পাঠান'}</span>
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="flex-1 py-2.5 px-3 rounded-xl bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>HD PDF ডাউনলোড</span>
        </button>
      </div>

      {/* Share Guidance Modal */}
      {showShareGuideModal && (
        <div className="fixed inset-0 z-70 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {isBn ? 'HD PDF ইনভয়েস প্রস্তুত ও সেভ হয়েছে!' : 'HD PDF Invoice Generated & Saved!'}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{lastDownloadedFilename}</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl space-y-2 text-xs text-emerald-950">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isBn ? 'হোয়াটসঅ্যাপে আসল PDF ফাইল পাঠাতে:' : 'To send the PDF in WhatsApp chat:'}</span>
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pl-1 font-medium">
                <li>{isBn ? 'হোয়াটসঅ্যাপ চ্যাটে মেসেজ ও বিবরণ অলরেডি পৌঁছে গেছে।' : 'WhatsApp chat opened with trip details.'}</li>
                <li>{isBn ? 'চ্যাটের নিচের 📎 (Attach) আইকনে চাপুন।' : 'Click the 📎 (Paperclip / Attach) icon in chat.'}</li>
                <li>{isBn ? 'Document নির্বাচন করে আপনার Downloads ফোল্ডার থেকে ফাইলটি পাঠিয়ে দিন।' : 'Choose "Document" and select the downloaded PDF from your Downloads folder.'}</li>
              </ol>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isBn ? 'আবার ডাউনলোড করুন' : 'Download Again'}</span>
              </button>
              <button
                onClick={() => setShowShareGuideModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                {isBn ? 'ঠিক আছে' : 'Got it'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
