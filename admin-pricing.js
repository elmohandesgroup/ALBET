const SUPABASE_URL = 'https://usaqiylvcnmccgpnxwaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_he-h5ysxq0VLujbtAXcUg_K5qf1rSB';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.onload = async () => {
    await loadPricingRules();
};

async function loadPricingRules() {
    const tbody = document.getElementById('pricingTableBody');
    if (!tbody) return;

    // جلب الأقسام وقواعد التسعير الحالية من قاعدة البيانات
    const { data: categories, error: catError } = await supabaseClient.from('categories').select('*');
    const { data: rules, error: ruleError } = await supabaseClient.from('pricing_rules').select('*');

    if (!categories || categories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-400 py-10">لا توجد أقسام مسجلة في قاعدة البيانات حالياً.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    categories.forEach(cat => {
        const catName = cat.name || cat.title;
        const existingRule = rules ? rules.find(r => r.category_name === catName) : null;
        
        const newPrice = existingRule ? existingRule.new_price : 50;
        const usedPrice = existingRule ? existingRule.used_price : 30;
        const isFree = existingRule ? existingRule.is_free : false;

        const row = `
            <tr class="border-b hover:bg-gray-50/80 transition-colors">
                <td class="p-3 font-bold text-gray-900">${catName}</td>
                <td class="p-3">
                    <input type="number" id="new_${catName}" value="${newPrice}" class="w-32 p-2.5 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                </td>
                <td class="p-3">
                    <input type="number" id="used_${catName}" value="${usedPrice}" class="w-32 p-2.5 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                </td>
                <td class="p-3 text-center">
                    <input type="checkbox" id="free_${catName}" ${isFree ? 'checked' : ''} class="w-5 h-5 accent-orange-600 cursor-pointer rounded">
                </td>
                <td class="p-3 text-center">
                    <button onclick="savePricing('${catName}')" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">حفظ</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function savePricing(catName) {
    const new_price = parseFloat(document.getElementById(`new_${catName}`).value) || 0;
    const used_price = parseFloat(document.getElementById(`used_${catName}`).value) || 0;
    const is_free = document.getElementById(`free_${catName}`).checked;

    const { data: existing } = await supabaseClient.from('pricing_rules').select('id').eq('category_name', catName).maybeSingle();

    let response;
    if (existing) {
        response = await supabaseClient.from('pricing_rules').update({ new_price, used_price, is_free }).eq('category_name', catName);
    } else {
        response = await supabaseClient.from('pricing_rules').insert([{ category_name: catName, new_price, used_price, is_free }]);
    }

    if (!response.error) {
        alert(`تم حفظ تسعير قسم (${catName}) بنجاح!`);
    } else {
        alert('حدث خطأ أثناء الحفظ: ' + response.error.message);
    }
}
