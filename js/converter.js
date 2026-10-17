/**
 * BANGLADOC - Bangla Currency and Number to Words Converter
 * Converts numeric amounts (both English 0-9 and Bengali ০-৯ digits)
 * into standard formal Bengali legal words (কথায় টাকা).
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BanglaConverter = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  
  const words_0_to_99 = [
    '', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ',
    'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
    'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আঠাশ', 'উনত্রিশ', 'ত্রিশ',
    'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'উনচল্লিশ', 'চল্লিশ',
    'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'উনপঞ্চাশ', 'পঞ্চাশ',
    'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'উনষাট', 'ষাট',
    'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'উনসত্তর', 'সত্তর',
    'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি', 'আশি',
    'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'অষ্টআশি', 'ঊননব্বই', 'নব্বই',
    'একানব্বই', 'বানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'
  ];

  /**
   * Normalizes Bengali digits (০-৯) into English digits (0-9)
   */
  function toEnglishDigits(str) {
    if (!str) return '';
    return String(str).replace(/[০-৯]/g, function (d) {
      return bengaliDigits.indexOf(d);
    });
  }

  /**
   * Converts English digits (0-9) into Bengali digits (০-৯)
   */
  function toBengaliDigits(num) {
    if (num === null || num === undefined) return '';
    return String(num).replace(/[0-9]/g, function (d) {
      return bengaliDigits[parseInt(d, 10)];
    });
  }

  /**
   * Internal recursive function to convert a positive integer into Bengali words
   */
  function convertUnderCrore(num) {
    let result = '';
    
    // Lakh (লক্ষ) - 1,00,000
    if (num >= 100000) {
      const lakh = Math.floor(num / 100000);
      result += words_0_to_99[lakh] + ' লক্ষ ';
      num %= 100000;
    }
    
    // Thousand (হাজার) - 1,000
    if (num >= 1000) {
      const thousand = Math.floor(num / 1000);
      result += words_0_to_99[thousand] + ' হাজার ';
      num %= 1000;
    }
    
    // Hundred (শত) - 100
    if (num >= 100) {
      const hundred = Math.floor(num / 100);
      result += words_0_to_99[hundred] + ' শত ';
      num %= 100;
    }
    
    // Remainder 1-99
    if (num > 0) {
      result += words_0_to_99[num] + ' ';
    }
    
    return result.trim();
  }

  /**
   * Main function: Converts any number or numeric string to standard Bengali currency in words
   * @param {number|string} amount - e.g. 25000, "50000", "৫০,০০০"
   * @returns {string} e.g. "পঁচিশ হাজার টাকা মাত্র"
   */
  function amountToBanglaWords(amount) {
    if (!amount) return '';
    
    // Clean input (remove commas, spaces, currency symbols)
    const cleaned = toEnglishDigits(String(amount)).replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10);
    
    if (isNaN(num) || num <= 0) return '';
    if (num === 0) return 'শূন্য টাকা মাত্র';
    
    let words = '';
    let remaining = num;
    
    // Crore (কোটি) - 1,00,00,000
    if (remaining >= 10000000) {
      const crore = Math.floor(remaining / 10000000);
      words += convertUnderCrore(crore) + ' কোটি ';
      remaining %= 10000000;
    }
    
    if (remaining > 0) {
      words += convertUnderCrore(remaining) + ' ';
    }
    
    return words.trim() + ' টাকা মাত্র';
  }

  /**
   * Converts a standard ISO date (YYYY-MM-DD) or Date object into formal Bengali text
   * e.g., "০১, জানুয়ারি ২০২৬ ইং"
   */
  const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  function formatBanglaDate(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    
    const day = toBengaliDigits(String(d.getDate()).padStart(2, '0'));
    const month = banglaMonths[d.getMonth()];
    const year = toBengaliDigits(d.getFullYear());
    
    return `${day} ${month}, ${year} খ্রিষ্টাব্দ`;
  }

  return {
    amountToBanglaWords,
    toBengaliDigits,
    toEnglishDigits,
    formatBanglaDate
  };
}));
