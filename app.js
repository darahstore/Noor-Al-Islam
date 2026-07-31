// ==========================================
// === المتغيرات الصوتية العامة وبدء فك الحظر ===
// ==========================================
const sebhaClickSound = new Audio('sebha-click.mp3'); 
const adhanAudio = new Audio('adhan.mp3');            
let isAdhanEnabled = true;                            
let lastAdhanPlayedName = "";                         

function unlockAudioContext() {
    [sebhaClickSound, adhanAudio].forEach(sound => {
        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
        }).catch(() => {});
    });
    document.removeEventListener('touchstart', unlockAudioContext);
    document.removeEventListener('click', unlockAudioContext);
}
document.addEventListener('touchstart', unlockAudioContext, { once: true });
document.addEventListener('click', unlockAudioContext, { once: true });

// ==========================================
// محرك حفظ البيانات (Local Storage Manager)
// ==========================================
const StorageManager = {
    state: {
        lang: 'ar', fontSize: 24, soundVib: true, sebhaTheme: 'default',
        sebhaSize: 'md', lastSurahMushaf: 1, country: '', city: '', isProUser: false,
        isDarkMode: false
    },
    load() {
        const saved = localStorage.getItem('nourAlIslamState');
        if (saved) {
            try { this.state = { ...this.state, ...JSON.parse(saved) }; } catch (e) { console.error(e); }
        }
    },
    save() { localStorage.setItem('nourAlIslamState', JSON.stringify(this.state)); },
    update(key, value) { this.state[key] = value; this.save(); }
};

function applySebhaSize(sizeValue) {
    const sizeMap = { 'xs': 0.75, 'sm': 0.88, 'md': 1.0, 'lg': 1.2 };
    const numericSize = sizeMap[sizeValue] || parseFloat(sizeValue) || 1.0;
    const mainContainer = document.getElementById('digital-tally-counter');
    
    if (mainContainer) {
        mainContainer.style.transform = `scale(${numericSize})`;
        mainContainer.style.transformOrigin = 'top center';
        mainContainer.style.transition = 'transform 0.2s ease-in-out';
    }
}

function applyDarkMode() {
    if (StorageManager.state.isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }
}

// ==========================================
// 1. محرك لغات التطبيق
// ==========================================
const Dictionary = {
    ar: { appName: "نور الإسلام", audioTab: "صوتيات", mushafTab: "المصحف", sebhaTab: "المسبحة", azkarTab: "الأذكار", prayerTab: "المواقيت" },
    en: { appName: "Nour Al-Islam", audioTab: "Audio", mushafTab: "Quran", sebhaTab: "Sebha", azkarTab: "Azkar", prayerTab: "Prayer" },
    fr: { appName: "Nour Al-Islam", audioTab: "Audio", mushafTab: "Coran", sebhaTab: "Chapelet", azkarTab: "Azkar", prayerTab: "Prières" }
};

function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const dict = Dictionary[lang] || Dictionary.ar;
    
    const h1 = document.querySelector('h1');
    if (h1) h1.innerText = dict.appName;
    
    const navs = ['audio', 'mushaf', 'sebha', 'azkar', 'prayer'];
    navs.forEach(nav => {
        const el = document.querySelector(`#nav-${nav} span:last-child`);
        if (el) el.innerText = dict[`${nav}Tab`];
    });
    
    StorageManager.update('lang', lang);
}

// ==========================================
// 2. محرك المصحف المكتوب
// ==========================================
const SuwarNames = [
    "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
    "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
    "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
    "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
    "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
    "الصف", "الجُمُعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
    "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
    "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
    "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
    "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
    "المسد", "الإخلاص", "الفلق", "الناس"
];

