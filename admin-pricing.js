        const SUPABASE_URL = 'https://usaqiylvcnmccgpnxwaq.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_he-h5ysxqK0VLujbtAXcUg_K5qf1rSB';
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let editingCategoryId = null;
let currentExistingImageUrl = ''; // حفظ رابط الصورة القديمة عند التعديل

document.addEventListener('DOMContentLoaded', () => {
    loadCategoriesForAdmin();
    setupImagePreview();
    setupLevelToggle();
});

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

async function loadCategoriesForAdmin() {
    const tbody = document.getElementById('categoriesTableBody');
    const parentSelect = document.getElementById('catParent');
    if (!tbody) return;

    try {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-400 py-6">جاري تحميل الأقسام...</td></tr>`;

        const { data: categories, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!categories || categories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-400 py-6">لا توجد أقسام مسجلة حالياً.</td></tr>`;
            if (parentSelect) parentSelect.innerHTML = `<option value="">لا توجد أقسام رئيسية متاحة</option>`;
            return;
        }

        if (parentSelect) {
            parentSelect.innerHTML = `<option value="">اختر القسم الرئيسي التابع له</option>`;
            categories.filter(c => !c.parent_id).forEach(cat => {
                parentSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        }

        const mainCategories = categories.filter(c => !c.parent_id);
        let orderedCategories = [];

        mainCategories.forEach(main => {
            orderedCategories.push({ ...main, isMain: true });
            const subCategories = categories.filter(c => c.parent_id === main.id);
            subCategories.forEach(sub => {
                orderedCategories.push({ ...sub, isMain: false, mainName: main.name });
            });
        });

        tbody.innerHTML = '';
        orderedCategories.forEach(cat => {
            const typeLabel = cat.isMain 
                ? `<span class="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">رئيسي</span>` 
                : `<span class="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">فرعي (يتبع: ${cat.mainName})</span>`;
            
            const statusLabel = cat.is_free 
                ? `<span class="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-lg font-bold">مجاني بالكامل</span>` 
                : `<span class="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-lg font-bold">حسب السعر</span>`;

            const rowBg = cat.isMain ? 'bg-white font-bold' : 'bg-gray-50/60';
            const nameIndentation = cat.isMain ? cat.name : `↳ ${cat.name}`;
            const safeImageUrl = cat.image_url || 'logo192.png';

            tbody.innerHTML += `
                <tr class="${rowBg} hover:bg-orange-50/30 transition-colors border-b">
                    <td class="p-3"><img src="${safeImageUrl}" class="w-10 h-10 object-cover rounded-xl border shadow-sm"></td>
                    <td class="p-3 text-gray-800">${nameIndentation}</td>
                    <td class="p-3">${typeLabel}</td>
                    <td class="p-3 text-gray-700">${cat.new_price || 0} ج.م</td>
                    <td class="p-3 text-gray-700">${cat.used_price || 0} ج.م</td>
                    <td class="p-3">${statusLabel}</td>
                    <td class="p-3 text-center flex items-center justify-center gap-2">
                        <button onclick="editCategory('${cat.id}', '${cat.name}', '${cat.parent_id || ''}', ${cat.new_price || 0}, ${cat.used_price || 0}, ${cat.is_free || false}, '${cat.image_url || ''}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm">تعديل</button>
                        <button onclick="deleteCategory('${cat.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm">حذف</button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error('Database Error:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500 py-6">خطأ في تحميل الأقسام من قاعدة البيانات.</td></tr>`;
    }
}

function editCategory(id, name, parentId, newPrice, usedPrice, isFree, imageUrl) {
    editingCategoryId = id;
    currentExistingImageUrl = imageUrl; // الاحتفاظ برابط الصورة القديمة
    document.getElementById('catName').value = name;
    document.getElementById('catNewPrice').value = newPrice;
    document.getElementById('catUsedPrice').value = usedPrice;
    document.getElementById('catIsFree').checked = isFree;

    const typeLevelSelect = document.getElementById('catTypeLevel');
    const parentWrapper = document.getElementById('parentCategoryWrapper');
    const parentSelect = document.getElementById('catParent');
    const submitBtn = document.querySelector('#addCategoryForm button[type="submit"]');

    if (parentId && parentId !== 'null' && parentId !== '') {
        typeLevelSelect.value = 'sub';
        parentWrapper.classList.remove('hidden');
        parentSelect.value = parentId;
        parentSelect.setAttribute('required', 'true');
    } else {
        typeLevelSelect.value = 'main';
        parentWrapper.classList.add('hidden');
        parentSelect.value = '';
        parentSelect.removeAttribute('required');
    }

    submitBtn.textContent = 'تحديث بيانات القسم';
    submitBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
    submitBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

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

    try {
        let image_url = currentExistingImageUrl; // الافتراضي هو الصورة القديمة

        // لو تم اختيار صورة جديدة، ارفعها
        if (imageFile) {
            const fileName = `cat_${Date.now()}.webp`;
            const { error: uploadError } = await supabaseClient.storage
                .from('categories')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabaseClient.storage.from('ads-images').getPublicUrl(fileName);
            image_url = publicUrlData.publicUrl;
        }

        if (editingCategoryId) {
            const { error } = await supabaseClient.from('categories').update({
                name,
                parent_id: parent_id || null,
                new_price,
                used_price,
                is_free,
                image_url
            }).eq('id', editingCategoryId);

            if (error) throw error;

            alert('تم تحديث القسم بنجاح!');
            resetFormState();
        } else {
            const { error } = await supabaseClient.from('categories').insert([{
                name,
                parent_id: parent_id || null,
                new_price,
                used_price,
                is_free,
                image_url: image_url || null
            }]);

            if (error) throw error;

            alert('تم إضافة القسم بنجاح!');
            document.getElementById('addCategoryForm').reset();
            document.getElementById('parentCategoryWrapper').classList.add('hidden');
            clearImageInput();
        }

        loadCategoriesForAdmin();

    } catch (err) {
        console.error('Save Error:', err);
        alert('حدث خطأ أثناء الحفظ: ' + err.message);
    }
});

function resetFormState() {
    editingCategoryId = null;
    currentExistingImageUrl = '';
    document.getElementById('addCategoryForm').reset();
    document.getElementById('parentCategoryWrapper').classList.add('hidden');
    clearImageInput();
    const submitBtn = document.querySelector('#addCategoryForm button[type="submit"]');
    submitBtn.textContent = 'حفظ وإضافة القسم';
    submitBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    submitBtn.classList.add('bg-orange-600', 'hover:bg-orange-700');
}

async function deleteCategory(id) {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟ (سيتم حذف الأقسام الفرعية التابعة له أيضاً)')) {
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
