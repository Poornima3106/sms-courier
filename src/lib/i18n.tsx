'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ta';

export const translations = {
  en: {
    brandName: 'Sri Mahadevaiyer Sweets',
    tagline: 'Order & Courier Management System – Since 1946, Madurai',
    headerTitle: 'Sri Mahadevaiyer Sweets – Since 1946',
    shopSince: 'Since 1946 • Madurai, Tamil Nadu',
    welcome: 'Welcome',
    logout: 'Logout',
    nav: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      addOrder: 'Add Order',
      dispatch: 'Bulk Dispatch',
      track: 'Track Order',
      reports: 'Reports',
      activity: 'Activity Log',
      users: 'Users & Staff',
      settings: 'Settings',
    },
    metrics: {
      totalOrders: 'Total Orders',
      pending: 'Pending Dispatch',
      inTransit: 'In Transit',
      delivered: 'Delivered',
      problems: 'Delayed / Issues',
      todayDispatches: "Today's Dispatches",
    },
    status: {
      Pending: 'Pending',
      Dispatched: 'Dispatched',
      'In Transit': 'In Transit',
      Delivered: 'Delivered',
      Delayed: 'Delayed',
      Returned: 'Returned',
      Damaged: 'Damaged',
    },
    payment: {
      Paid: 'Paid',
      COD: 'COD (Cash on Delivery)',
      Pending: 'Payment Pending',
    },
    orderFields: {
      orderNo: 'Order No',
      customerName: 'Customer Name',
      phone: 'Phone Number',
      address: 'Delivery Address',
      city: 'City / Town',
      pincode: 'PIN Code',
      product: 'Product / Sweet Box',
      orderDate: 'Order Date',
      paymentStatus: 'Payment Status',
      amount: 'Amount (₹)',
      status: 'Order Status',
      courier: 'Courier Partner',
      awbNo: 'AWB / Tracking No',
      weightKg: 'Weight (kg)',
      boxes: 'No. of Boxes',
      courierCharge: 'Courier Charge (₹)',
      dispatchDate: 'Dispatch Date',
      actions: 'Actions',
    },
    buttons: {
      addOrder: '+ Add Order',
      dispatchSelected: 'Dispatch Selected',
      filter: 'Filter',
      search: 'Search orders, phone, AWB...',
      clear: 'Clear',
      exportExcel: 'Export Excel',
      exportPdf: 'Export PDF',
      save: 'Save Changes',
      cancel: 'Cancel',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this order?',
      track: 'Track',
      whatsApp: 'WhatsApp',
      updateStatus: 'Update Status',
      createUser: 'Create Staff User',
      resetPassword: 'Reset Password',
      deactivate: 'Deactivate',
      activate: 'Activate',
    },
    messages: {
      orderCreatedSuccess: 'Order created successfully!',
      orderUpdatedSuccess: 'Order updated successfully!',
      dispatchSuccess: 'Orders dispatched successfully!',
      confirmDeleteText: 'This action cannot be undone. Do you wish to continue?',
      loading: 'Loading data...',
      noOrders: 'No orders found matching the filter.',
      sessionExpired: 'Your session has expired. Please log in again.',
    },
  },
  ta: {
    brandName: 'ஸ்ரீ மகாதேவையர் ஸ்வீட்ஸ்',
    tagline: 'ஆர்டர் & கூரியர் மேலாண்மை அமைப்பு – 1946 முதல், மதுரை',
    headerTitle: 'ஸ்ரீ மகாதேவையர் ஸ்வீட்ஸ் – 1946 முதல்',
    shopSince: '1946 முதல் • மதுரை, தமிழ்நாடு',
    welcome: 'வணக்கம்',
    logout: 'வெளியேறு',
    nav: {
      dashboard: 'முகப்பு',
      orders: 'ஆர்டர்கள்',
      addOrder: 'புதிய ஆர்டர்',
      dispatch: 'கூரியர் அனுப்புகை',
      track: 'கண்காணிப்பு',
      reports: 'அறிக்கைகள்',
      activity: 'செயல்பாட்டுப் பதிவு',
      users: 'பணியாளர்கள்',
      settings: 'அமைப்புகள்',
    },
    metrics: {
      totalOrders: 'மொத்த ஆர்டர்கள்',
      pending: 'அனுப்ப வேண்டியவை',
      inTransit: 'வழியில் உள்ளவை',
      delivered: 'விநியோகிக்கப்பட்டது',
      problems: 'தாமதம் / சிக்கல்கள்',
      todayDispatches: 'இன்றைய அனுப்புகைகள்',
    },
    status: {
      Pending: 'நிலுவை',
      Dispatched: 'அனுப்பப்பட்டது',
      'In Transit': 'வழியில் உள்ளது',
      Delivered: 'விநியோகமானது',
      Delayed: 'தாமதம்',
      Returned: 'திரும்பியது',
      Damaged: 'சேதமடைந்தது',
    },
    payment: {
      Paid: 'செலுத்தப்பட்டது',
      COD: 'பணப்பரிமாற்றம் (COD)',
      Pending: 'நிலுவையில் உள்ளது',
    },
    orderFields: {
      orderNo: 'ஆர்டர் எண்',
      customerName: 'வாடிக்கையாளர் பெயர்',
      phone: 'கைபேசி எண்',
      address: 'விநியோக முகவரி',
      city: 'ஊர் / நகரம்',
      pincode: 'அஞ்சல் குறியீடு',
      product: 'இனிப்பு பெட்டி',
      orderDate: 'ஆர்டர் தேதி',
      paymentStatus: 'கட்டண நிலை',
      amount: 'தொகை (₹)',
      status: 'ஆர்டர் நிலை',
      courier: 'கூரியர் நிறுவனம்',
      awbNo: 'AWB எண்',
      weightKg: 'எடை (கிலோ)',
      boxes: 'பெட்டிகள் எண்ணிக்கை',
      courierCharge: 'கூரியர் கட்டணம் (₹)',
      dispatchDate: 'அனுப்பிய தேதி',
      actions: 'செயல்கள்',
    },
    buttons: {
      addOrder: '+ புதிய ஆர்டர்',
      dispatchSelected: 'தேர்ந்தெடுத்ததை அனுப்பு',
      filter: 'வடிகட்டு',
      search: 'ஆர்டர், தொலைபேசி, AWB தேடுக...',
      clear: 'அழி',
      exportExcel: 'Excel பதிவிறக்கு',
      exportPdf: 'PDF பதிவிறக்கு',
      save: 'சேமி',
      cancel: 'ரத்து செய்',
      delete: 'நீக்கு',
      confirmDelete: 'இந்த ஆர்டரை உறுதியாக நீக்க விரும்புகிறீர்களா?',
      track: 'கண்காணி',
      whatsApp: 'வாட்ஸ்அப்',
      updateStatus: 'நிலை மாற்று',
      createUser: 'பணியாளர் சேர்க்க',
      resetPassword: 'கடவுச்சொல் மாற்று',
      deactivate: 'முடக்கு',
      activate: 'செயல்படுத்து',
    },
    messages: {
      orderCreatedSuccess: 'ஆர்டர் வெற்றிகரமாக உருவாக்கப்பட்டது!',
      orderUpdatedSuccess: 'ஆர்டர் புதுப்பிக்கப்பட்டது!',
      dispatchSuccess: 'கூரியர் வெற்றிகரமாக அனுப்பப்பட்டது!',
      confirmDeleteText: 'இந்த செயலை திரும்பப் பெற முடியாது. தொடரவா?',
      loading: 'தரவு ஏற்றப்படுகிறது...',
      noOrders: 'ஆர்டர்கள் எதுவும் காணப்படவில்லை.',
      sessionExpired: 'அமர்வு முடிந்தது. மீண்டும் உள்நுழையவும்.',
    },
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('sms_lang') as Language;
    if (saved === 'en' || saved === 'ta') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sms_lang', lang);
  };

  const t = translations[language];

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
