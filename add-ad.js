const SUPABASE_URL = 'https://usaqiylvcnmccgpnxwaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_he-h5ysxqK0VLujbtAXcUg_K5qf1rSB';

let selectedAdImages = []; 
let receiptImageWebp = ''; 
let categoriesData = []; 

function showCustomModal(message) {
    const modalMsg = document.getElementById('modalMessage');
    const customModal = document.getElementById('customModal');
    if (modalMsg) modalMsg.textContent = message;
    if (customModal) customModal.classList.remove('hidden');
}

function closeCustomModal() {
    const customModal = document.getElementById('customModal');
    if (customModal) customModal.classList.add('hidden');
}

async function fetchCategories() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*`, {
            method: 'GET',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
        });
        if (!response.ok) throw new Error('فشل في جلب الأقسام');
        categoriesData = await response.json();
        const mainCategorySelect = document.getElementById('adCategory');
        if (!mainCategorySelect) return;
        mainCategorySelect.innerHTML = '<option value="">اختر القسم الرئيسي</option>';
        const mainCategories = categoriesData.filter(cat => !cat.parent_id || cat.parent_id === "");
        mainCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name; 
            option.textContent = cat.name;
            mainCategorySelect.appendChild(option);
        });
    } catch (err) { console.error(err); }
}

function handleMainCategoryChange() {
    const mainCategoryName = document.getElementById('adCategory').value;
    const subCategorySelect = document.getElementById('adSubCategory');
    if (!subCategorySelect) return;
    subCategorySelect.innerHTML = '<option value="">اختر القسم الفرعي</option>';
    if (!mainCategoryName) { updateDynamicPricing(); return; }
    const parentCat = categoriesData.find(c => c.name === mainCategoryName);
    const subCategories = categoriesData.filter(c => parentCat && c.parent_id === parentCat.id);
    if (subCategories.length > 0) {
        subCategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub.name;
            option.textContent = sub.name;
            subCategorySelect.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.value = mainCategoryName;
        option.textContent = mainCategoryName + ' (رئيسي مباشر)';
        subCategorySelect.appendChild(option);
    }
    updateDynamicPricing();
}

async function fetchGovernorates() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/governorates?select=*`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
        });
        const governorates = await response.json();
        const govSelect = document.getElementById('adGovernorate');
        if (govSelect) {
            govSelect.innerHTML = '<option value="">اختر المحافظة</option>';
            governorates.forEach(gov => {
                const option = document.createElement('option');
                option.value = gov.name; 
                option.textContent = gov.name;
                govSelect.appendChild(option);
            });
        }
    } catch (err) { console.error(err); }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchGovernorates();
    document.getElementById('adCategory')?.addEventListener('change', handleMainCategoryChange);
    document.getElementById('adSubCategory')?.addEventListener('change', updateDynamicPricing);
    document.getElementById('adCondition')?.addEventListener('change', updateDynamicPricing);
});

function updateDynamicPricing() {
    const mainCategoryName = document.getElementById('adCategory')?.value || '';
    const subCategoryName = document.getElementById('adSubCategory')?.value || '';
    const condition = document.getElementById('adCondition')?.value || 'جديد';
    const paymentSection = document.getElementById('paymentSectionWrapper');
    if (!paymentSection) return;
    let targetCatName = subCategoryName || mainCategoryName;
    if (!targetCatName) { paymentSection.classList.add('hidden'); return; }
    const category = categoriesData.find(c => c.name === targetCatName) || categoriesData.find(c => c.name === mainCategoryName);
    if (!category) { paymentSection.classList.add('hidden'); return; }
    let currentPrice = condition === 'جديد' ? Number(category.new_price || 0) : Number(category.used_price || 0);
    if (category.is_free === true || currentPrice === 0) {
        paymentSection.classList.add('hidden');
        receiptImageWebp = '';
    } else {
        paymentSection.classList.remove('hidden');
        document.getElementById('displayFeeAmount').textContent = currentPrice;
        document.getElementById('feeTextSpan').textContent = currentPrice + ' ج.م';
    }
}

// تحويل الصورة إلى WebP File object لرفعها للـ Storage
function convertFileToWebpBlob(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                const MAX_WIDTH = 1000;
                if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => { resolve(blob); }, 'image/webp', 0.8);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

let rawImageFiles = [];
async function handleAdImages(event) {
    const files = Array.from(event.target.files);
    if (rawImageFiles.length + files.length > 8) {
        showCustomModal('عذراً، الحد الأقصى المسموح به هو 8 صور فقط.');
        return;
    }
    for (let file of files) {
        rawImageFiles.push(file);
        const previewUrl = URL.createObjectURL(file);
        selectedAdImages.push({ uniqueId: 'img_' + Math.random().toString(36).substr(2, 9), preview: previewUrl, file: file });
    }
    event.target.value = '';
    renderAdImagesPreviews();
}

