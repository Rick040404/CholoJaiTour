/**
 * Bengali Calendar (বঙ্গাব্দ) and Date Utilities
 * Precise West Bengal (Gupta Press / Bishuddho Siddhanto Panjika) Calendar Converter
 */

export const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const toBengaliNumber = (num: number | string): string => {
  return num
    .toString()
    .split('')
    .map(char => {
      const digit = parseInt(char, 10);
      return !isNaN(digit) ? BENGALI_DIGITS[digit] : char;
    })
    .join('');
};

export const BENGALI_MONTHS = [
  'বৈশাখ',    // 0: Boishakh (starts Apr 15)
  'জ্যৈষ্ঠ',    // 1: Jaishtha (starts May 16)
  'আষাঢ়',    // 2: Asharh (starts Jun 16)
  'শ্রাবণ',    // 3: Shrabon (starts Jul 17)
  'ভাদ্র',     // 4: Bhadra (starts Aug 18)
  'আশ্বিন',    // 5: Ashwin (starts Sep 18)
  'কার্তিক',   // 6: Kartik (starts Oct 18)
  'অগ্রহায়ণ',  // 7: Agrahayan (starts Nov 17)
  'পৌষ',      // 8: Poush (starts Dec 17)
  'মাঘ',      // 9: Magh (starts Jan 16)
  'ফাল্গুন',    // 10: Falgun (starts Feb 14)
  'চৈত্র'      // 11: Chaitra (starts Mar 15)
];

export const BENGALI_WEEKDAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার'
];

export const ENGLISH_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface BengaliDateInfo {
  day: number;
  dayBn: string;
  month: string;
  monthIndex: number;
  year: number;
  yearBn: string;
  weekday: string;
  weekdayEn: string;
  formattedBn: string;
  formattedEn: string;
  gregorianDateStr: string;
}

/**
 * Calculates accurate Bengali date for a given Gregorian date
 * Uses standard West Bengal / Surya Siddhanta (Gupta Press Panjika) solar calendar
 */
export function getBengaliDate(date: Date = new Date()): BengaliDateInfo {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth(); // 0-11
  const gDate = date.getDate();
  const dayOfWeek = date.getDay();

  const isGregorianLeapYear = (gYear % 4 === 0 && gYear % 100 !== 0) || (gYear % 400 === 0);

  let bYear = gYear - 593;
  let bMonthIndex = 0;
  let bDay = 1;

  // Exact West Bengal (Indian) Panjika Mapping:
  switch (gMonth) {
    case 0: // January
      bYear = gYear - 594;
      if (gDate <= 15) {
        bMonthIndex = 8; // Poush
        bDay = gDate + 16;
      } else {
        bMonthIndex = 9; // Magh
        bDay = gDate - 15;
      }
      break;

    case 1: // February
      bYear = gYear - 594;
      if (gDate <= 13) {
        bMonthIndex = 9; // Magh
        bDay = gDate + 16;
      } else {
        bMonthIndex = 10; // Falgun
        bDay = gDate - 13;
      }
      break;

    case 2: // March
      bYear = gYear - 594;
      const febOffset = isGregorianLeapYear ? 15 : 14;
      if (gDate <= 14) {
        bMonthIndex = 10; // Falgun
        bDay = gDate + febOffset;
      } else {
        bMonthIndex = 11; // Chaitra
        bDay = gDate - 14;
      }
      break;

    case 3: // April
      if (gDate <= 14) {
        bYear = gYear - 594;
        bMonthIndex = 11; // Chaitra
        bDay = gDate + 17;
      } else {
        bYear = gYear - 593;
        bMonthIndex = 0; // Boishakh
        bDay = gDate - 14;
      }
      break;

    case 4: // May
      if (gDate <= 15) {
        bMonthIndex = 0; // Boishakh
        bDay = gDate + 16;
      } else {
        bMonthIndex = 1; // Jaishtha
        bDay = gDate - 15;
      }
      break;

    case 5: // June
      if (gDate <= 15) {
        bMonthIndex = 1; // Jaishtha
        bDay = gDate + 16;
      } else {
        bMonthIndex = 2; // Asharh
        bDay = gDate - 15;
      }
      break;

    case 6: // July
      if (gDate <= 16) {
        bMonthIndex = 2; // Asharh
        bDay = gDate + 15;
      } else {
        bMonthIndex = 3; // Shrabon
        bDay = gDate - 16;
      }
      break;

    case 7: // August
      if (gDate <= 17) {
        bMonthIndex = 3; // Shrabon (ends on Aug 17)
        bDay = gDate + 15; // 17 Aug = 32 Shrabon / 16 Aug = 31 Shrabon
      } else {
        bMonthIndex = 4; // Bhadra (starts on Aug 18)
        bDay = gDate - 17; // 18 Aug = 1 Bhadra
      }
      break;

    case 8: // September
      if (gDate <= 17) {
        bMonthIndex = 4; // Bhadra
        bDay = gDate + 14;
      } else {
        bMonthIndex = 5; // Ashwin
        bDay = gDate - 17;
      }
      break;

    case 9: // October
      if (gDate <= 17) {
        bMonthIndex = 5; // Ashwin
        bDay = gDate + 13;
      } else {
        bMonthIndex = 6; // Kartik
        bDay = gDate - 17;
      }
      break;

    case 10: // November
      if (gDate <= 16) {
        bMonthIndex = 6; // Kartik
        bDay = gDate + 14;
      } else {
        bMonthIndex = 7; // Agrahayan
        bDay = gDate - 16;
      }
      break;

    case 11: // December
      if (gDate <= 16) {
        bMonthIndex = 7; // Agrahayan
        bDay = gDate + 14;
      } else {
        bMonthIndex = 8; // Poush
        bDay = gDate - 16;
      }
      break;
  }

  // Suffix for Bengali day (১লা, ২রা, ৩রা, ৪ঠা, ৫ই ... ৩১শে, ৩২শে)
  let daySuffix = 'ই';
  if (bDay === 1) daySuffix = 'লা';
  else if (bDay === 2 || bDay === 3) daySuffix = 'রা';
  else if (bDay === 4) daySuffix = 'ঠা';
  else if (bDay >= 5 && bDay <= 18) daySuffix = 'ই';
  else if (bDay >= 19 && bDay <= 32) daySuffix = 'শে';

  const dayBn = `${toBengaliNumber(bDay)}${daySuffix}`;
  const yearBn = toBengaliNumber(bYear);
  const weekday = BENGALI_WEEKDAYS[dayOfWeek];
  const weekdayEn = ENGLISH_WEEKDAYS[dayOfWeek];
  const monthNameBn = BENGALI_MONTHS[bMonthIndex];

  const formattedBn = `${dayBn} ${monthNameBn}, ${yearBn} বঙ্গাব্দ (${weekday})`;
  const formattedEn = `${date.getDate()} ${ENGLISH_MONTHS[gMonth]} ${gYear}, ${weekdayEn}`;
  const gregorianDateStr = `${gYear}-${String(gMonth + 1).padStart(2, '0')}-${String(gDate).padStart(2, '0')}`;

  return {
    day: bDay,
    dayBn,
    month: monthNameBn,
    monthIndex: bMonthIndex,
    year: bYear,
    yearBn,
    weekday,
    weekdayEn,
    formattedBn,
    formattedEn,
    gregorianDateStr
  };
}

