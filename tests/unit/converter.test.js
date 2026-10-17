/**
 * Unit Tests for BanglaConverter (js/converter.js)
 * Tests digit translation, number-to-words currency generation, and date formatting.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const BanglaConverter = require('../../js/converter.js');

describe('BanglaConverter - Digit Conversion', () => {
  it('converts English digits to Bengali digits', () => {
    assert.equal(BanglaConverter.toBengaliDigits('0123456789'), '০১২৩৪৫৬৭৮৯');
    assert.equal(BanglaConverter.toBengaliDigits(50000), '৫০০০০');
    assert.equal(BanglaConverter.toBengaliDigits('Rent: $1500 per month'), 'Rent: $১৫০০ per month');
  });

  it('handles null, undefined, and empty values gracefully in toBengaliDigits', () => {
    assert.equal(BanglaConverter.toBengaliDigits(''), '');
    assert.equal(BanglaConverter.toBengaliDigits(null), '');
    assert.equal(BanglaConverter.toBengaliDigits(undefined), '');
  });

  it('converts Bengali digits to English digits', () => {
    assert.equal(BanglaConverter.toEnglishDigits('০১২৩৪৫৬৭৮৯'), '0123456789');
    assert.equal(BanglaConverter.toEnglishDigits('ভাড়া ২৫,০০০ টাকা'), 'ভাড়া 25,000 টাকা');
  });

  it('handles null, undefined, and empty values gracefully in toEnglishDigits', () => {
    assert.equal(BanglaConverter.toEnglishDigits(''), '');
    assert.equal(BanglaConverter.toEnglishDigits(null), '');
    assert.equal(BanglaConverter.toEnglishDigits(undefined), '');
  });
});

describe('BanglaConverter - amountToBanglaWords', () => {
  it('converts 1 to 99 correctly', () => {
    assert.equal(BanglaConverter.amountToBanglaWords(1), 'এক টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(10), 'দশ টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(21), 'একুশ টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(99), 'নিরানব্বই টাকা মাত্র');
  });

  it('converts hundreds correctly', () => {
    assert.equal(BanglaConverter.amountToBanglaWords(100), 'এক শত টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(550), 'পাঁচ শত পঞ্চাশ টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(999), 'নয় শত নিরানব্বই টাকা মাত্র');
  });

  it('converts thousands correctly', () => {
    assert.equal(BanglaConverter.amountToBanglaWords(1000), 'এক হাজার টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(15000), 'পনেরো হাজার টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(25000), 'পঁচিশ হাজার টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(99000), 'নিরানব্বই হাজার টাকা মাত্র');
  });

  it('converts lakhs correctly (Bangladeshi currency format)', () => {
    assert.equal(BanglaConverter.amountToBanglaWords(100000), 'এক লক্ষ টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(550000), 'পাঁচ লক্ষ পঞ্চাশ হাজার টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(9900000), 'নিরানব্বই লক্ষ টাকা মাত্র');
  });

  it('converts crores correctly', () => {
    assert.equal(BanglaConverter.amountToBanglaWords(10000000), 'এক কোটি টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(25000000), 'দুই কোটি পঞ্চাশ লক্ষ টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords(100000000), 'দশ কোটি টাকা মাত্র');
  });

  it('converts multi-tiered complex figures accurately', () => {
    // 1,23,45,678 -> এক কোটি তেইশ লক্ষ পঁয়তাল্লিশ হাজার ছয় শত আটাত্তর টাকা মাত্র
    const words = BanglaConverter.amountToBanglaWords(12345678);
    assert.equal(words, 'এক কোটি তেইশ লক্ষ পঁয়তাল্লিশ হাজার ছয় শত আটাত্তর টাকা মাত্র');
  });

  it('handles strings with commas and Bengali digits', () => {
    assert.equal(BanglaConverter.amountToBanglaWords('২৫,০০০'), 'পঁচিশ হাজার টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords('১,৫০,০০০'), 'এক লক্ষ পঞ্চাশ হাজার টাকা মাত্র');
    assert.equal(BanglaConverter.amountToBanglaWords('1,00,000'), 'এক লক্ষ টাকা মাত্র');
  });

  it('handles boundary and invalid amounts safely without throwing', () => {
    assert.equal(BanglaConverter.amountToBanglaWords(''), '');
    assert.equal(BanglaConverter.amountToBanglaWords(null), '');
    assert.equal(BanglaConverter.amountToBanglaWords(undefined), '');
    assert.equal(BanglaConverter.amountToBanglaWords('abc'), '');
    // Note: Due to regex /[^0-9]/ stripping all non-digits, negative signs are stripped:
    assert.equal(BanglaConverter.amountToBanglaWords('-500'), 'পাঁচ শত টাকা মাত্র');
  });
});

describe('BanglaConverter - formatBanglaDate', () => {
  it('formats ISO dates into Bengali month and year format', () => {
    assert.equal(BanglaConverter.formatBanglaDate('2026-01-01'), '০১ জানুয়ারি, ২০২৬ খ্রিষ্টাব্দ');
    assert.equal(BanglaConverter.formatBanglaDate('2026-02-21'), '২১ ফেব্রুয়ারি, ২০২৬ খ্রিষ্টাব্দ');
    assert.equal(BanglaConverter.formatBanglaDate('2026-12-16'), '১৬ ডিসেম্বর, ২০২৬ খ্রিষ্টাব্দ');
  });

  it('handles Date objects as input', () => {
    const d = new Date(2026, 2, 26); // March 26, 2026
    assert.equal(BanglaConverter.formatBanglaDate(d), '২৬ মার্চ, ২০২৬ খ্রিষ্টাব্দ');
  });

  it('returns empty string on invalid or missing date inputs', () => {
    assert.equal(BanglaConverter.formatBanglaDate(''), '');
    assert.equal(BanglaConverter.formatBanglaDate(null), '');
    assert.equal(BanglaConverter.formatBanglaDate(undefined), '');
    assert.equal(BanglaConverter.formatBanglaDate('not-a-valid-date'), '');
  });
});
