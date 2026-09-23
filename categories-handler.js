async function loadSubCategories(parentId, parentName) {
    const gridContainer = document.getElementById('all-categories-container');
    const barContainer = document.getElementById('categories-container');
    
    const container = gridContainer || barContainer;
    if (!container) return;

    container.innerHTML = '<div class="col-span-full text-center text-xs text-gray-400 p-4">جاري تحميل الأقسام الفرعية...</div>';

    // تحديث الهيدر فوراً وبشكل مستقل عشان يظهر الترتيب الصح في كل الحالات
    const pageHeaderArea = document.getElementById('categories-header-area');
    if (pageHeaderArea) {
      pageHeaderArea.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="font-black text-gray-900 text-base md:text-lg">${parentName}</h2>
                    
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-orange-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                    
                    <a href="categories.html" class="inline-flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm">
                        <span>الأقسام</span>
                    </a>
                    
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-orange-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                    
                    <button onclick="location.reload();" class="inline-flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                        <span>الرئيسية</span>
                    </button>
                </div>
                
                <span id="categories-count" class="text-xs text-gray-400 font-semibold">جاري التحميل...</span>
            </div>
        `;
    }

    try {
        const { data: subCategories, error } = await db
            .from('categories')
            .select('*')
            .eq('parent_id', parentId);

        if (error) throw error;

        if (!subCategories || subCategories.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-xs text-gray-400 p-4">لا توجد أقسام فرعية حالياً لهذا القسم</div>';
            return;
        }

        container.innerHTML = '';

        if (gridContainer) {
            subCategories.forEach(sub => {
                const iconSrc = sub.image_url ? sub.image_url : 'logo192.png';
                const subCard = `
                    <div onclick="filterAdsByCategory('${sub.name}', '${sub.id}')" class="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-orange-500 hover:shadow-md transition-all group cursor-pointer">
                        <div class="w-20 h-20 bg-orange-50/50 rounded-2xl flex items-center justify-center mb-3 overflow-hidden shadow-inner border border-orange-100/50 group-hover:scale-105 transition-transform">
                            <img src="${iconSrc}" alt="${sub.name}" class="w-full h-full object-cover">
                        </div>
                        <h3 class="font-bold text-gray-800 text-sm group-hover:text-orange-600 transition-colors truncate w-full">${sub.name}</h3>
                        <span class="text-[11px] text-gray-400 mt-1">تصفح الإعلانات</span>
                    </div>
                `;
                container.innerHTML += subCard;
            });

            // تحديث العداد بعد التحميل
            const countSpan = document.getElementById('categories-count');
            if (countSpan) countSpan.innerText = `${subCategories.length} قسم فرعي`;

        } else {
            subCategories.forEach((sub, index) => {
                const iconSrc = sub.image_url ? sub.image_url : 'logo192.png';
                const hintClass = index === 0 ? 'scroll-hint' : '';
                
                const subCard = `
                    <div onclick="filterAdsByCategory('${sub.name}', '${sub.id}')" class="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-2xl p-3 w-28 flex-shrink-0 shadow-sm hover:border-orange-500 hover:shadow transition-all ${hintClass} cursor-pointer">
                        <div class="w-16 h-16 bg-orange-50/30 rounded-full flex items-center justify-center mb-2 overflow-hidden shadow-inner">
                            <img src="${iconSrc}" alt="${sub.name}" class="w-full h-full object-cover rounded-full">
                        </div>
                        <span class="text-xs font-bold text-gray-700 truncate w-full text-center">${sub.name}</span>
                    </div>
                `;
                container.innerHTML += subCard;
            });

            const sectionTitle = document.querySelector('h3.font-bold.text-gray-800');
            if (sectionTitle) {
                sectionTitle.innerHTML = parentName;
            }
        }

    } catch (err) {
        console.error('خطأ في جلب الأقسام الفرعية:', err.message);
        container.innerHTML = '<div class="col-span-full text-center text-xs text-red-400 p-4">تعذر تحميل الأقسام الفرعية.</div>';
    }
}
