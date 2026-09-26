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

// جلب الأقسام الرئيسية والفرعية من Supabase
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

        // افترضنا هنا إن الأقسام الرئيسية هي اللي مفيهاش parent_id أو قيمتها فارغة
        const mainCategories = categoriesData.filter(cat => !cat.parent_id || cat.parent_id === "");

        if (mainCategories.length > 0) {
            mainCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name; 
                option.textContent = cat.name;
                mainCategorySelect.appendChild(option);
            });
        } else {
            // لو قاعدة البيانات مش مسجلة parent_id، هنعرض كل الأقسام كمثال رئيسي
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

// دالة تسلسل الأقسام الفرعية بناءً على اختيار القسم الرئيسي
function handleMainCategoryChange() {
    const mainCategoryName = document.getElementById('adCategory').value;
    const subCategorySelect = document.getElementById('adSubCategory');
    
    subCategorySelect.innerHTML = '<option value="">اختر القسم الفرعي</option>';

    if (!mainCategoryName) return;

    // البحث عن الأقسام الفرعية التابعة للقسم الرئيسي المختار
    const parentCat = categoriesData.find(c => c.name === mainCategoryName);
    
    // لو عندك حقل في قاعدة البيانات يربط الفرعي بالرئيسي (مثلا parent_id أو sub_categories)
    // هنا بنجيب الأقسام الفرعية المرتبطة
    const subCategories = categoriesData.filter(c => c.parent_id === (parentCat ? parentCat.id : null));

    if (subCategories.length > 0) {
        subCategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub.name;
            option.textContent = sub.name;
            subCategorySelect.appendChild(option);
        });
    } else {
        // لو مفيش أقسام فرعية مفصولة، ممكن نعتبر القسم نفسه متاح أو نعرض رسالة
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
        
        govSelect.innerHTML = '<option value="">اختر المحافظة</option>';
        governorates.forEach(gov => {
            const option = document.createElement('option');
            option.value = gov.name; 
            option.textContent = gov.name;
            govSelect.appendChild(option);
        });
    } catch (err) {
        console.error('خطأ في تحميل المحافظات:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchGovernorates();
});

// تحديث الأسعار الديناميكية (جديد ومستعمل) وإخفاء صندوق الدفع لو الإعلان مجاني
function updateDynamicPricing() {
    const selectedCategoryName = document.getElementById('adCategory').value;
    const condition = document.getElementById('adCondition').value;
    const paymentSection = document.getElementById('paymentSectionWrapper');
    const displayFee = document.getElementById('displayFeeAmount');
    const feeText = document.getElementById('feeTextSpan');

    if (!selectedCategoryName) return;

    const category = categoriesData.find(c => c.name === selectedCategoryName);
    if (!category) return;

    let currentPrice = condition === 'جديد' ? (category.new_price || 0) : (category.used_price || 0);

    if (category.is_free || currentPrice === 0) {
        paymentSection.classList.add('hidden');
        receiptImageWebp = '';
    } else {
        paymentSection.classList.remove('hidden');
        displayFee.textContent = currentPrice;
        feeText.textContent = currentPrice + ' ج.م';
    }
}

// تحويل الصور إلى WebP للمحافظة على مساحة السيرفر وسرعة الموقع
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
        document.getElementById('receiptImagePreview').src = receiptImageWebp;
        document.getElementById('receiptImagePreviewContainer').classList.remove('hidden');
        document.getElementById('receiptLabelText').textContent = 'تم اختيار الإيصال';
        event.target.value = '';
    }
}

function removeReceiptImage() {
    receiptImageWebp = '';
    document.getElementById('receiptImagePreviewContainer').classList.add('hidden');
    document.getElementById('receiptLabelText').textContent = 'اختر صورة الإيصال';
}

// إرسال الإعلان وقيده كـ pending للمراجعة
document.getElementById('addAdForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (selectedAdImages.length === 0) {
        showCustomModal('يرجى اختيار صورة واحدة على الأقل للمنتج.');
        return;
    }

    const category = document.getElementById('adCategory').value;
    const subCategory = document.getElementById('adSubCategory').value;
    const condition = document.getElementById('adCondition').value;
    const matchedCat = categoriesData.find(c => c.name === category);
    
    let currentPrice = matchedCat ? (condition === 'جديد' ? (matchedCat.new_price || 0) : (matchedCat.used_price || 0)) : 0;
    const isFreeAd = matchedCat && (matchedCat.is_free || currentPrice === 0);

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
                price: parseFloat(document.getElementById('adPrice').value),
                condition: condition,
                category: subCategory, // نخزن القسم الفرعي النهائي كقسم للإعلان
                main_category: category, // نخزن القسم الرئيسي للفلترة
                phone: document.getElementById('adPhone').value,
                governorate: document.getElementById('adGovernorate').value,
                description: document.getElementById('adDescription').value,
                image_url: selectedAdImages.map(img => img.webp).join('||'),
                receipt_url: receiptImageWebp || null,
                sender_phone: document.getElementById('senderPhone').value || '',
                payment_method: document.getElementById('paymentMethod').value || '',
                status: 'pending' // قيد المراجعة دائماً لحماية منصة متجر البيت
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
