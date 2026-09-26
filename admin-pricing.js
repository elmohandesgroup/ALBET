const SUPABASE_URL = 'https://usaqiylvcnmccgpnxwaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_he-h5ysxq0VLujbtAXcUg_K5qf1rSB';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    loadCategoriesForAdmin();
    setupImagePreview();
    setupLevelToggle();
});

// التحكم في إظهار وإخفاء حقل القسم الرئيسي ديناميكياً
function setupLevelToggle() {
    const typeLevelSelect = document.getElementById('catTypeLevel');
    const parentWrapper = document.getElementById('parentCategoryWrapper');
    const parentSelect = document.getElementById('catParent');

    if (!typeLevelSelect || !parentWrapper) return;

    typeLevelSelect.addEventListener('change', (e) => {
        if (e.target.value === 'sub') {
            parentWrapper.classList.remove('hidden');
            parentSelect.setAttribute('required', 'true');
        } else {
            parentWrapper.classList.add('hidden');
            parentSelect.removeAttribute('required');
            parentSelect.value = '';
        }
    });
}

// معاينة الصورة وحذفها قبل الرفع
function setupImagePreview() {
    const fileInput = document.getElementById('catImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreview');
    const clearBtn = document.getElementById('clearImageBtn');

    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                if (previewImg) previewImg.src = event.target.result;
                if (previewContainer) previewContainer.classList.remove('hidden');
                if (clearBtn) clearBtn.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            clearImageInput();
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearImageInput();
        });
    }
}

function clearImageInput() {
    const fileInput = document.getElementById('catImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const clearBtn = document.getElementById('clearImageBtn');
    
    if (fileInput) fileInput.value = '';
    if (previewContainer) previewContainer.classList.add('hidden');
    if (clearBtn) clearBtn.classList.add('hidden');
}

// الاتصال بقاعدة البيانات وجلب الأقسام الرئيسية والفرعية
async function loadCategoriesForAdmin() {
    const tbody = document.getElementById('categoriesTableBody');
    const parentSelect = document.getElementById('catParent');
    if (!tbody) return;

    try {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-400 py-6">جاري الاتصال بقاعدة البيانات وتحميل الأقسام...</td></tr>`;

        const { data: categories, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!categories || categories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-400 py-6">لا توجد أقسام مسجلة في قاعدة البيانات حالياً.</td></tr>`;
            if (parentSelect) parentSelect.innerHTML = `<option value="">لا توجد أقسام رئيسية متاحة</option>`;
            return;
        }

        // تعبئة قائمة الأقسام الرئيسية فقط (التي ليس لها parent_id) لاختيارها عند إضافة قسم فرعي
        if (parentSelect) {
            parentSelect.innerHTML = `<option value="">اختر القسم الرئيسي التابع له</option>`;
            const mainCategories = categories.filter(c => !c.parent_id);
            if (mainCategories.length > 0) {
                mainCategories.forEach(cat => {
                    parentSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
                });
            } else {
                parentSelect.innerHTML = `<option value="">لا توجد أقسام رئيسية مسجلة بعد</option>`;
            }
        }

        // بناء جدول الأقسام الحالية
        tbody.innerHTML = '';
        categories.forEach(cat => {
            const parentCat = categories.find(p => p.id === cat.parent_id);
            const typeLabel = parentCat ? `<span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">فرعي (يتبع: ${parentCat.name})</span>` : `<span class="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">رئيسي</span>`;
            const statusLabel = cat.is_free ? `<span class="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-lg font-bold">مجاني بالكامل</span>` : `<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-lg font-bold">مدفوع</span>`;

            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="p-3"><img src="${cat.image_url || 'logo192.png'}" class="w-10 h-10 object-cover rounded-xl border"></td>
                    <td class="p-3 font-bold text-gray-800">${cat.name}</td>
                    <td class="p-3">${typeLabel}</td>
                    <td class="p-3 font-bold text-gray-700">${cat.new_price !== undefined ? cat.new_price : 0} ج.م</td>
                    <td class="p-3 font-bold text-gray-700">${cat.used_price !== undefined ? cat.used_price : 0} ج.م</td>
                    <td class="p-3">${statusLabel}</td>
                    <td class="p-3 text-center">
                        <button onclick="deleteCategory('${cat.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm">حذف</button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error('Database Error:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500 py-6">خطأ في الاتصال بقاعدة البيانات أو تحميل الأقسام. (تأكد من وجود جدول categories والأعمدة المطلوبة)</td></tr>`;
    }
}

// إضافة قسم جديد لقاعدة البيانات
document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('catName').value.trim();
    const typeLevel = document.getElementById('catTypeLevel').value;
    const parent_id = typeLevel === 'sub' ? document.getElementById('catParent').value : null;
    const new_price = parseFloat(document.getElementById('catNewPrice').value) || 0;
    const used_price = parseFloat(document.getElementById('catUsedPrice').value) || 0;
    const is_free = document.getElementById('catIsFree').checked;
    const imageFile = document.getElementById('catImage').files[0];

    if (typeLevel === 'sub' && !parent_id) {
        alert('يرجى اختيار القسم الرئيسي التابع له هذا القسم الفرعي!');
        return;
    }

    let image_url = null;

    try {
        // رفع الصورة لو موجودة
        if (imageFile) {
            const fileName = `cat_${Date.now()}.webp`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('ads-images')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabaseClient.storage.from('ads-images').getPublicUrl(fileName);
            image_url = publicUrlData.publicUrl;
        }

        // حفظ البيانات في جدول categories
        const { error } = await supabaseClient.from('categories').insert([{
            name,
            parent_id: parent_id || null,
            new_price,
            used_price,
            is_free,
            image_url
        }]);

        if (error) throw error;

        alert('تم حفظ وإضافة القسم بنجاح!');
        document.getElementById('addCategoryForm').reset();
        document.getElementById('parentCategoryWrapper').classList.add('hidden');
        clearImageInput();
        loadCategoriesForAdmin();

    } catch (err) {
        console.error('Insert Error:', err);
        alert('حدث خطأ أثناء حفظ القسم: ' + (err.message || 'تأكد من صلاحيات قاعدة البيانات'));
    }
});

// حذف قسم من القاعدة
async function deleteCategory(id) {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
        try {
            const { error } = await supabaseClient.from('categories').delete().eq('id', id);
            if (error) throw error;
            
            alert('تم حذف القسم بنجاح');
            loadCategoriesForAdmin();
        } catch (err) {
            console.error('Delete Error:', err);
            alert('خطأ أثناء الحذف: ' + err.message);
        }
    }
}
