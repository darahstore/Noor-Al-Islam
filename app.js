// ==========================================
// 6. محرك حفظ البيانات (Local Storage Manager)
// ==========================================
const StorageManager = {
    state: {
        lang: 'ar',
        fontSize: 24,
        soundVib: true,
        sebhaTheme: 'default',
        lastSurahMushaf: 1,
        country: '',
        city: '',
        isProUser: false
    },
    load() {
        const saved = localStorage.getItem('nourAlIslamState');
        if (saved) {
            this.state = { ...this.state, ...JSON.parse(saved) };
        }
    },
    save() {
        localStorage.setItem('nourAlIslamState', JSON.stringify(this.state));
    },
    update(key, value) {
        this.state[key] = value;
        this.save();
    }
};

// حالة Pro عامة (تُحدث من localStorage)
let isProUser = false;

// ==========================================
// 1. محرك لغات التطبيق (Multi-Language Engine)
// ==========================================
const Dictionary = {
    ar: {
        appName: "نور الإسلام",
        audioTab: "صوتيات",
        mushafTab: "المصحف",
        sebhaTab: "المسبحة",
        prayerTab: "المواقيت",
        donate: "دعم التطبيق",
        settings: "الإعدادات",
        nextPrayer: "متبقي على الصلاة القادمة",
        fajr: "الفجر", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء",
        gpsLoc: "موقعي الحالي"
    },
    en: {
        appName: "Nour Al-Islam",
        audioTab: "Audio",
        mushafTab: "Quran",
        sebhaTab: "Sebha",
        prayerTab: "Prayer",
        donate: "Donate",
        settings: "Settings",
        nextPrayer: "Time until next prayer",
        fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha",
        gpsLoc: "My Location"
    },
    fr: {
        appName: "Nour Al-Islam",
        audioTab: "Audio",
        mushafTab: "Coran",
        sebhaTab: "Chapelet",
        prayerTab: "Prières",
        donate: "Faire un don",
        settings: "Paramètres",
        nextPrayer: "Temps restant avant la prière",
        fajr: "Fajr", dhuhr: "Dhor", asr: "Asr", maghrib: "Maghreb", isha: "Icha",
        gpsLoc: "Ma Position"
    }
};

function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const dict = Dictionary[lang];
    if(document.querySelector('h1')) document.querySelector('h1').innerText = dict.appName;
    if(document.querySelector('#nav-audio span:last-child')) document.querySelector('#nav-audio span:last-child').innerText = dict.audioTab;
    if(document.querySelector('#nav-mushaf span:last-child')) document.querySelector('#nav-mushaf span:last-child').innerText = dict.mushafTab;
    if(document.querySelector('#nav-sebha span:last-child')) document.querySelector('#nav-sebha span:last-child').innerText = dict.sebhaTab;
    if(document.querySelector('#nav-prayer span:last-child')) document.querySelector('#nav-prayer span:last-child').innerText = dict.prayerTab;
    
    StorageManager.update('lang', lang);
}

