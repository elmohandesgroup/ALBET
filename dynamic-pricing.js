// ملف التسعير الديناميكي لصفحة أضف إعلانك (add-ad.html)
document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('category-select'); // تأكد من مطابقة الـ ID في صفحة add-ad.html
    const conditionSelect = document.getElementById('condition-select'); // خانة الحالة (جديد / مستعمل)
    const paymentBox = document.getElementById('payment-box'); // صندوق الدفع في الصفحة

    if (categorySelect) {
        categorySelect.addEventListener('change', async (e) => {
            const categoryId = e.target.value;
            if (!categoryId) return;

            try {
                // جلب تسعير القسم المحدد من قاعدة البيانات
                const { data, error } = await supabaseClient
                    .from('categories')
                    .select('new_price, used_price, is_free')
                    .eq('id', categoryId)
                    .single();

                if (error || !data) return;

                updatePaymentUI(data, conditionSelect ? conditionSelect.value : 'جديد');

            } catch (err) {
                console.error('خطأ في جلب التسعير الديناميكي:', err);
            }
        });
    }

    if (conditionSelect) {
        conditionSelect.addEventListener('change', async () => {
            const categoryId = categorySelect ? categorySelect.value : null;
            if (!categoryId) return;

            const { data } = await supabaseClient
                .from('categories')
                .select('new_price, used_price, is_free')
                .eq('id', categoryId)
                .single();

            if (data) {
                updatePaymentUI(data, conditionSelect.value);
            }
        });
    }
});

function updatePaymentUI(categoryData, condition) {
    const amountSpan = document.getElementById('required-amount'); // العنصر الذي يعرض المبلغ المطلوب
    const paymentContainer = document.getElementById('payment-container'); // حاوية الدفع بالكامل

    if (!paymentContainer) return;

    if (categoryData.is_free) {
        paymentContainer.innerHTML = `
            <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center font-bold text-sm">
                🎉 هذا القسم مجاني بالكامل! لا توجد أي رسوم نشر مطلوبة لهذا الإعلان.
            </div>
        `;
    } else {
        const priceToPay = condition === 'مستعمل' ? (categoryData.used_price || 30) : (categoryData.new_price || 50);
        if (amountSpan) amountSpan.innerText = priceToPay + ' ج.م';
    }
}
