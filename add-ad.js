const SUPABASE_URL = 'https://usaqiylvcnmccgpnxwaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_he-h5ysxqK0VLujbtAXcUg_K5qf1rSB';

let selectedAdImages = []; 
let receiptImageWebp = ''; 
let categoriesData = []; 

function showCustomModal(message) {
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('customModal').classList.remove('hidden');
}

function closeCustomModal() {
    document.getElementById('customModal').classList.add('hidden');
}

// جلب الأقسام من Supabase
async function fetchCategories() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });

        if (!response.ok) throw new Error('فشل في جلب الأقسام');

        categoriesData = await response.json();
        const mainCategorySelect = document.getElementById('adCategory');
        
        mainCategorySelect.innerHTML = '<option value="">اختر القسم الرئيسي</option>';

        // الأقسام الرئيسية هي اللي مفيهاش parent_id
        const mainCategories = categoriesData.filter(cat => !cat.parent_id || cat.parent_id === "");

        if (mainCategories.length > 0) {
            mainCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name; 
                option.textContent = cat.name;
                mainCategorySelect.appendChild(option);
            });
        } else {
            categoriesData.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name; 
                option.textContent = cat.name;
                mainCategorySelect.appendChild(option);
            });
        }
    } catch (err) {
        console.error('خطأ في تحميل الأقسام:', err);
    }
}

// تسلسل الأقسام الفرعية وتحديث التسعير الديناميكي
function handleMainCategoryChange() {
    const mainCategoryName = document.getElementById('adCategory').value;
    const subCategorySelect = document.getElementById('adSubCategory');
    
    subCategorySelect.innerHTML = '<option value="">اختر القسم الفرعي</option>';

    if (!mainCategoryName) return;

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
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });

        if (!response.ok) throw new Error('فشل في جلب المحافظات');

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
    } catch (err) {
        console.error('خطأ في تحميل المحافظات:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchGovernorates();
    
    // ربط الأحداث للتحديث الفوري عند تغيير القسم أو الحالة
    const catSelect = document.getElementById('adCategory');
    const subCatSelect = document.getElementById('adSubCategory');
    const conditionSelect = document.getElementById('adCondition');

    if (catSelect) catSelect.addEventListener('change', handleMainCategoryChange);
    if (subCatSelect) subCatSelect.addEventListener('change', updateDynamicPricing);
    if (conditionSelect) conditionSelect.addEventListener('change', updateDynamicPricing);
});

// تحديث الأسعار وإخفاء صندوق الدفع تماماً لو القسم مجاني أو سعره صفر
function updateDynamicPricing() {
    const mainCategoryName = document.getElementById('adCategory').value;
    const subCategoryName = document.getElementById('adSubCategory').value;
    const condition = document.getElementById('adCondition').value || 'جديد';
    const paymentSection = document.getElementById('paymentSectionWrapper');
    const displayFee = document.getElementById('displayFeeAmount');
    const feeText = document.getElementById('feeTextSpan');

    if (!paymentSection) return;

    // البحث عن القسم المختار (الفرعي أولاً، أو الرئيسي لو مفيش فرعي)
    let targetCatName = subCategoryName || mainCategoryName;
    if (!targetCatName) {
        paymentSection.classList.add('hidden');
        return;
    }

    const category = categoriesData.find(c => c.name === targetCatName) || categoriesData.find(c => c.name === mainCategoryName);
    
    if (!category) {
        paymentSection.classList.add('hidden');
        return;
    }

    // جلب السعر حسب الحالة (جديد أو مستعمل)
    let currentPrice = condition === 'جديد' ? Number(category.new_price || 0) : Number(category.used_price || 0);

    // التحقق من أن القسم مجاني بالكامل أو سعره 0
    if (category.is_free === true || currentPrice === 0) {
        paymentSection.classList.add('hidden');
        receiptImageWebp = '';
    } else {
        paymentSection.classList.remove('hidden');
        if (displayFee) displayFee.textContent = currentPrice;
        if (feeText) feeText.textContent = currentPrice + ' ج.م';
    }
}

