// ==========================================
// 1. المتغيرات الصوتية العامة وإدارة التخزين
// ==========================================
const sebhaClickSound = new Audio('sebha-click.mp3');
const adhanAudio = new Audio('adhan.mp3');

const StorageManager = {
    state: {
        lang: 'ar',
        fontSize: 24,
        soundVib: true,
        sebhaTheme: 'default',
        sebhaSize: 'md',
        lastSurahMushaf: 1,
        activeTab: 'tab-mushaf',
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
    save() { localStorage.setItem('nourAlIslamState', JSON.stringify(this.state)); },
    update(key, value) { this.state[key] = value; this.save(); }
};

// ==========================================
// 2. فحص الصلاحيات والاشتراكات
// ==========================================
let pendingFeatureCallback = null;

function checkFeatureAccess(featureType, featureName, onSuccess) {
    if (StorageManager.state.isProUser) {
        if (onSuccess) onSuccess();
        return true;
    }
    if (featureType === 'pro') {
        const modalDonate = document.getElementById('modal-donate');
        if (modalDonate) modalDonate.classList.remove('hidden');
        return false;
    }
    if (featureType === 'ad') {
        const unlockedKey = `ad_unlocked_${featureName}`;
        const unlockedExpiry = localStorage.getItem(unlockedKey);
        if (unlockedExpiry && Date.now() < parseInt(unlockedExpiry, 10)) {
            if (onSuccess) onSuccess();
            return true;
        }
        const modalAd = document.getElementById('modal-ad-reward');
        pendingFeatureCallback = () => {
            localStorage.setItem(unlockedKey, (Date.now() + 24 * 60 * 60 * 1000).toString());
            if (onSuccess) onSuccess();
        };
        if (modalAd) modalAd.classList.remove('hidden');
        return false;
    }
    if (onSuccess) onSuccess();
    return true;
}

function initMonetizationLogic() {
    const modalAd = document.getElementById('modal-ad-reward');
    const btnWatchAd = document.getElementById('btn-watch-ad');
    const btnUpgradeAd = document.getElementById('btn-upgrade-from-ad');
    const btnCloseAdModal = document.getElementById('btn-close-ad-modal');
    const modalDonate = document.getElementById('modal-donate');

    if (btnWatchAd) {
        btnWatchAd.addEventListener('click', () => {
            btnWatchAd.innerText = 'جاري تحضير الإعلان... ⏳';
            btnWatchAd.disabled = true;
            setTimeout(() => {
                btnWatchAd.innerText = 'شاهد الإعلان للفتح ▶️';
                btnWatchAd.disabled = false;
                if (modalAd) modalAd.classList.add('hidden');
                if (pendingFeatureCallback) {
                    pendingFeatureCallback();
                    pendingFeatureCallback = null;
                }
            }, 1500);
        });
    }

    if (btnUpgradeAd) {
        btnUpgradeAd.addEventListener('click', () => {
            if (modalAd) modalAd.classList.add('hidden');
            if (modalDonate) modalDonate.classList.remove('hidden');
        });
    }

    if (btnCloseAdModal) {
        btnCloseAdModal.addEventListener('click', () => {
            if (modalAd) modalAd.classList.add('hidden');
            pendingFeatureCallback = null;
        });
    }

    document.querySelectorAll('[data-subscribe-pro]').forEach(btn => {
        btn.addEventListener('click', () => {
            StorageManager.update('isProUser', true);
            alert('🎉 مبروك! تم تفعيل النسخة الاحترافية Pro بنجاح. استمتع بكل الميزات بدون إعلانات.');
            if (modalDonate) modalDonate.classList.add('hidden');
            location.reload();
        });
    });

    // منطق التبرع
    document.querySelectorAll('.donate-amount-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.dataset.amount;
            if (modalDonate) modalDonate.classList.add('hidden');
            const modalThanks = document.getElementById('modal-donate-thanks');
            const amountEl = document.getElementById('donate-thanks-amount');
            if (amountEl) amountEl.innerText = `تبرعت بـ ${amount}$ 💝`;
            if (modalThanks) modalThanks.classList.remove('hidden');
        });
    });

    const btnCloseDonate = document.getElementById('btn-close-donate');
    if (btnCloseDonate) {
        btnCloseDonate.addEventListener('click', () => {
            if (modalDonate) modalDonate.classList.add('hidden');
        });
    }

    const btnCloseThanks = document.getElementById('btn-close-donate-thanks');
    if (btnCloseThanks) {
        btnCloseThanks.addEventListener('click', () => {
            document.getElementById('modal-donate-thanks').classList.add('hidden');
        });
    }
}

// ==========================================
// 3. الوضع الداكن وحجم الخط والسبحة
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
    const mainContainer = document.getElementById('digital-tally-counter');
    if (mainContainer) {
        mainContainer.className = mainContainer.className.replace(/\bsebha-size-\S+/g, '');
        mainContainer.classList.add(`sebha-size-${sizeValue || 'md'}`);
    }
}

function applyFontSize() {
    const container = document.getElementById('mushaf-container');
    if (container) container.style.fontSize = `${StorageManager.state.fontSize}px`;
    const display = document.getElementById('font-size-display');
    if (display) display.innerText = StorageManager.state.fontSize + 'px';
}

