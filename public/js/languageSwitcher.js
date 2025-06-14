// Language Switcher Component
document.addEventListener('DOMContentLoaded', () => {
    const languageSwitcher = document.createElement('div');
    languageSwitcher.className = 'language-switcher';
    languageSwitcher.innerHTML = `
        <button onclick="changeLanguage('en')" class="lang-btn" data-lang="en">
            <span class="lang-icon">🇬🇧</span>
            <span class="lang-text">EN</span>
        </button>
        <div class="divider"></div>
        <button onclick="changeLanguage('ar')" class="lang-btn" data-lang="ar">
            <span class="lang-icon">🇸🇦</span>
            <span class="lang-text">عربي</span>
        </button>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .language-switcher {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            display: flex;
            align-items: center;
            background: linear-gradient(145deg, #ffffff, #f5f5f5);
            padding: 4px;
            border-radius: 50px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.8);
        }
        .lang-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            border: none;
            border-radius: 50px;
            background: transparent;
            color: #666;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
        }
        .lang-btn:hover {
            color: #007bff;
            background: rgba(0, 123, 255, 0.05);
        }
        .lang-btn.active {
            background: #007bff;
            color: white;
        }
        .lang-icon {
            font-size: 14px;
        }
        .lang-text {
            font-family: 'Inter', sans-serif;
            letter-spacing: 0.5px;
        }
        .divider {
            width: 1px;
            height: 20px;
            background: rgba(0, 0, 0, 0.1);
            margin: 0 2px;
        }
        @media (max-width: 768px) {
            .language-switcher {
                bottom: 15px;
                left: 15px;
                padding: 3px;
            }
            .lang-btn {
                padding: 5px 10px;
            }
            .lang-text {
                font-size: 12px;
            }
        }
    `;
    document.head.appendChild(style);

    // Add to body
    document.body.appendChild(languageSwitcher);

    // Set initial active state
    const currentLang = i18next.language || 'en';
    document.querySelector(`.lang-btn[data-lang="${currentLang}"]`).classList.add('active');
});

// Function to change language
function changeLanguage(lng) {
    i18next.changeLanguage(lng, (err, t) => {
        if (err) return console.log('Error changing language:', err);
        updateContent();
        
        // Update active state
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.lang-btn[data-lang="${lng}"]`).classList.add('active');
    });
}

// Function to update content
function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = i18next.t(key);
    });
} 