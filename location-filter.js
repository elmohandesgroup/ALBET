/**
 * متجر البيت - نظام تحديد موقع الزائر وفلترة الإعلانات أوتوماتيكياً
 */

// تشغيل النظام فور تحميل الصفحة الرئيسية
document.addEventListener('DOMContentLoaded', () => {
    initUserLocationAndAds();
});

async function initUserLocationAndAds() {
    let userGovernorate = localStorage.getItem('selected_governorate') || '';

    // لو المحافظة مش متخزنة قبل كده، نحددها من الـ IP أوتوماتيك
    if (!userGovernorate) {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            // مطابقة اسم المنطقة القادمة من الـ IP مع محافظات مصر (افتراضي: القاهرة لو غير ذلك)
            userGovernorate = data.region || 'القاهرة'; 
            localStorage.setItem('selected_governorate', userGovernorate);
        } catch (err) {
            console.log('تعذر تحديد الموقع تلقائياً، يتم استخدام القيمة الافتراضية');
            userGovernorate = 'القاهرة';
        }
    }

    // إعداد واجهة اختيار المحافظة لو موجودة في الهيدر
    setupGovernorateDropdown(userGovernorate);

    // جلب وترتيب الإعلانات حسب محافظة الزائر
    fetchAndSortAdsByGovernorate(userGovernorate);
}

// دالة جلب الإعلانات وترتيبها (إعلانات محافظة الزائر أولاً)
async function fetchAndSortAdsByGovernorate(preferredGovernorate) {
    if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
        console.error('إعدادات Supabase غير متوفرة!');
        return;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ads?status=eq.approved&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });

        if (!response.ok) throw new Error('فشل في جلب الإعلانات');

        let ads = await response.json();

        // الترتيب الذكي: إعلانات محافظة الزائر في المقدمة (-1)، والباقي بعدها
        ads.sort((a, b) => {
            if (a.governorate === preferredGovernorate && b.governorate !== preferredGovernorate) return -1;
            if (a.governorate !== preferredGovernorate && b.governorate === preferredGovernorate) return 1;
            return 0;
        });

        // التأكد من وجود دالة العرض في ملف الـ index وعرض الإعلانات المرتبة
        if (typeof renderAds === 'function') {
            renderAds(ads, preferredGovernorate);
        } else {
            console.warn('دالة renderAds غير معرفة في الصفحة الرئيسية');
        }

    } catch (err) {
        console.error('خطأ في تحميل وترتيب الإعلانات:', err);
    }
}

// دالة إضافية لو حبيت تعمل قائمة منسدلة في الهيدر ليختار الزائر منها يدوياً
function setupGovernorateDropdown(currentGovernorate) {
    const govSelector = document.getElementById('userGovernorateSelect');
    if (!govSelector) return;

    govSelector.value = currentGovernorate;
    govSelector.addEventListener('change', function(e) {
        const selectedGov = e.target.value;
        localStorage.setItem('selected_governorate', selectedGov);
        // إعادة تحميل الإعلانات بالترتيب الجديد للمحافظة المختارة
        fetchAndSortAdsByGovernorate(selectedGov);
    });
}