/**
 * Returns date objects for 4 consecutive days: Today, Tomorrow, Day+2, Day+3
 */
export function getUpcoming4Days(): Array<{
  offset: number;
  labelEn: string;
  labelBn: string;
  dateObj: Date;
  dateStr: string; // YYYY-MM-DD
  bengaliInfo: BengaliDateInfo;
}> {
  const days = [
    { offset: 0, labelEn: 'Today', labelBn: 'আজ' },
    { offset: 1, labelEn: 'Tomorrow', labelBn: 'আগামীকাল' },
    { offset: 2, labelEn: 'Day after Tomorrow', labelBn: 'পরশু' },
    { offset: 3, labelEn: 'In 3 Days', labelBn: 'তরশু' }
  ];

  return days.map(d => {
    const date = new Date();
    date.setDate(date.getDate() + d.offset);
    const bInfo = getBengaliDate(date);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    return {
      offset: d.offset,
      labelEn: d.labelEn,
      labelBn: d.labelBn,
      dateObj: date,
      dateStr,
      bengaliInfo: bInfo
    };
  });
}

/**
 * Format a string date (YYYY-MM-DD) into Bengali Date String
 */
export function formatStringToBengaliDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const b = getBengaliDate(d);
        return `${b.dayBn} ${b.month}, ${b.yearBn} বঙ্গাব্দ`;
      }
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

/**
 * Get full Bengali Date info from a string date (YYYY-MM-DD)
 */
export function getBengaliDateFromString(dateStr: string): BengaliDateInfo | null {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return getBengaliDate(d);
      }
    }
  } catch (e) {
    // fallback
  }
  return null;
}

/**
 * Format a string date (YYYY-MM-DD) with Bengali weekday and full year info
 */
export function formatFullBengaliDate(dateStr: string): string {
  const b = getBengaliDateFromString(dateStr);
  if (b) {
    return `${b.dayBn} ${b.month}, ${b.yearBn} বঙ্গাব্দ (${b.weekday})`;
  }
  return dateStr;
}