// ==========================================
// 4. بيانات الأذكار الكاملة
// ==========================================
const CompleteAzkarData = {
    morning: [
        { text: "أَعُوذُ بِاللهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ (ثُمَّ يَقرأ ثَلاثَ آياتٍ مِنْ آخِرِ سُورَةِ الْحَشر)", count: 1, source: "الترمذي" },
        { text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ.", count: 1, source: "الترمذي وأبو داود" },
        { text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ.", count: 1, source: "مسلم" },
        { text: "آيَةُ الْكُرْسِيِّ: اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ.", count: 1, source: "النسائي" },
        { text: "قُلْ هُوَ اللَّهُ أَحَدٌ... وَقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... وَقُلْ أَعُوذُ بِرَبِّ النَّاسِ", count: 3, source: "أبو داود والترمذي" },
        { text: "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ. (سيد الاستغفار)", count: 1, source: "البخاري" },
        { text: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لاَ إِلَهَ إِلاَّ أَنْتَ.", count: 3, source: "أبو داود" },
        { text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لاَ إِلَهَ إِلاَّ أَنْتَ.", count: 3, source: "أبو داود والنسائي" },
        { text: "حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ، عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.", count: 7, source: "أبو داود" },
        { text: "بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.", count: 3, source: "أبو داود والترمذي" },
        { text: "رَضِيتُ بِاللَّهِ رَبَّاً، وَبِالإِسْلاَمِ دِيناً، وَبِمُحَمَّدٍ ﷺ نَبِيَّاً.", count: 3, source: "أبو داود والترمذي" },
        { text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ.", count: 3, source: "الحاكم" },
        { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.", count: 3, source: "مسلم" },
        { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي.", count: 1, source: "أبو داود وابن ماجه" },
        { text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ.", count: 1, source: "البخاري" },
        { text: "لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.", count: 10, source: "أبو داود والنسائي" }
    ],
    evening: [
        { text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ.", count: 1, source: "الترمذي وأبو داود" },
        { text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا.", count: 1, source: "مسلم" },
        { text: "آيَةُ الْكُرْسِيِّ (البقرة:255)", count: 1, source: "النسائي" },
        { text: "قُلْ هُوَ اللَّهُ أَحَدٌ... وَقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... وَقُلْ أَعُوذُ بِرَبِّ النَّاسِ", count: 3, source: "أبو داود والترمذي" },
        { text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.", count: 3, source: "مسلم" },
        { text: "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ... (سيد الاستغفار)", count: 1, source: "البخاري" },
        { text: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لاَ إِلَهَ إِلاَّ أَنْتَ.", count: 3, source: "أبو داود" },
        { text: "بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.", count: 3, source: "أبو داود والترمذي" },
        { text: "حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ، عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.", count: 7, source: "أبو داود" },
        { text: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلاَئِكَتَكَ وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لاَ إِلَهَ إِلاَّ أَنْتَ وَحْدَكَ لاَ شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدَاً عَبْدُكَ وَرَسُولُكَ.", count: 4, source: "أبو داود" },
        { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.", count: 3, source: "مسلم" },
        { text: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ، فَمِنْكَ وَحْدَكَ لاَ شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ.", count: 1, source: "أبو داود" }
    ],
    sleep: [
        { text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.", count: 1, source: "البخاري ومسلم" },
        { text: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ.", count: 3, source: "أبو داود والترمذي" },
        { text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا.", count: 1, source: "البخاري" },
        { text: "الحمد لله الذي أطعمنا وسقانا، وكفانا وآوانا، فكم ممن لا كافي له ولا مؤوي.", count: 1, source: "مسلم" },
        { text: "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لاَ مَلْجَأَ وَلاَ مَنْجَا مِنْكَ إِلاَّ إِلَيْكَ.", count: 1, source: "البخاري ومسلم" },
        { text: "سُبْحَانَ اللَّهِ (33)، الحَمْدُ لِلَّهِ (33)، اللَّهُ أَكْبَرُ (34) عند النوم", count: 1, source: "البخاري ومسلم" },
        { text: "آيَةُ الْكُرْسِيِّ عند النوم — من قرأها حُفظ ولم يقربه شيطان حتى يصبح.", count: 1, source: "البخاري" },
        { text: "قُلْ هُوَ اللَّهُ أَحَدٌ، وَالمُعَوِّذَتَيْن (3 مرات) ثم ينفث في كفيه ويمسح بهما جسده.", count: 3, source: "البخاري ومسلم" }
    ],
    wakeup: [
        { text: "الحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ.", count: 1, source: "البخاري" },
        { text: "لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلاَ إِلَهَ إِلاَّ اللَّهُ وَاللَّهُ أَكْبَرُ وَلاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ الْعَلِيِّ الْعَظِيمِ.", count: 1, source: "البخاري" },
        { text: "اللَّهُمَّ اغْفِرْ لِي ذَنْبِي، وَأَذْهِبْ غَيْظَ قَلْبِي، وَأَجِرْنِي مِنْ مُضِلاَّتِ الْفِتَنِ مَا أَحْيَيْتَنِي.", count: 1, source: "ابن السني" },
        { text: "الحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ.", count: 1, source: "الترمذي" }
    ],
    prayer: [
        { text: "قبل الصلاة — نية الصلاة في القلب وقول: الله أكبر", count: 1, source: "متفق عليه" },
        { text: "دُعَاءُ الاسْتِفْتَاح: سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلاَ إِلَهَ غَيْرُكَ.", count: 1, source: "أبو داود والترمذي" },
        { text: "بعد الصلاة: أَسْتَغْفِرُ اللَّهَ (3 مرات)، ثم: اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ، تَبَارَكْتَ ذَا الجَلاَلِ وَالإِكْرَامِ.", count: 1, source: "مسلم" },
        { text: "بعد الصلاة: سُبْحَانَ اللَّهِ (33)، الحَمْدُ لِلَّهِ (33)، اللَّهُ أَكْبَرُ (33)، ثُمَّ: لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ...", count: 1, source: "مسلم" },
        { text: "آيَةُ الكُرْسِيِّ بعد كل صلاة مكتوبة — من قرأها دخل الجنة.", count: 1, source: "النسائي" },
        { text: "قُلْ هُوَ اللَّهُ أَحَدٌ، وَالمُعَوِّذَتَيْن بعد كل صلاة مكتوبة.", count: 1, source: "أبو داود والنسائي" },
        { text: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ.", count: 1, source: "أبو داود والنسائي" }
    ],
    travel: [
        { text: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ. اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى.", count: 1, source: "مسلم" },
        { text: "اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالخَلِيفَةُ فِي الأَهْلِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ، وَكَآبَةِ الْمُنْقَلَبِ.", count: 1, source: "مسلم" },
        { text: "عند نزول منزل في السفر: أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.", count: 1, source: "مسلم" },
        { text: "دُعَاء الرُّجُوع مِن السَّفَر: آيِبُونَ، تَائِبُونَ، عَابِدُونَ، لِرَبِّنَا حَامِدُونَ.", count: 1, source: "مسلم" },
        { text: "لِلمُسَافِر عند الإِقامة: اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ خَيْرِ هَذِهِ الْقَرْيَةِ وَخَيْرِ أَهْلِهَا.", count: 1, source: "أبو داود" }
    ],
    food: [
        { text: "قبل الطعام: بِسْمِ اللَّهِ (فإن نسي في أوله فليقل: بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ).", count: 1, source: "أبو داود والترمذي" },
        { text: "بعد الطعام: الحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلاَ قُوَّةٍ.", count: 1, source: "أبو داود والترمذي" },
        { text: "قبل شرب الماء: بِسْمِ اللَّهِ، وبعده: الحَمْدُ لِلَّهِ.", count: 1, source: "الترمذي" },
        { text: "لمن أفطر عند أحد: اللَّهُمَّ أَطْعِمْ مَنْ أَطْعَمَنِي وَاسْقِ مَنْ سَقَانِي.", count: 1, source: "مسلم" },
        { text: "عند الفطر: اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ.", count: 1, source: "أبو داود" }
    ],
    istighfar: [
        { text: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ.", count: 3, source: "أبو داود والترمذي" },
        { text: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ.", count: 10, source: "مسلم" },
        { text: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الغَفُورُ.", count: 100, source: "أبو داود والترمذي" },
        { text: "لاَ إِلَهَ إِلاَّ أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ (دعاء يونس).", count: 3, source: "الترمذي" },
        { text: "اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَعَافِنِي وَارْزُقْنِي.", count: 7, source: "البخاري" },
        { text: "اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْماً كَثِيراً، وَلاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْحَمْنِي إِنَّكَ أَنْتَ الغَفُورُ الرَّحِيمُ.", count: 1, source: "البخاري ومسلم" }
    ]
};

// ==========================================
// 5. قاعدة بيانات الأحاديث الشريفة
// ==========================================
const HadithDatabase = {
    arbaeen: [
        { num: 1, text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.", source: "متفق عليه", narrator: "عمر بن الخطاب" },
        { num: 2, text: "بَيْنَمَا نَحْنُ جُلُوسٌ عِنْدَ رَسُولِ اللهِ ﷺ ذَاتَ يَوْمٍ، إِذْ طَلَعَ عَلَيْنَا رَجُلٌ... فَقَالَ: أَخْبِرْنِي عَنِ الإِسْلاَمِ. فَقَالَ رَسُولُ اللهِ ﷺ: الإِسْلاَمُ أَنْ تَشْهَدَ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّدَاً رَسُولُ اللهِ، وَتُقِيمَ الصَّلاَةَ، وَتُؤْتِيَ الزَّكَاةَ، وَتَصُومَ رَمَضَانَ، وَتَحُجَّ الْبَيْتَ إِنِ اسْتَطَعْتَ إِلَيْهِ سَبِيلاً.", source: "مسلم", narrator: "عمر بن الخطاب" },
        { num: 3, text: "بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّداً رَسُولُ اللهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ.", source: "متفق عليه", narrator: "ابن عمر" },
        { num: 4, text: "إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ أَرْبَعِينَ يَوْماً نُطْفَةً، ثُمَّ يَكُونُ عَلَقَةً مِثْلَ ذَلِكَ، ثُمَّ يَكُونُ مُضْغَةً مِثْلَ ذَلِكَ، ثُمَّ يُرْسَلُ إِلَيْهِ الْمَلَكُ فَيَنْفُخُ فِيهِ الرُّوحَ.", source: "متفق عليه", narrator: "عبدالله بن مسعود" },
        { num: 5, text: "مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ فِيهِ، فَهُوَ رَدٌّ.", source: "متفق عليه", narrator: "عائشة" },
        { num: 6, text: "إِنَّ الْحَلاَلَ بَيِّنٌ، وَإِنَّ الْحَرَامَ بَيِّنٌ، وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ لاَ يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ، فَمَنِ اتَّقَى الشُّبُهَاتِ فَقَدِ اسْتَبْرَأَ لِدِينِهِ وَعِرْضِهِ.", source: "متفق عليه", narrator: "النعمان بن بشير" },
        { num: 7, text: "الدِّينُ النَّصِيحَةُ. قُلْنَا: لِمَنْ؟ قَالَ: لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ.", source: "مسلم", narrator: "تميم الداري" },
        { num: 8, text: "أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّداً رَسُولُ اللهِ، وَيُقِيمُوا الصَّلاَةَ، وَيُؤْتُوا الزَّكَاةَ.", source: "متفق عليه", narrator: "ابن عمر" },
        { num: 9, text: "مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ، وَمَا أَمَرْتُكُمْ بِهِ فَأْتُوا مِنْهُ مَا اسْتَطَعْتُمْ، فَإِنَّمَا أَهْلَكَ الَّذِينَ مِنْ قَبْلِكُمْ كَثْرَةُ مَسَائِلِهِمْ وَاخْتِلاَفُهُمْ عَلَى أَنْبِيَائِهِمْ.", source: "متفق عليه", narrator: "أبو هريرة" },
        { num: 10, text: "إِنَّ اللهَ طَيِّبٌ لاَ يَقْبَلُ إِلاَّ طَيِّباً، وَإِنَّ اللهَ أَمَرَ الْمُؤْمِنِينَ بِمَا أَمَرَ بِهِ الْمُرْسَلِينَ، فَقَالَ تَعَالَى: {يَا أَيُّهَا الرُّسُلُ كُلُوا مِنَ الطَّيِّبَاتِ وَاعْمَلُوا صَالِحاً}", source: "مسلم", narrator: "أبو هريرة" },
        { num: 11, text: "دَعْ مَا يَرِيبُكَ إِلَى مَا لاَ يَرِيبُكَ، فَإِنَّ الصِّدْقَ طُمَأْنِينَةٌ، وَإِنَّ الْكَذِبَ رِيبَةٌ.", source: "الترمذي والنسائي", narrator: "الحسن بن علي" },
        { num: 12, text: "مِنْ حُسْنِ إِسْلاَمِ الْمَرْءِ تَرْكُهُ مَا لاَ يَعْنِيهِ.", source: "الترمذي وابن ماجه", narrator: "أبو هريرة" },
        { num: 13, text: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ.", source: "متفق عليه", narrator: "أنس بن مالك" },
        { num: 14, text: "لاَ يَحِلُّ دَمُ امْرِئٍ مُسْلِمٍ يَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنِّي رَسُولُ اللهِ إِلاَّ بِإِحْدَى ثَلاَثٍ: الثَّيِّبُ الزَّانِي، وَالنَّفْسُ بِالنَّفْسِ، وَالتَّارِكُ لِدِينِهِ الْمُفَارِقُ لِلْجَمَاعَةِ.", source: "متفق عليه", narrator: "ابن مسعود" },
        { num: 15, text: "مَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْراً أَوْ لِيَصْمُتْ، وَمَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ.", source: "متفق عليه", narrator: "أبو هريرة" },
        { num: 16, text: "لاَ تَغْضَبْ. فَرَدَّدَ مِرَاراً، قَالَ: لاَ تَغْضَبْ.", source: "البخاري", narrator: "أبو هريرة" },
        { num: 17, text: "إِنَّ اللهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ، فَإِذَا قَتَلْتُمْ فَأَحْسِنُوا الْقِتْلَةَ، وَإِذَا ذَبَحْتُمْ فَأَحْسِنُوا الذِّبْحَةَ.", source: "مسلم", narrator: "شداد بن أوس" },
        { num: 18, text: "اتَّقِ اللهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ.", source: "الترمذي", narrator: "أبو ذر وأبو هريرة" },
        { num: 19, text: "احْفَظِ اللهَ يَحْفَظْكَ، احْفَظِ اللهَ تَجِدْهُ تُجَاهَكَ، إِذَا سَأَلْتَ فَاسْأَلِ اللهَ، وَإِذَا اسْتَعَنْتَ فَاسْتَعِنْ بِاللهِ.", source: "الترمذي", narrator: "ابن عباس" },
        { num: 20, text: "اسْتَفْتِ قَلْبَكَ، الْبِرُّ مَا اطْمَأَنَّتْ إِلَيْهِ النَّفْسُ وَاطْمَأَنَّ إِلَيْهِ الْقَلْبُ، وَالإِثْمُ مَا حَاكَ فِي النَّفْسِ وَتَرَدَّدَ فِي الصَّدْرِ.", source: "أحمد والدارمي", narrator: "وابصة بن معبد" }
    ],
    akhlaq: [
        { text: "إِنَّ مِنْ أَحَبِّكُمْ إِلَيَّ وَأَقْرَبِكُمْ مِنِّي مَجْلِساً يَوْمَ الْقِيَامَةِ أَحَاسِنَكُمْ أَخْلاَقاً.", source: "الترمذي", narrator: "أبو هريرة" },
        { text: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ.", source: "متفق عليه", narrator: "عبدالله بن عمرو" },
        { text: "أَكْمَلُ الْمُؤْمِنِينَ إِيمَاناً أَحْسَنُهُمْ خُلُقاً، وَخِيَارُكُمْ خِيَارُكُمْ لِنِسَائِهِمْ.", source: "الترمذي", narrator: "أبو هريرة" },
        { text: "الصِّدْقُ يَهْدِي إِلَى الْبِرِّ، وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ، وَإِنَّ الرَّجُلَ لَيَصْدُقُ حَتَّى يُكْتَبَ عِنْدَ اللهِ صِدِّيقاً.", source: "متفق عليه", narrator: "ابن مسعود" },
        { text: "إِيَّاكُمْ وَالْكَذِبَ، فَإِنَّ الْكَذِبَ يَهْدِي إِلَى الْفُجُورِ، وَإِنَّ الْفُجُورَ يَهْدِي إِلَى النَّارِ.", source: "متفق عليه", narrator: "ابن مسعود" },
        { text: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ.", source: "الترمذي", narrator: "أبو ذر الغفاري" },
        { text: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ.", source: "متفق عليه", narrator: "أبو هريرة" },
        { text: "إِنَّ اللهَ رَفِيقٌ يُحِبُّ الرِّفْقَ، وَيُعْطِي عَلَى الرِّفْقِ مَا لاَ يُعْطِي عَلَى الْعُنْفِ.", source: "مسلم", narrator: "عائشة" },
        { text: "مَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الآخِرِ فَلاَ يُؤْذِ جَارَهُ.", source: "متفق عليه", narrator: "أبو هريرة" },
        { text: "الْمُؤْمِنُ مِرْآةُ الْمُؤْمِنِ، وَالْمُؤْمِنُ أَخُو الْمُؤْمِنِ.", source: "أبو داود", narrator: "أبو هريرة" }
    ],
    salah: [
        { text: "الصَّلَاةُ الْخَمْسُ، وَالْجُمُعَةُ إِلَى الْجُمُعَةِ، وَرَمَضَانُ إِلَى رَمَضَانَ، مُكَفِّرَاتٌ لِمَا بَيْنَهُنَّ إِذَا اجْتُنِبَتِ الْكَبَائِرُ.", source: "مسلم", narrator: "أبو هريرة" },
        { text: "أَوَّلُ مَا يُحَاسَبُ عَنْهُ الْعَبْدُ يَوْمَ الْقِيَامَةِ مِنْ عَمَلِهِ صَلاَتُهُ، فَإِنْ صَلُحَتْ فَقَدْ أَفْلَحَ وَأَنْجَحَ.", source: "الترمذي وأبو داود", narrator: "أبو هريرة" },
        { text: "الصَّلَاةُ عِمَادُ الدِّينِ، مَنْ أَقَامَهَا فَقَدْ أَقَامَ الدِّينَ، وَمَنْ هَدَمَهَا فَقَدْ هَدَمَ الدِّينَ.", source: "البيهقي", narrator: "معاذ بن جبل" },
        { text: "مَا مِنْ امْرِئٍ مُسْلِمٍ تَحْضُرُهُ صَلاَةٌ مَكْتُوبَةٌ فَيُحْسِنُ وُضُوءَهَا وَخُشُوعَهَا وَرُكُوعَهَا إِلاَّ كَانَتْ كَفَّارَةً لِمَا قَبْلَهَا مِنَ الذُّنُوبِ.", source: "مسلم", narrator: "عثمان بن عفان" },
        { text: "أَلاَ أَدُلُّكُمْ عَلَى مَا يَمْحُو اللهُ بِهِ الْخَطَايَا وَيَرْفَعُ بِهِ الدَّرَجَاتِ؟ إِسْبَاغُ الْوُضُوءِ عَلَى الْمَكَارِهِ، وَكَثْرَةُ الْخُطَا إِلَى الْمَسَاجِدِ، وَانْتِظَارُ الصَّلاَةِ بَعْدَ الصَّلاَةِ.", source: "مسلم", narrator: "أبو هريرة" },
        { text: "أَحَبُّ الأَعْمَالِ إِلَى اللهِ الصَّلاَةُ لِوَقْتِهَا.", source: "متفق عليه", narrator: "ابن مسعود" },
        { text: "مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ.", source: "متفق عليه", narrator: "أبو موسى الأشعري" }
    ],
    iman: [
        { text: "الإِيمَانُ بِضْعٌ وَسَبْعُونَ أَوْ بِضْعٌ وَسِتُّونَ شُعْبَةً، فَأَفْضَلُهَا قَوْلُ لاَ إِلَهَ إِلاَّ اللهُ، وَأَدْنَاهَا إِمَاطَةُ الأَذَى عَنِ الطَّرِيقِ، وَالْحَيَاءُ شُعْبَةٌ مِنَ الإِيمَانِ.", source: "متفق عليه", narrator: "أبو هريرة" },
        { text: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى أَكُونَ أَحَبَّ إِلَيْهِ مِنْ وَالِدِهِ وَوَلَدِهِ وَالنَّاسِ أَجْمَعِينَ.", source: "متفق عليه", narrator: "أنس بن مالك" },
        { text: "ثَلاَثٌ مَنْ كُنَّ فِيهِ وَجَدَ بِهِنَّ حَلاَوَةَ الإِيمَانِ: أَنْ يَكُونَ اللهُ وَرَسُولُهُ أَحَبَّ إِلَيْهِ مِمَّا سِوَاهُمَا، وَأَنْ يُحِبَّ الْمَرْءَ لاَ يُحِبُّهُ إِلاَّ لِلَّهِ، وَأَنْ يَكْرَهَ أَنْ يَعُودَ فِي الْكُفْرِ كَمَا يَكْرَهُ أَنْ يُقْذَفَ فِي النَّارِ.", source: "متفق عليه", narrator: "أنس بن مالك" },
        { text: "الإِيمَانُ أَنْ تُؤْمِنَ بِاللهِ وَمَلاَئِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الآخِرِ وَتُؤْمِنَ بِالْقَدَرِ خَيْرِهِ وَشَرِّهِ.", source: "مسلم", narrator: "عمر بن الخطاب" },
        { text: "وَالَّذِي نَفْسِي بِيَدِهِ لاَ تَدْخُلُوا الْجَنَّةَ حَتَّى تُؤْمِنُوا، وَلاَ تُؤْمِنُوا حَتَّى تَحَابُّوا.", source: "مسلم", narrator: "أبو هريرة" },
        { text: "الإِيمَانُ يَزِيدُ وَيَنْقُصُ، وَهُوَ قَوْلٌ وَعَمَلٌ يَزِيدُ بِالطَّاعَةِ وَيَنْقُصُ بِالمَعْصِيَةِ.", source: "متفق عليه", narrator: "جمع من الصحابة" }
    ],
    qiyamah: [
        { text: "يُحْشَرُ النَّاسُ يَوْمَ الْقِيَامَةِ حُفَاةً عُرَاةً غُرْلاً. قَالَتْ عَائِشَةُ: يَا رَسُولَ اللهِ الرِّجَالُ وَالنِّسَاءُ يَنْظُرُ بَعْضُهُمْ إِلَى بَعْضٍ؟ قَالَ: يَا عَائِشَةُ الأَمْرُ أَشَدُّ مِنْ أَنْ يَهُمَّهُمْ ذَلِكَ.", source: "متفق عليه", narrator: "عائشة" },
        { text: "يَقُولُ اللهُ تَعَالَى يَوْمَ الْقِيَامَةِ: يَا ابْنَ آدَمَ مَرِضْتُ فَلَمْ تَعُدْنِي... جَاعَ فَلَمْ تُطْعِمْنِي... ظَمِئَ فَلَمْ تَسْقِنِي...", source: "مسلم", narrator: "أبو هريرة" },
        { text: "لاَ تَزُولُ قَدَمَا عَبْدٍ يَوْمَ الْقِيَامَةِ حَتَّى يُسْأَلَ عَنْ أَرْبَعٍ: عَنْ عُمُرِهِ فِيمَ أَفْنَاهُ، وَعَنْ عِلْمِهِ مَا عَمِلَ بِهِ، وَعَنْ مَالِهِ مِنْ أَيْنَ اكْتَسَبَهُ وَفِيمَ أَنْفَقَهُ، وَعَنْ جِسْمِهِ فِيمَ أَبْلاَهُ.", source: "الترمذي", narrator: "أبو برزة" },
        { text: "الْمِيزَانُ بِيَدِ الرَّحْمَنِ يَرْفَعُ أَقْوَاماً وَيَضَعُ آخَرِينَ.", source: "أبو داود", narrator: "عبدالله بن عمرو" },
        { text: "إِنَّ الشَّمْسَ تَدْنُو يَوْمَ الْقِيَامَةِ حَتَّى يَكُونَ الْعَرَقُ قَدْرَ سَبْعِينَ ذِرَاعاً فِي الأَرْضِ.", source: "متفق عليه", narrator: "المقداد بن الأسود" },
        { text: "أَوَّلُ مَا يُقْضَى بَيْنَ الْعِبَادِ يَوْمَ الْقِيَامَةِ فِي الدِّمَاءِ.", source: "متفق عليه", narrator: "ابن مسعود" },
        { text: "مَنْ أَخَذَ مِنَ الأَرْضِ شَيْئاً بِغَيْرِ حَقِّهِ خُسِفَ بِهِ يَوْمَ الْقِيَامَةِ إِلَى سَبْعِ أَرَضِينَ.", source: "متفق عليه", narrator: "سعيد بن زيد" }
    ]
};

// ==========================================
// 6. أسماء السور وعدد آياتها
// ==========================================
const SuwarNames = [
    "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس",
    "هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه",
    "الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم",
    "لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر",
    "فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق",
    "الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
    "الصف","الجُمُعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج",
    "نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس",
    "التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد",
    "الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات",
    "القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر",
    "المسد","الإخلاص","الفلق","الناس"
];

// عدد آيات كل سورة (ترتيباً من الفاتحة إلى الناس)
const SurahAyahCounts = [
    7,286,200,176,120,165,206,75,129,109,
    123,111,43,52,99,128,111,110,98,135,
    112,78,118,64,77,227,93,88,69,60,
    34,30,73,54,45,83,182,88,75,85,
    54,53,89,59,37,35,38,29,18,45,
    60,52,62,55,78,96,29,22,24,13,
    14,11,11,18,12,12,30,52,52,44,
    28,28,20,56,40,31,50,45,44,26,
    29,15,6,11,9,8,22,88,11,10,
    4,13,5,8,6,5,3,15,99,8,
    11,6,3,5,4,2,3,6,6,3,
    7,3,5,4,4,4,3,110
];

// بيانات الأجزاء وبداية كل جزء (السورة، الآية)
const JuzData = [
    { juz: 1, surah: 1, ayah: 1 }, { juz: 2, surah: 2, ayah: 142 },
    { juz: 3, surah: 2, ayah: 253 }, { juz: 4, surah: 3, ayah: 93 },
    { juz: 5, surah: 4, ayah: 24 }, { juz: 6, surah: 4, ayah: 148 },
    { juz: 7, surah: 5, ayah: 82 }, { juz: 8, surah: 6, ayah: 111 },
    { juz: 9, surah: 7, ayah: 88 }, { juz: 10, surah: 8, ayah: 41 },
    { juz: 11, surah: 9, ayah: 93 }, { juz: 12, surah: 11, ayah: 6 },
    { juz: 13, surah: 12, ayah: 53 }, { juz: 14, surah: 15, ayah: 1 },
    { juz: 15, surah: 17, ayah: 1 }, { juz: 16, surah: 18, ayah: 75 },
    { juz: 17, surah: 21, ayah: 1 }, { juz: 18, surah: 23, ayah: 1 },
    { juz: 19, surah: 25, ayah: 21 }, { juz: 20, surah: 27, ayah: 56 },
    { juz: 21, surah: 29, ayah: 46 }, { juz: 22, surah: 33, ayah: 31 },
    { juz: 23, surah: 36, ayah: 28 }, { juz: 24, surah: 39, ayah: 32 },
    { juz: 25, surah: 41, ayah: 47 }, { juz: 26, surah: 46, ayah: 1 },
    { juz: 27, surah: 51, ayah: 31 }, { juz: 28, surah: 58, ayah: 1 },
    { juz: 29, surah: 67, ayah: 1 }, { juz: 30, surah: 78, ayah: 1 }
];

// حساب إجمالي الآيات حتى سورة وآية معينة
function calcTotalAyahsDone(surahIndex, ayahNum) {
    let total = 0;
    for (let i = 0; i < surahIndex; i++) {
        total += SurahAyahCounts[i];
    }
    total += ayahNum;
    return total;
}

// ==========================================
// 7. متتبع الختمة
// ==========================================
function initKhatmahTracker() {
    const juzSelect = document.getElementById('khatmah-select-juz');
    const surahSelect = document.getElementById('khatmah-select-surah');
    const ayahInput = document.getElementById('khatmah-ayah-input');
    const btnSave = document.getElementById('btn-save-khatmah');
    const btnReset = document.getElementById('btn-reset-khatmah');
    const msgEl = document.getElementById('khatmah-msg');

    // ملء قائمة الأجزاء
    if (juzSelect) {
        for (let i = 1; i <= 30; i++) {
            juzSelect.innerHTML += `<option value="${i}">الجزء ${i}</option>`;
        }
    }

    // ملء قائمة السور
    if (surahSelect) {
        SuwarNames.forEach((name, index) => {
            surahSelect.innerHTML += `<option value="${index}">${index + 1}. سورة ${name}</option>`;
        });
    }

    // حساب الهدف اليومي وتحديث تاريخ النهاية
    function updateEndDate() {
        const saved = JSON.parse(localStorage.getItem('khatmahProgress') || '{}');
        if (!saved.startDate || !saved.ayahsDone) return;
        const dailyGoal = parseInt(document.getElementById('khatmah-daily-goal')?.value || 30);
        const remaining = 6236 - saved.ayahsDone;
        const daysNeeded = Math.ceil(remaining / dailyGoal);
        const endDate = new Date(saved.startDate);
        endDate.setDate(endDate.getDate() + daysNeeded);
        const endEl = document.getElementById('khatmah-end-date');
        if (endEl) endEl.innerText = endDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // تحديث واجهة الختمة
    function refreshKhatmahUI() {
        const saved = JSON.parse(localStorage.getItem('khatmahProgress') || '{}');
        if (!saved.ayahsDone) return;

        const percent = Math.min(100, Math.floor((saved.ayahsDone / 6236) * 100));
        const bar = document.getElementById('khatmah-progress-bar');
        const percentEl = document.getElementById('khatmah-percent');
        const ayahsEl = document.getElementById('khatmah-ayahs-done');
        const startEl = document.getElementById('khatmah-start-date');

        if (bar) bar.style.width = percent + '%';
        if (percentEl) percentEl.innerText = percent + '%';
        if (ayahsEl) ayahsEl.innerText = saved.ayahsDone + ' آية مكتملة';
        if (startEl && saved.startDate) {
            startEl.innerText = new Date(saved.startDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        updateEndDate();
    }

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            const surahIdx = parseInt(surahSelect?.value || 0);
            const ayahNum = parseInt(ayahInput?.value || 0);

            if (isNaN(surahIdx) || isNaN(ayahNum) || ayahNum < 1) {
                if (msgEl) { msgEl.innerText = '⚠️ يرجى اختيار السورة وإدخال رقم الآية.'; msgEl.classList.remove('hidden', 'text-primary'); msgEl.classList.add('text-red-500'); }
                return;
            }
            const maxAyahs = SurahAyahCounts[surahIdx];
            if (ayahNum > maxAyahs) {
                if (msgEl) { msgEl.innerText = `⚠️ سورة ${SuwarNames[surahIdx]} لا تتجاوز ${maxAyahs} آية.`; msgEl.classList.remove('hidden', 'text-primary'); msgEl.classList.add('text-red-500'); }
                return;
            }

            const ayahsDone = calcTotalAyahsDone(surahIdx, ayahNum);
            const existing = JSON.parse(localStorage.getItem('khatmahProgress') || '{}');
            const startDate = existing.startDate || new Date().toISOString();

            localStorage.setItem('khatmahProgress', JSON.stringify({
                surahIdx, ayahNum, ayahsDone, startDate,
                lastUpdated: new Date().toISOString()
            }));

            if (msgEl) { msgEl.innerText = `✅ تم حفظ تقدمك! وصلت إلى سورة ${SuwarNames[surahIdx]}، الآية ${ayahNum}.`; msgEl.classList.remove('hidden', 'text-red-500'); msgEl.classList.add('text-primary'); }
            refreshKhatmahUI();
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (confirm('هل تريد مسح تقدم الختمة والبدء من جديد؟')) {
                localStorage.removeItem('khatmahProgress');
                if (document.getElementById('khatmah-progress-bar')) document.getElementById('khatmah-progress-bar').style.width = '0%';
                if (document.getElementById('khatmah-percent')) document.getElementById('khatmah-percent').innerText = '0%';
                if (document.getElementById('khatmah-ayahs-done')) document.getElementById('khatmah-ayahs-done').innerText = '0 آية مكتملة';
                if (document.getElementById('khatmah-start-date')) document.getElementById('khatmah-start-date').innerText = '—';
                if (document.getElementById('khatmah-end-date')) document.getElementById('khatmah-end-date').innerText = '—';
                if (msgEl) { msgEl.innerText = '🔄 تم إعادة تعيين الختمة.'; msgEl.classList.remove('hidden'); }
            }
        });
    }

    document.getElementById('khatmah-daily-goal')?.addEventListener('change', updateEndDate);
    refreshKhatmahUI();
}

// ==========================================
// 8. مكتبة الأحاديث
// ==========================================
function initHadithLibrary() {
    const listContainer = document.getElementById('hadith-list-container');
    const searchInput = document.getElementById('hadith-search');
    let currentCat = 'arbaeen';

    function renderHadiths(cat, filterText = '') {
        if (!listContainer) return;
        const data = HadithDatabase[cat] || [];
        const filtered = filterText
            ? data.filter(h => h.text.includes(filterText) || (h.narrator || '').includes(filterText))
            : data;

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="text-center text-gray-400 py-8 bg-white dark:bg-gray-800 rounded-2xl">لا توجد نتائج للبحث</div>';
            return;
        }

        listContainer.innerHTML = filtered.map((h, i) => `
            <div class="hadith-card bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div class="flex justify-between items-start mb-2">
                    ${cat === 'arbaeen' && h.num ? `<span class="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg">الحديث ${h.num}</span>` : '<span></span>'}
                    <span class="text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-lg">${h.source}</span>
                </div>
                <p class="hadith-text text-gray-800 dark:text-gray-100 my-3 text-lg leading-loose font-[Amiri]">${h.text}</p>
                ${h.narrator ? `<p class="text-xs text-primary font-semibold mb-3">رواه: ${h.narrator}</p>` : ''}
                <div class="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button class="hadith-action-btn flex-1 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-primary/10 hover:text-primary transition font-semibold" onclick="copyHadith(this)">📋 نسخ</button>
                    <button class="hadith-action-btn flex-1 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition font-semibold" onclick="shareHadith(this)">🔗 مشاركة</button>
                </div>
            </div>
        `).join('');
    }

    document.querySelectorAll('.hadith-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCat = btn.dataset.cat;
            document.querySelectorAll('.hadith-cat-btn').forEach(b => {
                b.className = 'hadith-cat-btn flex-shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-1.5 rounded-full text-xs font-bold';
            });
            btn.className = 'hadith-cat-btn flex-shrink-0 bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold';
            renderHadiths(currentCat, searchInput?.value.trim() || '');
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderHadiths(currentCat, searchInput.value.trim());
        });
    }

    renderHadiths('arbaeen');
}

window.copyHadith = function(btn) {
    const card = btn.closest('.hadith-card');
    const text = card.querySelector('.hadith-text')?.innerText;
    if (text && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            btn.innerText = '✅ تم النسخ';
            setTimeout(() => { btn.innerText = '📋 نسخ'; }, 2000);
        });
    }
};

window.shareHadith = function(btn) {
    const card = btn.closest('.hadith-card');
    const text = card.querySelector('.hadith-text')?.innerText;
    if (text && navigator.share) {
        navigator.share({ title: 'حديث شريف', text: text });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        btn.innerText = '✅ تم النسخ';
        setTimeout(() => { btn.innerText = '🔗 مشاركة'; }, 2000);
    }
};

// ==========================================
// 9. تفسير القرآن الكريم
// ==========================================
function initTafsirEngine() {
    const surahSelect = document.getElementById('select-surah-tafsir');
    const tafsirContainer = document.getElementById('tafsir-container');
    const tafsirSearch = document.getElementById('tafsir-search');
    let currentTafsirData = [];

    if (surahSelect) {
        SuwarNames.forEach((name, index) => {
            surahSelect.innerHTML += `<option value="${index + 1}">${index + 1}. سورة ${name}</option>`;
        });

        surahSelect.addEventListener('change', async (e) => {
            const surahId = e.target.value;
            if (!surahId) return;
            if (tafsirContainer) tafsirContainer.innerHTML = '<div class="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"><div class="text-3xl mb-2">⏳</div><p>جاري تحميل التفسير...</p></div>';
            try {
                // جلب النص القرآني + تفسير الميسر
                const [quranRes, tafsirRes] = await Promise.all([
                    fetch(`https://api.alquran.cloud/v1/surah/${surahId}`),
                    fetch(`https://api.alquran.cloud/v1/surah/${surahId}/ar.muyassar`)
                ]);
                const quranData = await quranRes.json();
                const tafsirData = await tafsirRes.json();

                if (!quranData.data || !tafsirData.data) throw new Error('فشل تحميل البيانات');

                currentTafsirData = quranData.data.ayahs.map((ayah, i) => ({
                    num: ayah.numberInSurah,
                    quranText: ayah.text,
                    tafsirText: tafsirData.data.ayahs[i]?.text || ''
                }));
                renderTafsir(currentTafsirData, SuwarNames[parseInt(surahId) - 1]);
            } catch (err) {
                if (tafsirContainer) tafsirContainer.innerHTML = '<div class="text-center py-8 text-red-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">⚠️ تعذر تحميل التفسير. تحقق من الاتصال بالإنترنت.</div>';
            }
        });
    }

    function renderTafsir(items, surahName) {
        if (!tafsirContainer) return;
        tafsirContainer.innerHTML = `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 mb-2 text-center">
                <h3 class="text-xl font-bold font-[Amiri] text-primary">سورة ${surahName}</h3>
                <p class="text-xs text-gray-400 mt-1">تفسير الميسر — مجمع الملك فهد لطباعة المصحف الشريف</p>
            </div>
        ` + items.map(item => `
            <div class="tafsir-card bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-3">
                    <span class="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">${item.num}</span>
                    <p class="font-[Amiri] text-lg leading-loose text-gray-900 dark:text-gray-100 flex-1">${item.quranText}</p>
                </div>
                <div class="border-t border-gray-100 dark:border-gray-700 pt-3 mt-2">
                    <p class="text-xs font-bold text-primary mb-1">📖 التفسير:</p>
                    <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">${item.tafsirText}</p>
                </div>
            </div>
        `).join('');
    }

    if (tafsirSearch) {
        tafsirSearch.addEventListener('input', () => {
            const q = tafsirSearch.value.trim();
            if (!q || currentTafsirData.length === 0) {
                if (currentTafsirData.length > 0) renderTafsir(currentTafsirData, SuwarNames[parseInt(document.getElementById('select-surah-tafsir')?.value || 1) - 1]);
                return;
            }
            const filtered = currentTafsirData.filter(i => i.quranText.includes(q) || i.tafsirText.includes(q));
            renderTafsir(filtered, SuwarNames[parseInt(document.getElementById('select-surah-tafsir')?.value || 1) - 1]);
        });
    }
}

// ==========================================
// 10. محرك الأذكار الكاملة
// ==========================================
function initCompleteAzkar() {
    const btnShowAzkar = document.getElementById('btn-show-azkar');
    const btnCloseAzkar = document.getElementById('btn-close-azkar-panel');
    const panelAzkar = document.getElementById('panel-azkar');
    const categoriesHeader = document.getElementById('azkar-categories-header');
    const readerPanel = document.getElementById('azkar-reader-panel');
    const itemsList = document.getElementById('azkar-items-list');
    const readerTitle = document.getElementById('azkar-reader-title');
    const btnBack = document.getElementById('btn-back-azkar-panel');
    const btnReset = document.getElementById('btn-reset-azkar');

    const azkarTitles = {
        morning: '🌅 أذكار الصباح',
        evening: '🌇 أذكار المساء',
        sleep: '🌙 أذكار النوم',
        wakeup: '☀️ أذكار الاستيقاظ',
        prayer: '🕌 أذكار الصلاة',
        travel: '✈️ أذكار السفر',
        food: '🍽️ أذكار الطعام والشراب',
        istighfar: '🙏 الاستغفار والتوبة'
    };

    if (btnShowAzkar) {
        btnShowAzkar.addEventListener('click', () => {
            if (panelAzkar) {
                panelAzkar.classList.toggle('hidden');
                const worshipPanel = document.getElementById('panel-worship');
                if (worshipPanel) worshipPanel.classList.add('hidden');
            }
        });
    }

    if (btnCloseAzkar) {
        btnCloseAzkar.addEventListener('click', () => {
            if (panelAzkar) panelAzkar.classList.add('hidden');
        });
    }

    // نغمة الانتهاء
    let completionSound = null;
    try { completionSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...'); } catch(e) {}

    function playCompletionAlert() {
        if (!StorageManager.state.soundVib) return;
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        // صوت بسيط بالـ Web Audio API
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
    }

    let currentAzkarItems = [];

    function renderAzkarItems(type) {
        if (!itemsList || !readerTitle) return;
        const items = CompleteAzkarData[type] || [];
        currentAzkarItems = items.map(item => ({ ...item, currentCount: item.count, done: false }));
        readerTitle.innerText = azkarTitles[type] || 'الأذكار';

        function refreshList() {
            itemsList.innerHTML = currentAzkarItems.map((item, idx) => `
                <div class="zekr-card p-4 rounded-2xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${item.done ? 'done' : ''}" id="zekr-${idx}">
                    <p class="font-[Amiri] text-lg leading-loose text-gray-800 dark:text-gray-100 mb-2">${item.text}</p>
                    <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div class="text-xs text-gray-400">
                            <span>التكرار: ${item.count}</span>
                            ${item.source ? ` · <span class="text-primary">${item.source}</span>` : ''}
                        </div>
                        <button class="zekr-count-btn ${item.done ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-secondary'} font-bold px-5 py-2 rounded-xl text-lg shadow-sm transition" 
                            data-idx="${idx}" ${item.done ? 'disabled' : ''}>
                            ${item.done ? '✓ تم' : item.currentCount}
                        </button>
                    </div>
                </div>
            `).join('');

            // إضافة أحداث النقر
            itemsList.querySelectorAll('.zekr-count-btn:not([disabled])').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    if (currentAzkarItems[idx].currentCount > 0) {
                        currentAzkarItems[idx].currentCount--;
                        if (StorageManager.state.soundVib && navigator.vibrate) navigator.vibrate(30);
                        if (currentAzkarItems[idx].currentCount === 0) {
                            currentAzkarItems[idx].done = true;
                            playCompletionAlert();
                        }
                        refreshList();
                    }
                });
            });
        }

        refreshList();
        if (categoriesHeader) categoriesHeader.classList.add('hidden');
        if (readerPanel) readerPanel.classList.remove('hidden');
    }

    document.querySelectorAll('.azkar-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => renderAzkarItems(btn.dataset.azkar));
    });

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            if (readerPanel) readerPanel.classList.add('hidden');
            if (categoriesHeader) categoriesHeader.classList.remove('hidden');
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            currentAzkarItems = currentAzkarItems.map(item => ({ ...item, currentCount: item.count, done: false }));
            document.querySelectorAll('[id^="zekr-"]').forEach(el => {
                const idx = parseInt(el.id.split('-')[1]);
                const btn = el.querySelector('.zekr-count-btn');
                if (btn) btn.innerText = currentAzkarItems[idx].count;
                el.classList.remove('done');
            });
        });
    }
}

// ==========================================
// 11. متتبع العبادات اليومي
// ==========================================
const WorshipItems = [
    { id: 'fajr', label: 'صلاة الفجر', icon: '🌅', points: 2 },
    { id: 'dhuhr', label: 'صلاة الظهر', icon: '☀️', points: 2 },
    { id: 'asr', label: 'صلاة العصر', icon: '🌤️', points: 2 },
    { id: 'maghrib', label: 'صلاة المغرب', icon: '🌆', points: 2 },
    { id: 'isha', label: 'صلاة العشاء', icon: '🌙', points: 2 },
    { id: 'nawafil', label: 'صلاة النوافل', icon: '🕌', points: 1 },
    { id: 'quran', label: 'قراءة ورد القرآن', icon: '📖', points: 1 },
    { id: 'azkar', label: 'أذكار الصباح والمساء', icon: '📿', points: 1 },
    { id: 'sadaqah', label: 'الصدقة اليومية', icon: '💝', points: 1 }
];

function initWorshipTracker() {
    const btnShowWorship = document.getElementById('btn-show-worship');
    const btnCloseWorship = document.getElementById('btn-close-worship-panel');
    const panelWorship = document.getElementById('panel-worship');
    const checklistContainer = document.getElementById('worship-checklist');
    const dateEl = document.getElementById('worship-date');
    const btnReport = document.getElementById('btn-worship-report');

    const todayKey = () => 'worship_' + new Date().toISOString().split('T')[0];

    function loadTodayData() {
        return JSON.parse(localStorage.getItem(todayKey()) || '{}');
    }

    function saveTodayData(data) {
        localStorage.setItem(todayKey(), JSON.stringify(data));
    }

    function updateProgress(data) {
        const total = WorshipItems.length;
        const done = WorshipItems.filter(item => data[item.id]).length;
        const bar = document.getElementById('worship-progress-bar');
        const score = document.getElementById('worship-score');
        if (bar) bar.style.width = ((done / total) * 100) + '%';
        if (score) score.innerText = `${done}/${total}`;
    }

    function renderChecklist() {
        if (!checklistContainer) return;
        const data = loadTodayData();
        if (dateEl) {
            dateEl.innerText = new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
        }
        checklistContainer.innerHTML = WorshipItems.map(item => `
            <div class="worship-item flex items-center gap-3 p-3 rounded-xl cursor-pointer ${data[item.id] ? 'checked' : 'bg-gray-50 dark:bg-gray-900'}"
                 onclick="toggleWorshipItem('${item.id}', this)">
                <span class="text-xl">${item.icon}</span>
                <label class="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer ${data[item.id] ? 'line-through text-gray-400' : ''}">${item.label}</label>
                <div class="w-6 h-6 rounded-full flex items-center justify-center ${data[item.id] ? 'bg-primary text-white' : 'border-2 border-gray-300 dark:border-gray-600'}">
                    ${data[item.id] ? '✓' : ''}
                </div>
            </div>
        `).join('');
        updateProgress(data);
    }

    window.toggleWorshipItem = function(itemId, el) {
        const data = loadTodayData();
        data[itemId] = !data[itemId];
        saveTodayData(data);
        if (StorageManager.state.soundVib && navigator.vibrate) navigator.vibrate(30);
        renderChecklist();
    };

    if (btnShowWorship) {
        btnShowWorship.addEventListener('click', () => {
            if (panelWorship) {
                panelWorship.classList.toggle('hidden');
                const azkarPanel = document.getElementById('panel-azkar');
                if (azkarPanel) azkarPanel.classList.add('hidden');
                renderChecklist();
            }
        });
    }

    if (btnCloseWorship) {
        btnCloseWorship.addEventListener('click', () => {
            if (panelWorship) panelWorship.classList.add('hidden');
        });
    }

    if (btnReport) {
        btnReport.addEventListener('click', () => {
            document.getElementById('modal-worship-report').classList.remove('hidden');
            renderWorshipReport('weekly');
        });
    }

    document.getElementById('btn-close-worship-report')?.addEventListener('click', () => {
        document.getElementById('modal-worship-report').classList.add('hidden');
    });

    document.getElementById('btn-report-weekly')?.addEventListener('click', () => {
        document.getElementById('btn-report-weekly').className = 'flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold';
        document.getElementById('btn-report-monthly').className = 'flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold';
        renderWorshipReport('weekly');
    });

    document.getElementById('btn-report-monthly')?.addEventListener('click', () => {
        document.getElementById('btn-report-monthly').className = 'flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold';
        document.getElementById('btn-report-weekly').className = 'flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold';
        renderWorshipReport('monthly');
    });
}

function renderWorshipReport(period) {
    const container = document.getElementById('worship-report-content');
    if (!container) return;
    const days = period === 'weekly' ? 7 : 30;
    const rows = [];
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = 'worship_' + d.toISOString().split('T')[0];
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const done = WorshipItems.filter(item => data[item.id]).length;
        const pct = Math.floor((done / WorshipItems.length) * 100);
        const dayLabel = i === 0 ? 'اليوم' : (i === 1 ? 'أمس' : dayNames[d.getDay()]);
        rows.push({ label: dayLabel, date: d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }), done, pct });
    }

    container.innerHTML = rows.map(row => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div class="text-xs font-bold text-gray-600 dark:text-gray-300 w-14 text-center">
                <div>${row.label}</div>
                <div class="text-gray-400">${row.date}</div>
            </div>
            <div class="flex-1">
                <div class="flex justify-between text-xs mb-1">
                    <span class="text-gray-500">${row.done}/${WorshipItems.length} عبادة</span>
                    <span class="${row.pct >= 80 ? 'text-primary' : row.pct >= 50 ? 'text-yellow-500' : 'text-red-400'} font-bold">${row.pct}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all ${row.pct >= 80 ? 'bg-primary' : row.pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}" style="width:${row.pct}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 12. بوصلة القبلة
// ==========================================
let qiblaAngle = 0;
let deviceHeading = 0;

function initQiblaCompass() {
    const btnCalibrate = document.getElementById('btn-calibrate-qibla');
    const needle = document.getElementById('qibla-compass-needle');
    const degreeText = document.getElementById('qibla-degree-text');
    const statusEl = document.getElementById('qibla-status');

    function calcQiblaAngle(lat, lng) {
        const kaabaLat = 21.3891 * Math.PI / 180;
        const kaabaLng = 39.8579 * Math.PI / 180;
        const userLat = lat * Math.PI / 180;
        const deltaLng = kaabaLng - (lng * Math.PI / 180);
        const y = Math.sin(deltaLng);
        const x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(deltaLng);
        let angle = Math.atan2(y, x) * 180 / Math.PI;
        return (angle + 360) % 360;
    }

    function updateCompassDisplay() {
        const displayAngle = (qiblaAngle - deviceHeading + 360) % 360;
        if (needle) needle.style.transform = `rotate(${displayAngle}deg)`;
        if (degreeText) degreeText.innerText = `اتجاه القبلة: ${Math.round(qiblaAngle)}° شمالاً — انعطف ${Math.round(displayAngle)}° من اتجاهك الحالي`;
        if (statusEl) {
            const diff = Math.abs(displayAngle) < 15 || Math.abs(displayAngle - 360) < 15;
            statusEl.className = `text-xs mt-1 font-semibold ${diff ? 'text-primary' : 'text-gray-400'}`;
            statusEl.innerText = diff ? '✅ أنت تتجه نحو القبلة!' : '↩️ أدر جسمك حتى تواجه القبلة';
            statusEl.classList.remove('hidden');
        }
    }

    function startCompass() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(permission => {
                if (permission === 'granted') listenToOrientation();
                else if (degreeText) degreeText.innerText = 'تم رفض إذن حساسات الاتجاه.';
            }).catch(() => listenToOrientation());
        } else {
            listenToOrientation();
        }
    }

    function listenToOrientation() {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        if (statusEl) { statusEl.innerText = '🧭 البوصلة نشطة...'; statusEl.classList.remove('hidden'); }
    }

    function handleOrientation(e) {
        if (e.alpha !== null) {
            deviceHeading = e.webkitCompassHeading || (360 - e.alpha);
            updateCompassDisplay();
        }
    }

    if (btnCalibrate) {
        btnCalibrate.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('متصفحك لا يدعم GPS');
                return;
            }
            btnCalibrate.innerText = '⏳ جاري التحديد...';
            btnCalibrate.disabled = true;
            navigator.geolocation.getCurrentPosition(pos => {
                const { latitude, longitude } = pos.coords;
                qiblaAngle = calcQiblaAngle(latitude, longitude);
                updateCompassDisplay();
                startCompass();
                btnCalibrate.innerText = '✅ تم تحديد القبلة';
                btnCalibrate.disabled = false;
            }, () => {
                btnCalibrate.innerText = '❌ فشل تحديد الموقع';
                btnCalibrate.disabled = false;
                alert('تعذر الحصول على موقعك. تأكد من تفعيل GPS.');
            }, { enableHighAccuracy: true, timeout: 10000 });
        });
    }
}

// ==========================================
// 13. محرك الصوتيات
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
    const downloadBtn = document.getElementById('download-surah-btn');

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
        } catch(e) { console.error('خطأ جلب القراء:', e); }
    }

    if (selectReciter) {
        selectReciter.addEventListener('change', (e) => {
            const reciter = currentRecitersData.find(r => r.id == e.target.value);
            if (!reciter || !selectRiwaya) return;
            selectRiwaya.innerHTML = '<option value="">اختر الرواية...</option>';
            reciter.moshaf.forEach(m => { selectRiwaya.innerHTML += `<option value="${m.id}">${m.name}</option>`; });
        });
    }

    if (selectRiwaya) {
        selectRiwaya.addEventListener('change', () => {
            if (!selectSurah) return;
            selectSurah.innerHTML = '<option value="">اختر السورة...</option>';
            SuwarNames.forEach((name, index) => {
                selectSurah.innerHTML += `<option value="${index + 1}">${index + 1}. سورة ${name}</option>`;
            });
        });
    }

    if (selectSurah) {
        selectSurah.addEventListener('change', () => {
            const reciter = currentRecitersData.find(r => r.id == selectReciter?.value);
            if (!reciter) return;
            const moshaf = reciter.moshaf.find(m => m.id == selectRiwaya?.value);
            if (!moshaf) return;
            const formattedSurah = selectSurah.value.padStart(3, '0');
            const audioUrl = `${moshaf.server}${formattedSurah}.mp3`;
            if (audioPlayer) {
                audioPlayer.src = audioUrl;
                audioPlayer.play();
                if (playBtn) playBtn.innerText = '⏸';
                if (audioTitle) audioTitle.innerText = `${reciter.name} - سورة ${SuwarNames[selectSurah.value - 1]}`;
            }
        });
    }

    if (playBtn && audioPlayer) {
        playBtn.addEventListener('click', () => {
            if (audioPlayer.paused) { audioPlayer.play(); playBtn.innerText = '⏸'; }
            else { audioPlayer.pause(); playBtn.innerText = '▶'; }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            checkFeatureAccess('pro', 'تنزيل الصوتيات', () => {
                if (audioPlayer && audioPlayer.src) {
                    const link = document.createElement('a');
                    link.href = audioPlayer.src;
                    link.download = 'surah.mp3';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    alert('يرجى اختيار سورة وتشغيلها أولاً.');
                }
            });
        });
    }

    if (audioPlayer && progressBar) {
        audioPlayer.addEventListener('timeupdate', () => {
            if (!isNaN(audioPlayer.duration)) {
                progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                const curM = Math.floor(audioPlayer.currentTime / 60);
                const curS = Math.floor(audioPlayer.currentTime % 60).toString().padStart(2, '0');
                const durM = Math.floor(audioPlayer.duration / 60);
                const durS = Math.floor(audioPlayer.duration % 60).toString().padStart(2, '0');
                if (audioTime) audioTime.innerText = `${curM}:${curS} / ${durM}:${durS}`;
            }
        });
        progressBar.addEventListener('input', (e) => {
            if (!isNaN(audioPlayer.duration)) audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
        });
    }

    fetchReciters();
}

// ==========================================
// 14. محرك المصحف المكتوب
// ==========================================
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
        mushafContainer.innerHTML = '<div class="text-center py-10">⏳ جاري تحميل السورة...</div>';
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
                    text = text.replace(/^بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*|^بۡسۡمِ\s+ٱللَّهِ\s+ٱلرَّحۡمَٰنِ\s+ٱلرَّحِيمِ\s*/ui, "");
                }
                htmlText += `${text} <span class="ayah-number">۝${ayah.numberInSurah}</span> `;
            });
            htmlText += '</div>';
            mushafContainer.innerHTML = htmlText;
            StorageManager.update('lastSurahMushaf', surahId);
            applyFontSize();
        } catch(err) {
            mushafContainer.innerHTML = '<div class="text-center py-10 text-red-500">⚠️ حدث خطأ في التحميل. تأكد من الاتصال بالإنترنت.</div>';
        }
    }
}

// ==========================================
// 15. قاعدة بيانات المواقيت
// ==========================================
const LocationsDB = {
    "المغرب": ["الرباط","الدار البيضاء","فاس","مراكش","طنجة","أكادير","مكناس","تطوان"],
    "السعودية": ["مكة المكرمة","المدينة المنورة","الرياض","جدة","الدمام","الطائف","الخبر","أبها"],
    "مصر": ["القاهرة","الإسكندرية","الجيزة","بورسعيد","الأقصر","الإسماعيلية","أسوان","المنصورة"],
    "الإمارات": ["أبوظبي","دبي","الشارقة","العين","رأس الخيمة","الفجيرة","عجمان"],
    "الجزائر": ["الجزائر العاصمة","وهران","قسنطينة","عنابة","سطيف","تلمسان"],
    "تونس": ["تونس","صفاقس","سوسة","بنزرت","القيروان"],
    "الكويت": ["الكويت","السالمية","حولي","الفروانية","الجهراء"],
    "قطر": ["الدوحة","الريان","الوكرة","الخور"],
    "البحرين": ["المنامة","المحرق","الرفاع"],
    "عُمان": ["مسقط","صلالة","نزوى","صحار"],
    "الأردن": ["عمان","الزرقاء","إربد","العقبة","الكرك"],
    "العراق": ["بغداد","البصرة","الموصل","أربيل","النجف","كربلاء"],
    "سوريا": ["دمشق","حلب","حمص","حماة","اللاذقية"],
    "فلسطين": ["القدس","غزة","رام الله","الخليل","نابلس"],
    "لبنان": ["بيروت","طرابلس","صيدا","صور","زحلة"],
    "ليبيا": ["طرابلس","بنغازي","مصراتة","سبها"],
    "تركيا": ["إسطنبول","أنقرة","إزمير","بورصة","أنطاليا"]
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
            if (e.target.value && selectCountry?.value) {
                fetchPrayerTimesByCity(e.target.value, selectCountry.value);
            }
        });
    }

    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                gpsBtn.innerText = '⏳ جاري التحديد...';
                gpsBtn.disabled = true;
                navigator.geolocation.getCurrentPosition(pos => {
                    fetchPrayerTimesByCoords(pos.coords.latitude, pos.coords.longitude);
                    gpsBtn.innerHTML = '<span>📍</span> موقعي الحالي';
                    gpsBtn.disabled = false;
                }, () => {
                    alert('تعذر تحديد موقعك. يرجى تفعيل الـ GPS.');
                    gpsBtn.innerHTML = '<span>📍</span> موقعي الحالي';
                    gpsBtn.disabled = false;
                });
            }
        });
    }
}

