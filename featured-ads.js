// تهيئة اتصال Supabase وجلب العروض المميزة كشريط متحرك احترافي
const SUPABASE_URL = 'https://usaqiylvcnmccgpnxwaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_he-h5ysxqK0VLujbtAXcUg_K5qf1rSB';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadFeaturedCompaniesBanner() {
    try {
        const container = document.getElementById('featuredAdsContainer');
        if (!container) return;

        const { data, error } = await supabaseClient
            .from('featured_companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            // تصميم السلايدر المتحرك بدون أزرار، وعرض الصور بشكل أنيق ومرتب
            let slidesHTML = data.map((ad, index) => {
                const imageUrl = (ad.images && ad.images.length > 0) ? ad.images[0] : '';
                return `
                    <div class="min-w-full md:min-w-[50%] flex-shrink-0 p-2 transition-all duration-500">
                        <div class="relative w-full rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4 md:p-5 text-center cursor-pointer h-full flex flex-col justify-between" onclick="openCompaniesModal()">
                            ${imageUrl ? `<img src="${imageUrl}" alt="${ad.title || ''}" class="w-full h-40 md:h-52 object-cover rounded-xl mb-3 shadow">` : ''}
                            <div>
                                <span class="bg-white/20 text-[11px] px-2.5 py-0.5 rounded-full mb-1.5 inline-block font-medium">إعلانات مميزة للشركات</span>
                                <h3 class="text-lg md:text-xl font-bold mb-1">${ad.title || ''}</h3>
                                <p class="text-xs opacity-90 line-clamp-1 mb-2">${ad.description || 'أفضل المنتجات والأجهزة بضمان الشركات.'}</p>
                            </div>
                            <span class="bg-white text-orange-600 px-3 py-1 rounded-xl text-xs font-bold shadow self-center mt-1">اضغط لعرض الشركات</span>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                <div class="relative w-full overflow-hidden mb-6">
                    <div id="companyAutoSlider" class="flex transition-transform duration-700 ease-in-out">
                        ${slidesHTML}
                    </div>
                </div>
            `;

            // تفعيل الحركة التلقائية (السلايدر) بدون أي أزرار وبشكل سلس
            startAutoSlider(data.length);
        } else {
            container.innerHTML = '';
        }
    } catch (err) {
        console.error('خطأ في جلب البنر:', err.message);
    }
}

function startAutoSlider(totalItems) {
    const slider = document.getElementById('companyAutoSlider');
    if (!slider || totalItems <= 1) return;

    let currentIndex = 0;
    setInterval(() => {
        // على الشاشات الكبيرة نعرض إعلانين جنب بعض، وعلى الموبايل إعلان واحد
        const isDesktop = window.innerWidth >= 768;
        const maxIndex = isDesktop ? Math.max(0, totalItems - 2) : totalItems - 1;

        currentIndex++;
        if (currentIndex > maxIndex) {
            currentIndex = 0;
        }

        const percentage = currentIndex * (isDesktop ? 50 : 100);
        slider.style.transform = `translateX(${percentage}%)`; // الاتجاه بالعربي
    }, 3500);
}

document.addEventListener('DOMContentLoaded', loadFeaturedCompaniesBanner);
