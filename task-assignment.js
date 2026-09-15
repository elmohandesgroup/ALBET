class TaskAssignmentManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    // 1. جلب الإعلانات الجديدة التي لم يتم إسنادها بعد (Pending Unassigned)
    async fetchUnassignedAds() {
        try {
            // جلب الإعلانات التي حالتها معلقة وليس لها مهام مسجلة
            const { data, error } = await this.supabase
                .from('ads')
                .select('*')
                .eq('status', 'pending');

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب الإعلانات المعلقة:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 2. إسناد إعلان معين لموظف محدد (من قبل المدير)
    async assignAdToStaff(adId, staffId) {
        try {
            const { data, error } = await this.supabase
                .from('task_assignments')
                .insert([
                    {
                        ad_id: adId,
                        staff_id: staffId,
                        review_status: 'pending'
                    }
                ])
                .select();

            if (error) throw error;
            return { success: true, data: data[0], message: 'تم إسناد الإعلان للموظف بنجاح!' };
        } catch (error) {
            console.error('خطأ في إسناد المهمة:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 3. جلب المهام الخاصة بموظف معين (لعرضها في لوحة تحكم الموظف)
    async fetchStaffTasks(staffId) {
        try {
            const { data, error } = await this.supabase
                .from('task_assignments')
                .select(`
                    id,
                    review_status,
                    rejection_reason,
                    ads (
                        id,
                        title,
                        description,
                        price,
                        category,
                        image_url,
                        created_at
                    )
                `)
                .eq('staff_id', staffId)
                .eq('review_status', 'pending'); // المهام المعلقة المطلوب مراجعتها

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب مهام الموظف:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 4. اتخاذ قرار المراجعة من قِبل الموظف (قبول ونشر أو رفض مع السبب)
    async reviewTask(assignmentId, adId, decision, rejectionReason = null) {
        try {
            // أ. تحديث حالة المهمة في جدول المهام
            const { error: taskError } = await this.supabase
                .from('task_assignments')
                .update({ 
                    review_status: decision === 'approve' ? 'approved' : 'rejected',
                    rejection_reason: rejectionReason,
                    reviewed_at: new Date()
                })
                .eq('id', assignmentId);

            if (taskError) throw taskError;

            // ب. إذا وافق الموظف، يتم تغيير حالة الإعلان إلى 'active' ليظهر فوراً في الموقع للمستخدمين
            if (decision === 'approve') {
                const { error: adError } = await this.supabase
                    .from('ads')
                    .update({ status: 'active' })
                    .eq('id', adId);

                if (adError) throw adError;
            } else {
                // إذا تم الرفض، يتم تحديث حالة الإعلان لـ 'rejected' أو حذفه
                const { error: adError } = await this.supabase
                    .from('ads')
                    .update({ status: 'rejected' })
                    .eq('id', adId);

                if (adError) throw adError;
            }

            return { success: true, message: decision === 'approve' ? 'تم اعتماد ونشر الإعلان بنجاح!' : 'تم رفض الإعلان.' };
        } catch (error) {
            console.error('خطأ في تنفيذ قرار المراجعة:', error.message);
            return { success: false, error: error.message };
        }
    }
}