async function fetchPrayerTimesByCity(city, country) {
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=8`);
        const data = await res.json();
        if (data.data) updatePrayerUI(data.data.timings);
    } catch(err) { console.error('خطأ جلب المواقيت:', err); }
}

async function fetchPrayerTimesByCoords(lat, lng) {
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=8`);
        const data = await res.json();
        if (data.data) updatePrayerUI(data.data.timings);
    } catch(err) { console.error('خطأ GPS:', err); }
}

function updatePrayerUI(timings) {
    ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(p => {
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
            if (!timings[key]) continue;
            const [h, m] = timings[key].split(':').map(Number);
            const timeMins = h * 60 + m;
            if (timeMins > currentTime && timeMins < nextPrayerTimeMins) {
                nextPrayerTimeMins = timeMins;
                nextPrayerName = arName;
            }
        }
        if (!nextPrayerName) {
            nextPrayerName = 'الفجر';
            if (timings['Fajr']) {
                const [h, m] = timings['Fajr'].split(':').map(Number);
                nextPrayerTimeMins = 24 * 60 + h * 60 + m;
            }
        }
        const diffMins = nextPrayerTimeMins - currentTime - 1;
        const diffSecs = 60 - now.getSeconds();
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        const elName = document.getElementById('next-prayer-name');
        const elTime = document.getElementById('next-prayer-countdown');
        if (elName) elName.innerText = `صلاة ${nextPrayerName}`;
        if (elTime) elTime.innerText = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
    }
    update();
    countdownInterval = setInterval(update, 1000);
}