function initMushafEngine() {
    const selectMushaf = document.getElementById('select-surah-mushaf');
    const mushafContainer = document.getElementById('mushaf-container');
    const mushafHeader = document.getElementById('mushaf-header');
    const surahNameEl = document.getElementById('mushaf-surah-name');
    
    if (!selectMushaf || !mushafContainer) return;

    SuwarNames.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.innerText = `${index + 1}. سورة ${name}`;
        selectMushaf.appendChild(option);
    });

    if (StorageManager.state.lastSurahMushaf) {
        selectMushaf.value = StorageManager.state.lastSurahMushaf;
        fetchSurahText(StorageManager.state.lastSurahMushaf);
    }

    selectMushaf.addEventListener('change', (e) => {
        if (e.target.value) fetchSurahText(e.target.value);
    });

    async function fetchSurahText(surahId) {
        mushafContainer.innerHTML = '<div class="text-center py-10">جاري تحميل السورة...</div>';
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}`);
            const data = await response.json();
            
            if (mushafHeader) mushafHeader.classList.remove('hidden');
            if (surahNameEl) surahNameEl.innerText = `سورة ${data.data.name.replace('سُورَةُ ', '')}`;
            
            const numericSurahId = parseInt(surahId, 10);
            let htmlText = '<div class="quran-text mushaf-page p-6 rounded-xl">';
            
            data.data.ayahs.forEach(ayah => {
                let text = ayah.text;
                if (numericSurahId !== 1 && numericSurahId !== 9 && ayah.numberInSurah === 1) {
                    text = text.replace(/^بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*|^بِسۡمِ\s+ٱللَّهِ\s+ٱلرَّحۡمَٰنِ\s+ٱلرَّحِيمِ\s*/ui, "");
                }
                htmlText += `${text} <span class="ayah-number">۝${ayah.numberInSurah}</span> `;
            });
            htmlText += '</div>';
            
            mushafContainer.innerHTML = htmlText;
            StorageManager.update('lastSurahMushaf', surahId);
            applyFontSize();
        } catch(err) {
            mushafContainer.innerHTML = '<div class="text-center py-10 text-red-500">حدث خطأ في تحميل السورة. تأكد من الاتصال بالإنترنت.</div>';
        }
    }
}

function applyFontSize() {
    const container = document.getElementById('mushaf-container');
    if (container) container.style.fontSize = `${StorageManager.state.fontSize}px`;
    const display = document.getElementById('font-size-display');
    if (display) display.innerText = StorageManager.state.fontSize + 'px';
}

// ==========================================
// 3. محرك مواقيت الصلاة والقبلة
// ==========================================
let countdownInterval = null;

function initPrayerEngine() {
    const selectCountry = document.getElementById('select-country');
    const selectCity = document.getElementById('select-city');

    if (selectCountry) {
        for (const country in LocationsDB) {
            selectCountry.innerHTML += `<option value="${country}">${country}</option>`;
        }
        selectCountry.addEventListener('change', (e) => {
            if (!selectCity) return;
            selectCity.innerHTML = '<option value="">اختر المدينة</option>';
            const cities = LocationsDB[e.target.value] || [];
            cities.forEach(city => { selectCity.innerHTML += `<option value="${city}">${city}</option>`; });
        });
    }

    if (selectCity) {
        selectCity.addEventListener('change', (e) => {
            if (e.target.value && selectCountry && selectCountry.value) {
                fetchPrayerTimesByCity(selectCity.value, selectCountry.value);
            }
        });
    }
}

function updatePrayerUI(timings) {
    ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(p => {
        const el = document.getElementById(`time-${p.toLowerCase()}`);
        if (el) el.innerText = timings[p];
    });
    startCountdown(timings);
}

function startCountdown(timings) {
    if (countdownInterval) clearInterval(countdownInterval);
    
    function update() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        let nextPrayerName = '';
        let nextPrayerTimeMins = 24 * 60;
        const prayerKeys = { 'Fajr': 'الفجر', 'Dhuhr': 'الظهر', 'Asr': 'العصر', 'Maghrib': 'المغرب', 'Isha': 'العشاء' };
        
        for (const [key, arName] of Object.entries(prayerKeys)) {
            if(!timings[key]) continue;
            const [h, m] = timings[key].split(':').map(Number);
            const timeMins = h * 60 + m;
            if (timeMins > currentTime) {
                if (timeMins < nextPrayerTimeMins) {
                    nextPrayerTimeMins = timeMins;
                    nextPrayerName = arName;
                }
            }
        }
        
        if (nextPrayerName === '') {
            nextPrayerName = 'الفجر';
            if(timings['Fajr']) {
                const [h, m] = timings['Fajr'].split(':').map(Number);
                nextPrayerTimeMins = (24 * 60) + (h * 60 + m);
            }
        }
        
        const diffMins = nextPrayerTimeMins - currentTime - 1; 
        const diffSecs = 60 - now.getSeconds();
        
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        const elName = document.getElementById('next-prayer-name');
        const elTime = document.getElementById('next-prayer-countdown');
        
        if(elName) elName.innerText = `صلاة ${nextPrayerName}`;
        if(elTime) elTime.innerText = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
    }
    
    update();
    countdownInterval = setInterval(update, 1000);
}

async function fetchPrayerTimesByCity(city, country) {
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=8`);
        const data = await res.json();
        if (data.data) {
            updatePrayerUI(data.data.timings);
        }
    } catch(err) { console.error("خطأ جلب المواقيت:", err); }
}

