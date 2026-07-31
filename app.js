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
        sebhaSize: 'md', lastSurahMushaf: 1, country: '', city: '', isProUser: false
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

let isProUser = false;

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

// ==========================================
// 1. محرك لغات التطبيق
// ==========================================
const Dictionary = {
    ar: {
        appName: "نور الإسلام", audioTab: "صوتيات", mushafTab: "المصحف", sebhaTab: "المسبحة",
        azkarTab: "الأذكار", prayerTab: "المواقيت", donate: "دعم التطبيق", settings: "الإعدادات",
        nextPrayer: "متبقي على الصلاة القادمة", fajr: "الفجر", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء", gpsLoc: "موقعي الحالي"
    },
    en: {
        appName: "Nour Al-Islam", audioTab: "Audio", mushafTab: "Quran", sebhaTab: "Sebha",
        azkarTab: "Azkar", prayerTab: "Prayer", donate: "Donate", settings: "Settings",
        nextPrayer: "Time until next prayer", fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha", gpsLoc: "My Location"
    },
    fr: {
        appName: "Nour Al-Islam", audioTab: "Audio", mushafTab: "Coran", sebhaTab: "Chapelet",
        azkarTab: "Azkar", prayerTab: "Prières", donate: "Faire un don", settings: "Paramètres",
        nextPrayer: "Temps restant avant la prière", fajr: "Fajr", dhuhr: "Dhor", asr: "Asr", maghrib: "Maghreb", isha: "Icha", gpsLoc: "Ma Position"
    }
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
    const searchInput = document.getElementById('search-surah');

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

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            Array.from(selectMushaf.options).forEach(opt => {
                if (opt.value === "") return;
                opt.style.display = opt.innerText.includes(val) ? "block" : "none";
            });
        });
    }

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
let currentQiblaAngle = 0;
let isOrientationListenerAdded = false;
const LocationsDB = {
    "المغرب": ["الرباط", "الدار البيضاء", "فاس", "مراكش", "طنجة"],
    "مصر": ["القاهرة", "الإسكندرية", "الجيزة", "المنصورة"],
    "السعودية": ["الرياض", "مكة المكرمة", "المدينة المنورة", "جدة"],
    "الجزائر": ["الجزائر العاصمة", "وهران", "قسنطينة"],
};

function initPrayerEngine() {
    const btnGps = document.getElementById('btn-gps-location');
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
                StorageManager.update('city', selectCity.value);
                StorageManager.update('country', selectCountry.value);
            }
        });
    }

    if (btnGps) {
        btnGps.addEventListener('click', () => {
            if (navigator.geolocation) {
                btnGps.innerText = "جاري التحديد...";
                navigator.geolocation.getCurrentPosition(pos => {
                    btnGps.innerText = "📍 موقعي الحالي";
                    fetchPrayerTimesByCoords(pos.coords.latitude, pos.coords.longitude);
                }, () => {
                    btnGps.innerText = "فشل التحديد";
                    alert("يرجى تفعيل الـ GPS وصلاحية الموقع.");
                });
            }
        });
    }

    if (StorageManager.state.city && StorageManager.state.country && selectCountry && selectCity) {
        selectCountry.value = StorageManager.state.country;
        selectCountry.dispatchEvent(new Event('change'));
        selectCity.value = StorageManager.state.city;
        fetchPrayerTimesByCity(StorageManager.state.city, StorageManager.state.country);
    }
}

function updateQiblaCompass(qiblaAngle) {
    currentQiblaAngle = qiblaAngle;
    const qiblaCompass = document.getElementById('qibla-compass');
    const qiblaText = document.getElementById('qibla-degree-text');
    if (!qiblaCompass) return;

    qiblaCompass.style.transform = `rotate(${qiblaAngle}deg)`;
    if (qiblaText) qiblaText.innerText = `زاوية القبلة: ${qiblaAngle.toFixed(2)} درجة`;
}