// ==========================================
// 16. حاسبة الزكاة
// ==========================================
function initZakatCalculator() {
    const btnTool = document.getElementById('btn-tool-zakat');
    const modal = document.getElementById('modal-zakat');
    const btnClose = document.getElementById('btn-close-zakat');

    if (btnTool) btnTool.addEventListener('click', () => modal?.classList.remove('hidden'));
    if (btnClose) btnClose.addEventListener('click', () => modal?.classList.add('hidden'));

    // تبديل نوع الزكاة
    document.querySelectorAll('.zakat-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            document.querySelectorAll('.zakat-type-btn').forEach(b => {
                b.className = 'zakat-type-btn flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold';
            });
            btn.className = 'zakat-type-btn flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold';
            ['money', 'gold', 'silver'].forEach(t => {
                const panel = document.getElementById(`zakat-${t}-panel`);
                if (panel) panel.classList.toggle('hidden', t !== type);
            });
        });
    });

    // حاسبة المال
    document.getElementById('btn-calc-zakat-money')?.addEventListener('click', () => {
        const savings = parseFloat(document.getElementById('zakat-savings')?.value || 0);
        const nisabMoney = 5610; // تقريبي بالدولار (85جم ذهب × ~66$/جم)
        const result = document.getElementById('zakat-money-result');
        const amount = document.getElementById('zakat-money-amount');
        const note = document.getElementById('zakat-money-note');

        if (!savings || savings <= 0) { alert('يرجى إدخال مبلغ صحيح'); return; }
        if (result) result.classList.remove('hidden');
        if (savings < nisabMoney) {
            if (amount) amount.innerText = 'لا زكاة عليك';
            if (note) note.innerText = `مدخراتك (${savings}$) لم تبلغ النصاب (~${nisabMoney}$)`;
        } else {
            const zakat = (savings * 0.025).toFixed(2);
            if (amount) amount.innerText = `${zakat} $`;
            if (note) note.innerText = `2.5% من مدخراتك البالغة ${savings}$`;
        }
    });

    // حاسبة الذهب
    document.getElementById('btn-calc-zakat-gold')?.addEventListener('click', () => {
        const weight = parseFloat(document.getElementById('zakat-gold-weight')?.value || 0);
        const price = parseFloat(document.getElementById('zakat-gold-price')?.value || 0);
        const karat = parseInt(document.getElementById('zakat-gold-karat')?.value || 24);
        const purity = karat / 24;
        const nisabGrams = 85;
        const result = document.getElementById('zakat-gold-result');
        const amount = document.getElementById('zakat-gold-amount');
        const note = document.getElementById('zakat-gold-note');

        if (!weight || !price) { alert('يرجى إدخال الوزن والسعر'); return; }
        if (result) result.classList.remove('hidden');
        const pureGold = weight * purity;
        if (pureGold < nisabGrams) {
            if (amount) amount.innerText = 'لا زكاة عليك';
            if (note) note.innerText = `ذهبك (${pureGold.toFixed(1)}جم خالص) لم يبلغ نصاب الزكاة (85جم)`;
        } else {
            const totalValue = weight * price;
            const zakat = (totalValue * 0.025).toFixed(2);
            if (amount) amount.innerText = `${zakat} $`;
            if (note) note.innerText = `2.5% من قيمة ${weight}جم عيار ${karat} بسعر ${price}$/جم = ${totalValue.toFixed(2)}$`;
        }
    });

    // حاسبة الفضة
    document.getElementById('btn-calc-zakat-silver')?.addEventListener('click', () => {
        const weight = parseFloat(document.getElementById('zakat-silver-weight')?.value || 0);
        const price = parseFloat(document.getElementById('zakat-silver-price')?.value || 0);
        const nisabSilver = 595;
        const result = document.getElementById('zakat-silver-result');
        const amount = document.getElementById('zakat-silver-amount');
        const note = document.getElementById('zakat-silver-note');

        if (!weight || !price) { alert('يرجى إدخال الوزن والسعر'); return; }
        if (result) result.classList.remove('hidden');
        if (weight < nisabSilver) {
            if (amount) amount.innerText = 'لا زكاة عليك';
            if (note) note.innerText = `فضتك (${weight}جم) لم تبلغ نصاب الزكاة (595جم)`;
        } else {
            const totalValue = weight * price;
            const zakat = (totalValue * 0.025).toFixed(2);
            if (amount) amount.innerText = `${zakat} $`;
            if (note) note.innerText = `2.5% من قيمة ${weight}جم بسعر ${price}$/جم = ${totalValue.toFixed(2)}$`;
        }
    });
}

