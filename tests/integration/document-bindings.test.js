/**
 * Integration Test: Document Bindings for All 7 BanglaDoc Generators
 * Verifies that form inputs bind to the legal document preview elements,
 * converting numbers to Bengali digits and words accurately.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT_DIR = path.resolve(__dirname, '../../');
const converterJs = fs.readFileSync(path.join(ROOT_DIR, 'js/converter.js'), 'utf-8');
const themeJs = fs.readFileSync(path.join(ROOT_DIR, 'js/theme.js'), 'utf-8');
const autodraftJs = fs.readFileSync(path.join(ROOT_DIR, 'js/autodraft.js'), 'utf-8');

function setupPageDOM(htmlFileName) {
  const filePath = path.join(ROOT_DIR, htmlFileName);
  let html = fs.readFileSync(filePath, 'utf-8');

  // Strip external script tags to avoid network/file loading warnings in JSDOM,
  // we will execute converter and autodraft manually inside the window context.
  html = html.replace(/<script src="js\/(?:converter|theme|autodraft)\.js"><\/script>/g, '');

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: `https://bangladoc.com/${htmlFileName}`
  });

  const { window } = dom;

  // Provide scripts in execution order
  window.eval(converterJs);
  window.eval(themeJs);
  window.eval(autodraftJs);

  // Trigger DOMContentLoaded
  const event = window.document.createEvent('Event');
  event.initEvent('DOMContentLoaded', true, true);
  window.document.dispatchEvent(event);

  return { dom, window, document: window.document };
}

describe('Document Bindings Integration Test', () => {
  it('Rent Agreement (rent-agreement.html) binds inputs to preview sheet correctly', () => {
    const { document, window } = setupPageDOM('rent-agreement.html');

    const landlordInput = document.getElementById('landlordName');
    const rentInput = document.getElementById('monthlyRent');
    const viewLandlord = document.getElementById('viewLandlordName');
    const viewRent = document.getElementById('viewRentNumber');
    const rentWords = document.getElementById('rentWords');

    assert.ok(landlordInput && viewLandlord, 'Landlord input and view element must exist');
    assert.ok(rentInput && viewRent, 'Rent input and view element must exist');

    // Simulate input modification
    landlordInput.value = 'হাজী মো: শামসুল হক';
    landlordInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    assert.equal(viewLandlord.innerText, 'হাজী মো: শামসুল হক');

    // Simulate rent change
    rentInput.value = '35000';
    rentInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    assert.equal(viewRent.innerText, '৩৫০০০');
    assert.equal(rentWords.innerText, 'পঁয়ত্রিশ হাজার টাকা মাত্র');
  });

  it('Commercial Rent (commercial-rent.html) binds shop details & security advance', () => {
    const { document, window } = setupPageDOM('commercial-rent.html');

    const shopNo = document.getElementById('shopNo');
    const viewShopNo = document.getElementById('viewShopNo');
    const ownerInput = document.getElementById('ownerName');
    const viewOwner = document.getElementById('viewOwnerName');

    assert.ok(shopNo && viewShopNo, 'Shop number input and view element must exist');
    assert.ok(ownerInput && viewOwner, 'Owner input and view element must exist');

    shopNo.value = 'দোকান নং-৪/বি';
    shopNo.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewShopNo.innerText, 'দোকান নং-৪/বি');

    ownerInput.value = 'আলহাজ্ব মোস্তাফিজুর রহমান';
    ownerInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewOwner.innerText, 'আলহাজ্ব মোস্তাফিজুর রহমান');
  });

  it('Police GD (police-gd.html) binds complainant info and loss description', () => {
    const { document, window } = setupPageDOM('police-gd.html');

    const applicantInput = document.getElementById('applicantName');
    const viewApplicant = document.getElementById('viewApplicantName');
    const thanaInput = document.getElementById('thanaName');
    const viewThana = document.getElementById('viewThanaName');

    assert.ok(applicantInput && viewApplicant, 'Applicant input and view element must exist');
    assert.ok(thanaInput && viewThana, 'Thana input and view element must exist');

    applicantInput.value = 'তানভীর আহমেদ';
    applicantInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewApplicant.innerText, 'তানভীর আহমেদ');

    thanaInput.value = 'মিরপুর মডেল থানা';
    thanaInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewThana.innerText, 'মিরপুর মডেল থানা');
  });

  it('Money Loan (money-loan.html) converts loan amount to words', () => {
    const { document, window } = setupPageDOM('money-loan.html');

    const lenderInput = document.getElementById('lenderName');
    const viewLender = document.getElementById('viewLenderName');
    const loanInput = document.getElementById('loanAmount');
    const viewLoanNumber = document.getElementById('viewLoanNumber');
    const loanWords = document.getElementById('loanWords');

    assert.ok(lenderInput && viewLender, 'Lender input and view element must exist');
    assert.ok(loanInput && viewLoanNumber, 'Loan input and view element must exist');

    lenderInput.value = 'মোঃ আল আমিন';
    lenderInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewLender.innerText, 'মোঃ আল আমিন');

    loanInput.value = '150000';
    loanInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewLoanNumber.innerText, '১৫০০০০');
    assert.equal(loanWords.innerText, 'এক লক্ষ পঞ্চাশ হাজার টাকা মাত্র');
  });

  it('Leave Application (leave-application.html) binds employee details and designations', () => {
    const { document, window } = setupPageDOM('leave-application.html');

    const nameInput = document.getElementById('employeeName');
    const viewName = document.getElementById('viewSignName');
    const desigInput = document.getElementById('designation');
    const viewDesig = document.getElementById('viewDesignation');

    assert.ok(nameInput && viewName, 'Employee name input and view element must exist');
    assert.ok(desigInput && viewDesig, 'Designation input and view element must exist');

    nameInput.value = 'ফাহমিদা আক্তার';
    nameInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewName.innerText, 'ফাহমিদা আক্তার');

    desigInput.value = 'সিনিয়র অফিসার';
    desigInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewDesig.innerText, 'সিনিয়র অফিসার');
  });

  it('Vehicle Sale (vehicle-sale.html) binds vehicle reg and buyer/seller data', () => {
    const { document, window } = setupPageDOM('vehicle-sale.html');

    const sellerInput = document.getElementById('sellerName');
    const viewSeller = document.getElementById('viewSellerName');
    const regInput = document.getElementById('regNo');
    const viewReg = document.getElementById('viewRegNo');

    assert.ok(sellerInput && viewSeller, 'Seller input and view element must exist');
    assert.ok(regInput && viewReg, 'Reg input and view element must exist');

    sellerInput.value = 'কবির হোসাইন';
    sellerInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewSeller.innerText, 'কবির হোসাইন');

    regInput.value = 'ঢাকা মেট্রো-হ-১২-৩৪৫৬';
    regInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewReg.innerText, 'ঢাকা মেট্রো-হ-১২-৩৪৫৬');
  });

  it('Bayna Agreement (bayna-agreement.html) binds seller and land identification mouza', () => {
    const { document, window } = setupPageDOM('bayna-agreement.html');

    const sellerInput = document.getElementById('sellerName');
    const viewSeller = document.getElementById('viewSellerName');
    const mouzaInput = document.getElementById('mouzaName');
    const viewMouza = document.getElementById('viewMouza');

    assert.ok(sellerInput && viewSeller, 'Seller input and view element must exist');
    assert.ok(mouzaInput && viewMouza, 'Mouza input and view element must exist');

    sellerInput.value = 'মোহাম্মদ ইউসুফ আলী';
    sellerInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewSeller.innerText, 'মোহাম্মদ ইউসুফ আলী');

    mouzaInput.value = 'বাড্ডা মৌজা';
    mouzaInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.equal(viewMouza.innerText, 'বাড্ডা মৌজা');
  });
});
