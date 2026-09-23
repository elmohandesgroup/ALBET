// categories-handler.js

async function loadSubCategories(parentId, parentName) {
    // التحقق من المكان الحالي: هل نحن في صفحة الأقسام العامة أم الصفحة الرئيسية؟
    const gridContainer = document.getElementById('all-categories-container');
    const barContainer = document.getElementById('categories-container');
    
    const container = gridContainer || barContainer;
    if (!container) return;

    // عرض حالة التحميل مؤقتاً
    container.innerHTML = '<div class="col-span-full text-center text-xs text-gray-400 p-4">جاري تحميل الأقسام الفرعية...</div>';

    try {
        // استعلام Supabase لجلب الأقسام الفرعية التي تتبع القسم الرئيسي المحدد
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

        // إذا كنا في صفحة الأقسام العامة (شبكة Grid)، نرسمها بشكل شبكي جميل
        if (gridContainer) {
            subCategories.forEach(sub => {
                const iconSrc = sub.image_url ? sub.image_url : 'logo192.png';
                const subCard = `
                    <a href="#" onclick="filterAdsBySubCategory('${sub.id}'); return false;" class="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-orange-500 hover:shadow-md transition-all group">
                        <div class="w-20 h-20 bg-orange-50/50 rounded-2xl flex items-center justify-center mb-3 overflow-hidden shadow-inner border border-orange-100/50 group-hover:scale-105 transition-transform">
                            <img src="${iconSrc}" alt="${sub.name}" class="w-full h-full object-cover">
                        </div>
                        <h3 class="font-bold text-gray-800 text-sm group-hover:text-orange-600 transition-colors truncate w-full">${sub.name}</h3>
                        <span class="text-[11px] text-gray-400 mt-1">تصفح الإعلانات</span>
                    </a>
                `;
                container.innerHTML += subCard;
            });

            // تحديث عدد الأقسام وعنوان الصفحة
            const countLabel = document.getElementById('categories-count');
            if (countLabel) countLabel.innerText = `${subCategories.length} قسم فرعي متاح`;

            const pageTitle = document.querySelector('h2.font-bold.text-gray-800');
            if (pageTitle) pageTitle.innerHTML = `أقسام: ${parentName} <a href="categories.html" class="text-xs text-orange-600 mr-4 font-normal hover:underline">[إرجاع للأقسام الرئيسية]</a>`;

        } else {
            // التصميم الأفقي الخاص بالصفحة الرئيسية (شريط)
            subCategories.forEach((sub, index) => {
                const iconSrc = sub.image_url ? sub.image_url : 'logo192.png';
                const hintClass = index === 0 ? 'scroll-hint' : '';
                
                const subCard = `
                    <a href="#" onclick="filterAdsBySubCategory('${sub.id}'); return false;" class="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-2xl p-3 w-28 flex-shrink-0 shadow-sm hover:border-orange-500 hover:shadow transition-all ${hintClass}">
                        <div class="w-16 h-16 bg-orange-50/30 rounded-full flex items-center justify-center mb-2 overflow-hidden shadow-inner">
                            <img src="${iconSrc}" alt="${sub.name}" class="w-full h-full object-cover rounded-full">
                        </div>
                        <span class="text-xs font-bold text-gray-700 truncate w-full text-center">${sub.name}</span>
                    </a>
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