// ==========================================
// 17. التقويم الهجري والمناسبات
// ==========================================
function initIslamicCalendar() {
    const btnTool = document.getElementById('btn-tool-calendar');
    const modal = document.getElementById('modal-calendar');
    const btnClose = document.getElementById('btn-close-calendar');

    if (btnTool) btnTool.addEventListener('click', () => {
        modal?.classList.remove('hidden');
        loadCalendarData();
    });
    if (btnClose) btnClose.addEventListener('click', () => modal?.classList.add('hidden'));

    async function loadCalendarData() {
        const todayGregorianEl = document.getElementById('calendar-today-gregorian');
        const todayHijriEl = document.getElementById('calendar-today-hijri');
        const todayDayEl = document.getElementById('calendar-today-day');
        const occasionsList = document.getElementById('islamic-occasions-list');

        const now = new Date();
        const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
        const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

        if (todayGregorianEl) todayGregorianEl.innerText = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}م`;
        if (todayDayEl) todayDayEl.innerText = days[now.getDay()];

        try {
            const res = await fetch(`https://api.aladhan.com/v1/gToH?date=${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`);
            const data = await res.json();
            if (data.data) {
                const h = data.data.hijri;
                if (todayHijriEl) todayHijriEl.innerText = `${h.day} ${h.month.ar} ${h.year}هـ`;
            }
        } catch(e) {
            if (todayHijriEl) todayHijriEl.innerText = 'تعذر تحميل التاريخ الهجري';
        }

        // المناسبات الإسلامية الثابتة
        const occasions = [
            { name: 'رأس السنة الهجرية', date: '1 محرم', days: calcDaysToHijriOccasion(1, 1) },
            { name: 'يوم عاشوراء', date: '10 محرم', days: calcDaysToHijriOccasion(10, 1) },
            { name: 'المولد النبوي الشريف', date: '12 ربيع الأول', days: calcDaysToHijriOccasion(12, 3) },
            { name: 'ليلة المعراج', date: '27 رجب', days: calcDaysToHijriOccasion(27, 7) },
            { name: 'ليلة النصف من شعبان', date: '15 شعبان', days: calcDaysToHijriOccasion(15, 8) },
            { name: 'بداية رمضان', date: '1 رمضان', days: calcDaysToHijriOccasion(1, 9) },
            { name: 'ليلة القدر (المرجح)', date: '27 رمضان', days: calcDaysToHijriOccasion(27, 9) },
            { name: 'عيد الفطر المبارك', date: '1 شوال', days: calcDaysToHijriOccasion(1, 10) },
            { name: 'يوم عرفة', date: '9 ذو الحجة', days: calcDaysToHijriOccasion(9, 12) },
            { name: 'عيد الأضحى المبارك', date: '10 ذو الحجة', days: calcDaysToHijriOccasion(10, 12) },
        ];

        const hijriMonthsAr = ['محرم','صفر','ربيع الأول','ربيع الثاني','جمادى الأولى','جمادى الثانية','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];

        if (occasionsList) {
            occasionsList.innerHTML = occasions.map(occ => `
                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        ${occ.days >= 0 ? occ.days : '~'}<br><span class="text-xs">يوم</span>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-sm text-gray-800 dark:text-white">${occ.name}</p>
                        <p class="text-xs text-gray-400">${occ.date} هـ</p>
                    </div>
                    ${occ.days === 0 ? '<span class="text-xs bg-primary text-white px-2 py-1 rounded-lg font-bold">اليوم!</span>' : ''}
                </div>
            `).join('');
        }
    }

    function calcDaysToHijriOccasion(hijriDay, hijriMonth) {
        // تقدير مبسط (الأيام = تقريبي)
        return Math.floor(Math.random() * 300) + 1; // placeholder — في التطبيق الحقيقي يحتاج حسابات دقيقة
    }
}

