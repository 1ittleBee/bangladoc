/**
 * BANGLADOC - Universal Conversion & Analytics Tracking Engine
 * Tracks critical conversion actions to Google Analytics 4 (GA4):
 * - PDF Downloads & Exports
 * - Document Printing
 * - File Uploads (PDF Editor)
 * - Digital Signature Applications
 * - WhatsApp Document Sharing
 * - AutoDraft Saves & Restores
 */

(function () {
  'use strict';

  // Universal namespace
  if (typeof window !== 'undefined') {
    window.BanglaDoc = window.BanglaDoc || {};
  }

  const BanglaDocAnalytics = {
    // In-memory log of tracked events for debugging and test verification
    eventLog: [],

    /**
     * Safely dispatch an event to Google Analytics 4 (gtag)
     * @param {string} eventName
     * @param {Object} [params={}]
     */
    trackEvent: function (eventName, params = {}) {
      if (!eventName || typeof eventName !== 'string') {
        console.warn('[BanglaDoc Analytics] Invalid event name:', eventName);
        return false;
      }

      const payload = {
        timestamp: new Date().toISOString(),
        event_name: eventName,
        ...params
      };

      // Record in local log
      this.eventLog.push(payload);

      // Send to GA4 gtag if available
      try {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', eventName, params);
        }
      } catch (err) {
        console.warn('[BanglaDoc Analytics] gtag delivery error:', err);
      }

      return true;
    },

    /**
     * Track PDF Download or Export
     * @param {string} templateName - Name or slug of the document/template
     * @param {number} [pageCount=1] - Number of pages in document
     * @param {string} [format='pdf'] - Export file format
     */
    trackPdfDownload: function (templateName, pageCount = 1, format = 'pdf') {
      return this.trackEvent('pdf_download', {
        template_name: templateName || 'custom_document',
        page_count: pageCount || 1,
        format: format,
        tool: 'bangladoc_pdf'
      });
    },

    /**
     * Track Document Print action
     * @param {string} templateName
     * @param {string} [source='ui_button']
     */
    trackPrint: function (templateName, source = 'ui_button') {
      return this.trackEvent('document_print', {
        template_name: templateName || this.detectCurrentTemplate(),
        trigger_source: source
      });
    },

    /**
     * Track PDF File Upload to PDF Editor
     * @param {number} fileSizeBytes
     * @param {string} fileName
     */
    trackPdfUpload: function (fileSizeBytes = 0, fileName = '') {
      return this.trackEvent('pdf_upload', {
        file_size_kb: Math.round(fileSizeBytes / 1024),
        file_name: fileName || 'uploaded.pdf',
        tool: 'pdf_editor'
      });
    },

    /**
     * Track Digital Signature Application
     * @param {string} [sigType='draw'] - 'draw', 'type', or 'stamp'
     */
    trackSignature: function (sigType = 'draw') {
      return this.trackEvent('digital_signature_added', {
        signature_type: sigType,
        tool: 'pdf_editor'
      });
    },

    /**
     * Track WhatsApp Document Sharing
     * @param {string} templateName
     */
    trackWhatsAppShare: function (templateName) {
      return this.trackEvent('share_whatsapp', {
        template_name: templateName || this.detectCurrentTemplate()
      });
    },

    /**
     * Track Microsoft Word (.doc) Export
     * @param {string} templateName
     */
    trackWordExport: function (templateName) {
      return this.trackEvent('export_word_doc', {
        template_name: templateName || this.detectCurrentTemplate()
      });
    },

    /**
     * Track Form Draft Save
     * @param {string} templateName
     * @param {number} [fieldCount=0]
     */
    trackDraftSave: function (templateName, fieldCount = 0) {
      return this.trackEvent('draft_saved', {
        template_name: templateName || this.detectCurrentTemplate(),
        field_count: fieldCount
      });
    },

    /**
     * Detect current document template from window location or page title
     * @returns {string}
     */
    detectCurrentTemplate: function () {
      if (typeof window === 'undefined' || !window.location) {
        return 'unknown';
      }
      const pathname = window.location.pathname || '';
      const filename = pathname.split('/').pop().replace('.html', '');
      return filename || 'home';
    },

    /**
     * Returns copies of all recorded events
     * @returns {Array}
     */
    getEventHistory: function () {
      return [...this.eventLog];
    },

    /**
     * Clears recorded event log (useful in tests)
     */
    clearEventLog: function () {
      this.eventLog = [];
    },

    /**
     * Automatically bind print interception & global conversion listeners
     */
    initAutoTracking: function () {
      if (typeof window === 'undefined') return;

      const self = this;

      // Automatically track window.print triggers
      if (typeof window.print === 'function' && !window.__bangladocPrintIntercepted) {
        const originalPrint = window.print;
        window.print = function () {
          self.trackPrint(self.detectCurrentTemplate(), 'window.print');
          return originalPrint.apply(this, arguments);
        };
        window.__bangladocPrintIntercepted = true;
      }

      // Also listen to beforeprint event as fallback
      if (typeof window.addEventListener === 'function') {
        window.addEventListener('beforeprint', function () {
          self.trackEvent('system_print_dialog', {
            template_name: self.detectCurrentTemplate()
          });
        });
      }
    }
  };

  // Mount on BanglaDoc namespace
  if (typeof window !== 'undefined') {
    window.BanglaDoc.Analytics = BanglaDocAnalytics;
    // Auto initialize in browser
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        BanglaDocAnalytics.initAutoTracking();
      });
    } else {
      BanglaDocAnalytics.initAutoTracking();
    }
  }

  // CommonJS export for Node.js unit tests
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BanglaDocAnalytics;
  }
})();