// ==========================================
// 2. محرك المصحف المكتوب (Full Quran Text Manager)
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

    // تعبئة قائمة السور
    SuwarNames.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.innerText = `${index + 1}. سورة ${name}`;
        selectMushaf.appendChild(option);
    });

    // استرجاع آخر سورة مقروءة
    if (StorageManager.state.lastSurahMushaf) {
        selectMushaf.value = StorageManager.state.lastSurahMushaf;
        fetchSurahText(StorageManager.state.lastSurahMushaf);
    }

    selectMushaf.addEventListener('change', (e) => {
        const surahId = e.target.value;
        if(surahId) fetchSurahText(surahId);
    });

    // البحث السريع
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        Array.from(selectMushaf.options).forEach(opt => {
            if(opt.value === "") return;
            opt.style.display = opt.innerText.includes(val) ? "block" : "none";
        });
    });

    async function fetchSurahText(surahId) {
        mushafContainer.innerHTML = '<div class="text-center py-10">جاري تحميل السورة...</div>';
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}`);
            const data = await response.json();
            
            mushafHeader.classList.remove('hidden');
            surahNameEl.innerText = `سورة ${data.data.name.replace('سُورَةُ ', '')}`;
            
            let htmlText = '<div class="quran-text mushaf-page p-6 rounded-xl">';
            data.data.ayahs.forEach(ayah => {
                let text = ayah.text;
                if(surahId != 1 && surahId != 9 && ayah.numberInSurah === 1) {
                    text = text.replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ", "");
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
    if(container) container.style.fontSize = `${StorageManager.state.fontSize}px`;
    const display = document.getElementById('font-size-display');
    if(display) display.innerText = StorageManager.state.fontSize + 'px';
}

// ==========================================
// 3. محرك مواقيت الصلاة والقبلة (Prayer & Location Engine)
// ==========================================
let countdownInterval = null;

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

    // تعبئة الدول
    for (const country in LocationsDB) {
        selectCountry.innerHTML += `<option value="${country}">${country}</option>`;
    }

    selectCountry.addEventListener('change', (e) => {
        selectCity.innerHTML = '<option value="">اختر المدينة</option>';
        const cities = LocationsDB[e.target.value] || [];
        cities.forEach(city => {
            selectCity.innerHTML += `<option value="${city}">${city}</option>`;
        });
    });

    selectCity.addEventListener('change', (e) => {
        if(e.target.value && selectCountry.value) {
            fetchPrayerTimesByCity(selectCity.value, selectCountry.value);
            StorageManager.update('city', selectCity.value);
            StorageManager.update('country', selectCountry.value);
        }
    });

    btnGps.addEventListener('click', () => {
        if (navigator.geolocation) {
            btnGps.innerText = "جاري التحديد...";
            navigator.geolocation.getCurrentPosition(pos => {
                btnGps.innerText = "📍 موقعي الحالي";
                fetchPrayerTimesByCoords(pos.coords.latitude, pos.coords.longitude);
            }, err => {
                btnGps.innerText = "فشل التحديد";
                alert("يرجى تفعيل الـ GPS وصلاحية الموقع.");
            });
        }
    });

    // تحميل آخر موقع
    if (StorageManager.state.city && StorageManager.state.country) {
        selectCountry.value = StorageManager.state.country;
        selectCountry.dispatchEvent(new Event('change'));
        selectCity.value = StorageManager.state.city;
        fetchPrayerTimesByCity(StorageManager.state.city, StorageManager.state.country);
    }
}

async function fetchPrayerTimesByCity(city, country) {
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=8`);
        const data = await res.json();
        updatePrayerUI(data.data.timings);
    } catch(err) { console.error(err); }
}

async function fetchPrayerTimesByCoords(lat, lng) {
    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const res = await fetch(`https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=8`);
        const data = await res.json();
        updatePrayerUI(data.data.timings);
        
        // تحديث القبلة
        const qiblaCompass = document.getElementById('qibla-compass');
        const qiblaText = document.getElementById('qibla-degree-text');
        if(data.data.meta && data.data.meta.qibla) {
            qiblaCompass.style.transform = `rotate(${data.data.meta.qibla}deg)`;
            qiblaText.innerText = `زاوية القبلة: ${data.data.meta.qibla.toFixed(2)} درجة`;
        }
    } catch(err) { console.error(err); }
}

function updatePrayerUI(timings) {
    document.getElementById('time-fajr').innerText = timings.Fajr;
    document.getElementById('time-dhuhr').innerText = timings.Dhuhr;
    document.getElementById('time-asr').innerText = timings.Asr;
    document.getElementById('time-maghrib').innerText = timings.Maghrib;
    document.getElementById('time-isha').innerText = timings.Isha;
    
    startCountdown(timings);
}

