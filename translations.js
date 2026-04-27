// ===========================
// SafeScan - Translations
// ===========================

const translations = {
  ar: {
    // --- عام ---
    error_msg: "الرجاء كتابة رسالة",
    error_token: "لم يتم التعرف على الاستيكر",
    sticker_invalid: "استيكر غير صالح",
    owner_unavailable: "المالك غير متاح",
    login_required: "الرجاء تسجيل الدخول أولاً",
    not_registered: "غير مسجل",
    error_loading: "خطأ في التحميل",
    no_stickers: "لا توجد استيكرات مرتبطة",
    no_messages: "لا توجد رسائل بعد",
    new_badge: "🆕 جديدة",
    replied_badge: "✅ تم الرد",
    message_label: "الرسالة:",
    previous_reply: "ردك السابق:",
    reply_failed: "فشل إرسال الرد",
    reply_sent: "تم إرسال الرد",
    will_notify: "سيتم إشعارك فور وصول رسالة",
    notifications_off: "الإشعارات متوقفة",
    vehicle_default: "🚗 سيارتي",
    status_active: "🟢 حالة الاستقبال",
    status_off: "🔴 متوقف (خصوصية تامة)",
    loading: "جار التحميل...",
    refresh: "🔄 تحديث",
    inbox: "📥 آخر الرسائل",
    reply_title: "💬 الرد على الرسالة",
    reply_placeholder: "اكتب ردك هنا...",
    send_reply: "إرسال الرد",
    cancel: "إلغاء",
    settings: "⚙️ الإعدادات السريعة",
    telegram_notify: "🔔 إشعارات تيليجرام",
    phone_registered: "📱 رقم الجوال المسجل",
    auto_schedule: "🕒 الجدولة التلقائية",
    soon: "قريباً",
    logout: "تسجيل الخروج",
    privacy: "سياسة الخصوصية",
    support: "مركز المساعدة",

    // --- صفحة التواصل (index.html) ---
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

    // --- صفحة التسجيل (register.html) ---
    activate_title: "تفعيل الاستيكر",
    activate_sub: "Activate your sticker",
    phone_label: "رقم الجوال",
    token_label: "رمز التفعيل",
    password_label: "كلمة المرور",
    activate_btn: "تفعيل الاستيكر",
    encrypted_msg: "رقمك مشفر ولا يظهر للغير",
    additional_info: "📝 معلومات إضافية عن المركبة",
    optional: "اختياري",
    car_name_label: "اسم المركبة",
    plate_label: "رقم اللوحة",
    model_label: "الموديل",
    driver_label: "اسم السائق",
    image_label: "صورة المركبة",
    car_name_placeholder: "مثال: سيارة العمل",
    plate_placeholder: "مثال: أ ب ج 1234",
    model_placeholder: "مثال: كامري 2024",
    driver_placeholder: "مثال: أحمد محمد",
    show_public: "إظهار للعامة",
    otp_label: "رمز التحقق OTP",
    otp_sent: "تم إرسال رمز التحقق إلى جوالك",
    otp_placeholder: "أدخل الرمز المكون من 6 أرقام",

    // --- تسجيل الدخول (login.html) ---
    login_title: "تسجيل الدخول",
    login_sub: "لأصحاب السيارات المسجلين",
    login_btn: "دخول",
    no_account: "ليس لديك حساب؟ فعّل استيكر جديد",

    // --- المحادثة (chat.html) ---
    chat_title: "محادثة مؤقتة مع مالك السيارة",
    session_ended: "تم الرد - انتهت الجلسة",
    waiting_reply: "في انتظار رد المالك",
    refresh_btn: "تحديث الآن",
    session_info: "تنتهي الجلسة بعد ساعة",
    identity_hidden: "هويتك مجهولة",
    no_reply: "الزائر لا يمكنه الرد",

    // --- الخصوصية ---
    show_phone_setting: "📱 إظهار رقمي للزوار",
    show_phone_warning: "⚠️ تحذير: هذا الخيار سيجعل رقم جوالك ظاهراً لأي شخص يمسح كود الاستيكر.\n\nهل أنت متأكد من رغبتك في إظهار رقمك للعامة؟",
    show_phone_to_visitor: "📞 إظهار رقمي لهذا الشخص",
    show_phone_to_visitor_warning: "⚠️ سيظهر رقم جوالك لهذا الشخص فقط في صفحة المحادثة.\nسينتهي الإظهار تلقائياً بعد ساعة.\n\nهل أنت متأكد؟",
    phone_revealed: "📱 رقم مالك السيارة:",
    phone_revealed_chat: "📱 رقم المالك:",
    phone_revealed_success: "سيظهر رقمك لهذا الزائر عند زيارته لرابط المحادثة.",
    show_label_on: "إظهار",
    show_label_off: "إخفاء"
  },

  en: {
    // --- General ---
    error_msg: "Please write a message",
    error_token: "Sticker not recognized",
    sticker_invalid: "Invalid sticker",
    owner_unavailable: "Owner unavailable",
    login_required: "Please login first",
    not_registered: "Not registered",
    error_loading: "Loading error",
    no_stickers: "No linked stickers",
    no_messages: "No messages yet",
    new_badge: "🆕 New",
    replied_badge: "✅ Replied",
    message_label: "Message:",
    previous_reply: "Your previous reply:",
    reply_failed: "Failed to send reply",
    reply_sent: "Reply sent",
    will_notify: "You will be notified when a message arrives",
    notifications_off: "Notifications off",
    vehicle_default: "🚗 My Car",
    status_active: "🟢 Active",
    status_off: "🔴 Stopped (Full Privacy)",
    loading: "Loading...",
    refresh: "🔄 Refresh",
    inbox: "📥 Inbox",
    reply_title: "💬 Reply to message",
    reply_placeholder: "Write your reply here...",
    send_reply: "Send Reply",
    cancel: "Cancel",
    settings: "⚙️ Quick Settings",
    telegram_notify: "🔔 Telegram Notifications",
    phone_registered: "📱 Registered Phone",
    auto_schedule: "🕒 Auto Schedule",
    soon: "Soon",
    logout: "Logout",
    privacy: "Privacy Policy",
    support: "Help Center",

    // --- Contact Page (index.html) ---
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

    // --- Registration Page (register.html) ---
    activate_title: "Activate Sticker",
    activate_sub: "Activate your sticker",
    phone_label: "Phone Number",
    token_label: "Activation Code",
    password_label: "Password",
    activate_btn: "Activate",
    encrypted_msg: "Your number is encrypted",
    additional_info: "📝 Additional Vehicle Information",
    optional: "Optional",
    car_name_label: "Vehicle Name",
    plate_label: "Plate Number",
    model_label: "Model",
    driver_label: "Driver Name",
    image_label: "Vehicle Image",
    car_name_placeholder: "e.g. Work Car",
    plate_placeholder: "e.g. ABC 1234",
    model_placeholder: "e.g. Camry 2024",
    driver_placeholder: "e.g. Ahmed",
    show_public: "Show publicly",
    otp_label: "OTP Code",
    otp_sent: "Verification code sent to your phone",
    otp_placeholder: "Enter 6-digit code",

    // --- Login Page (login.html) ---
    login_title: "Login",
    login_sub: "For registered owners",
    login_btn: "Login",
    no_account: "No account? Activate new sticker",

    // --- Chat Page (chat.html) ---
    chat_title: "Temporary Chat",
    session_ended: "Replied - Ended",
    waiting_reply: "Waiting for owner",
    refresh_btn: "Refresh",
    session_info: "Session expires after 1 hour",
    identity_hidden: "Your identity is hidden",
    no_reply: "Visitor cannot reply",

    // --- Privacy ---
    show_phone_setting: "📱 Show my phone to visitors",
    show_phone_warning: "⚠️ Warning: This will show your phone number to anyone scanning the sticker.\n\nAre you sure?",
    show_phone_to_visitor: "📞 Show my number to this person",
    show_phone_to_visitor_warning: "⚠️ Your number will be shown to this person in the chat only.\nIt will expire after 1 hour.\n\nAre you sure?",
    phone_revealed: "📱 Owner's Phone:",
    phone_revealed_chat: "📱 Owner's Phone:",
    phone_revealed_success: "Your number will be shown to this visitor when they open the chat link.",
    show_label_on: "Show",
    show_label_off: "Hide"
  }
};

// دالة الترجمة - تكتشف لغة المتصفح تلقائياً
function t(key) {
  const lang = navigator.language?.startsWith('ar') ? 'ar' : 'en';
  return translations[lang]?.[key] || translations.en[key] || key;
}

// تطبيق الترجمة على جميع العناصر التي تحمل data-key أو data-placeholder
function applyTranslations() {
  document.querySelectorAll('[data-key]').forEach(el => {
    el.textContent = t(el.getAttribute('data-key'));
  });
  document.querySelectorAll('[data-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-placeholder'));
  });
}

document.addEventListener('DOMContentLoaded', applyTranslations);