async function fetchPrayerTimesByCity(city, country) {
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=8`);
        const data = await res.json();
        if (data.data) {
            updatePrayerUI(data.data.timings);
            if (data.data.meta && data.data.meta.qibla !== undefined) updateQiblaCompass(data.data.meta.qibla);
        }
    } catch(err) { console.error("خطأ جلب المواقيت:", err); }
}

async function fetchPrayerTimesByCoords(lat, lng) {
    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const res = await fetch(`https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=8`);
        const data = await res.json();
        if (data.data) {
            updatePrayerUI(data.data.timings);
            if (data.data.meta && data.data.meta.qibla !== undefined) updateQiblaCompass(data.data.meta.qibla);
        }
    } catch(err) { console.error("خطأ جلب المواقيت بالإحداثيات:", err); }
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
    const prayers = [
        { name: "الفجر", time: timings.Fajr }, { name: "الظهر", time: timings.Dhuhr },
        { name: "العصر", time: timings.Asr }, { name: "المغرب", time: timings.Maghrib }, { name: "العشاء", time: timings.Isha }
    ];

    countdownInterval = setInterval(() => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        let nextPrayer = prayers.find(p => {
            const [h, m] = p.time.split(':').map(Number);
            return (h * 60 + m) >= currentTime;
        });

        let targetHours, targetMinutes;
        if (!nextPrayer) {
            nextPrayer = prayers[0];
            const [h, m] = prayers[0].time.split(':').map(Number);
            targetHours = h + 24; targetMinutes = m;
        } else {
            const [h, m] = nextPrayer.time.split(':').map(Number);
            targetHours = h; targetMinutes = m;
        }

        let diffMinutes = (targetHours * 60 + targetMinutes) - currentTime;
        if (diffMinutes < 0) diffMinutes = 0;

        const hrs = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        const secs = (60 - now.getSeconds()) % 60;

        const elName = document.getElementById('next-prayer-name');
        const elCountdown = document.getElementById('next-prayer-countdown');

        if (elName) elName.innerText = `صلاة ${nextPrayer.name}`;
        if (elCountdown) {
            const displayMins = secs === 0 ? mins : (mins > 0 ? mins - 1 : 59);
            const displayHrs = (secs !== 0 && mins === 0) ? (hrs > 0 ? hrs - 1 : 0) : hrs;
            elCountdown.innerText = `${displayHrs.toString().padStart(2, '0')}:${displayMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// ==========================================
// 4. محرك القرآن الصوتي
// ==========================================
let allReciters = [];
let currentAudioUrl = "";

function initAudioEngine() {
    const selectReciter = document.getElementById('select-reciter');
    const selectRiwaya = document.getElementById('select-riwaya');
    const selectSurah = document.getElementById('select-surah-audio');
    const audioPlayer = document.getElementById('core-audio-player');
    const btnPlay = document.getElementById('btn-audio-play');
    const progressBar = document.getElementById('audio-progress');
    const audioTime = document.getElementById('audio-time');
    const audioTitle = document.getElementById('audio-title');

    if (!selectReciter || !selectRiwaya || !selectSurah || !audioPlayer) return;

    selectRiwaya.disabled = true; selectSurah.disabled = true;

    fetch('https://mp3quran.net/api/v3/reciters?language=ar')
        .then(res => res.json())
        .then(data => {
            allReciters = data.reciters || [];
            allReciters.forEach(rec => {
                const opt = document.createElement('option');
                opt.value = rec.id; opt.innerText = rec.name;
                selectReciter.appendChild(opt);
            });
        }).catch(err => console.error(err));

    selectReciter.addEventListener('change', (e) => {
        selectRiwaya.innerHTML = '<option value="">اختر الرواية...</option>';
        selectSurah.innerHTML = '<option value="">اختر السورة...</option>';
        const recId = e.target.value;
        if (!recId) { selectRiwaya.disabled = true; selectSurah.disabled = true; return; }

        const reciter = allReciters.find(r => String(r.id) === recId);
        if (reciter && reciter.moshaf) {
            selectRiwaya.disabled = false;
            reciter.moshaf.forEach((m, idx) => {
                const opt = document.createElement('option');
                opt.value = idx; opt.innerText = m.name;
                selectRiwaya.appendChild(opt);
            });
        }
    });

    selectRiwaya.addEventListener('change', (e) => {
        selectSurah.innerHTML = '<option value="">اختر السورة...</option>';
        const recId = selectReciter.value;
        const moshafIdx = e.target.value;
        if (moshafIdx === "" || !recId) { selectSurah.disabled = true; return; }

        const reciter = allReciters.find(r => String(r.id) === recId);
        const moshaf = reciter.moshaf[moshafIdx];
        if (moshaf && moshaf.surah_list) {
            selectSurah.disabled = false;
            moshaf.surah_list.split(',').forEach(surahNum => {
                const idx = parseInt(surahNum, 10) - 1;
                if (idx >= 0 && idx < SuwarNames.length) {
                    const opt = document.createElement('option');
                    opt.value = `${moshaf.server}${String(surahNum).padStart(3, '0')}.mp3`;
                    opt.innerText = `سورة ${SuwarNames[idx]}`;
                    selectSurah.appendChild(opt);
                }
            });
        }
    });

    selectSurah.addEventListener('change', (e) => {
        currentAudioUrl = e.target.value;
        if (currentAudioUrl) {
            if (audioTitle) audioTitle.innerText = e.target.options[e.target.selectedIndex].text;
            audioPlayer.src = currentAudioUrl;
            audioPlayer.play().then(() => { if (btnPlay) btnPlay.innerText = "⏸"; }).catch(() => {});
        }
    });

    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            if (!audioPlayer.src) return;
            if (audioPlayer.paused) {
                audioPlayer.play().then(() => btnPlay.innerText = "⏸");
            } else {
                audioPlayer.pause();
                btnPlay.innerText = "▶";
            }
        });
    }

    audioPlayer.addEventListener('timeupdate', () => {
        if (audioPlayer.duration && progressBar) {
            progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            if (audioTime) {
                const cM = Math.floor(audioPlayer.currentTime / 60).toString().padStart(2, '0');
                const cS = Math.floor(audioPlayer.currentTime % 60).toString().padStart(2, '0');
                const dM = Math.floor(audioPlayer.duration / 60).toString().padStart(2, '0');
                const dS = Math.floor(audioPlayer.duration % 60).toString().padStart(2, '0');
                audioTime.innerText = `${cM}:${cS} / ${dM}:${dS}`;
            }
        }
    });

    audioPlayer.addEventListener('ended', () => { if (btnPlay) btnPlay.innerText = "▶"; });
    if (progressBar) progressBar.addEventListener('input', (e) => {
        if (audioPlayer.duration) audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
    });
}

