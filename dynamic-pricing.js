document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('adCategory');
    const conditionSelect = document.getElementById('adCondition');

    if (categorySelect && conditionSelect) {
        categorySelect.addEventListener('change', updateAdFeeDisplay);
        conditionSelect.addEventListener('change', updateAdFeeDisplay);
    }
});

async function updateAdFeeDisplay() {
    const categoryName = document.getElementById('adCategory').value;
    const condition = document.getElementById('adCondition').value; // جديد أو مستعمل
    
    if (!categoryName) return;

    try {
        // جلب قاعدة التسعير الخاصة بهذا القسم من جدول pricing_rules
        const { data, error } = await supabaseClient
            .from('pricing_rules')
            .select('*')
            .eq('category_name', categoryName)
            .maybeSingle();

        let finalPrice = 50; // السعر الافتراضي لو مش محدد
        let isFree = false;

        if (data) {
            isFree = data.is_free;
            if (!isFree) {
                // لو الحالة جديد يخد سعر الجديد، لو مستعمل ياخد سعر المستعمل
                if (condition.includes('جديد')) {
                    finalPrice = data.new_price;
                } else {
                    finalPrice = data.used_price;
                }
            }
        }

        // تحديث النص الظاهر للعميل في قسم الدفع
        const paymentNoticeBox = document.querySelector('#addAdForm .bg-orange-50');
        if (paymentNoticeBox) {
            if (isFree || finalPrice === 0) {
                paymentNoticeBox.innerHTML = `
                    <div class="flex items-center justify-between">
                        <p class="font-bold text-emerald-800 text-sm">رسوم النشر والمراجعة:</p>
                        <span class="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-md text-[11px]">مجانـاً تماماً</span>
                    </div>
                    <p class="text-gray-600 mt-2">هذا القسم أو الحالة مدعومة بعرض مجاني، يمكنك نشر إعلانك الآن دون أي رسوم تحويل!</p>
                `;
            } else {
                paymentNoticeBox.innerHTML = `
                    <div class="flex items-center justify-between">
                        <p class="font-bold text-orange-800 text-sm">طريقة الدفع (رسوم النشر والمراجعة):</p>
                        <span class="bg-orange-600 text-white font-bold px-2.5 py-1 rounded-md text-[11px]">${finalPrice} ج.م فقط</span>
                    </div>
                    <p class="text-gray-600 leading-relaxed mt-2">
                        برجاء تحويل مبلغ (<span class="font-bold text-orange-600 text-sm">${finalPrice} ج.م</span>) إلى رقم المحفظة: <span class="font-bold text-black bg-white px-2 py-1 rounded select-all border text-sm inline-block my-1">01227802300</span> ثم إدخال بيانات التحويل أدناه للمطابقة.
                    </p>
                `;
            }
        }

    } catch (err) {
        console.error('خطأ في جلب تسعير القسم:', err);
    }
}
