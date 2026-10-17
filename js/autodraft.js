/**
 * BanglaDoc AutoDraft & Mobile Dock Utility
 * Provides:
 * 1. Automatic localStorage persistence for all form inputs
 * 2. Mobile sticky bottom action dock with view toggle and direct print
 * 3. 1-tap WhatsApp sharing of contract summary
 * 4. Toast notifications & reset capabilities
 */

(function () {
  'use strict';

  window.BanglaDoc = window.BanglaDoc || {};

  /**
   * Initializes draft persistence on a form
   * @param {string} formId 
   * @param {string} storageKey 
   * @param {Function} onRestoreCallback 
   */
  window.BanglaDoc.initAutoDraft = function (formId, storageKey, onRestoreCallback) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Check for existing saved draft
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        let restoredCount = 0;
        Object.keys(data).forEach(key => {
          const input = form.elements[key];
          if (input && data[key] !== undefined && data[key] !== '') {
            input.value = data[key];
            restoredCount++;
          }
        });

        if (restoredCount > 0) {
          showDraftBanner(storageKey, formId);
          if (typeof onRestoreCallback === 'function') {
            onRestoreCallback();
          }
        }
      } catch (err) {
        console.warn('AutoDraft restore failed:', err);
      }
    }

    // Debounced auto-save on any change
    let debounceTimer;
    form.addEventListener('input', () => {
      updateDockStatus('সংরক্ষণ হচ্ছে...', true);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        saveFormData(form, storageKey);
        updateDockStatus('খসড়া সুরক্ষিত ✓', false);
      }, 350);
    });
  };

  function saveFormData(form, storageKey) {
    const formData = new FormData(form);
    const obj = {};
    formData.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(storageKey, JSON.stringify(obj));
  }

  function showDraftBanner(storageKey, formId) {
    const container = document.querySelector('.form-panel .panel-header');
    if (!container) return;

    const banner = document.createElement('div');
    banner.className = 'draft-alert-banner';
    banner.id = 'draftAlertBanner';
    banner.innerHTML = `
      <div class="draft-alert-left">
        <span class="draft-pulse-dot"></span>
        <span>আপনার পূর্ববর্তী অসম্পূর্ণ খসড়াটি রিকভার করা হয়েছে।</span>
      </div>
      <button type="button" class="btn-draft-reset" onclick="BanglaDoc.resetDraft('${storageKey}', '${formId}')" title="খসড়া মুছে নতুন শুরু করুন">
        নতুন করে শুরু
      </button>
    `;
    container.parentNode.insertBefore(banner, container.nextSibling);
  }

  window.BanglaDoc.resetDraft = function (storageKey, formId) {
    if (confirm('আপনি কি পূর্ববর্তী খসড়াটি মুছে নতুন করে শুরু করতে চান?')) {
      localStorage.removeItem(storageKey);
      const form = document.getElementById(formId);
      if (form) form.reset();
      const banner = document.getElementById('draftAlertBanner');
      if (banner) banner.remove();
      window.location.reload();
    }
  };

  function updateDockStatus(text, isSaving) {
    const statusText = document.getElementById('dockStatusLabel');
    const pulseDot = document.getElementById('dockPulseDot');
    if (statusText) statusText.innerText = text;
    if (pulseDot) {
      if (isSaving) {
        pulseDot.classList.add('saving');
      } else {
        pulseDot.classList.remove('saving');
      }
    }
  }

  /**
   * Share brief summary via WhatsApp
   */
  window.BanglaDoc.shareViaWhatsApp = function (docTitle) {
    const url = window.location.href;
    const text = `আমি BanglaDoc (${url}) দিয়ে "${docTitle}"-এর খসড়া তৈরি করেছি। আপনিও সহজে বাংলায় চুক্তিপত্র ও দরখাস্ত তৈরি করতে পারেন।`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

})();
