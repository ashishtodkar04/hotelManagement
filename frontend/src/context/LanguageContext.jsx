/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { useHotel } from '../hooks/useHotel';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('app-lang') || 'en');
  const { name: HOTEL_NAME } = useHotel();

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
  }, [lang]);

  const translations = {
    en: {
      home: "Home", menu: "Menu", booking: "Table Booking", login: "Log In", dashboard: "My Account", logout: "Log Out", admin: "Admin", language: "Language",
      admin_terminal: "Admin Management Desk", today_bookings: "Today's Bookings", walkins_online: "Direct Entry / Online", total_revenue: "Total Sales", monitor_sync: "SMS Tracker",
      active: "ACTIVE", offline: "OFFLINE", refresh: "Refresh", live_bookings: "Current Bookings", customer: "Customer Name", table: "Table No.", guests: "Total Guests", status: "Current Status", actions: "Take Action",
      pending: "Waiting", confirmed: "Confirmed", seated: "Seated Now", completed: "Finished", cancelled: "Cancelled",
      welcome_msg: `Namaste! Welcome back to the ${HOTEL_NAME} desk.`,
      secure_connection: "Your connection is safe and active.",
      bill_amount: "Full Bill", advance_paid: "Advance Paid", remaining: "Balance Amount",
      home_title: "Experience the Finest Dining",
      home_subtitle: `Book your table at ${HOTEL_NAME} for an unforgettable culinary journey.`,
      book_now: "Book Your Table", view_menu: "Check Menu",
      booking_page_title: "Book Your Table", booking_subtitle: "Synchronize your schedule with our availability to ensure an uncompromising culinary session.",
      floor_architecture: "Floor Architecture", vacant: "Vacant", selected: "Selected", occupied: "Occupied", date_label: "Scheduled Date", time_label: "Synchronized Time", guest_label: "Guest Count", duration_label: "Session Duration", table_placement: "Floor Placement Confirmation", authorize_booking: "Authorize & Initialize Deposit",
      payment_header: "Finalize Payment", payment_subtitle: "Authorize your reservation via our encrypted UPI bridge to secure your architectural placement.",
      session_ref: "Digital Signature (Ref)", temporal_window: "Temporal Window", placement: "Placement", attendance: "Attendance", manual_override: "Manual Override Required", authorize_session: "Authorize Session", verified_msg: "Transmission Verified", pending_msg: "Audit Pending",
      verified_desc: `Your financial authorization is complete. Your seat at the pinnacle of dining at ${HOTEL_NAME} is now confirmed.`,
      pending_desc: "Your transaction has been submitted for sovereign audit. You will be notified upon verification."
    },
    hi: {
      home: "मुख्य पृष्ठ", menu: "मेन्यू", booking: "टेबल बुकिंग", login: "लॉग इन", dashboard: "मेरा खाता", logout: "लॉग आउट", admin: "एडमिन", language: "भाषा",
      admin_terminal: "एडमिन मैनेजमेंट डेस्क", today_bookings: "आज की बुकिंग", walkins_online: "सीधी एंट्री / ऑनलाइन", total_revenue: "कुल बिक्री", monitor_sync: "SMS ट्रैकर",
      active: "सक्रिय", offline: "ऑफलाइन", refresh: "रिफ्रेश", live_bookings: "मौजूदा बुकिंग", customer: "ग्राहक का नाम", table: "टेबल नंबर", guests: "कुल मेहमान", status: "वर्तमान स्थिति", actions: "कार्रवाई करें",
      pending: "प्रतीक्षा", confirmed: "कन्फर्म", seated: "अभी बैठे हैं", completed: "समाप्त", cancelled: "रद्द",
      welcome_msg: `नमस्ते! ${HOTEL_NAME} डेस्क पर आपका स्वागत है।`,
      secure_connection: "आपका कनेक्शन सुरक्षित और सक्रिय है।",
      bill_amount: "कुल बिल", advance_paid: "अग्रिम भुगतान", remaining: "बकाया राशि",
      home_title: "बेहतरीन डाइनिंग का अनुभव करें",
      home_subtitle: `एक यादगार स्वाद यात्रा के लिए ${HOTEL_NAME} में अपनी टेबल बुक करें।`,
      book_now: "टेबल बुक करें", view_menu: "मेन्यू देखें",
      booking_page_title: "अपनी टेबल बुक करें", booking_subtitle: "बिना किसी समझौते के डाइनिंग अनुभव के लिए हमारे साथ अपनी टेबल तय करें।",
      floor_architecture: "फ्लोर प्लान", vacant: "खाली", selected: "चुना गया", occupied: "भरा हुआ", date_label: "तय तारीख", time_label: "तय समय", guest_label: "मेहमानों की संख्या", duration_label: "समय अवधि", table_placement: "टेबल का चयन", authorize_booking: "बुकिंग और भुगतान शुरू करें",
      payment_header: "भुगतान पूरा करें", payment_subtitle: "अपनी बुकिंग सुरक्षित करने के लिए हमारे सुरक्षित UPI गेटवे के माध्यम से भुगतान करें।",
      session_ref: "डिजिटल सिग्नेचर (Ref)", temporal_window: "समय विवरण", placement: "स्थान", attendance: "उपस्थिति", manual_override: "मैनुअल अपडेट की आवश्यकता", authorize_session: "सत्र अधिकृत करें", verified_msg: "भुगतान सफल", pending_msg: "सत्यापन लंबित",
      verified_desc: `${HOTEL_NAME} में आपका भुगतान सफल रहा। अब आपकी टेबल बुक हो चुकी है।`,
      pending_desc: "आपका ट्रांजैक्शन ऑडिट के लिए जमा कर दिया गया है। सत्यापन के बाद आपको सूचित किया जाएगा।"
    },
    mr: {
      home: "मुख्य पृष्ठ", menu: "मेनू", booking: "टेबल बुकिंग", login: "लॉग इन", dashboard: "माझे खाते", logout: "लॉग आउट", admin: "एडमिन", language: "भाषा",
      admin_terminal: "एडमिन मॅनेजमेंट डेस्क", today_bookings: "आजची बुकिंग", walkins_online: "थेट एंट्री / ऑनलाइन", total_revenue: "एकूण विक्री", monitor_sync: "SMS ट्रॅकर",
      active: "सक्रिय", offline: "ऑफलाइन", refresh: "रिफ्रेश", live_bookings: "सध्याची बुकिंग", customer: "ग्राहकाचे नाव", table: "टेबल नंबर", guests: "एकूण पाहुणे", status: "सध्याची स्थिती", actions: "कृती करा",
      pending: "प्रतिक्षा", confirmed: "निश्चित", seated: "आता बसलेले", completed: "पूर्ण झाले", cancelled: "रद्द",
      welcome_msg: `नमस्ते! ${HOTEL_NAME} मॅनेजमेंट डेस्कवर आपले स्वागत आहे.`,
      secure_connection: "तुमचे कनेक्शन सुरक्षित आणि सक्रिय आहे.",
      bill_amount: "एकूण बिल", advance_paid: "आगाऊ रक्कम", remaining: "उर्वरित रक्कम",
      home_title: "उत्कृष्ट डाइनिंगचा अनुभव घ्या",
      home_subtitle: `एक अविस्मरणीय चवीच्या प्रवासासाठी ${HOTEL_NAME} मध्ये तुमची टेबल बुक करा.`,
      book_now: "टेबल बुक करा", view_menu: "मेनू पहा",
      booking_page_title: "तुमचे टेबल बुक करा", booking_subtitle: "डाइनिंग अनुभवासाठी आमच्या उपलब्धतेनुसार तुमचे टेबल निश्चित करा.",
      floor_architecture: "फ्लोर प्लॅन", vacant: "रिकामे", selected: "निवडलेले", occupied: "भरलेले", date_label: "निश्चित तारीख", time_label: "निश्चित वेळ", guest_label: "पाहुण्यांची संख्या", duration_label: "वेळेची मर्यादा", table_placement: "टेबलची निवड", authorize_booking: "बुकिंग आणि पेमेंट सुरू करा",
      payment_header: "पेमेंट पूर्ण करा", payment_subtitle: "तुमची बुकिंग सुरक्षित करण्यासाठी आमच्या सुरक्षित UPI गेटवेद्वारे पेमेंट करा.",
      session_ref: "डिजिटल सिग्नेचर (Ref)", temporal_window: "वेळेचा तपशील", placement: "ठिकाण", attendance: "उपस्थिती", manual_override: "मॅन्युअल अपडेटची गरज", authorize_session: "सत्र अधिकृत करा", verified_msg: "पेमेंट यशस्वी", pending_msg: "पडताळणी प्रलंबित",
      verified_desc: `${HOTEL_NAME} मध्ये तुमचे पेमेंट यशस्वी झाले आहे. आता तुमचे टेबल बुक झाले आहे.`,
      pending_desc: "तुमचा ट्रांजॅक्शन ऑडिटसाठी सबमिट केला गेला आहे. पडताळणीनंतर तुम्हाला कळवले जाईल।"
    }
  };

  const t = (key) => {
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
