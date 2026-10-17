/**
 * BANGLADOC - Theme Manager & Interactive Toast Engine
 */

(function () {
  // Theme initialization
  const storedTheme = localStorage.getItem('bangladoc-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', initialTheme);

  window.toggleTheme = function () {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('bangladoc-theme', newTheme);
    updateThemeIcon(newTheme);
  };

  function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? 'লাইট মোডে পরিবর্তন করুন' : 'ডার্ক মোডে পরিবর্তন করুন');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    updateThemeIcon(currentTheme);
  });

  // Universal Toast Notification
  window.showToast = function (message) {
    let toast = document.getElementById('banglaDocToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'banglaDocToast';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  };

  // Safe Universal Clipboard Copy Helper
  window.copyTextToClipboard = function (text, successMsg) {
    const msg = successMsg || 'দলিল টেক্সট সফলভাবে কপি হয়েছে!';
    const fallback = function () {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {}
      window.showToast(msg);
    };

    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        window.showToast(msg);
      }).catch(() => {
        fallback();
      });
    } else {
      fallback();
    }
  };
})();