// ==========================================
// 4. محرك السبحة الإلكترونية
// ==========================================
let currentSebhaCount = 0;
const dhikrList = ["سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "لَا إِلَهَ إِلَّا اللَّهُ", "اللَّهُ أَكْبَرُ", "أَسْتَغْفِرُ اللَّهَ"];
let currentDhikrIndex = 0;

function initSebha() {
    const tallyBtn = document.getElementById('tally-btn');
    const resetBtn = document.getElementById('reset-btn');
    const countDisplay = document.querySelector('#sebha-count-display span');
    const themeSelect = document.getElementById('sebha-theme-select');
    const dhikrText = document.getElementById('current-dhikr-text');
    const btnNextDhikr = document.getElementById('btn-next-dhikr');
    const btnPrevDhikr = document.getElementById('btn-prev-dhikr');

    function updateCount() {
        if(countDisplay) countDisplay.innerText = currentSebhaCount.toString().padStart(4, '0');
    }

    if(tallyBtn) {
        tallyBtn.addEventListener('click', () => {
            currentSebhaCount++;
            updateCount();
            if(StorageManager.state.soundVib && navigator.vibrate) navigator.vibrate(50);
        });
    }

    if(resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentSebhaCount = 0;
            updateCount();
            if(StorageManager.state.soundVib && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        });
    }

    if (btnNextDhikr && btnPrevDhikr && dhikrText) {
        btnNextDhikr.addEventListener('click', () => {
            currentDhikrIndex = (currentDhikrIndex + 1) % dhikrList.length;
            dhikrText.innerText = dhikrList[currentDhikrIndex];
        });
        btnPrevDhikr.addEventListener('click', () => {
            currentDhikrIndex = (currentDhikrIndex - 1 + dhikrList.length) % dhikrList.length;
            dhikrText.innerText = dhikrList[currentDhikrIndex];
        });
    }

    if(themeSelect) {
        themeSelect.value = StorageManager.state.sebhaTheme;
        themeSelect.addEventListener('change', (e) => {
            document.body.className = document.body.className.replace(/\bsebha-theme-\S+/g, '');
            document.body.classList.add(`sebha-theme-${e.target.value}`);
            StorageManager.update('sebhaTheme', e.target.value);
        });
        document.body.classList.add(`sebha-theme-${StorageManager.state.sebhaTheme}`);
    }
}

// ==========================================
// 5. التنقل بين الأقسام والإعدادات
// ==========================================
function initUI() {
    // تبويبات التنقل
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('main section');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sections.forEach(s => { s.classList.add('hidden'); s.classList.remove('block', 'flex'); });
            const targetId = btn.dataset.target;
            const targetSection = document.getElementById(targetId);
            
            if(targetId === 'tab-sebha') {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('flex');
            } else {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('block');
            }

            navBtns.forEach(b => {
                b.classList.remove('text-primary', 'transform', 'scale-105');
                b.classList.add('text-gray-500', 'dark:text-gray-400');
            });
            btn.classList.remove('text-gray-500', 'dark:text-gray-400');
            btn.classList.add('text-primary', 'transform', 'scale-105');
        });
    });

    // النوافذ المنبثقة
    const btnSettings = document.getElementById('btn-settings');
    const modalSettings = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    
    if(btnSettings) btnSettings.addEventListener('click', () => modalSettings.classList.remove('hidden'));
    if(btnCloseSettings) btnCloseSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));

    // الإعدادات: الوضع الداكن
    const darkModeToggle = document.getElementById('toggle-dark-mode');
    if (darkModeToggle) {
        darkModeToggle.checked = StorageManager.state.isDarkMode;
        darkModeToggle.addEventListener('change', (e) => {
            StorageManager.update('isDarkMode', e.target.checked);
            applyDarkMode();
        });
    }

    // الإعدادات: الخط
    document.getElementById('btn-font-plus')?.addEventListener('click', () => {
        if(StorageManager.state.fontSize < 40) { StorageManager.update('fontSize', StorageManager.state.fontSize + 2); applyFontSize(); }
    });
    document.getElementById('btn-font-minus')?.addEventListener('click', () => {
        if(StorageManager.state.fontSize > 16) { StorageManager.update('fontSize', StorageManager.state.fontSize - 2); applyFontSize(); }
    });

    // الإعدادات: حجم السبحة
    const sizeSelect = document.getElementById('settings-sebha-size');
    if(sizeSelect) {
        sizeSelect.value = StorageManager.state.sebhaSize;
        sizeSelect.addEventListener('change', (e) => {
            StorageManager.update('sebhaSize', e.target.value);
            applySebhaSize(e.target.value);
        });
    }
}

// ==========================================
// التهيئة عند تحميل الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.load();
    applyDarkMode();
    applyLanguage(StorageManager.state.lang);
    applyFontSize();
    applySebhaSize(StorageManager.state.sebhaSize);
    
    initMushafEngine();
    initPrayerEngine();
    initSebha();
    initUI();
});