// ==========================================
// 18. المساجد القريبة
// ==========================================
function initNearbyMosques() {
    const btnTool = document.getElementById('btn-tool-mosques');
    const modal = document.getElementById('modal-mosques');
    const btnClose = document.getElementById('btn-close-mosques');
    const btnFind = document.getElementById('btn-find-mosques');

    if (btnTool) btnTool.addEventListener('click', () => modal?.classList.remove('hidden'));
    if (btnClose) btnClose.addEventListener('click', () => modal?.classList.add('hidden'));

    if (btnFind) {
        btnFind.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('متصفحك لا يدعم تحديد الموقع');
                return;
            }
            btnFind.innerText = '⏳ جاري تحديد موقعك...';
            btnFind.disabled = true;
            navigator.geolocation.getCurrentPosition(pos => {
                const { latitude, longitude } = pos.coords;
                const mapsUrl = `https://www.google.com/maps/search/mosque/@${latitude},${longitude},15z/data=!3m1!4b1`;
                window.open(mapsUrl, '_blank');
                btnFind.innerHTML = '<span>📍</span> فتح الخريطة وعرض المساجد';
                btnFind.disabled = false;
                modal?.classList.add('hidden');
            }, () => {
                alert('تعذر تحديد موقعك. تأكد من تفعيل GPS.');
                btnFind.innerHTML = '<span>📍</span> فتح الخريطة وعرض المساجد';
                btnFind.disabled = false;
            }, { enableHighAccuracy: true, timeout: 10000 });
        });
    }
}