function startCountdown(timings) {
    if(countdownInterval) clearInterval(countdownInterval);
    
    const prayers = [
        { name: "الفجر", time: timings.Fajr },
        { name: "الظهر", time: timings.Dhuhr },
        { name: "العصر", time: timings.Asr },
        { name: "المغرب", time: timings.Maghrib },
        { name: "العشاء", time: timings.Isha }
    ];

    countdownInterval = setInterval(() => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        let nextPrayer = prayers[0];
        let found = false;

        for (let p of prayers) {
            const [h, m] = p.time.split(':').map(Number);
            const pTime = h * 60 + m;
            if (pTime > currentTime) {
                nextPrayer = p;
                found = true;
                break;
            }
        }

        // إذا انتهت صلوات اليوم، القادمة هي الفجر غداً
        let targetHours, targetMinutes;
        if (!found) {
            const [h, m] = prayers[0].time.split(':').map(Number);
            targetHours = h + 24;
            targetMinutes = m;
        } else {
            const [h, m] = nextPrayer.time.split(':').map(Number);
            targetHours = h;
            targetMinutes = m;
        }

        let diffMinutes = (targetHours * 60 + targetMinutes) - (now.getHours() * 60 + now.getMinutes());
        if(diffMinutes < 0) diffMinutes = 0; // احتياط

        const hrs = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        const secs = 59 - now.getSeconds();

        document.getElementById('next-prayer-name').innerText = `صلاة ${nextPrayer.name}`;
        document.getElementById('next-prayer-countdown').innerText = 
            `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
    }, 1000);
}

// ==========================================
// 4. محرك القرآن الصوتي (Audio Streaming Engine)
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

    selectRiwaya.disabled = true;
    selectRiwaya.title = "الرجاء اختيار القارئ أولاً";
    selectSurah.disabled = true;
    selectSurah.title = "الرجاء اختيار القارئ والرواية أولاً";

    fetch('https://mp3quran.net/api/v3/reciters?language=ar')
        .then(res => res.json())
        .then(data => {
            allReciters = data.reciters;
            allReciters.forEach(rec => {
                const opt = document.createElement('option');
                opt.value = rec.id;
                opt.innerText = rec.name;
                selectReciter.appendChild(opt);
            });
        });

    selectReciter.addEventListener('change', (e) => {
        selectRiwaya.innerHTML = '<option value="">اختر الرواية...</option>';
        selectSurah.innerHTML = '<option value="">اختر السورة...</option>';
        
        const recId = e.target.value;
        if (!recId) {
            selectRiwaya.disabled = true;
            selectRiwaya.title = "الرجاء اختيار القارئ أولاً";
            selectSurah.disabled = true;
            selectSurah.title = "الرجاء اختيار القارئ والرواية أولاً";
            return;
        }

        const reciter = allReciters.find(r => String(r.id) === recId);
        if (!reciter || !reciter.moshaf || reciter.moshaf.length === 0) {
            selectRiwaya.disabled = true;
            selectRiwaya.title = "لا توجد روايات متاحة لهذا القارئ";
            selectSurah.disabled = true;
            selectSurah.title = "الرجاء اختيار الرواية أولاً";
            return;
        }

        selectRiwaya.disabled = false;
        selectRiwaya.title = "";
        reciter.moshaf.forEach((m, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.innerText = m.name;
            selectRiwaya.appendChild(opt);
        });

        selectSurah.disabled = true;
        selectSurah.title = "الرجاء اختيار الرواية أولاً";
    });

    selectRiwaya.addEventListener('change', (e) => {
        selectSurah.innerHTML = '<option value="">اختر السورة...</option>';
        const recId = selectReciter.value;
        const moshafIdx = e.target.value;
        
        if (moshafIdx === "" || !recId) {
            selectSurah.disabled = true;
            selectSurah.title = "الرجاء اختيار الرواية أولاً";
            return;
        }

        const reciter = allReciters.find(r => String(r.id) === recId);
        if (!reciter || !reciter.moshaf || !reciter.moshaf[moshafIdx]) {
            selectSurah.disabled = true;
            selectSurah.title = "بيانات الرواية غير متوفرة";
            return;
        }

        const moshaf = reciter.moshaf[moshafIdx];
        if (!moshaf.surah_list) {
            selectSurah.disabled = true;
            selectSurah.title = "لا توجد سور لهذه الرواية";
            return;
        }

        const suwarList = moshaf.surah_list.split(',');
        suwarList.forEach(surahNum => {
            const idx = parseInt(surahNum) - 1;
            if (idx < 0 || idx >= SuwarNames.length) return;
            const opt = document.createElement('option');
            const formatted = String(surahNum).padStart(3, '0');
            opt.value = `${moshaf.server}${formatted}.mp3`;
            opt.innerText = `سورة ${SuwarNames[idx]}`;
            selectSurah.appendChild(opt);
        });

        selectSurah.disabled = false;
        selectSurah.title = "";
    });

    selectSurah.addEventListener('change', (e) => {
        currentAudioUrl = e.target.value;
        if (currentAudioUrl) {
            audioTitle.innerText = e.target.options[e.target.selectedIndex].text;
            audioPlayer.src = currentAudioUrl;
            audioPlayer.play();
            btnPlay.innerText = "⏸";
        }
    });

    btnPlay.addEventListener('click', () => {
        if(!audioPlayer.src) return;
        if (audioPlayer.paused) {
            audioPlayer.play();
            btnPlay.innerText = "⏸";
        } else {
            audioPlayer.pause();
            btnPlay.innerText = "▶";
        }
    });

    audioPlayer.addEventListener('timeupdate', () => {
        if(audioPlayer.duration) {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.value = progress;
            
            const currMins = Math.floor(audioPlayer.currentTime / 60).toString().padStart(2, '0');
            const currSecs = Math.floor(audioPlayer.currentTime % 60).toString().padStart(2, '0');
            const durMins = Math.floor(audioPlayer.duration / 60).toString().padStart(2, '0');
            const durSecs = Math.floor(audioPlayer.duration % 60).toString().padStart(2, '0');
            
            audioTime.innerText = `${currMins}:${currSecs} / ${durMins}:${durSecs}`;
        }
    });

    progressBar.addEventListener('input', (e) => {
        if(audioPlayer.duration) {
            audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
        }
    });
}

// ==========================================
// 5. محرك المسبحة والتخصيصات (Sebha & Themes) - محدث
// ==========================================
const DhikrList = [
    "سُبْحَانَ اللَّهِ",
    "الْحَمْدُ لِلَّهِ",
    "لَا إِلَهَ إِلَّا اللَّهُ",
    "اللَّهُ أَكْبَرُ",
    "أَسْتَغْفِرُ اللَّهَ",
    "صَلَّى اللَّهُ عَلَى مُحَمَّدٍ"
];
let currentDhikrIdx = 0;
let sebhaCount = 0;

// دالة محاكاة الإعلان التجريبي المحدثة
function simulateRewardAd(onSuccess, onCancel) {
    if (confirm("هذا الثيم متاح في النسخة المدفوعة، يمكنك مشاهدة إعلان قصير لفتحه الآن")) {
        // محاكاة تأخير الإعلان
        setTimeout(() => {
            alert("✅ تم فتح الميزة مؤقتاً! شكراً لمشاهدتك الإعلان.");
            if (onSuccess) onSuccess();
        }, 1500);
    } else {
        if (onCancel) onCancel();
    }
}

function initSebhaEngine() {
    const tallyBtn = document.getElementById('tally-btn');
    const resetBtn = document.getElementById('reset-btn');
    const lcdDisplay = document.getElementById('sebha-count-display');
    const displayText = document.getElementById('current-dhikr-text');
    const themeSelect = document.getElementById('sebha-theme-select');
    
    lcdDisplay.innerText = String(sebhaCount).padStart(4, '0');
    
    // تحميل الثيم المحفوظ
    if(StorageManager.state.sebhaTheme) {
        themeSelect.value = StorageManager.state.sebhaTheme;
        applySebhaTheme(StorageManager.state.sebhaTheme);
    }

    tallyBtn.addEventListener('click', () => {
        sebhaCount++;
        lcdDisplay.innerText = String(sebhaCount).padStart(4, '0');
        
        if(StorageManager.state.soundVib && navigator.vibrate) {
            navigator.vibrate(20);
        }
        
        tallyBtn.classList.add('tally-btn-active');
        setTimeout(() => tallyBtn.classList.remove('tally-btn-active'), 100);
    });

    resetBtn.addEventListener('click', () => {
        sebhaCount = 0;
        lcdDisplay.innerText = String(sebhaCount).padStart(4, '0');
    });

    document.getElementById('btn-next-dhikr').addEventListener('click', () => {
        currentDhikrIdx = (currentDhikrIdx + 1) % DhikrList.length;
        displayText.innerText = DhikrList[currentDhikrIdx];
        sebhaCount = 0; 
        lcdDisplay.innerText = "0000";
    });

    document.getElementById('btn-prev-dhikr').addEventListener('click', () => {
        currentDhikrIdx = (currentDhikrIdx - 1 + DhikrList.length) % DhikrList.length;
        displayText.innerText = DhikrList[currentDhikrIdx];
        sebhaCount = 0; 
        lcdDisplay.innerText = "0000";
    });

    // تحديث منطق اختيار الثيمات الأربعة والدعم
    themeSelect.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        const previousTheme = StorageManager.state.sebhaTheme || 'default';

        // إذا كان الثيم المختار هو royal أو diamond
        if (selectedTheme === 'royal' || selectedTheme === 'diamond') {
            if (isProUser) {
                // إذا كان مستخدم Pro، يتم التطبيق فوراً
                applySebhaTheme(selectedTheme);
                StorageManager.update('sebhaTheme', selectedTheme);
            } else {
                // إذا لم يكن Pro، يتم إيقاف التغيير مؤقتاً وإظهار التنبيه
                simulateRewardAd(
                    () => {
                        // عند الموافقة ومشاهدة الإعلان بنجاح
                        applySebhaTheme(selectedTheme);
                        StorageManager.update('sebhaTheme', selectedTheme);
                    },
                    () => {
                        // عند الرفض أو الإلغاء، يعود الاختيار في القائمة إلى الثيم السابق
                        themeSelect.value = previousTheme;
                    }
                );
            }
        } else {
            // الثيمات المجانية (default أو wood) تطبق مباشرة
            applySebhaTheme(selectedTheme);
            StorageManager.update('sebhaTheme', selectedTheme);
        }
    });
}

function applySebhaTheme(theme) {
    const sebhaSection = document.getElementById('tab-sebha');
    if (!sebhaSection) return;
    
    // إزالة جميع كلاسات الثيمات السابقة
    sebhaSection.classList.remove('sebha-theme-default', 'sebha-theme-wood', 'sebha-theme-royal', 'sebha-theme-diamond');
    
    // إضافة الكلاس المناسب
    if (theme === 'default') {
        sebhaSection.classList.add('sebha-theme-default');
    } else if (theme === 'wood') {
        sebhaSection.classList.add('sebha-theme-wood');
    } else if (theme === 'royal') {
        sebhaSection.classList.add('sebha-theme-royal');
    } else if (theme === 'diamond') {
        sebhaSection.classList.add('sebha-theme-diamond');
    }
    
    document.body.classList.remove('theme-royal');
    if (theme === 'royal') {
        document.body.classList.add('theme-royal');
    }
}

// ==========================================
// منطق التحميل والاشتراكات (Download & Pro)
// ==========================================
function initProFeatures() {
    const downloadBtn = document.getElementById('download-surah-btn');
    const donateModal = document.getElementById('modal-donate');
    
    isProUser = StorageManager.state.isProUser || false;
    updateProUI();

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!currentAudioUrl) {
                alert("الرجاء اختيار سورة أولاً.");
                return;
            }
            
            if (isProUser) {
                startDownload(currentAudioUrl);
            } else {
                simulateRewardAd(() => startDownload(currentAudioUrl));
            }
        });
    }
    
    if (donateModal) {
        const proSubscribeBtn = donateModal.querySelector('[data-subscribe-pro="monthly"]');
        if (proSubscribeBtn) {
            proSubscribeBtn.addEventListener('click', () => {
                activatePro();
                alert("🎉 تم تفعيل اشتراك Pro! استمتع بكل الميزات.");
                donateModal.classList.add('hidden');
            });
        }
        
        const donateBtns = donateModal.querySelectorAll('[data-donate-amount]');
        donateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = btn.getAttribute('data-donate-amount');
                alert(`شكراً لدعمك! تبرع بقيمة $${amount}. (محاكاة)`);
                if (amount === '5') {
                    activatePro();
                }
                donateModal.classList.add('hidden');
            });
        });
    }
}

function startDownload(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const downloadIcon = document.getElementById('download-icon');
    const downloadText = document.getElementById('download-text');
    if (downloadIcon) downloadIcon.innerText = '✅';
    if (downloadText) downloadText.innerText = 'تم التحميل';
    setTimeout(() => {
        if (downloadIcon) downloadIcon.innerText = isProUser ? '⬇️' : '🔒';
        if (downloadText) downloadText.innerText = isProUser ? 'تحميل (Pro)' : 'تحميل السورة';
    }, 2500);
}

function activatePro() {
    isProUser = true;
    StorageManager.update('isProUser', true);
    updateProUI();
}

function updateProUI() {
    const downloadIcon = document.getElementById('download-icon');
    if (downloadIcon) {
        downloadIcon.innerText = isProUser ? '⬇️' : '🔒';
    }
    const downloadText = document.getElementById('download-text');
    if (downloadText) {
        downloadText.innerText = isProUser ? 'تحميل (Pro)' : 'تحميل السورة';
    }
}

// ==========================================
// التنقل ونوافذ الإعدادات (Navigation & Modals Logic)
// ==========================================
function initNavigationAndSettings() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = ['tab-audio', 'tab-mushaf', 'tab-sebha', 'tab-prayer'];

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-target');
            
            sections.forEach(sec => {
                document.getElementById(sec).classList.add('hidden');
                document.getElementById(sec).classList.remove('block');
            });
            document.getElementById(targetId).classList.remove('hidden');
            document.getElementById(targetId).classList.add('block');

            navBtns.forEach(b => {
                b.classList.remove('text-primary', 'transform', 'scale-105');
                b.classList.add('text-gray-500', 'dark:text-gray-400');
            });
            btn.classList.add('text-primary', 'transform', 'scale-105');
            btn.classList.remove('text-gray-500', 'dark:text-gray-400');
        });
    });

    const modalSettings = document.getElementById('modal-settings');
    const modalDonate = document.getElementById('modal-donate');

    document.getElementById('btn-settings').addEventListener('click', () => {
        modalSettings.classList.remove('hidden');
        modalSettings.classList.add('modal-backdrop-enter');
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
        modalSettings.classList.add('hidden');
    });

    document.getElementById('btn-donate').addEventListener('click', () => {
        modalDonate.classList.remove('hidden');
        modalDonate.classList.add('modal-backdrop-enter');
    });
    document.getElementById('btn-close-donate').addEventListener('click', () => {
        modalDonate.classList.add('hidden');
    });

    document.getElementById('settings-lang').value = StorageManager.state.lang;
    document.getElementById('settings-lang').addEventListener('change', (e) => applyLanguage(e.target.value));

    const toggleSound = document.getElementById('toggle-sound-vib');
    toggleSound.checked = StorageManager.state.soundVib;
    toggleSound.addEventListener('change', (e) => StorageManager.update('soundVib', e.target.checked));

    document.getElementById('btn-font-plus').addEventListener('click', () => {
        if(StorageManager.state.fontSize < 40) {
            StorageManager.update('fontSize', StorageManager.state.fontSize + 2);
            applyFontSize();
        }
    });
    
    document.getElementById('btn-font-minus').addEventListener('click', () => {
        if(StorageManager.state.fontSize > 16) {
            StorageManager.update('fontSize', StorageManager.state.fontSize - 2);
            applyFontSize();
        }
    });
}

// ==========================================
// بدء التشغيل (Initialization)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.load();
    isProUser = StorageManager.state.isProUser || false;
    applyLanguage(StorageManager.state.lang);
    applyFontSize();
    
    initNavigationAndSettings();
    initMushafEngine();
    initAudioEngine();
    initSebhaEngine();
    initPrayerEngine();
    initProFeatures();
});
