// categories-handler.js

async function loadSubCategories(parentId, parentName) {
    const container = document.getElementById('categories-container');
    if (!container) return;

    // عرض حالة التحميل مؤقتاً في الشريط
    container.innerHTML = '<div class="text-xs text-gray-400 p-2">جاري تحميل الأقسام الفرعية...</div>';

    try {
        // استعلام Supabase لجلب الأقسام الفرعية التي تتبع القسم الرئيسي المحدد
        const { data: subCategories, error } = await db
            .from('categories') // اسم جدول الأقسام (عدله لو اسم الجدول مختلف عندك)
            .select('*')
            .eq('parent_id', parentId);

        if (error) throw error;

        if (!subCategories || subCategories.length === 0) {
            container.innerHTML = '<div class="text-xs text-gray-400 p-2">لا توجد أقسام فرعية حالياً</div>';
            return;
        }

        // تفريغ الشريط وبدء رسم الأقسام الفرعية
        container.innerHTML = '';

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

        // اختيارياً: لو حابب تغير عنوان كلمة "الأقسام" فوق لاسم القسم الرئيسي اللي تم الضغط عليه
        const sectionTitle = document.querySelector('h3.font-bold.text-gray-800');
        if (sectionTitle) {
            sectionTitle.innerHTML = parentName;
        }

    } catch (err) {
        console.error('خطأ في جلب الأقسام الفرعية:', err.message);
        container.innerHTML = '<div class="text-xs text-red-400 p-2">تعذر تحميل الأقسام الفرعية.</div>';
    }
}