// ==========================================
// 19. البث المباشر للحرمين
// ==========================================
const HARAMAIN_STREAMS = {
    makkah: {
        iframeSrc: 'https://www.youtube.com/embed/XNh5XBlmxGQ?autoplay=1&mute=0',
        youtubeLink: 'https://www.youtube.com/watch?v=XNh5XBlmxGQ'
    },
    madinah: {
        iframeSrc: 'https://www.youtube.com/embed/SFAKSVfqyJE?autoplay=1&mute=0',
        youtubeLink: 'https://www.youtube.com/watch?v=SFAKSVfqyJE'
    }
};

function initHaramainStream() {
    const btnTool = document.getElementById('btn-tool-haramain');
    const modal = document.getElementById('modal-haramain');
    const btnClose = document.getElementById('btn-close-haramain');
    const btnMakkah = document.getElementById('btn-stream-makkah');
    const btnMadinah = document.getElementById('btn-stream-madinah');
    const iframe = document.getElementById('haramain-stream-iframe');
    const ytLink = document.getElementById('haramain-youtube-link');

    if (btnTool) btnTool.addEventListener('click', () => modal?.classList.remove('hidden'));
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            modal?.classList.add('hidden');
            if (iframe) iframe.src = ''; // إيقاف البث عند الإغلاق
        });
    }

    function setStream(type) {
        const stream = HARAMAIN_STREAMS[type];
        if (iframe) iframe.src = stream.iframeSrc;
        if (ytLink) ytLink.href = stream.youtubeLink;
        const active = 'flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-secondary transition';
        const inactive = 'flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-200 transition';
        if (btnMakkah) btnMakkah.className = type === 'makkah' ? active : inactive;
        if (btnMadinah) btnMadinah.className = type === 'madinah' ? active : inactive;
    }

    if (btnMakkah) btnMakkah.addEventListener('click', () => setStream('makkah'));
    if (btnMadinah) btnMadinah.addEventListener('click', () => setStream('madinah'));
}

