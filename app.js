// ==========================================
// 1. المتغيرات الصوتية العامة وإدارة التخزين
// ==========================================
const sebhaClickSound = new Audio('sebha-click.mp3'); 
const adhanAudio = new Audio('adhan.mp3');            

// إدارة حالة التطبيق والتخزين المحلي
const StorageManager = {
    state: {
        lang: 'ar',
        fontSize: 24,
        soundVib: true,
        sebhaTheme: 'default',
        sebhaSize: 'md',
        lastSurahMushaf: 1,
        country: '',
        city: '',
        isProUser: false,
        isDarkMode: false
    },
    load() {
        const saved = localStorage.getItem('nourAlIslamState');
        if (saved) {
            try { this.state = { ...this.state, ...JSON.parse(saved) }; } catch (e) { console.error(e); }
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

// ==========================================
// 2. تطبيق الوضع الداكن وحجم الخط والسبحة
// ==========================================
function applyDarkMode() {
    if (StorageManager.state.isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }
}

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

function applyFontSize() {
    const container = document.getElementById('mushaf-container');
    if (container) container.style.fontSize = `${StorageManager.state.fontSize}px`;
    const display = document.getElementById('font-size-display');
    if (display) display.innerText = StorageManager.state.fontSize + 'px';
}

// ==========================================
// 3. محرك الأذكار (بيانات كاملة + تفاعل العداد)
// ==========================================
const AzkarData = {
    morning: [
        { text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ.", count: 1 },
        { text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ.", count: 1 },
        { text: "آيَةُ الْكُرْسِيِّ: اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...", count: 1 },
        { text: "قُلْ هُوَ اللَّهُ أَحَدٌ... قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... قُلْ أَعُوذُ بِرَبِّ النَّاسِ...", count: 3 },
        { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.", count: 3 },
        { text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ.", count: 1 }
    ],
    evening: [
        { text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ.", count: 1 },
        { text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ.", count: 1 },
        { text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.", count: 3 },
        { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ.", count: 1 }
    ],
    night: [
        { text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا.", count: 1 },
        { text: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ.", count: 3 },
        { text: "سُبْحَانَ اللَّهِ (33)، الْحَمْدُ لِلَّهِ (33)، اللَّهُ أَكْبَرُ (34).", count: 1 }
    ],
    travel: [
        { text: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ.", count: 1 },
        { text: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى.", count: 1 }
    ]
};

function initAzkarEngine() {
    const categoriesContainer = document.getElementById('azkar-categories');
    const readerContainer = document.getElementById('azkar-reader');
    const listContainer = document.getElementById('azkar-list-container');
    const titleEl = document.getElementById('azkar-reader-title');
    const btnBack = document.getElementById('btn-back-azkar');

    const titlesMap = {
        morning: 'أذكار الصباح',
        evening: 'أذكار المساء',
        night: 'أذكار النوم',
        travel: 'أذكار السفر'
    };

    document.querySelectorAll('.azkar-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const azkarList = AzkarData[type] || [];
            
            if (titleEl) titleEl.innerText = titlesMap[type] || 'الأذكار';
            if (listContainer) {
                listContainer.innerHTML = '';
                azkarList.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'zekr-card p-5 rounded-2xl shadow-sm space-y-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700';
                    card.innerHTML = `
                        <p class="zekr-text font-[Amiri] text-xl leading-loose text-gray-800 dark:text-gray-100">${item.text}</p>
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span class="text-xs text-gray-400">التكرار المطلوبة: ${item.count}</span>
                            <button class="zekr-count-btn bg-primary text-white font-bold px-6 py-2 rounded-xl text-lg shadow-md active:scale-95 transition">
                                ${item.count}
                            </button>
                        </div>
                    `;

                    const countBtn = card.querySelector('.zekr-count-btn');
                    let currentCount = item.count;
                    countBtn.addEventListener('click', () => {
                        if (currentCount > 0) {
                            currentCount--;
                            countBtn.innerText = currentCount;
                            if (StorageManager.state.soundVib && navigator.vibrate) navigator.vibrate(40);
                            if (currentCount === 0) {
                                countBtn.className = 'zekr-count-btn bg-gray-300 dark:bg-gray-700 text-gray-500 font-bold px-6 py-2 rounded-xl text-lg shadow-inner cursor-not-allowed';
                                countBtn.innerText = '✓ تم';
                            }
                        }
                    });

                    listContainer.appendChild(card);
                });
            }

            categoriesContainer.classList.add('hidden');
            readerContainer.classList.remove('hidden');
            readerContainer.classList.add('flex');
        });
    });

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            readerContainer.classList.add('hidden');
            readerContainer.classList.remove('flex');
            categoriesContainer.classList.remove('hidden');
        });
    }
}

// ==========================================
// 4. محرك القرأن الصوتي (API المشغل والتنزيل)
// ==========================================
let currentRecitersData = [];

function initAudioEngine() {
    const selectReciter = document.getElementById('select-reciter');
    const selectRiwaya = document.getElementById('select-riwaya');
    const selectSurah = document.getElementById('select-surah-audio');
    const audioPlayer = document.getElementById('core-audio-player');
    const playBtn = document.getElementById('btn-audio-play');
    const audioTitle = document.getElementById('audio-title');
    const audioTime = document.getElementById('audio-time');
    const progressBar = document.getElementById('audio-progress');

    // جلب القراء من API mp3quran
    async function fetchReciters() {
        try {
            const res = await fetch('https://mp3quran.net/api/v3/reciters?language=ar');
            const data = await res.json();
            currentRecitersData = data.reciters || [];
            
            if (selectReciter) {
                selectReciter.innerHTML = '<option value="">اختر القارئ...</option>';
                currentRecitersData.forEach(r => {
                    selectReciter.innerHTML += `<option value="${r.id}">${r.name}</option>`;
                });
            }
        } catch(e) { console.error("خطأ في جلب القراء:", e); }
    }

    if (selectReciter) {
        selectReciter.addEventListener('change', (e) => {
            const reciterId = e.target.value;
            const reciter = currentRecitersData.find(r => r.id == reciterId);
            if (!reciter || !selectRiwaya) return;

            selectRiwaya.innerHTML = '<option value="">اختر الرواية...</option>';
            reciter.moshaf.forEach(m => {
                selectRiwaya.innerHTML += `<option value="${m.id}">${m.name}</option>`;
            });
        });
    }

    if (selectRiwaya) {
        selectRiwaya.addEventListener('change', (e) => {
            if (!selectSurah) return;
            selectSurah.innerHTML = '<option value="">اختر السورة...</option>';
            SuwarNames.forEach((name, index) => {
                selectSurah.innerHTML += `<option value="${index + 1}">${index + 1}. سورة ${name}</option>`;
            });
        });
    }

    if (selectSurah) {
        selectSurah.addEventListener('change', () => {
            const reciterId = selectReciter.value;
            const moshafId = selectRiwaya.value;
            const surahNum = selectSurah.value;

            const reciter = currentRecitersData.find(r => r.id == reciterId);
            if (!reciter) return;
            const moshaf = reciter.moshaf.find(m => m.id == moshafId);
            if (!moshaf) return;

            const formattedSurah = surahNum.padStart(3, '0');
            const audioUrl = `${moshaf.server}${formattedSurah}.mp3`;

            if (audioPlayer) {
                audioPlayer.src = audioUrl;
                audioPlayer.play();
                if (playBtn) playBtn.innerText = '⏸';
                if (audioTitle) audioTitle.innerText = `${reciter.name} - سورة ${SuwarNames[surahNum - 1]}`;
            }
        });
    }

    if (playBtn && audioPlayer) {
        playBtn.addEventListener('click', () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playBtn.innerText = '⏸';
            } else {
                audioPlayer.pause();
                playBtn.innerText = '▶';
            }
        });
    }

    if (audioPlayer && progressBar) {
        audioPlayer.addEventListener('timeupdate', () => {
            if (!isNaN(audioPlayer.duration)) {
                const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressBar.value = pct;
                
                const curM = Math.floor(audioPlayer.currentTime / 60);
                const curS = Math.floor(audioPlayer.currentTime % 60).toString().padStart(2, '0');
                const durM = Math.floor(audioPlayer.duration / 60);
                const durS = Math.floor(audioPlayer.duration % 60).toString().padStart(2, '0');
                if (audioTime) audioTime.innerText = `${curM}:${curS} / ${durM}:${durS}`;
            }
        });

        progressBar.addEventListener('input', (e) => {
            if (!isNaN(audioPlayer.duration)) {
                audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
            }
        });
    }

    fetchReciters();
}

// ==========================================
// 5. محرك المصحف المكتوب
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
                    text = text.replace(/^بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*|^بۡسۡمِ\s+ٱللَّهِ\s+ٱلرَّحۡمَٰنِ\s+ٱلرَّحِيمِ\s*/ui, "");
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

// ==========================================
// 6. قواعد بيانات الدول ومواقيت الصلاة
// ==========================================
const LocationsDB = {
    "المغرب": ["الرباط", "الدار البيضاء", "فاس", "مراكش", "طنجة", "أكادير"],
    "السعودية": ["مكة المكرمة", "المدينة المنورة", "الرياض", "جدة", "الدمام"],
    "مصر": ["القاهرة", "الإسكندرية", "الجيزة", "بورسعيد", "الأقصر"],
    "الإمارات": ["أبوظبي", "دبي", "الشارقة", "العين"],
    "الجزائر": ["الجزائر العاصمة", "وهران", "قسنطينة"]
};

let countdownInterval = null;

function initPrayerEngine() {
    const selectCountry = document.getElementById('select-country');
    const selectCity = document.getElementById('select-city');
    const gpsBtn = document.getElementById('btn-gps-location');

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

    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    fetchPrayerTimesByCoords(lat, lng);
                }, () => alert("تعذر تحديد موقعك. يرجى تفعيل الـ GPS."));
            }
        });
    }
}

