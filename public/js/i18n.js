// i18n.js for browser (with default language override)
(function () {
  // ✅ Step 1: Set default language to 'en' if not stored already
  const savedLang = localStorage.getItem('i18nextLng');
  if (!savedLang) {
    localStorage.setItem('i18nextLng', 'en');
  }

  // ✅ Step 2: Initialize i18next
  i18next
    .use(i18nextHttpBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
      fallbackLng: 'en',
      debug: true,
      backend: {
        loadPath: '/locales/{{lng}}/translation.json',
      },
      interpolation: {
        escapeValue: false,
      }
    }, function (err, t) {
      updateContent(); // Initial content load
    });

  // ✅ Step 3: Define content update logic
  window.updateContent = function () {
    document.querySelectorAll('[data-i18n]').forEach(function (element) {
      var key = element.getAttribute('data-i18n');
      element.textContent = i18next.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (element) {
      var key = element.getAttribute('data-i18n-placeholder');
      element.setAttribute('placeholder', i18next.t(key));
    });

    // Handle RTL direction for Arabic
    if (i18next.language === 'ar') {
      document.body.dir = 'rtl';
    } else {
      document.body.dir = 'ltr';
    }
  };

  // ✅ Step 4: Handle language change
  i18next.on('languageChanged', function () {
    window.updateContent();

    // Dispatch event if other parts need to respond
    var event = new Event('languageChanged');
    window.dispatchEvent(event);
  });
})();