// ==========================================
// 20. المسبحة الرقمية (جميع الثيمات مقفلة)
// ==========================================
let currentSebhaCount = 0;
const dhikrList = [
    "سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "لَا إِلَهَ إِلَّا اللَّهُ",
    "اللَّهُ أَكْبَرُ", "أَسْتَغْفِرُ اللَّهَ", "لَا حَوْلَ وَلَا قُوَّةَ إِلاَّ بِاللَّهِ",
    "صَلَّى اللهُ عَلَى مُحَمَّدٍ", "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
];
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
        if (countDisplay) countDisplay.innerText = currentSebhaCount.toString().padStart(4, '0');
    }

    if (tallyBtn) {
        tallyBtn.addEventListener('click', () => {
            currentSebhaCount++;
            updateCount();
            if (StorageManager.state.soundVib) {
                sebhaClickSound.currentTime = 0;
                sebhaClickSound.play().catch(() => {});
                if (navigator.vibrate) navigator.vibrate(30);
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentSebhaCount = 0;
            updateCount();
            if (StorageManager.state.soundVib) {
                sebhaClickSound.currentTime = 0;
                sebhaClickSound.play().catch(() => {});
                if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
            }
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

    // قفل جميع ثيمات المسبحة بدون استثناء
    if (themeSelect) {
        themeSelect.value = StorageManager.state.sebhaTheme || 'default';

        // إذا كان المستخدم يملك Pro، طبّق الثيم المحفوظ مباشرة
        if (StorageManager.state.isProUser) {
            applyThemeClass(StorageManager.state.sebhaTheme || 'default');
        } else {
            // تطبيق ثيم افتراضي بصري بدون قفل للعرض (لكن التغيير مقفل)
            applyThemeClass('default');
        }

        themeSelect.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            const featureName = `ثيم_${selectedTheme}`;

            // جميع الثيمات مقفلة — تتطلب إعلاناً أو Pro
            checkFeatureAccess('ad', featureName, () => {
                applyThemeClass(selectedTheme);
                StorageManager.update('sebhaTheme', selectedTheme);
            });

            // إعادة القائمة إلى الثيم الحالي حتى يتم فتح الجديد
            themeSelect.value = StorageManager.state.sebhaTheme || 'default';
        });
    }
}

function applyThemeClass(themeName) {
    const sebhaContainer = document.getElementById('digital-tally-counter');
    if (sebhaContainer) {
        const parent = sebhaContainer.parentElement;
        parent.className = parent.className.replace(/\bsebha-theme-\S+/g, '');
        parent.classList.add(`sebha-theme-${themeName}`);
    }
}

// ==========================================
// 21. واجهة المستخدم والتنقل
// ==========================================
function initUI() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('main section');

    function switchTab(targetId) {
        sections.forEach(s => { s.classList.add('hidden'); s.classList.remove('block', 'flex'); });
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            if (targetId === 'tab-sebha') {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('flex');
            } else {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('block');
            }
        }
        navBtns.forEach(b => {
            if (b.dataset.target === targetId) {
                b.classList.remove('text-gray-400', 'dark:text-gray-500');
                b.classList.add('text-primary', 'transform', 'scale-105');
            } else {
                b.classList.remove('text-primary', 'transform', 'scale-105');
                b.classList.add('text-gray-400', 'dark:text-gray-500');
            }
        });
        StorageManager.update('activeTab', targetId);
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.target));
    });

    if (StorageManager.state.activeTab) {
        switchTab(StorageManager.state.activeTab);
    }

    // الإعدادات
    const btnSettings = document.getElementById('btn-settings');
    const modalSettings = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnSettings) btnSettings.addEventListener('click', () => modalSettings?.classList.remove('hidden'));
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => modalSettings?.classList.add('hidden'));

    // زر Pro
    const btnDonate = document.getElementById('btn-donate');
    if (btnDonate) btnDonate.addEventListener('click', () => document.getElementById('modal-donate')?.classList.remove('hidden'));

    // الوضع الداكن
    const darkModeToggle = document.getElementById('toggle-dark-mode');
    if (darkModeToggle) {
        darkModeToggle.checked = StorageManager.state.isDarkMode;
        darkModeToggle.addEventListener('change', (e) => {
            StorageManager.update('isDarkMode', e.target.checked);
            applyDarkMode();
        });
    }

    // الصوت والاهتزاز
    const soundToggle = document.getElementById('toggle-sound-vib');
    if (soundToggle) {
        soundToggle.checked = StorageManager.state.soundVib;
        soundToggle.addEventListener('change', (e) => {
            StorageManager.update('soundVib', e.target.checked);
        });
    }

    // حجم الخط
    document.getElementById('btn-font-plus')?.addEventListener('click', () => {
        if (StorageManager.state.fontSize < 40) {
            StorageManager.update('fontSize', StorageManager.state.fontSize + 2);
            applyFontSize();
        }
    });
    document.getElementById('btn-font-minus')?.addEventListener('click', () => {
        if (StorageManager.state.fontSize > 16) {
            StorageManager.update('fontSize', StorageManager.state.fontSize - 2);
            applyFontSize();
        }
    });

    // حجم المسبحة
    const sizeSelect = document.getElementById('settings-sebha-size');
    if (sizeSelect) {
        sizeSelect.value = StorageManager.state.sebhaSize || 'md';
        sizeSelect.addEventListener('change', (e) => {
            StorageManager.update('sebhaSize', e.target.value);
            applySebhaSize(e.target.value);
        });
    }
}

// ==========================================
// 22. تشغيل التطبيق عند التحميل
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.load();
    applyDarkMode();
    applyFontSize();
    applySebhaSize(StorageManager.state.sebhaSize);

    initMonetizationLogic();
    initAudioEngine();
    initMushafEngine();
    initPrayerEngine();
    initSebha();
    initCompleteAzkar();
    initWorshipTracker();
    initKhatmahTracker();
    initHadithLibrary();
    initTafsirEngine();
    initQiblaCompass();
    initZakatCalculator();
    initIslamicCalendar();
    initNearbyMosques();
    initHaramainStream();
    initUI();
});
