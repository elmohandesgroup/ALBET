const SUPABASE_URL = 'https://usaqiylvcnmccgpnxwaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_he-h5ysxq0VLujbtAXcUg_K5qf1rSB';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    loadCategoriesForAdmin();
    setupImagePreview();
});

// معاينة الصورة وحذفها قبل الرفع
function setupImagePreview() {
    const fileInput = document.getElementById('catImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreview');
    const clearBtn = document.getElementById('clearImageBtn');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                previewImg.src = event.target.result;
                previewContainer.classList.remove('hidden');
                clearBtn.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            clearImageInput();
        }
    });

    clearBtn.addEventListener('click', () => {
        clearImageInput();
    });
}

function clearImageInput() {
    const fileInput = document.getElementById('catImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const clearBtn = document.getElementById('clearImageBtn');
    
    fileInput.value = '';
    previewContainer.classList.add('hidden');
    clearBtn.classList.add('hidden');
}

// تحميل الأقسام في الجدول والقائمة المنسدلة للـ Parent
async function loadCategoriesForAdmin() {
    const tbody = document.getElementById('categoriesTableBody');
    const parentSelect = document.getElementById('catParent');
    if (!tbody) return;

    try {
        const { data: categories, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!categories || categories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-400 py-6">لا توجد أقسام مسجلة حالياً.</td></tr>`;
            parentSelect.innerHTML = `<option value="">قسم رئيسي (بدون أب)</option>`;
            return;
        }

        // تعبئة قائمة الأقسام الرئيسية للأبناء
        parentSelect.innerHTML = `<option value="">قسم رئيسي (بدون أب)</option>`;
        categories.filter(c => !c.parent_id).forEach(cat => {
            parentSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });

        tbody.innerHTML = '';
        categories.forEach(cat => {
            const parentCat = categories.find(p => p.id === cat.parent_id);
            const typeLabel = parentCat ? `<span class="text-xs text-gray-500">فرعي (يتبع: ${parentCat.name})</span>` : `<span class="text-xs font-bold text-orange-600">رئيسي</span>`;
            const statusLabel = cat.is_free ? `<span class="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-lg font-bold">مجاني بالكامل</span>` : `<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-lg font-bold">مدفوع</span>`;

            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="p-3"><img src="${cat.image_url || 'logo192.png'}" class="w-10 h-10 object-cover rounded-xl border"></td>
                    <td class="p-3 font-bold text-gray-800">${cat.name}</td>
                    <td class="p-3">${typeLabel}</td>
                    <td class="p-3 font-bold text-gray-700">${cat.new_price || 0} ج.م</td>
                    <td class="p-3 font-bold text-gray-700">${cat.used_price || 0} ج.م</td>
                    <td class="p-3">${statusLabel}</td>
                    <td class="p-3 text-center">
                        <button onclick="deleteCategory('${cat.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all">حذف</button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500 py-6">خطأ في تحميل الأقسام (تأكد من وجود أعمدة التسعير في الجدول)</td></tr>`;
    }
}

// إضافة قسم جديد
document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('catName').value.trim();
    const parent_id = document.getElementById('catParent').value || null;
    const new_price = parseFloat(document.getElementById('catNewPrice').value) || 0;
    const used_price = parseFloat(document.getElementById('catUsedPrice').value) || 0;
    const is_free = document.getElementById('catIsFree').checked;
    const imageFile = document.getElementById('catImage').files[0];

    let image_url = null;

    try {
        if (imageFile) {
            const fileName = `cat_${Date.now()}.webp`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('ads-images')
                .upload(fileName, imageFile);

            if (!uploadError) {
                const { data: publicUrlData } = supabaseClient.storage.from('ads-images').getPublicUrl(fileName);
                image_url = publicUrlData.publicUrl;
            }
        }

        const { error } = await supabaseClient.from('categories').insert([{
            name,
            parent_id,
            new_price,
            used_price,
            is_free,
            image_url
        }]);

        if (error) throw error;

        alert('تم إضافة القسم بنجاح!');
        document.getElementById('addCategoryForm').reset();
        clearImageInput();
        loadCategoriesForAdmin();

    } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء الإضافة: ' + err.message);
    }
});

async function deleteCategory(id) {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
        const { error } = await supabaseClient.from('categories').delete().eq('id', id);
        if (!error) {
            alert('تم الحذف بنجاح');
            loadCategoriesForAdmin();
        } else {
            alert('خطأ أثناء الحذف: ' + error.message);
        }
    }
}
