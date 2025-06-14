document.addEventListener('DOMContentLoaded', function() {
    // Initialize i18next
    i18next.init({
        lng: 'en', // default language
        fallbackLng: 'en',
        resources: {
            en: {
                translation: require('../locales/en/translation.json')
            },
            ar: {
                translation: require('../locales/ar/translation.json')
            }
        }
    });

    const form = document.getElementById('signup-form');
    const submitBtn = document.getElementById('submitBtn');
    const inputs = form.querySelectorAll('input[required]');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');

    // Update text content with translations
    function updateTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = i18next.t(key);
        });
    }

    // Update error messages with translations
    function updateErrorMessages() {
        if (passwordError.style.display === 'block') {
            passwordError.textContent = i18next.t('loginPage.passwordError');
        }
        if (phoneError.style.display === 'block') {
            phoneError.textContent = i18next.t('loginPage.phoneError');
        }
    }

    function checkFormValidity() {
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
            }
        });
        
        if (passwordInput.value !== confirmPasswordInput.value) {
            passwordError.style.display = 'block';
            passwordError.textContent = i18next.t('loginPage.passwordError');
            isValid = false;
        } else {
            passwordError.style.display = 'none';
        }
        
        const phoneRegex = /^(10|11|12|15)\d{8}$/;
        if (!phoneRegex.test(phoneInput.value)) {
            phoneError.style.display = 'block';
            phoneError.textContent = i18next.t('loginPage.phoneError');
            isValid = false;
        } else {
            phoneError.style.display = 'none';
        }
        
        submitBtn.disabled = !isValid;
    }

    inputs.forEach(input => {
        input.addEventListener('input', checkFormValidity);
    });

    confirmPasswordInput.addEventListener('input', function() {
        if (passwordInput.value !== this.value) {
            passwordError.style.display = 'block';
            passwordError.textContent = i18next.t('loginPage.passwordError');
        } else {
            passwordError.style.display = 'none';
        }
        checkFormValidity();
    });

    phoneInput.addEventListener('input', function() {
        const phoneRegex = /^(10|11|12|15)\d{8}$/;
        if (this.value && !phoneRegex.test(this.value)) {
            phoneError.style.display = 'block';
            phoneError.textContent = i18next.t('loginPage.phoneError');
        } else {
            phoneError.style.display = 'none';
        }
        checkFormValidity();
    });

    form.addEventListener('submit', function(e) {
        checkFormValidity();
        
        if (!submitBtn.disabled) {
            const hiddenPhone = document.createElement('input');
            hiddenPhone.type = 'hidden';
            hiddenPhone.name = 'fullPhone';
            hiddenPhone.value = '+20' + phoneInput.value;
            form.appendChild(hiddenPhone);
        }
    });

    // Initial translations
    updateTranslations();
    checkFormValidity();

    // Listen for language changes
    window.addEventListener('languageChanged', function(e) {
        updateTranslations();
        updateErrorMessages();
    });
});