async function fetchPrayerTimesByCity(city, country) {
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=8`);
        const data = await res.json();
        if (data.data) updatePrayerUI(data.data.timings);
    } catch(err) { console.error("خطأ جلب المواقيت:", err); }
}

async function fetchPrayerTimesByCoords(lat, lng) {
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=8`);
        const data = await res.json();
        if (data.data) updatePrayerUI(data.data.timings);
    } catch(err) { console.error("خطأ GPS:", err); }
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
            if (timeMins > currentTime && timeMins < nextPrayerTimeMins) {
                nextPrayerTimeMins = timeMins;
                nextPrayerName = arName;
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

// ==========================================
// 7. محرك المسبحة الإلكترونية
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
// 8. واجهة المستخدم والتنقل والترقية
// ==========================================
function initUI() {
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

    // النوافذ المنبثقة: الإعدادات والدعم
    const btnSettings = document.getElementById('btn-settings');
    const modalSettings = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    
    if(btnSettings) btnSettings.addEventListener('click', () => modalSettings.classList.remove('hidden'));
    if(btnCloseSettings) btnCloseSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));

    const btnDonate = document.getElementById('btn-donate');
    const modalDonate = document.getElementById('modal-donate');
    const btnCloseDonate = document.getElementById('btn-close-donate');

    if(btnDonate) btnDonate.addEventListener('click', () => modalDonate.classList.remove('hidden'));
    if(btnCloseDonate) btnCloseDonate.addEventListener('click', () => modalDonate.classList.add('hidden'));

    // الوضع الداكن
    const darkModeToggle = document.getElementById('toggle-dark-mode');
    if (darkModeToggle) {
        darkModeToggle.checked = StorageManager.state.isDarkMode;
        darkModeToggle.addEventListener('change', (e) => {
            StorageManager.update('isDarkMode', e.target.checked);
            applyDarkMode();
        });
    }

    // التحكم بالخط وحجم السبحة
    document.getElementById('btn-font-plus')?.addEventListener('click', () => {
        if(StorageManager.state.fontSize < 40) { StorageManager.update('fontSize', StorageManager.state.fontSize + 2); applyFontSize(); }
    });
    document.getElementById('btn-font-minus')?.addEventListener('click', () => {
        if(StorageManager.state.fontSize > 16) { StorageManager.update('fontSize', StorageManager.state.fontSize - 2); applyFontSize(); }
    });

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
// 9. تشغيل التطبيق عند التحميل
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.load();
    applyDarkMode();
    applyFontSize();
    applySebhaSize(StorageManager.state.sebhaSize);
    
    initAudioEngine();
    initMushafEngine();
    initAzkarEngine();
    initPrayerEngine();
    initSebha();
    initUI();
});
