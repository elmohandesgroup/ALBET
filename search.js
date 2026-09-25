// search.js - ملف برمجية البحث السريع الذكي (Live Search)
document.addEventListener("DOMContentLoaded", () => {
    // التأكد من وجود عناصر البحث في الصفحة الحالية
    const searchInput = document.getElementById('quick-search-input');
    const searchDropdown = document.getElementById('search-results-dropdown');

    if (!searchInput || !searchDropdown) return;

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchDropdown.classList.add('hidden');
            searchDropdown.innerHTML = '';
            return;
        }

        // تأخير بسيط (Debounce) لمنع كثرة الطلبات مع كل حرف
        searchTimeout = setTimeout(async () => {
            try {
                // التأكد من توفر عميل Supabase في الصفحة
                if (typeof db === 'undefined') {
                    console.error('Supabase client (db) is not defined!');
                    return;
                }

                // البحث المباشر في عمود الـ title
                const { data: results, error } = await db
                    .from('ads')
                    .select('*')
                    .ilike('title', `%${query}%`)
                    .limit(5);

                if (error) throw error;

                if (results && results.length > 0) {
                    searchDropdown.innerHTML = '';
                    results.forEach(ad => {
                        const img = (ad.images && ad.images.length > 0) ? ad.images[0] : 'logo192.png';
                        searchDropdown.innerHTML += `
                            <a href="ad-details.html?id=${ad.id}" class="flex items-center gap-3 p-2 rounded-xl hover:bg-orange-50 transition-colors">
                                <img src="${img}" class="w-12 h-12 object-cover rounded-lg border border-gray-100 flex-shrink-0">
                                <div class="flex-1 min-w-0 text-right">
                                    <h4 class="font-bold text-xs text-gray-800 truncate">${ad.title}</h4>
                                    <p class="text-orange-600 font-black text-xs mt-0.5">${ad.price ? ad.price + ' جنيه' : 'السعر عند الاتصال'}</p>
                                </div>
                            </a>
                        `;
                    });
                    searchDropdown.classList.remove('hidden');
                } else {
                    searchDropdown.innerHTML = '<div class="p-3 text-center text-xs text-gray-400">عذراً، لم يتم العثور على نتائج مطابقة</div>';
                    searchDropdown.classList.remove('hidden');
                }

            } catch (err) {
                console.error('خطأ في البحث:', err);
                searchDropdown.innerHTML = '<div class="p-3 text-center text-xs text-red-400">حدث خطأ أثناء البحث</div>';
                searchDropdown.classList.remove('hidden');
            }
        }, 300);
    });

    // إخفاء قائمة النتائج عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.add('hidden');
        }
    });
});
