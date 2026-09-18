// ملف: payment-check.js

// دالة التحقق ومطابقة الدفع
async function verifyPayment(clientExpectedAmount, adId, supabaseClient) {
    try {
        // 1. جلب أحدث الرسائل الواردة من Supabase
        const { data: smsList, error } = await supabaseClient
            .from('incoming_sms')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(15); // فحص آخر 15 رسالة وصلت

        if (error) throw error;

        // 2. البحث عن رسالة مطابقة للمبلغ
        const matchingSms = smsList.find(sms => {
            return Number(sms.amount) === Number(clientExpectedAmount);
        });

        if (matchingSms) {
            // 3. تحديث حالة الإعلان في جدول ads بناءً على الـ ID
            const { error: updateError } = await supabaseClient
                .from('ads')
                .update({ status: 'active', payment_verified: true })
                .eq('id', adId);

            if (updateError) throw updateError;

            return { 
                success: true, 
                message: "تم تأكيد التحويل ومطابقة المبلغ بنجاح! تم تفعيل إعلانك." 
            };
        } else {
            return { 
                success: false, 
                message: "لم يتم العثور على تحويل بهذا المبلغ حتى الآن، يرجى المحاولة لاحقاً أو مراجعة الإيصال." 
            };
        }

    } catch (err) {
        console.error("خطأ أثناء مطابقة الدفع:", err.message);
        return { success: false, message: "حدث خطأ تقني أثناء التحقق." };
    }
}