function renderAdImagesPreviews() {
    const container = document.getElementById('adImagesPreviewContainer');
    if (!container) return;
    container.innerHTML = '';
    if (selectedAdImages.length > 0) {
        container.classList.remove('hidden');
        selectedAdImages.forEach((imgObj) => {
            const div = document.createElement('div');
            div.className = 'relative w-20 h-20 border rounded-lg overflow-hidden shadow-sm bg-white';
            div.innerHTML = `<img src="${imgObj.preview}" class="w-full h-full object-cover"><button type="button" onclick="removeAdImage('${imgObj.uniqueId}')" class="absolute top-1 left-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">✕</button>`;
            container.appendChild(div);
        });
    } else { container.classList.add('hidden'); }
}

function removeAdImage(uniqueId) {
    selectedAdImages = selectedAdImages.filter(img => img.uniqueId !== uniqueId);
    renderAdImagesPreviews();
}

let rawReceiptFile = null;
async function handleReceiptImage(event) {
    const file = event.target.files[0];
    if (file) {
        rawReceiptFile = file;
        const preview = document.getElementById('receiptImagePreview');
        const container = document.getElementById('receiptImagePreviewContainer');
        if (preview) preview.src = URL.createObjectURL(file);
        if (container) container.classList.remove('hidden');
        document.getElementById('receiptLabelText').textContent = 'تم اختيار الإيصال';
        event.target.value = '';
    }
}

function removeReceiptImage() {
    rawReceiptFile = null;
    document.getElementById('receiptImagePreviewContainer')?.classList.add('hidden');
    document.getElementById('receiptLabelText').textContent = 'اختر صورة الإيصال';
}

// رفع الصور إلى Supabase Storage Bucket والحصول على روابط حقيقية
async function uploadImageToSupabase(file, folder = 'ads') {
    const webpBlob = await convertFileToWebpBlob(file);
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36.substring(2, 9))}.webp`;
    
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/ads-images/${fileName}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'image/webp'
        },
        body: webpBlob
    });

    if (!response.ok) throw new Error('فشل رفع إحدى الصور إلى التخزين');
    return `${SUPABASE_URL}/storage/v1/object/public/ads-images/${fileName}`;
}

const addAdFormElement = document.getElementById('addAdForm');
if (addAdFormElement) {
    addAdFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (selectedAdImages.length === 0) {
            showCustomModal('يرجى اختيار صورة واحدة على الأقل للمنتج.');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'جاري رفع الصور والإرسال...'; }

        try {
            // رفع صور الإعلان بالتتابع والحصول على روابطهم الحقيقية
            let uploadedUrls = [];
            for (let imgObj of selectedAdImages) {
                const publicUrl = await uploadImageToSupabase(imgObj.file, 'listings');
                uploadedUrls.push(publicUrl);
            }

            // رفع إيصال الدفع إن وجد
            let receiptUrl = null;
            if (rawReceiptFile) {
                receiptUrl = await uploadImageToSupabase(rawReceiptFile, 'receipts');
            }

            const mainCategory = document.getElementById('adCategory').value;
            const subCategory = document.getElementById('adSubCategory').value || mainCategory;
            const condition = document.getElementById('adCondition').value;

            // إرسال البيانات للجدول بحالة pending (معلق لحين المراجعة من الإدارة)
            const response = await fetch(`${SUPABASE_URL}/rest/v1/ads`, {
                method: 'POST',
                headers: {
                   'Content-Type': 'application/json',
                   'apikey': SUPABASE_ANON_KEY,
                   'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                   'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    title: document.getElementById('adTitle').value,
                    price: parseFloat(document.getElementById('adPrice').value) || 0,
                    condition: condition,
                    category: mainCategory,
                    sub_category: subCategory,
                    description: document.getElementById('adDescription').value,
                    image_url: uploadedUrls.join('||'),
                    payment_reference: receiptUrl,
                    status: 'pending' // معلق ولا يظهر للمستخدمين إلا بعد الاعتماد
                })
            });

            if (!response.ok) throw new Error(await response.text());

            showCustomModal('تم إرسال إعلانك بنجاح وسيتم مراجعته واعتماده قريباً!');
            setTimeout(() => window.location.replace('index.html?v=' + Date.now()), 2500);
        } catch (err) {
            showCustomModal('حدث خطأ أثناء الحفظ: ' + err.message);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'إرسال الإعلان للمراجعة'; }
        }
    });
}
