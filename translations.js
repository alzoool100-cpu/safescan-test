const translations = {
  ar: {
    contact_owner: "تواصل مع مالك السيارة",
    scan_contact: "المسح للتواصل مع مالك السيارة",
    urdu_text: "گاڑی کے مالک سے رابطہ کریں",
    safe_message: "رسالتك آمنة ولن يظهر رقمك",
    message_placeholder: "اكتب رسالتك هنا...",
    quick_block: "🚫 تسد الطريق",
    quick_lights: "💡 الأضواء",
    quick_accident: "⚠️ حادث",
    send_btn: "📨 إرسال الرسالة",
    chat_open: "💬 فتح المحادثة الآن",
    send_success: "تم إرسال رسالتك",
    copy_manual: "أو يمكنك نسخ الرابط يدوياً",
    link_valid: "الرابط صالح لمدة ساعة واحدة",
    owner_login: "🔐 مالك السيارة؟ سجل دخولك",
    activate_title: "تفعيل الاستيكر",
    activate_sub: "Activate your sticker",
    phone_label: "رقم الجوال",
    token_label: "رمز التفعيل",
    password_label: "كلمة المرور",
    activate_btn: "تفعيل الاستيكر",
    encrypted_msg: "رقمك مشفر ولا يظهر للغير",
    login_title: "تسجيل الدخول",
    login_sub: "لأصحاب السيارات المسجلين",
    login_btn: "دخول",
    no_account: "ليس لديك حساب؟ فعّل استيكر جديد",
    chat_title: "محادثة مؤقتة مع مالك السيارة",
    session_ended: "تم الرد - انتهت الجلسة",
    waiting_reply: "في انتظار رد المالك",
    refresh_btn: "تحديث الآن",
    session_info: "تنتهي الجلسة بعد ساعة",
    identity_hidden: "هويتك مجهولة",
    no_reply: "الزائر لا يمكنه الرد"
  },
  en: {
    contact_owner: "Contact Car Owner",
    scan_contact: "Scan to contact the car owner",
    urdu_text: "گاڑی کے مالک سے رابطہ کریں",
    safe_message: "Your message is safe and number hidden",
    message_placeholder: "Write your message here...",
    quick_block: "🚫 Blocking",
    quick_lights: "💡 Lights On",
    quick_accident: "⚠️ Accident",
    send_btn: "📨 Send",
    chat_open: "💬 Open Chat",
    send_success: "Message Sent",
    copy_manual: "Or copy link manually",
    link_valid: "Link valid for 1 hour",
    owner_login: "🔐 Owner? Login",
    activate_title: "Activate Sticker",
    activate_sub: "Activate your sticker",
    phone_label: "Phone Number",
    token_label: "Activation Code",
    password_label: "Password",
    activate_btn: "Activate",
    encrypted_msg: "Your number is encrypted",
    login_title: "Login",
    login_sub: "For registered owners",
    login_btn: "Login",
    no_account: "No account? Activate new sticker",
    chat_title: "Temporary Chat",
    session_ended: "Replied - Ended",
    waiting_reply: "Waiting for owner",
    refresh_btn: "Refresh",
    session_info: "Session expires after 1 hour",
    identity_hidden: "Your identity is hidden",
    no_reply: "Visitor cannot reply"
  }
};

function t(key) {
  const lang = navigator.language?.startsWith('ar') ? 'ar' : 'en';
  return translations[lang]?.[key] || translations.en[key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-key]').forEach(el => {
    el.textContent = t(el.getAttribute('data-key'));
  });
  document.querySelectorAll('[data-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-placeholder'));
  });
}

document.addEventListener('DOMContentLoaded', applyTranslations);