// ==========================================
// 5. محرك المسبحة والتخصيصات (Sebha Engine)
// ==========================================
const DhikrList = [
    "سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "لَا إِلَهَ إِلَّا اللَّهُ", "اللَّهُ أَكْبَرُ", "أَسْتَغْفِرُ اللَّهَ", "صَلَّى اللَّهُ عَلَى مُحَمَّدٍ"
];
let currentDhikrIdx = 0;
let sebhaCount = 0;

function initSebhaEngine() {
    const tallyBtn = document.getElementById('tally-btn');
    const resetBtn = document.getElementById('reset-btn');
    const lcdDisplay = document.getElementById('sebha-count-display');
    const displayText = document.getElementById('current-dhikr-text');
    const themeSelect = document.getElementById('sebha-theme-select');
    
    if (lcdDisplay) lcdDisplay.querySelector('span').innerText = String(sebhaCount).padStart(4, '0');
    
    if (StorageManager.state.sebhaTheme && themeSelect) {
        themeSelect.value = StorageManager.state.sebhaTheme;
        applyTheme(StorageManager.state.sebhaTheme);
    }
    if (StorageManager.state.sebhaSize) {
        applySebhaSize(StorageManager.state.sebhaSize);
    }

    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });
    }

    function applyTheme(theme) {
        document.body.className = document.body.className.replace(/sebha-theme-\w+/g, '');
        document.body.classList.add(`sebha-theme-${theme}`);
        StorageManager.update('sebhaTheme', theme);
    }

    const updateSebhaUI = () => {
        if (lcdDisplay) lcdDisplay.querySelector('span').innerText = String(sebhaCount).padStart(4, '0');
        if (displayText) displayText.innerText = DhikrList[currentDhikrIdx];
    };

    if (tallyBtn) {
        tallyBtn.addEventListener('click', () => {
            sebhaCount++;
            updateSebhaUI();
            
            tallyBtn.classList.add('tally-btn-active');
            setTimeout(() => tallyBtn.classList.remove('tally-btn-active'), 100);

            if (StorageManager.state.soundVib) {
                if (navigator.vibrate) navigator.vibrate(50);
                sebhaClickSound.currentTime = 0;
                sebhaClickSound.play().catch(e => console.log('Audio error:', e));
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            sebhaCount = 0;
            updateSebhaUI();
            if (StorageManager.state.soundVib && navigator.vibrate) navigator.vibrate([30, 50, 30]);
        });
    }

    document.getElementById('btn-next-dhikr')?.addEventListener('click', () => {
        currentDhikrIdx = (currentDhikrIdx + 1) % DhikrList.length;
        sebhaCount = 0; updateSebhaUI();
    });

    document.getElementById('btn-prev-dhikr')?.addEventListener('click', () => {
        currentDhikrIdx = (currentDhikrIdx - 1 + DhikrList.length) % DhikrList.length;
        sebhaCount = 0; updateSebhaUI();
    });
}

