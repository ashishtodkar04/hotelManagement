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
      admin_terminal: "Admin Desk", today_bookings: "Today's Bookings", walkins_online: "Walk-ins / Online", total_revenue: "Total Sales", monitor_sync: "SMS Tracker",
      active: "ACTIVE", offline: "OFFLINE", refresh: "Refresh", live_bookings: "Live Bookings", customer: "Customer Name", table: "Table No.", guests: "Total Guests", status: "Status", actions: "Action",
      pending: "Waiting", confirmed: "Confirmed", seated: "Seated", completed: "Done", cancelled: "Cancelled",
      welcome_msg: `Welcome back to ${HOTEL_NAME}.`,
      secure_connection: "Connection is safe.",
      bill_amount: "Total Bill", advance_paid: "Advance Paid", remaining: "Remaining Due",
      home_title: "Enjoy Great Food in Space",
      home_subtitle: `Book a table at ${HOTEL_NAME} for a great meal.`,
      book_now: "Book Table", view_menu: "See Menu",
      booking_page_title: "Book Your Table", booking_subtitle: "Choose your time and table for a great meal.",
      floor_architecture: "Floor Plan", vacant: "Empty", selected: "Selected", occupied: "Full", date_label: "Date", time_label: "Time", guest_label: "Guests", duration_label: "Duration", table_placement: "Selected Table", authorize_booking: "Pay Advance to Book",
      payment_header: "Complete Payment", payment_subtitle: "Pay safely using UPI to lock your table.",
      session_ref: "Booking ID", temporal_window: "Time", placement: "Table", attendance: "Guests", manual_override: "Need Manual Check", authorize_session: "Pay Now", verified_msg: "Payment Success", pending_msg: "Checking Payment",
      verified_desc: `Your payment is successful. Your table at ${HOTEL_NAME} is booked!`,
      pending_desc: "We are checking your payment. We will tell you when it is done."
    },
    hi: {
      home: "मुख्य पृष्ठ", menu: "मेन्यू", booking: "टेबल बुकिंग", login: "लॉग इन", dashboard: "मेरा खाता", logout: "लॉग आउट", admin: "एडमिन", language: "भाषा",
      admin_terminal: "एडमिन डेस्क", today_bookings: "आज की बुकिंग", walkins_online: "सीधी एंट्री / ऑनलाइन", total_revenue: "कुल बिक्री", monitor_sync: "SMS ट्रैकर",
      active: "सक्रिय", offline: "ऑफलाइन", refresh: "रिफ्रेश", live_bookings: "आज की बुकिंग", customer: "ग्राहक का नाम", table: "टेबल नंबर", guests: "कुल मेहमान", status: "स्थिति", actions: "कार्रवाई",
      pending: "प्रतीक्षा", confirmed: "कन्फर्म", seated: "बैठे हैं", completed: "हो गया", cancelled: "रद्द",
      welcome_msg: `नमस्ते! ${HOTEL_NAME} में आपका स्वागत है।`,
      secure_connection: "आपका कनेक्शन सुरक्षित है।",
      bill_amount: "कुल बिल", advance_paid: "एडवांस भुगतान", remaining: "बकाया",
      home_title: "अंतरिक्ष में शानदार भोजन का आनंद लें",
      home_subtitle: `शानदार भोजन के लिए ${HOTEL_NAME} में अपनी टेबल बुक करें।`,
      book_now: "टेबल बुक करें", view_menu: "मेन्यू देखें",
      booking_page_title: "अपनी टेबल बुक करें", booking_subtitle: "शानदार भोजन के लिए अपना समय और टेबल चुनें।",
      floor_architecture: "फ्लोर प्लान", vacant: "खाली", selected: "चुना गया", occupied: "भरा हुआ", date_label: "तारीख", time_label: "समय", guest_label: "मेहमान", duration_label: "अवधि", table_placement: "चुनी गई टेबल", authorize_booking: "बुक करने के लिए एडवांस दें",
      payment_header: "भुगतान पूरा करें", payment_subtitle: "टेबल बुक करने के लिए UPI से सुरक्षित भुगतान करें।",
      session_ref: "बुकिंग ID", temporal_window: "समय", placement: "टेबल", attendance: "मेहमान", manual_override: "मैनुअल जांच की जरूरत", authorize_session: "भुगतान करें", verified_msg: "भुगतान सफल", pending_msg: "भुगतान की जांच हो रही है",
      verified_desc: `आपका भुगतान सफल रहा। ${HOTEL_NAME} में आपकी टेबल बुक हो गई है!`,
      pending_desc: "हम आपके भुगतान की जांच कर रहे हैं। जांच पूरी होने पर हम आपको बताएंगे।"
    },
    mr: {
      home: "मुख्य पृष्ठ", menu: "मेनू", booking: "टेबल बुकिंग", login: "लॉग इन", dashboard: "माझे खाते", logout: "लॉग आउट", admin: "एडमिन", language: "भाषा",
      admin_terminal: "एडमिन डेस्क", today_bookings: "आजची बुकिंग", walkins_online: "थेट एंट्री / ऑनलाइन", total_revenue: "एकूण विक्री", monitor_sync: "SMS ट्रॅकर",
      active: "सक्रिय", offline: "ऑफलाइन", refresh: "रिफ्रेश", live_bookings: "आजची बुकिंग", customer: "ग्राहकाचे नाव", table: "टेबल नंबर", guests: "एकूण पाहुणे", status: "स्थिती", actions: "कृती",
      pending: "प्रतिक्षा", confirmed: "निश्चित", seated: "बसलेले", completed: "झाले", cancelled: "रद्द",
      welcome_msg: `नमस्ते! ${HOTEL_NAME} मध्ये आपले स्वागत आहे.`,
      secure_connection: "तुमचे कनेक्शन सुरक्षित आहे.",
      bill_amount: "एकूण बिल", advance_paid: "अॅडव्हान्स", remaining: "बाकी",
      home_title: "अंतराळात उत्तम जेवणाचा आनंद घ्या",
      home_subtitle: `उत्तम जेवणासाठी ${HOTEL_NAME} मध्ये तुमची टेबल बुक करा.`,
      book_now: "टेबल बुक करा", view_menu: "मेनू पहा",
      booking_page_title: "तुमचे टेबल बुक करा", booking_subtitle: "उत्तम जेवणासाठी तुमची वेळ आणि टेबल निवडा.",
      floor_architecture: "फ्लोर प्लॅन", vacant: "रिकामे", selected: "निवडलेले", occupied: "भरलेले", date_label: "तारीख", time_label: "वेळ", guest_label: "पाहुणे", duration_label: "वेळ", table_placement: "निवडलेले टेबल", authorize_booking: "बुकिंगसाठी अॅडव्हान्स द्या",
      payment_header: "पेमेंट पूर्ण करा", payment_subtitle: "तुमचे टेबल बुक करण्यासाठी UPI द्वारे सुरक्षित पेमेंट करा.",
      session_ref: "बुकिंग ID", temporal_window: "वेळ", placement: "टेबल", attendance: "पाहुणे", manual_override: "मॅन्युअल तपासणीची गरज", authorize_session: "पेमेंट करा", verified_msg: "पेमेंट यशस्वी", pending_msg: "पेमेंट तपासले जात आहे",
      verified_desc: `तुमचे पेमेंट यशस्वी झाले आहे. ${HOTEL_NAME} मध्ये तुमचे टेबल बुक झाले आहे!`,
      pending_desc: "आम्ही तुमचे पेमेंट तपासत आहोत. तपासणी पूर्ण झाल्यावर आम्ही तुम्हाला कळवू."
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
