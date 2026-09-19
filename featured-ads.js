// ملف جلب وعرض إعلانات الشركات المميزة
const SUPABASE_URL = 'https://usaqiylvcnmccgpnxwaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_he-h5ysxqK0VLUjbtAXCg_K5qf1rSB';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadFeaturedCompanies() {
    try {
        const { data, error } = await supabaseClient
            .from('featured_companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            // البحث عن أول بانر نشط مخصص للالصفحة الرئيسية
            const activeAd = data.find(ad => ad.page_target === 'index.html' || ad.page_target === 'الصفحة الرئيسية');
            
            if (activeAd && activeAd.images && activeAd.images.length > 0) {
                const bannerContainer = document.getElementById('featuredAdsContainer');
                if (bannerContainer) {
                    bannerContainer.innerHTML = `
                        <div class="relative w-full rounded-2xl overflow-hidden shadow-lg mb-6">
                            <img src="${activeAd.images[0]}" alt="${activeAd.title}" class="w-full h-48 md:h-64 object-cover">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                <h3 class="text-white text-lg font-bold">${activeAd.title}</h3>
                            </div>
                        </div>
                    `;
                }
            }
        }
    } catch (err) {
        console.error('خطأ أثناء جلب إعلانات الشركات:', err.message);
    }
}

// تشغيل الدالة أوتوماتيك بمجرد تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadFeaturedCompanies);
