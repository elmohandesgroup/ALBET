// جلب وعرض إعلانات الشركات المميزة
async function loadFeaturedCompaniesBanner() {
    try {
        const container = document.getElementById('featuredAdsContainer');
        if (!container) return;

        const SUPABASE_URL = 'https://usaqiylvcnmccgpnxwaq.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_he-h5ysxqK0VLUjbtAXCg_K5qf1rSB';
        const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const { data, error } = await client
            .from('featured_companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            const ad = data[0];
            const imageUrl = (ad.images && ad.images.length > 0) ? ad.images[0] : '';
            
            container.innerHTML = `
                <div class="w-full bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl shadow-md p-4 text-white text-center cursor-pointer mb-6" onclick="openCompaniesModal()">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${ad.title || ''}" class="w-full h-48 md:h-56 object-cover rounded-xl mb-3 shadow">` : ''}
                    <span class="bg-white/20 text-xs px-3 py-1 rounded-full mb-2 inline-block font-medium">إعلانات مميزة للشركات</span>
                    <h3 class="text-xl font-bold mb-1">${ad.title || ''}</h3>
                    <p class="text-xs opacity-90 mb-3">${ad.description || 'أفضل المنتجات والأجهزة بضمان الشركات.'}</p>
                    <span class="bg-white text-orange-600 px-4 py-1.5 rounded-xl text-xs font-bold shadow">اضغط لعرض الشركات</span>
                </div>
            `;
        }
    } catch (err) {
        console.error('خطأ في البنر:', err.message);
    }
}

document.addEventListener('DOMContentLoaded', loadFeaturedCompaniesBanner);