// ==========================================
// 6. محرك الأذكار (Azkar Engine)
// ==========================================
const AzkarData = {
    morning: [
        { text: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. ﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ...﴾ [آية الكرسي]", count: 1 },
        { text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. ﴿قُلْ هُوَ اللَّهُ أَحَدٌ...﴾", count: 3 },
        { text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...﴾", count: 3 },
        { text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ...﴾", count: 3 },
        { text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ...", count: 1 },
        { text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ.", count: 1 }
    ],
    evening: [
        { text: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. ﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ...﴾ [آية الكرسي]", count: 1 },
        { text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. ﴿قُلْ هُوَ اللَّهُ أَحَدٌ...﴾", count: 3 },
        { text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...﴾", count: 3 },
        { text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ...﴾", count: 3 },
        { text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ...", count: 1 },
        { text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ.", count: 1 }
    ],
    night: [
        { text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا.", count: 1 },
        { text: "يُجْمَعُ كَفَّيْهِ ثُمَّ يَنْفُثُ فِيهِمَا فَيَقْرَأُ: ﴿قُلْ هُوَ اللَّهُ أَحَدٌ﴾ و﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ﴾ و﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ﴾ ثُمَّ يَمْسَحُ بِهِمَا مَا اسْتَطَاعَ مِنْ جَسَدِهِ.", count: 3 },
        { text: "آيَةُ الكُرْسِي: ﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...﴾", count: 1 },
        { text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.", count: 1 }
    ],
    travel: [
        { text: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، ﴿سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ * وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ﴾.", count: 1 },
        { text: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى.", count: 1 },
        { text: "اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا، وَاطْوِ عَنَّا بُعْدَهُ.", count: 1 },
        { text: "اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الْأَهْلِ.", count: 1 }
    ]
};

const AzkarTitles = {
    morning: "أذكار الصباح", evening: "أذكار المساء", night: "أذكار النوم", travel: "أذكار السفر"
};

function initAzkarEngine() {
    const categoryBtns = document.querySelectorAll('.azkar-category-btn');
    const azkarCategoriesView = document.getElementById('azkar-categories');
    const azkarReaderView = document.getElementById('azkar-reader');
    const btnBackAzkar = document.getElementById('btn-back-azkar');
    const azkarReaderTitle = document.getElementById('azkar-reader-title');
    const azkarListContainer = document.getElementById('azkar-list-container');

    if (!azkarCategoriesView || !azkarReaderView) return;

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => { openAzkar(btn.getAttribute('data-type')); });
    });

    if (btnBackAzkar) {
        btnBackAzkar.addEventListener('click', () => {
            azkarReaderView.classList.add('hidden');
            azkarReaderView.classList.remove('flex');
            azkarCategoriesView.classList.remove('hidden');
        });
    }

    function openAzkar(type) {
        const data = AzkarData[type];
        if (!data) return;

        azkarReaderTitle.innerText = AzkarTitles[type];
        azkarListContainer.innerHTML = '';

        data.forEach((zekr) => {
            const card = document.createElement('div');
            card.className = 'zekr-card p-5 rounded-xl shadow-sm flex flex-col gap-4 relative';
            card.innerHTML = `
                <p class="zekr-text text-gray-800 dark:text-gray-100">${zekr.text}</p>
                <div class="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3">
                    <span class="text-sm text-gray-500 font-bold">التكرار: ${zekr.count}</span>
                    <button class="zekr-count-btn bg-primary text-white w-12 h-12 rounded-full font-bold text-xl shadow flex justify-center items-center" data-count="${zekr.count}">
                        ${zekr.count}
                    </button>
                </div>
            `;

            const btn = card.querySelector('.zekr-count-btn');
            btn.addEventListener('click', function() {
                let currentCount = parseInt(this.getAttribute('data-count'));
                if (currentCount > 0) {
                    currentCount--;
                    this.setAttribute('data-count', currentCount);
                    this.innerText = currentCount;
                    
                    if (currentCount === 0) {
                        this.classList.remove('bg-primary');
                        this.classList.add('bg-gray-400');
                        this.innerHTML = '✔️';
                        card.style.opacity = '0.5';
                    }
                    if (StorageManager.state.soundVib && navigator.vibrate) navigator.vibrate(50);
                }
            });
            azkarListContainer.appendChild(card);
        });

        azkarCategoriesView.classList.add('hidden');
        azkarReaderView.classList.remove('hidden');
        azkarReaderView.classList.add('flex');
    }
}

// ==========================================
// 7. محرك التنقل بين الأقسام (Tabs Engine)
// ==========================================
function initTabs() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('main > section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            
            sections.forEach(sec => {
                sec.classList.add('hidden');
                sec.classList.remove('flex');
            });
            
            const targetSec = document.getElementById(targetId);
            if(targetSec) {
                targetSec.classList.remove('hidden');
                if(targetId === 'tab-sebha') {
                    targetSec.classList.add('flex');
                }
            }

            navBtns.forEach(b => {
                b.classList.remove('text-primary', 'scale-105');
                b.classList.add('text-gray-500', 'dark:text-gray-400');
                b.querySelector('span').classList.remove('drop-shadow-sm');
            });
            btn.classList.add('text-primary', 'scale-105');
            btn.classList.remove('text-gray-500', 'dark:text-gray-400');
            btn.querySelector('span').classList.add('drop-shadow-sm');
        });
    });
}

// ==========================================
// 8. محرك الإعدادات والنوافذ (Settings)
// ==========================================
function initSettings() {
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const modalSettings = document.getElementById('modal-settings');

    const btnDonate = document.getElementById('btn-donate');
    const btnCloseDonate = document.getElementById('btn-close-donate');
    const modalDonate = document.getElementById('modal-donate');

    const selectLang = document.getElementById('settings-lang');
    const btnFontPlus = document.getElementById('btn-font-plus');
    const btnFontMinus = document.getElementById('btn-font-minus');
    const toggleSoundVib = document.getElementById('toggle-sound-vib');
    const sebhaSizeSelect = document.getElementById('settings-sebha-size');

    if (btnSettings && modalSettings) {
        btnSettings.addEventListener('click', () => modalSettings.classList.remove('hidden'));
        btnCloseSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));
    }

    if (btnDonate && modalDonate) {
        btnDonate.addEventListener('click', () => modalDonate.classList.remove('hidden'));
        btnCloseDonate.addEventListener('click', () => modalDonate.classList.add('hidden'));
    }

    if (selectLang) {
        selectLang.value = StorageManager.state.lang;
        selectLang.addEventListener('change', (e) => applyLanguage(e.target.value));
    }

    if (btnFontPlus) {
        btnFontPlus.addEventListener('click', () => {
            StorageManager.update('fontSize', StorageManager.state.fontSize + 2);
            applyFontSize();
        });
    }
    if (btnFontMinus) {
        btnFontMinus.addEventListener('click', () => {
            StorageManager.update('fontSize', Math.max(16, StorageManager.state.fontSize - 2));
            applyFontSize();
        });
    }

    if (toggleSoundVib) {
        toggleSoundVib.checked = StorageManager.state.soundVib;
        toggleSoundVib.addEventListener('change', (e) => StorageManager.update('soundVib', e.target.checked));
    }

    if (sebhaSizeSelect) {
        sebhaSizeSelect.value = StorageManager.state.sebhaSize || 'md';
        sebhaSizeSelect.addEventListener('change', (e) => {
            StorageManager.update('sebhaSize', e.target.value);
            applySebhaSize(e.target.value);
        });
    }
}

// ==========================================
// نقطة التشغيل (Initialization)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.load();
    applyLanguage(StorageManager.state.lang);
    applyFontSize();
    
    initTabs();
    initMushafEngine();
    initPrayerEngine();
    initAudioEngine();
    initSebhaEngine();
    initAzkarEngine();
    initSettings();
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
});
