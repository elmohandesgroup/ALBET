// استيراد أو ربط عميل Supabase (تأكد من تهيئته في مشروعك)
// import { createClient } from '@supabase/supabase-js'

class StaffManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    // 1. جلب قائمة كل الموظفين لعرضها في لوحة التحكم
    async fetchAllStaff() {
        try {
            const { data, error } = await this.supabase
                .from('staff_members')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب الموظفين:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 2. إضافة موظف جديد وإسناد قسم له
    async addStaffMember(name, email, role, assignedCategory) {
        try {
            const { data, error } = await this.supabase
                .from('staff_members')
                .insert([
                    { 
                        name: name, 
                        email: email, 
                        role: role, // 'moderator' أو 'admin'
                        assigned_category: assignedCategory, 
                        is_active: true 
                    }
                ])
                .select();

            if (error) throw error;
            return { success: true, data: data[0], message: 'تم إضافة الموظف بنجاح!' };
        } catch (error) {
            console.error('خطأ في إضافة الموظف:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 3. تفعيل أو تعطيل حساب الموظف (حسب طلب المدير)
    async toggleStaffStatus(staffId, currentStatus) {
        try {
            const { data, error } = await this.supabase
                .from('staff_members')
                .update({ is_active: !currentStatus })
                .eq('id', staffId)
                .select();

            if (error) throw error;
            return { success: true, data: data[0], message: 'تم تحديث حالة الموظف بنجاح!' };
        } catch (error) {
            console.error('خطأ في تحديث حالة الموظف:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 4. حذف الموظف نهائياً من النظام
    async deleteStaffMember(staffId) {
        try {
            const { error } = await this.supabase
                .from('staff_members')
                .delete()
                .eq('id', staffId);

            if (error) throw error;
            return { success: true, message: 'تم حذف الموظف نهائياً.' };
        } catch (error) {
            console.error('خطأ في حذف الموظف:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// مثال على الاستخدام في الواجهة الأمامية للوحة التحكم
/*
const staffManager = new StaffManager(supabase);

// مثال لإضافة موظف جديد عند الضغط على زر في لوحة المدير:
async function handleAddStaffForm(event) {
    event.preventDefault();
    const name = document.getElementById('staffName').value;
    const email = document.getElementById('staffEmail').value;
    const role = document.getElementById('staffRole').value;
    const category = document.getElementById('staffCategory').value;

    const result = await staffManager.addStaffMember(name, email, role, category);
    if (result.success) {
        alert(result.message);
        // تحديث جدول العرض في الصفحة
    } else {
        alert('فشل الإضافة: ' + result.error);
    }
}
*/
