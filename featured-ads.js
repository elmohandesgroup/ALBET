// جلب وعرض البانر المميز من قاعدة بيانات Supabase
async function loadFeaturedCompaniesBanner() {
    try {
        const { data, error } = await supabaseClient
            .from('featured_companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            const activeAd = data[0]; // جلب أحدث بانر
            if (activeAd && activeAd.images && activeAd.images.length > 0) {
                const container = document.getElementById('featuredAdsContainer');
                if (container) {
                    container.innerHTML = `
                        <div class="relative w-full rounded-2xl overflow-hidden shadow-lg mb-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 text-center cursor-pointer" onclick="openCompaniesModal()">
                            <img src="${activeAd.images[0]}" alt="${activeAd.title}" class="w-full h-48 md:h-64 object-cover rounded-xl mb-3 shadow-md">
                            <span class="bg-white/20 text-xs px-3 py-1 rounded-full mb-2 inline-block font-medium">إعلانات مميزة للشركات</span>
                            <h3 class="text-xl md:text-2xl font-bold mb-1">${activeAd.title}</h3>
                            <p class="text-xs md:text-sm opacity-90 max-w-xl mx-auto mb-3">${activeAd.description || 'أفضل المنتجات والأجهزة المضمونة بضمان الشركات وأسعار تنافسية.'}</p>
                            <span class="bg-white text-orange-600 px-4 py-1.5 rounded-xl text-xs font-bold shadow">اضغط لعرض الشركات</span>
                        </div>
                    `;
                }
            }
        }
    } catch (err) {
        console.error('خطأ في جلب البنر:', err.message);
    }
}

document.addEventListener('DOMContentLoaded', loadFeaturedCompaniesBanner);
