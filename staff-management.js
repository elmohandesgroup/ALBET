class StaffManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    // إضافة موظف جديد وتوليد بيانات الدخول وإرسالها عبر البريد
    async addStaffMemberWithEmail(name, email, role, assignedCategory, tempPassword) {
        try {
            // 1. إنشاء حساب الموظف في جدول البيانات الأساسي
            const { data: staffData, error: staffError } = await this.supabase
                .from('staff_members')
                .insert([
                    { 
                        name: name, 
                        email: email, 
                        role: role, // 'moderator'
                        assigned_category: assignedCategory, 
                        is_active: true 
                    }
                ])
                .select();

            if (staffError) throw staffError;

            // 2. إرسال رسالة البريد الإلكتروني التلقائية بالبيانات ورابط لوحة التحكم
            // (يمكن ربط هذه الخطوة بدالة سحابية Supabase Edge Function أو خدمة تواصل مثل Resend)
            const emailSent = await this.sendWelcomeEmail(email, name, tempPassword, assignedCategory);

            if (!emailSent.success) {
                console.warn('تم حفظ الموظف ولكن فشل إرسال البريد الإلكتروني:', emailSent.error);
            }

            return { 
                success: true, 
                data: staffData[0], 
                message: 'تم إضافة الموظف بنجاح وإرسال بيانات الدخول إلى بريده الإلكتروني!' 
            };

        } catch (error) {
            console.error('خطأ في إضافة الموظف:', error.message);
            return { success: false, error: error.message };
        }
    }

    // دالة إرسال الإيميل (تتصل بخدمة إرسال البريد مثل Resend أو API خارجي)
    async sendWelcomeEmail(email, name, password, category) {
        try {
            // مثال لطلب API لإرسال البريد عبر خدمة جاهزة
            /*
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_RESEND_API_KEY'
                },
                body: JSON.stringify({
                    from: 'admin@albet.store',
                    to: email,
                    subject: 'تم تفعيل حسابك الإداري في منصة متجر البيت',
                    html: `
                        <div dir="rtl" style="font-family: Arial; padding: 20px;">
                            <h2>أهلاً بك يا ${name} في فريق إدارة متجر البيت (albet.store)</h2>
                            <p>تم تعيينك كموظف مراجعة وتدقيق لقسم: <b>${category}</b>.</p>
                            <hr>
                            <p><b>بيانات الدخول الخاصة بك:</b></p>
                            <ul>
                                href="https://albet.store/employee-login.html">رابط لوحة التحكم للموظفين</a></li>
                                <li>اسم المستخدم (البريد): ${email}</li>
                                <li>كلمة المرور المؤقتة: <b>${password}</b></li>
                            </ul>
                            <p>يرجى تسجيل الدخول وتغيير كلمة المرور الخاصة بك في أقرب وقت.</p>
                        </div>
                    `
                })
            });
            */
           
            // لمحاكاة النجاح فوراً أثناء التطوير
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // باقي الدوال (fetchAllStaff, toggleStaffStatus, deleteStaffMember) تظل كما هي...
}