// تحويل الصور إلى WebP
function convertImageToWebp(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1000;
                
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp', 0.8));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleAdImages(event) {
    const files = Array.from(event.target.files);
    if (selectedAdImages.length + files.length > 8) {
        showCustomModal('عذراً، الحد الأقصى المسموح به هو 8 صور فقط.');
        return;
    }

    for (let file of files) {
        try {
            const webpUrl = await convertImageToWebp(file);
            selectedAdImages.push({ uniqueId: 'img_' + Math.random().toString(36).substr(2, 9), webp: webpUrl });
        } catch(err) { console.error(err); }
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
            div.innerHTML = `<img src="${imgObj.webp}" class="w-full h-full object-cover"><button type="button" onclick="removeAdImage('${imgObj.uniqueId}')" class="absolute top-1 left-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">✕</button>`;
            container.appendChild(div);
        });
    } else { container.classList.add('hidden'); }
}

function removeAdImage(uniqueId) {
    selectedAdImages = selectedAdImages.filter(img => img.uniqueId !== uniqueId);
    renderAdImagesPreviews();
}

async function handleReceiptImage(event) {
    const file = event.target.files[0];
    if (file) {
        receiptImageWebp = await convertImageToWebp(file);
        const preview = document.getElementById('receiptImagePreview');
        const container = document.getElementById('receiptImagePreviewContainer');
        const labelText = document.getElementById('receiptLabelText');
        if (preview) preview.src = receiptImageWebp;
        if (container) container.classList.remove('hidden');
        if (labelText) labelText.textContent = 'تم اختيار الإيصال';
        event.target.value = '';
    }
}

function removeReceiptImage() {
    receiptImageWebp = '';
    const container = document.getElementById('receiptImagePreviewContainer');
    const labelText = document.getElementById('receiptLabelText');
    if (container) container.classList.add('hidden');
    if (labelText) labelText.textContent = 'اختر صورة الإيصال';
}

// إرسال الإعلان وقيده كـ pending
document.getElementById('addAdForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (selectedAdImages.length === 0) {
        showCustomModal('يرجى اختيار صورة واحدة على الأقل للمنتج.');
        return;
    }

    const category = document.getElementById('adCategory').value;
    const subCategory = document.getElementById('adSubCategory').value || category;
    const condition = document.getElementById('adCondition').value;
    const targetCatName = subCategory || category;
    const matchedCat = categoriesData.find(c => c.name === targetCatName) || categoriesData.find(c => c.name === category);
    
    let currentPrice = matchedCat ? (condition === 'جديد' ? Number(matchedCat.new_price || 0) : Number(matchedCat.used_price || 0)) : 0;
    const isFreeAd = matchedCat && (matchedCat.is_free === true || currentPrice === 0);

    if (!isFreeAd && !receiptImageWebp) {
        showCustomModal('يرجى رفع صورة إيصال التحويل لاستكمال إرسال الإعلان.');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري إرسال الإعلان...';

   try {
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
                category: subCategory, 
                main_category: category, 
                phone: document.getElementById('adPhone').value,
                description: document.getElementById('adDescription').value,
                image_url: selectedAdImages.map(img => img.webp).join('||'),
                receipt_url: receiptImageWebp || null,
                sender_phone: document.getElementById('senderPhone') ? document.getElementById('senderPhone').value : '',
                payment_method: document.getElementById('paymentMethod') ? document.getElementById('paymentMethod').value : '',
                status: 'pending'
            })
        });

        if (!response.ok) throw new Error(await response.text());

        showCustomModal('تم إرسال إعلانك بنجاح وسيتم مراجعته واعتماده قريباً!');
        setTimeout(() => window.location.replace('index.html?v=' + Date.now()), 2500);
    } catch (err) {
        showCustomModal('حدث خطأ أثناء الحفظ: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'إرسال الإعلان للمراجعة';
    }
});
