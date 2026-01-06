import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  User,
  Volume2,
  RotateCcw,
  Square,
  Star,
  ChevronRight,
  AlertCircle,
  Settings,
  LogIn,
  ArrowLeft,
  Trophy,
  PartyPopper,
  Check,
} from "lucide-react";
import { useLocation } from "wouter";
import logoImg from "@assets/kidz-gpt_1767288550163.jpeg";
import robotImage from "@assets/generated_images/cute_3d_robot_character.png";
import solarSystemImage from "@assets/generated_images/cartoon_solar_system_illustration.png";
import scienceExperimentImage from "@assets/generated_images/fun_science_experiment_illustration.png";
import oceanLifeImage from "@assets/generated_images/cute_3d_panda_toy_on_wheels.png";
import dinosaursImage from "@assets/generated_images/cute_3d_minion_toy_character.png";
import artImage from "@assets/generated_images/creative_art_and_drawing_illustration.png";
import ScenePlayer from "@/components/ScenePlayer";
import { GestureFullscreenController } from "@/components/GestureFullscreenController";
import { GestureZoomController } from "@/components/GestureZoomController";
import { useBackendGestureDetection } from "@/hooks/useBackendGestureDetection";
import sceneData from "@/data/sampleScene.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatMessage {
  actor: "kid" | "ai";
  text: string;
}

interface TopicExplainer {
  title: string;
  question?: string;
  answer: string;
  points: string[];
  tags: string[];
  imageSrc: string;
  imageAlt: string;
  wikipediaImageUrl?: string | null;
}

type BackendExplainer = {
  title?: string;
  summary?: string;
  points?: string[];
  wikipedia_keyword?: string;
  image_url?: string | null;
};

type ExplainerPollResponse = {
  job_id?: string;
  status?: "pending" | "ready" | "fallback" | string;
  explainer?: BackendExplainer | null;
  error?: string | null;
};

type Scene = {
  scene_id?: number;
  character?: "boy" | "girl" | "ben10" | "oggy";
  animation?: {
    action?: string;
    loop?: boolean;
  };
  dialogue?: {
    text?: string;
  };
  duration?: number;
};

type UILangCode =
  | "en"
  | "hi"
  | "bn"
  | "ta"
  | "te"
  | "mr"
  | "gu"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as"
  | "ur"
  | "kok"
  | "sa"
  | "ks";

const UI_LANGUAGE_LABELS: Record<UILangCode, string> = {
  en: "English",
  hi: "हिन्दी",
  bn: "বাংলা",
  ta: "தமிழ்",
  te: "తెలుగు",
  mr: "मराठी",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
  ur: "اردو",
  kok: "कोंकणी",
  sa: "संस्कृत",
  ks: "کٲشُر",
};

const UI_STRINGS: Record<UILangCode, Record<string, string>> = {
  en: {
    settings: "Settings",
    uiLanguage: "UI Language",
    character: "Character",
    login: "Login",
    backToHome: "Back to Home",
    welcomeSubtitle: "Welcome! Tap the microphone to start learning! 🎤",
    processingQuestion: "Processing your question...",
    sendingToKidzGPT: "Sending to KIDZ-GPT...",
    readyNext: "Ready for your next question!",
    oopsDifferent: "Oops! Please try a different question.",
    chatEmpty: "💬 Chat will appear here!",
    youLabel: "🎤 You",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "Ready to listen!",
    somethingWrong: "Something went wrong. Try again!",
    noAudio: "No audio recorded. Please try again.",
  },
  hi: {
    settings: "सेटिंग्स",
    uiLanguage: "ऐप की भाषा",
    character: "किरदार",
    login: "लॉगिन",
    backToHome: "होम पर वापस",
    welcomeSubtitle: "स्वागत है! सीखना शुरू करने के लिए माइक्रोफोन दबाएँ! 🎤",
    processingQuestion: "आपका सवाल प्रोसेस हो रहा है...",
    sendingToKidzGPT: "KIDZ-GPT को भेज रहे हैं...",
    readyNext: "अगले सवाल के लिए तैयार!",
    oopsDifferent: "ओह! कृपया कोई दूसरा सवाल पूछें।",
    chatEmpty: "💬 चैट यहाँ दिखेगी!",
    youLabel: "🎤 आप",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "सुनने के लिए तैयार!",
    somethingWrong: "कुछ गलत हो गया। फिर से कोशिश करें!",
    noAudio: "कोई ऑडियो रिकॉर्ड नहीं हुआ। फिर से कोशिश करें।",
  },
  bn: {
    settings: "সেটিংস",
    uiLanguage: "অ্যাপের ভাষা",
    character: "চরিত্র",
    login: "লগইন",
    backToHome: "হোমে ফিরে যান",
    welcomeSubtitle: "স্বাগতম! শেখা শুরু করতে মাইক্রোফোন ট্যাপ করুন! 🎤",
    processingQuestion: "আপনার প্রশ্ন প্রসেস করা হচ্ছে...",
    sendingToKidzGPT: "KIDZ-GPT-এ পাঠানো হচ্ছে...",
    readyNext: "পরের প্রশ্নের জন্য প্রস্তুত!",
    oopsDifferent: "উফ! দয়া করে অন্য প্রশ্ন করুন।",
    chatEmpty: "💬 চ্যাট এখানে দেখাবে!",
    youLabel: "🎤 আপনি",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "শোনার জন্য প্রস্তুত!",
    somethingWrong: "কিছু ভুল হয়েছে। আবার চেষ্টা করুন!",
    noAudio: "কোনও অডিও রেকর্ড হয়নি। আবার চেষ্টা করুন।",
  },
  ta: {
    settings: "அமைப்புகள்",
    uiLanguage: "செயலி மொழி",
    character: "பாத்திரம்",
    login: "உள்நுழை",
    backToHome: "முகப்புக்கு திரும்ப",
    welcomeSubtitle: "வரவேற்கிறோம்! கற்றலைத் தொடங்க மைக்ரோஃபோனைத் தட்டுங்கள்! 🎤",
    processingQuestion: "உங்கள் கேள்வி செயலாக்கப்படுகிறது...",
    sendingToKidzGPT: "KIDZ-GPT-க்கு அனுப்பப்படுகிறது...",
    readyNext: "அடுத்த கேள்விக்குத் தயாராக!",
    oopsDifferent: "அய்யோ! வேறு கேள்வியை முயற்சிக்கவும்.",
    chatEmpty: "💬 அரட்டை இங்கே தோன்றும்!",
    youLabel: "🎤 நீங்கள்",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "கேட்கத் தயாராக!",
    somethingWrong: "ஏதோ தவறு. மீண்டும் முயற்சிக்கவும்!",
    noAudio: "ஆடியோ பதிவு செய்யப்படவில்லை. மீண்டும் முயற்சிக்கவும்.",
  },
  te: {
    settings: "సెట్టింగ్స్",
    uiLanguage: "యాప్ భాష",
    character: "పాత్ర",
    login: "లాగిన్",
    backToHome: "హోమ్‌కు తిరుగు",
    welcomeSubtitle: "స్వాగతం! నేర్చుకోవడానికి మైక్ నొక్కండి! 🎤",
    processingQuestion: "మీ ప్రశ్నను ప్రాసెస్ చేస్తున్నాం...",
    sendingToKidzGPT: "KIDZ-GPT‌కు పంపుతున్నాం...",
    readyNext: "తదుపరి ప్రశ్నకు సిద్ధం!",
    oopsDifferent: "అయ్యో! దయచేసి మరో ప్రశ్న అడగండి.",
    chatEmpty: "💬 చాట్ ఇక్కడ కనిపిస్తుంది!",
    youLabel: "🎤 మీరు",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "వినేందుకు సిద్ధం!",
    somethingWrong: "ఏదో తప్పు జరిగింది. మళ్లీ ప్రయత్నించండి!",
    noAudio: "ఆడియో రికార్డు కాలేదు. మళ్లీ ప్రయత్నించండి.",
  },
  mr: {
    settings: "सेटिंग्स",
    uiLanguage: "अॅपची भाषा",
    character: "पात्र",
    login: "लॉगिन",
    backToHome: "होमला परत",
    welcomeSubtitle: "स्वागत आहे! शिकायला सुरू करण्यासाठी माईक टॅप करा! 🎤",
    processingQuestion: "तुमचा प्रश्न प्रक्रिया होत आहे...",
    sendingToKidzGPT: "KIDZ-GPT ला पाठवत आहोत...",
    readyNext: "पुढच्या प्रश्नासाठी तयार!",
    oopsDifferent: "अरे! कृपया दुसरा प्रश्न विचारा.",
    chatEmpty: "💬 चॅट इथे दिसेल!",
    youLabel: "🎤 तुम्ही",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "ऐकण्यासाठी तयार!",
    somethingWrong: "काहीतरी चूक झाली. पुन्हा प्रयत्न करा!",
    noAudio: "ऑडिओ रेकॉर्ड झाला नाही. पुन्हा प्रयत्न करा.",
  },
  gu: {
    settings: "સેટિંગ્સ",
    uiLanguage: "એપની ભાષા",
    character: "પાત્ર",
    login: "લૉગિન",
    backToHome: "હોમ પર પાછા",
    welcomeSubtitle: "સ્વાગત છે! શીખવાનું શરૂ કરવા માઇક્રોફોન ટૅપ કરો! 🎤",
    processingQuestion: "તમારો પ્રશ્ન પ્રોસેસ થઈ રહ્યો છે...",
    sendingToKidzGPT: "KIDZ-GPT ને મોકલી રહ્યા છીએ...",
    readyNext: "આગળના પ્રશ્ન માટે તૈયાર!",
    oopsDifferent: "અરે! કૃપા કરીને બીજો પ્રશ્ન કરો.",
    chatEmpty: "💬 ચેટ અહીં દેખાશે!",
    youLabel: "🎤 તમે",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "સાંભળવા માટે તૈયાર!",
    somethingWrong: "કંઈક ખોટું થયું. ફરી પ્રયાસ કરો!",
    noAudio: "કોઈ ઓડિયો રેકોર્ડ થયો નથી. ફરી પ્રયાસ કરો.",
  },
  kn: {
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    uiLanguage: "ಅಪ್ ಭಾಷೆ",
    character: "ಪಾತ್ರ",
    login: "ಲಾಗಿನ್",
    backToHome: "ಮುಖಪುಟಕ್ಕೆ ಮರಳಿ",
    welcomeSubtitle: "ಸ್ವಾಗತ! ಕಲಿಸಲು ಮೈಕ್‌ ಅನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ! 🎤",
    processingQuestion: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...",
    sendingToKidzGPT: "KIDZ-GPT ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
    readyNext: "ಮುಂದಿನ ಪ್ರಶ್ನೆಗೆ ಸಿದ್ಧ!",
    oopsDifferent: "ಅಯ್ಯೋ! ದಯವಿಟ್ಟು ಬೇರೆ ಪ್ರಶ್ನೆ ಕೇಳಿ.",
    chatEmpty: "💬 ಚಾಟ್ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ!",
    youLabel: "🎤 ನೀವು",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "ಕೇಳಲು ಸಿದ್ಧ!",
    somethingWrong: "ಏನೋ ತಪ್ಪಾಗಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ!",
    noAudio: "ಯಾವುದೇ ಆಡಿಯೋ ದಾಖಲಾಗಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  ml: {
    settings: "സെറ്റിംഗ്സ്",
    uiLanguage: "ആപ്പ് ഭാഷ",
    character: "കഥാപാത്രം",
    login: "ലോഗിൻ",
    backToHome: "ഹോമിലേക്ക് മടങ്ങുക",
    welcomeSubtitle: "സ്വാഗതം! പഠനം ആരംഭിക്കാൻ മൈക്ക് ടാപ്പ് ചെയ്യൂ! 🎤",
    processingQuestion: "നിങ്ങളുടെ ചോദ്യം പ്രോസസ് ചെയ്യുന്നു...",
    sendingToKidzGPT: "KIDZ-GPT-ലേക്ക് അയക്കുന്നു...",
    readyNext: "അടുത്ത ചോദ്യത്തിന് തയ്യാറാണ്!",
    oopsDifferent: "അയ്യോ! മറ്റൊരു ചോദ്യം ശ്രമിക്കൂ.",
    chatEmpty: "💬 ചാറ്റ് ഇവിടെ കാണിക്കും!",
    youLabel: "🎤 നിങ്ങൾ",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "കേൾക്കാൻ തയ്യാറാണ്!",
    somethingWrong: "എന്തോ പിഴവുണ്ട്. വീണ്ടും ശ്രമിക്കുക!",
    noAudio: "ഓഡിയോ റെക്കോർഡ് ചെയ്തില്ല. വീണ്ടും ശ്രമിക്കുക.",
  },
  pa: {
    settings: "ਸੈਟਿੰਗਜ਼",
    uiLanguage: "ਐਪ ਦੀ ਭਾਸ਼ਾ",
    character: "ਕਿਰਦਾਰ",
    login: "ਲਾਗਇਨ",
    backToHome: "ਹੋਮ ਵਾਪਸ",
    welcomeSubtitle: "ਜੀ ਆਇਆਂ ਨੂੰ! ਸਿੱਖਣਾ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਮਾਈਕ ਟੈਪ ਕਰੋ! 🎤",
    processingQuestion: "ਤੁਹਾਡਾ ਸਵਾਲ ਪ੍ਰੋਸੈਸ ਹੋ ਰਿਹਾ ਹੈ...",
    sendingToKidzGPT: "KIDZ-GPT ਨੂੰ ਭੇਜਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
    readyNext: "ਅਗਲੇ ਸਵਾਲ ਲਈ ਤਿਆਰ!",
    oopsDifferent: "ਓਹੋ! ਕਿਰਪਾ ਕਰਕੇ ਹੋਰ ਸਵਾਲ ਪੁੱਛੋ।",
    chatEmpty: "💬 ਚੈਟ ਇੱਥੇ ਦਿਖੇਗੀ!",
    youLabel: "🎤 ਤੁਸੀਂ",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "ਸੁਣਨ ਲਈ ਤਿਆਰ!",
    somethingWrong: "ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ!",
    noAudio: "ਕੋਈ ਆਡੀਓ ਰਿਕਾਰਡ ਨਹੀਂ ਹੋਈ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
  },
  or: {
    settings: "ସେଟିଂସ୍",
    uiLanguage: "ଆପ୍ ଭାଷା",
    character: "ଚରିତ୍ର",
    login: "ଲଗଇନ୍",
    backToHome: "ହୋମକୁ ଫେରନ୍ତୁ",
    welcomeSubtitle: "ସ୍ବାଗତ! ଶିଖିବାକୁ ଆରମ୍ଭ କରିବା ପାଇଁ ମାଇକ୍ ଟ୍ୟାପ୍ କରନ୍ତୁ! 🎤",
    processingQuestion: "ଆପଣଙ୍କ ପ୍ରଶ୍ନ ପ୍ରୋସେସ୍ ହେଉଛି...",
    sendingToKidzGPT: "KIDZ-GPT କୁ ପଠାଯାଉଛି...",
    readyNext: "ପରବର୍ତ୍ତୀ ପ୍ରଶ୍ନ ପାଇଁ ପ୍ରସ୍ତୁତ!",
    oopsDifferent: "ଓହ୍! ଦୟାକରି ଅନ୍ୟ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ।",
    chatEmpty: "💬 ଚାଟ୍ ଏଠାରେ ଦେଖାଯିବ!",
    youLabel: "🎤 ଆପଣ",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "ଶୁଣିବାକୁ ପ୍ରସ୍ତୁତ!",
    somethingWrong: "କିଛି ଭୁଲ ହେଲା। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ!",
    noAudio: "କୌଣସି ଅଡିଓ ରେକର୍ଡ ହୋଇନାହିଁ। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
  },
  as: {
    settings: "ছেটিংছ",
    uiLanguage: "এপৰ ভাষা",
    character: "চৰিত্ৰ",
    login: "লগইন",
    backToHome: "হোমলৈ ঘূৰি যাওক",
    welcomeSubtitle: "স্বাগতম! শিকিবলৈ মাইকৰফোন টেপ কৰক! 🎤",
    processingQuestion: "আপোনাৰ প্ৰশ্ন প্ৰচেছ কৰা হৈছে...",
    sendingToKidzGPT: "KIDZ-GPT লৈ পঠাই আছে...",
    readyNext: "পৰৱৰ্তী প্ৰশ্নৰ বাবে সাজু!",
    oopsDifferent: "অʼ! অনুগ্ৰহ কৰি অন্য প্ৰশ্ন সোধক।",
    chatEmpty: "💬 চেট ইয়াত দেখা যাব!",
    youLabel: "🎤 আপুনি",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "শুনিবলৈ সাজু!",
    somethingWrong: "কিবা ভুল হ'ল। আকৌ চেষ্টা কৰক!",
    noAudio: "কোনো অডিঅ’ ৰেকৰ্ড হোৱা নাই। আকৌ চেষ্টা কৰক।",
  },
  ur: {
    settings: "سیٹنگز",
    uiLanguage: "ایپ کی زبان",
    character: "کردار",
    login: "لاگ اِن",
    backToHome: "ہوم پر واپس",
    welcomeSubtitle: "خوش آمدید! سیکھنا شروع کرنے کے لیے مائیکروفون دبائیں! 🎤",
    processingQuestion: "آپ کا سوال پروسیس ہو رہا ہے...",
    sendingToKidzGPT: "KIDZ-GPT کو بھیجا جا رہا ہے...",
    readyNext: "اگلے سوال کے لیے تیار!",
    oopsDifferent: "اوہ! براہِ کرم کوئی دوسرا سوال کریں۔",
    chatEmpty: "💬 چیٹ یہاں دکھے گی!",
    youLabel: "🎤 آپ",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "سننے کے لیے تیار!",
    somethingWrong: "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں!",
    noAudio: "کوئی آڈیو ریکارڈ نہیں ہوئی۔ دوبارہ کوشش کریں۔",
  },
  kok: {
    settings: "सेटिंग्स",
    uiLanguage: "ॲप भाशा",
    character: "पात्र",
    login: "लॉगिन",
    backToHome: "होमाक परत",
    welcomeSubtitle: "स्वागत! शिकपाक सुरू करपाक मायक टॅप करात! 🎤",
    processingQuestion: "तुमचो प्रश्न प्रोसेस जातलो...",
    sendingToKidzGPT: "KIDZ-GPT कडे धाडता...",
    readyNext: "फुडल्या प्रश्नाक तयार!",
    oopsDifferent: "अरे! दुसरो प्रश्न विचारात.",
    chatEmpty: "💬 चॅट हांगा दिसतली!",
    youLabel: "🎤 तुमी",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "आयकपाक तयार!",
    somethingWrong: "काय तरी चूक जाली. परत प्रयत्न करात!",
    noAudio: "ऑडिओ रेकॉर्ड जाला ना. परत प्रयत्न करात.",
  },
  sa: {
    settings: "विन्यासाः",
    uiLanguage: "अनुप्रयोगस्य भाषा",
    character: "पात्रम्",
    login: "प्रवेशः",
    backToHome: "गृहं प्रति",
    welcomeSubtitle: "स्वागतम्! अध्ययनम् आरभ्यताम् — माइक्रोफोनं स्पृशत! 🎤",
    processingQuestion: "भवतः प्रश्नः प्रक्रियते...",
    sendingToKidzGPT: "KIDZ-GPT प्रति प्रेष्यते...",
    readyNext: "अग्रिमप्रश्नाय सिद्धम्!",
    oopsDifferent: "ओह्! कृपया अन्यः प्रश्नः पृच्छ्यताम्।",
    chatEmpty: "💬 वार्तालापः अत्र दृश्यते!",
    youLabel: "🎤 भवन्तः",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "श्रवणाय सिद्धम्!",
    somethingWrong: "किञ्चित् त्रुटिः। पुनः प्रयत्नं कुरुत!",
    noAudio: "श्रव्यं न अभिलेखितम्। पुनः प्रयत्नं कुरुत।",
  },
  ks: {
    settings: "سیٹِنگس",
    uiLanguage: "ایپ زَبان",
    character: "کردار",
    login: "لاگ اِن",
    backToHome: "ہوم واپس",
    welcomeSubtitle: "خوش آمدید! سیکھنے کے لیے مائیکروفون ٹَیپ کرو! 🎤",
    processingQuestion: "تُہند سوال پروسیس گَژھان...",
    sendingToKidzGPT: "KIDZ-GPT کُن بھیج گَژھان...",
    readyNext: "اگلے سوال خٲطرٕ تیار!",
    oopsDifferent: "اوہ! مہربانی کرِتھ اَکھ بیٚی سوال پُچھو۔",
    chatEmpty: "💬 چیٹ یِتھ ہُندہ دکھنُک!",
    youLabel: "🎤 تُہند",
    kidzgptLabel: "🤖 KidzGPT",
    readyToListen: "سُننہٕ خٲطرٕ تیار!",
    somethingWrong: "کینہہ غلط گٔیو۔ دوبارہ کوشش کرو!",
    noAudio: "آڈیو ریکارڈ نہٕ بٔیو۔ دوبارہ کوشش کرو۔",
  },
};

const normalizeTo3DScenes = (input: any): Scene[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((s, idx): Scene => {
      const dialogueText =
        (s?.dialogue && typeof s.dialogue === "object" ? s.dialogue.text : undefined) ||
        (typeof s?.dialogue === "string" ? s.dialogue : undefined) ||
        (typeof s?.text === "string" ? s.text : undefined) ||
        "";

      return {
        scene_id: s?.scene_id ?? s?.scene ?? idx + 1,
        character:
          s?.character === "girl"
            ? "girl"
            : s?.character === "boy"
              ? "boy"
              : s?.character === "ben10"
                ? "ben10"
                : s?.character === "oggy"
                  ? "oggy"
                : undefined,
        animation: {
          action: s?.animation?.action ?? "neutral",
          loop: s?.animation?.loop ?? true,
        },
        dialogue: { text: dialogueText },
        duration: Number(s?.duration ?? 4),
      };
    })
    .filter((s) => Boolean((s.dialogue?.text || "").trim()));
};

export default function Home() {
  const [, setLocation] = useLocation();

  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("Welcome! Tap the microphone to start learning! 🎤");
  const [liveTranscript, setLiveTranscript] = useState<string>("");

  const getInitialUiLanguage = (): UILangCode => {
    try {
      const raw = localStorage.getItem("kidzgpt-ui-language") || "en";
      const normalized = String(raw).trim().toLowerCase();
      if (normalized in UI_LANGUAGE_LABELS) return normalized as UILangCode;
    } catch {
      // ignore
    }
    return "en";
  };

  // UI language controls page text only; it does NOT control voice input/output.
  const [uiLanguage, setUiLanguage] = useState<UILangCode>(() => getInitialUiLanguage());

  // Voice/request language used for STT/TTS; defaults to auto-detect.
  const [language, setLanguage] = useState<string>("auto");

  // Translation helper for UI strings (depends on uiLanguage).
  const t = (key: string) => UI_STRINGS[uiLanguage]?.[key] ?? UI_STRINGS.en[key] ?? key;

  const [character, setCharacter] = useState<"boy" | "girl" | "ben10" | "oggy">(() => {
    const saved = localStorage.getItem("kidzgpt-character");
    return saved === "boy" || saved === "girl" || saved === "ben10" || saved === "oggy"
      ? (saved as "boy" | "girl" | "ben10" | "oggy")
      : "ben10";
  });

  const getInitialPresetVideoSpeed = (): number => {
    try {
      const raw = localStorage.getItem("kidzgpt-preset-video-speed") || "1";
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return 1;
      // Clamp to a reasonable range.
      return Math.max(0.5, Math.min(2, parsed));
    } catch {
      return 1;
    }
  };

  const [presetVideoSpeed, setPresetVideoSpeed] = useState<number>(() => getInitialPresetVideoSpeed());

  // Class selection state
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem("kidzgpt-class") || "";
  });
  const [showClassModal, setShowClassModal] = useState(false);

  const classOptions = ["Nursery", "Kindergarten", "1", "2", "3", "4", "5"];

  const handleClassSelect = (classLevel: string) => {
    setSelectedClass(classLevel);
    localStorage.setItem("kidzgpt-class", classLevel);
    setShowClassModal(false);
  };

  const [speakingDialogueIndex, setSpeakingDialogueIndex] = useState<number | null>(null);
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  
  // Preloaded video understanding check state
  const [currentPreloadedKeyword, setCurrentPreloadedKeyword] = useState<string | null>(null);
  const [showUnderstandingCheck, setShowUnderstandingCheck] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [bodyPartsVideoVersion, setBodyPartsVideoVersion] = useState(1); // Track which version of body-parts video to play
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  
  // Voice settings for browser TTS - clear, professional male voice
  const [voiceSettings] = useState({
    pitch: 0.9,  // Slightly lower pitch tends to sound more masculine (0-2)
    rate: 0.95,   // Slightly faster than before, but still very clear and professional (0.1-10)
    volume: 1.0,  // Max volume for clarity
    preferFemale: true
  });

  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const topicExplainerRef = useRef<HTMLDivElement>(null);
  const explainerScrollPendingRef = useRef<boolean>(false);
  const speechRecognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const liveTranscriptRef = useRef<string>("");
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const stopResponseRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const processAbortControllerRef = useRef<AbortController | null>(null);
  const lastScenesRef = useRef<Scene[]>(sceneData.scenes);
  const specialVideoRef = useRef<HTMLVideoElement | null>(null);
  const specialVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoGestureLastApplyAtRef = useRef<number>(0);

  // Keyword to preloaded video mapping
  const videoKeywordMap: Record<string, string> = {
    "body parts": "/assets/preloaded/body-parts.mp4",
    "body part": "/assets/preloaded/body-parts.mp4",
    "skin": "/assets/preloaded/body-parts.mp4",
    "muscle": "/assets/preloaded/body-parts.mp4",
    "bone": "/assets/preloaded/body-parts.mp4",
    "organs": "/assets/preloaded/body-parts.mp4",
    "skeleton": "/assets/preloaded/body-parts.mp4",
    "anatomy": "/assets/preloaded/body-parts.mp4",
    
    "animals": "/assets/preloaded/animals.mp4",
    "animal": "/assets/preloaded/animals.mp4",
    "lion": "/assets/preloaded/animals.mp4",
    "tiger": "/assets/preloaded/animals.mp4",
    "elephant": "/assets/preloaded/animals.mp4",
    "zebra": "/assets/preloaded/animals.mp4",
    "giraffe": "/assets/preloaded/animals.mp4",
    "wildlife": "/assets/preloaded/animals.mp4",
    
    "earth": "/assets/preloaded/earth.mp4",
    "planet": "/assets/preloaded/earth.mp4",
    "world": "/assets/preloaded/earth.mp4",
    "globe": "/assets/preloaded/earth.mp4",
    "geography": "/assets/preloaded/earth.mp4",
    
    "sense organs": "/assets/preloaded/senseorgans.mp4",
    "5 senses": "/assets/preloaded/senseorgans.mp4",
    "5 sense organs": "/assets/preloaded/senseorgans.mp4",
    "sense organ": "/assets/preloaded/senseorgans.mp4",
    "eye": "/assets/preloaded/senseorgans.mp4",
    "ear": "/assets/preloaded/senseorgans.mp4",
    "nose": "/assets/preloaded/senseorgans.mp4",
    "tongue": "/assets/preloaded/senseorgans.mp4",
    "sight": "/assets/preloaded/senseorgans.mp4",
    "hearing": "/assets/preloaded/senseorgans.mp4",
    "smell": "/assets/preloaded/senseorgans.mp4",
    "taste": "/assets/preloaded/senseorgans.mp4",
    "touch": "/assets/preloaded/senseorgans.mp4",
    
    "vegetables": "/assets/preloaded/vegetables.mp4",
    "vegetable": "/assets/preloaded/vegetables.mp4",
    "carrot": "/assets/preloaded/vegetables.mp4",
    "broccoli": "/assets/preloaded/vegetables.mp4",
    "cucumber": "/assets/preloaded/vegetables.mp4",
    "spinach": "/assets/preloaded/vegetables.mp4",
    "tomato": "/assets/preloaded/vegetables.mp4",
    "pumpkin": "/assets/preloaded/vegetables.mp4",
  };

  // Function to check if any keyword matches the text
  const getPreloadedVideoUrl = (text: string, videoVersion: number = 1): { url: string; keyword: string } | null => {
    const lowerText = (text || "").toLowerCase().trim();
    
    // Check multi-word keywords first (longer matches have priority)
    const multiWordKeywords = Object.keys(videoKeywordMap)
      .filter(k => k.includes(" "))
      .sort((a, b) => b.length - a.length);
    
    for (const keyword of multiWordKeywords) {
      if (lowerText.includes(keyword)) {
        console.log(`🎬 Preloaded video matched for keyword: "${keyword}"`);
        
        // For body parts, alternate between body-parts.mp4 and body-parts2.mp4
        let videoUrl = videoKeywordMap[keyword];
        if (keyword.includes("body") && videoVersion === 2) {
          videoUrl = "/assets/preloaded/body-parts2.mp4";
          console.log(`🎬 Using alternate video (version 2): body-parts2.mp4`);
        }
        
        return { url: videoUrl, keyword };
      }
    }
    
    // Then check single-word keywords
    const singleWordKeywords = Object.keys(videoKeywordMap)
      .filter(k => !k.includes(" "))
      .sort((a, b) => b.length - a.length);
    
    for (const keyword of singleWordKeywords) {
      if (lowerText.includes(keyword)) {
        console.log(`🎬 Preloaded video matched for keyword: "${keyword}"`);
        
        // For body parts, alternate between body-parts.mp4 and body-parts2.mp4
        let videoUrl = videoKeywordMap[keyword];
        if (keyword === "skin" || keyword === "body" || keyword === "bone" || keyword === "skeleton" || keyword === "organs" || keyword === "anatomy") {
          if (videoVersion === 2) {
            videoUrl = "/assets/preloaded/body-parts2.mp4";
            console.log(`🎬 Using alternate video (version 2): body-parts2.mp4`);
          }
        }
        
        return { url: videoUrl, keyword };
      }
    }
    
    return null;
  };

  const [topicExplainer, setTopicExplainer] = useState<TopicExplainer>({
    title: "",
    question: undefined,
    answer: "",
    points: [],
    tags: [],
    imageSrc: "",
    imageAlt: "",
  });
  const [hasExplainer, setHasExplainer] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const chatLenRef = useRef<number>(0);

  useEffect(() => {
    chatLenRef.current = chatHistory.length;
  }, [chatHistory.length]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  useEffect(() => {
    localStorage.setItem("kidzgpt-character", character);
  }, [character]);

  // Persist and apply preset-video playback speed.
  useEffect(() => {
    try {
      localStorage.setItem("kidzgpt-preset-video-speed", String(presetVideoSpeed));
    } catch {
      // ignore
    }

    if (specialVideoRef.current) {
      try {
        specialVideoRef.current.playbackRate = presetVideoSpeed;
      } catch {
        // ignore
      }
    }
  }, [presetVideoSpeed]);

  // Show class selection modal on first load if no class selected
  useEffect(() => {
    if (!selectedClass) {
      const timer = setTimeout(() => {
        setShowClassModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedClass]);

  useEffect(() => {
    try {
      localStorage.setItem("kidzgpt-ui-language", uiLanguage);
    } catch {
      // ignore
    }

    // Keep the initial subtitle aligned to UI language when the session is idle.
    if (chatHistory.length === 0 && !isListening && !isProcessing) {
      setCurrentSubtitle(t("welcomeSubtitle"));
    }
  }, [uiLanguage]);

  useEffect(() => {
    // Keep the transcript visible at the bottom while it's updating.
    // Use 'nearest' to avoid scrolling the whole page
    if (!chatEndRef.current) return;
    if (!isListening && !isProcessing) return;
    if (!liveTranscript) return;
    const id = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }, 50);
    return () => clearTimeout(id);
  }, [liveTranscript, isListening, isProcessing]);
  const [specialVideo, setSpecialVideo] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>(sceneData.scenes);
  const [isSceneActive, setIsSceneActive] = useState(false);
  const [isScenePlaying, setIsScenePlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [isReplayRunning, setIsReplayRunning] = useState(false);
  const [currentBackground, setCurrentBackground] = useState<"back.jpeg" | "back2.jpeg">("back.jpeg");
  const [cameraZoom, setCameraZoom] = useState(1);

  useEffect(() => {
    if (!hasExplainer) return;
    if (isSceneActive) return;
    if (!explainerScrollPendingRef.current) return;
    explainerScrollPendingRef.current = false;
    setTimeout(() => {
      topicExplainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, [hasExplainer, isSceneActive]);


  // Removed auto-scroll on chat history changes to prevent unwanted scrolling during use

  const toSpeechLangTag = (lang: string): string => {
    const normalized = (lang || "").trim();
    if (!normalized || normalized.toLowerCase() === "auto") return "en-IN";

    // Backend may return ISO-639 like "en", "hi"; the Web Speech API prefers BCP-47.
    const lower = normalized.toLowerCase();
    if (lower === "en") return "en-IN";
    if (lower === "hi") return "hi-IN";
    if (lower === "bn") return "bn-IN";
    if (lower === "ta") return "ta-IN";
    if (lower === "te") return "te-IN";

    // If it's already a BCP-47-ish tag (en-IN), keep it.
    if (normalized.includes("-")) return normalized;

    return `${normalized}-IN`;
  };

  const handleBackendResult = async (data: any, languageAtRequest: string) => {
    try {
      // Handle error responses from backend
      if (data?.error) {
        setError(data.message || data.error);
        setCurrentSubtitle("Oops! Please try a different question.");
        setIsProcessing(false);
        return;
      }

    // Use backend-detected language (from Whisper) for everything
    // This ensures responses and TTS match the input language
    let detectedLanguage: string = data?.language || languageAtRequest;

    // Normalize language code (backend often returns ISO-639 like "hi")
    if (detectedLanguage && detectedLanguage !== "auto" && detectedLanguage !== "unknown") {
      const baseLang = detectedLanguage.split("-")[0].toLowerCase();
      const langMap: Record<string, string> = {
        hi: "hi-IN",
        bn: "bn-IN",
        ta: "ta-IN",
        te: "te-IN",
        en: "en-IN",
      };

      detectedLanguage = langMap[baseLang] || toSpeechLangTag(detectedLanguage);
      setLanguage(detectedLanguage);
      console.log(`🌐 Language detected: ${String(data?.language)} → Using: ${detectedLanguage} for responses and TTS`);
    } else {
      detectedLanguage = languageAtRequest === "auto" ? "en-IN" : languageAtRequest;
    }

    const ttsLanguage = detectedLanguage;

    const normalizeDialogueKey = (input: string) =>
      String(input || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    // Add user message first
    const originalText = typeof data?.original_text === "string" ? data.original_text.trim() : "";
    // Check for preloaded video match based on keywords in the user prompt
    const matchedVideo = getPreloadedVideoUrl(originalText, 1); // Always start with version 1 for new questions
    if (matchedVideo) {
      setSpecialVideo(matchedVideo.url);
      setCurrentPreloadedKeyword(matchedVideo.keyword);
      setBodyPartsVideoVersion(1); // Reset to version 1 for new questions
      // console.log(`🎬 Preloaded video activated: ${matchedVideo.url}`);
    } else {
      setSpecialVideo(null);
      setCurrentPreloadedKeyword(null);
    }

    if (originalText) {
      setChatHistory((prev) => [...prev, { actor: "kid", text: originalText }]);
      chatLenRef.current += 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    // Clear any live transcript once the backend transcription arrives.
    setLiveTranscript("");

    // Backend response has arrived; drop processing state so animation resumes and preloader hides.
    setIsProcessing(false);
    
    // Reset video completion state for new question
    setVideoCompleted(false);

    // Toggle background image for variety
    setCurrentBackground((prev) => (prev === "back.jpeg" ? "back2.jpeg" : "back.jpeg"));

    // Start explainer processing/polling immediately (while animation plays)
    const rawTopic = data?.intent?.topic || data?.topic || "";
    const initialBackendExplainer: BackendExplainer | null =
      (data?.explainer as BackendExplainer) ||
      (data?.explanation as BackendExplainer) ||
      null;
    const jobId = typeof data?.job_id === "string" ? data.job_id : "";
    const explainerPromise = jobId ? pollExplainer(jobId) : Promise.resolve(initialBackendExplainer);

    // Process scenes sequentially
    const incoming3D =
      (data?.animation_scenes && Array.isArray(data.animation_scenes)
        ? data.animation_scenes
        : null) || (data?.scenes && Array.isArray(data.scenes) ? data.scenes : null);

    const normalizedScenes = normalizeTo3DScenes(incoming3D);
    const resolvedScenes =
      normalizedScenes.length > 0
        ? normalizedScenes.map((s) => ({
            ...s,
            // Always honor the user's current character selection for playback.
            character,
          }))
        : [];

    if (resolvedScenes.length > 0) {
      lastScenesRef.current = resolvedScenes;
      // Keep TTS enabled even during preset videos; the video is muted and
      // the "Did you understand it?" overlay is shown only after TTS finishes.
      await playScenesWithSpeech(resolvedScenes, ttsLanguage, true, false);
    }

    // Update the topic explainer section (image + summary) and scroll to it
    try {
      const backendExplainer = (await withTimeout(explainerPromise, 8000)) || initialBackendExplainer;

      const nextExplainer = pickTopicExplainer({
        topic: rawTopic,
        question: data?.original_text,
        backendExplainer,
      });
      setHasExplainer(true);
      setTopicExplainer(nextExplainer);
      explainerScrollPendingRef.current = true;

      // Use the intent topic (from backend) for better Wikipedia image search
      // Pass both the topic and original query for fallback
      const imageUrl = await fetchTopicImage(
        data?.original_text || "",
        ttsLanguage,
        rawTopic  // Pass the extracted intent topic directly
      );
      if (imageUrl) {
        setTopicExplainer((prev) => ({
          ...prev,
          imageSrc: imageUrl,
          imageAlt: rawTopic || data?.original_text || prev.imageAlt,
        }));
      }
    } finally {
      // Leave scroll position untouched so users can manually navigate.
    }

      setCurrentSubtitle("Ready for your next question!");
    } finally {
      setIsProcessing(false);
    }
  };

  const toSpeechRecognitionLangTag = (lang: string): string => {
    const normalized = String(lang || "").trim();
    if (!normalized || normalized.toLowerCase() === "auto") return "en-IN";
    return toSpeechLangTag(normalized);
  };

  const startLiveTranscription = (): boolean => {
    if (typeof window === "undefined") return false;
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return false;

    try {
      // Stop any previous recognizer.
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.onresult = null;
          speechRecognitionRef.current.onend = null;
          speechRecognitionRef.current.onerror = null;
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
        speechRecognitionRef.current = null;
      }

      const recognizer = new SpeechRecognitionCtor();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = toSpeechRecognitionLangTag(language);

      recognizer.onresult = (event: any) => {
        // Rebuild the full transcript each time for stability.
        try {
          const results = event?.results;
          if (!results || typeof results.length !== "number") return;
          let full = "";
          for (let i = 0; i < results.length; i++) {
            const t = results[i]?.[0]?.transcript;
            if (typeof t === "string") full += t;
          }
          const next = full.trim();
          if (next) setLiveTranscript(next);
        } catch {
          // ignore
        }
      };

      // Some browsers auto-stop on pauses; restart while still listening.
      recognizer.onend = () => {
        if (!isListeningRef.current) return;
        try {
          recognizer.start();
        } catch {
          // ignore
        }
      };

      recognizer.onerror = () => {
        // Non-fatal: backend Whisper remains source-of-truth.
      };

      speechRecognitionRef.current = recognizer;
      recognizer.start();
      return true;
    } catch {
      return false;
    }
  };

  const stopLiveTranscription = () => {
    const recognizer = speechRecognitionRef.current;
    if (!recognizer) return;
    try {
      recognizer.onresult = null;
      recognizer.onend = null;
      recognizer.onerror = null;
      recognizer.stop();
    } catch {
      // ignore
    } finally {
      speechRecognitionRef.current = null;
    }
  };

  const stopSpeechNow = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    currentUtteranceRef.current = null;
    setIsSpeechActive(false);
  };

  const abortInFlightProcessing = () => {
    const controller = processAbortControllerRef.current;
    if (!controller) return;
    try {
      controller.abort();
    } catch {
      // ignore
    }
    processAbortControllerRef.current = null;
  };

  const getFullscreenElement = () => {
    if (typeof document === "undefined") return null;
    return (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement ||
      null
    );
  };

  const isPresetVideoFullscreenActive = () => {
    const container = specialVideoContainerRef.current;
    const fsEl = getFullscreenElement();
    if (!container || !fsEl) return false;
    return fsEl === container;
  };

  const requestPresetVideoFullscreen = async () => {
    const container = specialVideoContainerRef.current;
    if (!container) return;
    if (isPresetVideoFullscreenActive()) return;

    try {
      const anyEl = container as any;
      const fn = container.requestFullscreen || anyEl.webkitRequestFullscreen || anyEl.msRequestFullscreen;
      if (fn) await fn.call(container);
    } catch {
      // ignore
    }
  };

  const exitPresetVideoFullscreen = async () => {
    try {
      const fsEl = getFullscreenElement();
      if (!fsEl) return;
      if (!isPresetVideoFullscreenActive()) return;

      const anyDoc = document as any;
      const fn = document.exitFullscreen || anyDoc.webkitExitFullscreen || anyDoc.msExitFullscreen;
      if (fn) await fn.call(document);
    } catch {
      // ignore
    }
  };

  // Ensure we don't stay fullscreen if the preset video is cleared.
  useEffect(() => {
    if (specialVideo) return;
    void exitPresetVideoFullscreen();
  }, [specialVideo]);

  const handlePresetVideoGesture = useCallback(
    (result: any) => {
      const now = Date.now();
      if (now - videoGestureLastApplyAtRef.current < 180) return;
      videoGestureLastApplyAtRef.current = now;

      const gestureRaw = String(result?.gesture || "");
      const gestureNormalized = gestureRaw.trim().toLowerCase().replace(/[-\s]+/g, "_");
      const zoomAction = String(result?.zoom_action || "").trim().toLowerCase();

      // Backend sometimes maps open_palm -> zoom_out; treat zoom_out as open palm.
      const isOpenPalm = gestureNormalized.includes("open_palm") || zoomAction === "zoom_out";

      if (isOpenPalm) {
        void requestPresetVideoFullscreen();
      } else {
        void exitPresetVideoFullscreen();
      }
    },
    [requestPresetVideoFullscreen, exitPresetVideoFullscreen]
  );

  // Gesture fullscreen for preset videos while they're actively playing.
  useBackendGestureDetection({
    enabled: !!specialVideo && !isProcessing && !videoCompleted,
    onGestureDetected: handlePresetVideoGesture,
  });

  const scoreVoice = (voice: SpeechSynthesisVoice, langTag: string, preferFemale: boolean = true) => {
    const vLang = (voice.lang || "").toLowerCase();
    const wanted = (langTag || "").toLowerCase();
    const wantedPrimary = wanted.split("-")[0];

    let score = 0;
    
    // Language matching (highest priority)
    if (vLang === wanted) score += 200;
    if (wantedPrimary && vLang.startsWith(wantedPrimary)) score += 120;
    
    // If language doesn't match at all, heavily penalize
    if (wantedPrimary && !vLang.startsWith(wantedPrimary)) score -= 100;

    const name = (voice.name || "").toLowerCase();
    
    // FEMALE VOICE PREFERENCE (high priority for sweet, clear voice)
    if (preferFemale) {
      // Strong indicators of female voices
      if (name.includes("female") || name.includes("woman") || name.includes("girl")) score += 200;
      if (name.includes("zira") || name.includes("samantha") || name.includes("karen") || 
          name.includes("susan") || name.includes("linda") || name.includes("heather") ||
          name.includes("hazel") || name.includes("tessa") || name.includes("veena") ||
          name.includes("priya") || name.includes("neela") || name.includes("sophia") ||
          name.includes("olivia") || name.includes("emma") || name.includes("ava")
      ) score += 180;
      
      // Avoid male voices
      if (name.includes("male") || name.includes("man") || name.includes("boy") || name.includes("david") ||
          name.includes("mark") || name.includes("richard") || name.includes("james") ||
          name.includes("daniel") || name.includes("thomas") || name.includes("alex")) score -= 100;
    } else {
      // MALE VOICE PREFERENCE
      if (name.includes("male") || name.includes("man") || name.includes("boy")) score += 200;

      // Common male voice names across platforms
      if (
        name.includes("david") ||
        name.includes("mark") ||
        name.includes("george") ||
        name.includes("james") ||
        name.includes("daniel") ||
        name.includes("thomas") ||
        name.includes("alex") ||
        name.includes("ravi")
      ) {
        score += 180;
      }

      // De-prioritize common female voices
      if (name.includes("female") || name.includes("woman") || name.includes("girl")) score -= 120;
      if (
        name.includes("zira") ||
        name.includes("samantha") ||
        name.includes("karen") ||
        name.includes("susan") ||
        name.includes("linda") ||
        name.includes("heather") ||
        name.includes("hazel") ||
        name.includes("tessa") ||
        name.includes("veena") ||
        name.includes("priya") ||
        name.includes("neela") ||
        name.includes("sophia") ||
        name.includes("olivia") ||
        name.includes("emma") ||
        name.includes("ava")
      ) {
        score -= 100;
      }
    }

    // HIGH-QUALITY VOICE INDICATORS (professional, clear)
    if (name.includes("neural")) score += 80;  // Neural voices are usually high quality
    if (name.includes("natural")) score += 70;
    if (name.includes("premium")) score += 60;
    if (name.includes("enhanced")) score += 55;
    if (name.includes("hd")) score += 50;
    if (name.includes("crystal") || name.includes("clear")) score += 45;
    
    // Platform-specific high-quality voices
    if (name.includes("google") && (name.includes("neural") || name.includes("wavenet"))) score += 90;
    if (name.includes("microsoft") && (name.includes("neural") || name.includes("zira"))) score += 85;
    if (name.includes("amazon") && name.includes("neural")) score += 85;
    if (name.includes("apple") && (name.includes("samantha") || name.includes("karen"))) score += 80;
    
    // Language-specific high-quality voices
    if (wantedPrimary === "hi" && (name.includes("hi") || name.includes("hindi"))) {
      if (name.includes("neural") || name.includes("premium")) score += 100;
    }
    if (wantedPrimary === "bn" && (name.includes("bn") || name.includes("bengali"))) {
      if (name.includes("neural") || name.includes("premium")) score += 100;
    }
    if (wantedPrimary === "ta" && (name.includes("ta") || name.includes("tamil"))) {
      if (name.includes("neural") || name.includes("premium")) score += 100;
    }
    if (wantedPrimary === "te" && (name.includes("te") || name.includes("telugu"))) {
      if (name.includes("neural") || name.includes("premium")) score += 100;
    }

    // AVOID low-quality voices
    if (name.includes("default") && !name.includes("neural")) score -= 50;
    if (name.includes("android") && !name.includes("neural")) score -= 40;
    if (name.includes("espeak")) score -= 100;  // Very robotic
    if (name.includes("system") && !name.includes("neural")) score -= 30;
    if (name.includes("basic")) score -= 40;
    if (name.includes("sapi")) score -= 20;  // Older SAPI voices

    // Some engines flag the default voice (small bonus, but prefer named voices)
    if ((voice as any).default && !name.includes("neural") && !name.includes("premium")) {
      score += 5;  // Very small bonus
    }

    return score;
  };

  const ensureVoicesReady = (): Promise<void> => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return Promise.resolve();
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Log available voices for debugging (only first time)
      if (!(window as any).__voicesLogged) {
        console.log(`🎙️ Available voices (${voices.length}):`, 
          voices.map(v => `${v.name} (${v.lang})`).slice(0, 10)
        );
        (window as any).__voicesLogged = true;
      }
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        const loadedVoices = window.speechSynthesis.getVoices();
        if (loadedVoices.length > 0 && !(window as any).__voicesLogged) {
          console.log(`🎙️ Available voices (${loadedVoices.length}):`, 
            loadedVoices.map(v => `${v.name} (${v.lang})`).slice(0, 10)
          );
          (window as any).__voicesLogged = true;
        }
        resolve();
      };

      window.speechSynthesis.addEventListener("voiceschanged", handler);
      // Safety timeout: resolve even if voices never load.
      setTimeout(() => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve();
      }, 1500);
    });
  };

  const speakText = async (text: string, lang: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!text || text.trim() === "") return;
    if (stopResponseRef.current) return;
    setIsSpeechActive(true);

    await ensureVoicesReady();

    const utterance = new SpeechSynthesisUtterance(text);
    const langTag = toSpeechLangTag(lang);
    utterance.lang = langTag;
    currentUtteranceRef.current = utterance;

    // Get all available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Filter voices that match the language (at least primary language)
    const langPrimary = langTag.split("-")[0]?.toLowerCase();
    const matchingVoices = voices.filter((v) => {
      const vLang = (v.lang || "").toLowerCase();
      return vLang.startsWith(langPrimary) || vLang === langTag;
    });

    // Score and select the best voice based on preferences
    const scoredVoices = (matchingVoices.length > 0 ? matchingVoices : voices)
      .filter((v) => !!v.lang)
      .map((v) => ({
        voice: v,
        score: scoreVoice(v, langTag, voiceSettings.preferFemale) // Use preference setting
      }))
      .sort((a, b) => b.score - a.score);

    const selectedVoice = scoredVoices[0]?.voice;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`🎤 Using voice: ${selectedVoice.name} (${selectedVoice.lang}) for language: ${langTag}`);
    } else {
      console.warn(`⚠️ No suitable voice found for ${langTag}, using default`);
    }

    // Apply voice settings
    const primary = langTag.split("-")[0]?.toLowerCase();
    
    utterance.volume = voiceSettings.volume;
    utterance.pitch = voiceSettings.pitch;
    
    // Adjust rate based on language for optimal clarity
    if (primary === "hi") {
      utterance.rate = Math.min(voiceSettings.rate, 0.88);  // Hindi: slightly slower for clarity
    } else if (primary === "bn" || primary === "ta" || primary === "te") {
      utterance.rate = Math.min(voiceSettings.rate, 0.90);  // Other Indian languages: clear pace
    } else {
      utterance.rate = voiceSettings.rate;  // Use setting for English
    }

    await new Promise<void>((resolve) => {
      utterance.onend = () => {
        if (currentUtteranceRef.current === utterance) {
          currentUtteranceRef.current = null;
        }
        console.log("✅ Speech completed");
        setIsSpeechActive(false);
        resolve();
      };
      utterance.onerror = (e) => {
        if (currentUtteranceRef.current === utterance) {
          currentUtteranceRef.current = null;
        }
        console.error("❌ Speech error:", e);
        setIsSpeechActive(false);
        resolve();  // Don't block on errors
      };

      // Cancel any ongoing speech before starting new one
      stopSpeechNow();

      // Small delay to ensure cancellation is processed
      setTimeout(() => {
        if (stopResponseRef.current) {
          resolve();
          return;
        }
        window.speechSynthesis.speak(utterance);
      }, 50);
    });
  };

  const playScenesWithSpeech = async (
    scenesToPlay: Scene[],
    ttsLanguage: string,
    addToChat: boolean,
    suppressSpeech: boolean = false,
  ) => {
    if (!scenesToPlay || scenesToPlay.length === 0 || stopResponseRef.current) {
      return;
    }
    const seenDialogues = new Set<string>();
    setScenes(scenesToPlay);
    setIsSceneActive(true);

    // Collect all unique dialogues for chat (combine into single message)
    const allDialogues: string[] = [];
    
    for (let i = 0; i < scenesToPlay.length; i++) {
      const scene = scenesToPlay[i];
      const dialogue = (scene.dialogue?.text || "").trim();
      if (!dialogue) {
        console.warn(`⚠️ Skipping scene ${i + 1}: empty dialogue`);
        continue;
      }

      const dialogueKey = normalizeDialogueKey(dialogue);
      if (seenDialogues.has(dialogueKey)) {
        console.warn(`⚠️ Skipping scene ${i + 1}: duplicate dialogue`);
        continue;
      }
      seenDialogues.add(dialogueKey);
      allDialogues.push(dialogue);
    }

    // Add combined response as a single message
    let chatMessageIndex = chatLenRef.current;
    if (addToChat && allDialogues.length > 0) {
      const combinedText = allDialogues.join("\n\n");
      setChatHistory((prev) => [...prev, { actor: "ai", text: combinedText }]);
      chatLenRef.current += 1;
      chatMessageIndex = chatLenRef.current - 1;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Now play scenes with speech
    seenDialogues.clear();
    for (let i = 0; i < scenesToPlay.length; i++) {
      if (stopResponseRef.current) {
        setIsScenePlaying(false);
        setIsSceneActive(false);
        setSpeakingDialogueIndex(null);
        break;
      }

      const scene = scenesToPlay[i];
      setCurrentSceneIndex(i);

      const dialogue = (scene.dialogue?.text || "").trim();
      if (!dialogue) {
        continue;
      }

      const dialogueKey = normalizeDialogueKey(dialogue);
      if (seenDialogues.has(dialogueKey)) {
        continue;
      }
      seenDialogues.add(dialogueKey);

      setCurrentSubtitle(dialogue);
      setSpeakingDialogueIndex(addToChat ? chatMessageIndex : null);
      setIsScenePlaying(!suppressSpeech);

      if (!suppressSpeech) {
        await speakText(dialogue, ttsLanguage);
      }

      setSpeakingDialogueIndex(null);
      setIsScenePlaying(false);

      if (i < scenesToPlay.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setIsScenePlaying(false);
    setIsSceneActive(false);
    setSpeakingDialogueIndex(null);
  };

  const stopResponsePlayback = () => {
    stopResponseRef.current = true;
    abortInFlightProcessing();
    stopSpeechNow();
    void exitPresetVideoFullscreen();
    if (specialVideoRef.current) {
      try {
        specialVideoRef.current.pause();
        specialVideoRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }
    setSpeakingDialogueIndex(null);
    setIsScenePlaying(false);
    setIsSceneActive(false);
    setIsProcessing(false);
    setCurrentSubtitle("Response stopped. Ready when you are!");
  };

  const replayLastResponse = async () => {
    if (isProcessing || isListening || isReplayRunning) return;
    const lastAi = [...chatHistory].reverse().find((msg) => msg.actor === "ai");
    const hasScenes = Array.isArray(lastScenesRef.current) && lastScenesRef.current.length > 0;
    if (!lastAi && !hasScenes) return;
    stopResponseRef.current = false;
    stopSpeechNow();
    setIsReplayRunning(true);
    try {
      if (hasScenes) {
        await playScenesWithSpeech(lastScenesRef.current, language, false, !!specialVideo);
      }
      if (!hasScenes && lastAi) {
        setCurrentSubtitle(lastAi.text);
        await speakText(lastAi.text, language);
      }
    } finally {
      setIsReplayRunning(false);
      stopResponseRef.current = false;
    }
  };

  const pickTopicExplainer = (args: {
    topic?: string;
    question?: string;
    backendExplainer?: BackendExplainer | null;
  }): TopicExplainer => {
    const rawTopic = (args.topic || "").trim();
    const title = rawTopic ? rawTopic : "Your Topic";

    const be = args.backendExplainer || null;
    const answer = (be?.summary || "").trim() || "Here are the main ideas in a simple way.";

    const points = Array.isArray(be?.points)
      ? be!.points.map((p) => String(p || "").trim()).filter(Boolean).slice(0, 3)
      : ["It has a simple meaning.", "It has important parts or steps.", "It helps us understand how something works."];

    const normalized = rawTopic.toLowerCase();

    const hasAny = (needles: string[]) => needles.some((n) => normalized.includes(n));

    let imageSrc = scienceExperimentImage;
    let imageAlt = "Learning";

    if (hasAny(["space", "planet", "solar", "sun", "moon", "star", "galaxy"])) {
      imageSrc = solarSystemImage;
      imageAlt = "Space";
    } else if (hasAny(["ocean", "sea", "fish", "whale", "shark", "coral"])) {
      imageSrc = oceanLifeImage;
      imageAlt = "Ocean";
    } else if (hasAny(["dinosaur", "dinosaurs", "t-rex", "trex", "jurassic"])) {
      imageSrc = dinosaursImage;
      imageAlt = "Dinosaurs";
    } else if (hasAny(["draw", "drawing", "art", "paint", "color", "colour"])) {
      imageSrc = artImage;
      imageAlt = "Art";
    }

    // Use Wikipedia image if available, otherwise use the theme-based image
    const wikipediaImageUrl = be?.image_url || null;
    if (wikipediaImageUrl) {
      imageSrc = wikipediaImageUrl;
      imageAlt = be?.title || rawTopic || "Topic Image";
    }

    const tags: string[] = [];
    if (rawTopic) {
      const primary = rawTopic.split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
      if (primary) tags.push(primary);
    }
    if (tags.length < 2) tags.push("Learning");

    return {
      title: (be?.title || title).trim(),
      question: args.question,
      answer,
      points,
      tags,
      imageSrc,
      imageAlt,
      wikipediaImageUrl,
    };
  };

  const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T | null> => {
    let timer: any;
    try {
      const timeout = new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      });
      return (await Promise.race([promise, timeout])) as T | null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const pollExplainer = async (jobId: string): Promise<BackendExplainer | null> => {
    const id = String(jobId || "").trim();
    if (!id) return null;

    // Poll for up to ~20s. This runs while the animation/TTS is playing.
    for (let attempt = 0; attempt < 25; attempt++) {
      try {
        const resp = await fetch(`/explainer?job_id=${encodeURIComponent(id)}`);
        if (resp.status === 404) return null;
        if (!resp.ok) {
          await delay(600);
          continue;
        }
        const data = (await resp.json().catch(() => null)) as ExplainerPollResponse | null;
        const status = String(data?.status || "");
        const explainer = data?.explainer || null;
        if ((status === "ready" || status === "fallback") && explainer) return explainer;
      } catch {
        // ignore transient failures
      }
      await delay(800);
    }

    return null;
  };

  const toWikiLangCode = (lang: string): string => {
    const raw = String(lang || "").trim().toLowerCase();
    const primary = (raw.includes("-") ? raw.split("-")[0] : raw) || "en";
    const supported = new Set(["en", "hi", "bn", "ta", "te"]);
    return supported.has(primary) ? primary : "en";
  };

const cleanQuery = (query: string): string => {
    const stopwords = ["a", "an", "the", "is", "are", "was", "were"];
    const words = query.toLowerCase().split(" ");
    const cleanedWords = words.filter(word => !stopwords.includes(word));
    return cleanedWords.join(" ") || query;
  };

  const hashToIndex = (input: string, modulo: number): number => {
    const s = String(input || "");
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    }
    const n = Math.abs(hash);
    return modulo > 0 ? n % modulo : 0;
  };

  const pickEmojiForTopic = (topic: string): string => {
    const t = String(topic || "").toLowerCase();
    const rules: Array<[RegExp, string]> = [
      [/dino|dinosaur|jurassic/, "🦖"],
      [/ocean|sea|marine|whale|fish|coral/, "🐳"],
      [/space|planet|solar|galaxy|astron/, "🪐"],
      [/volcano|lava|eruption/, "🌋"],
      [/rainforest|jungle|forest|tree/, "🌴"],
      [/insect|bug|ant|bee|butterfly/, "🐞"],
      [/body|heart|brain|skeleton|blood/, "🫀"],
      [/robot|ai|machine|computer/, "🤖"],
      [/weather|rain|storm|cloud|wind|snow/, "⛈️"],
      [/music|song|instrument|piano|guitar/, "🎵"],
      [/sport|football|soccer|cricket|tennis/, "⚽"],
      [/egypt|pharaoh|pyramid/, "🏺"],
      [/magic|trick|wizard/, "🎩"],
      [/castle|king|queen|knight/, "🏰"],
      [/antarctica|penguin|ice|polar/, "🐧"],
    ];

    for (const [re, emoji] of rules) {
      if (re.test(t)) return emoji;
    }
    return "✨";
  };

  const buildIllustrationDataUrl = (topic: string): string => {
    // Reuse the existing palette already used across the UI.
    const gradients: Array<[string, string]> = [
      ["#FF6B6B", "#FFA500"],
      ["#2196F3", "#81D4FA"],
      ["#4CAF50", "#81C784"],
      ["#9C27B0", "#CE93D8"],
      ["#FFD700", "#FFE082"],
      ["#FF5722", "#FFAB91"],
    ];
    const idx = hashToIndex(topic, gradients.length);
    const [c1, c2] = gradients[idx] || gradients[0];
    const emoji = pickEmojiForTopic(topic);
    const title = String(topic || "").trim() || "Let’s learn!";
    const safeTitle = title.length > 36 ? `${title.slice(0, 33)}...` : title;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
  </defs>

  <rect width="800" height="450" rx="36" fill="url(#bg)"/>
  <circle cx="690" cy="80" r="90" fill="#ffffff" opacity="0.18"/>
  <circle cx="120" cy="370" r="120" fill="#ffffff" opacity="0.12"/>

  <g filter="url(#shadow)">
    <rect x="70" y="80" width="660" height="290" rx="30" fill="#ffffff" opacity="0.92"/>
  </g>

  <text x="400" y="215" text-anchor="middle" font-size="96" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial">${emoji}</text>
  <text x="400" y="295" text-anchor="middle" font-size="36" font-weight="800" fill="#111827" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial">${safeTitle}</text>
  <text x="400" y="335" text-anchor="middle" font-size="20" font-weight="700" fill="#374151" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial">Tap the mic and ask more!</text>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const extractMainTopic = (text: string): string => {
    // Remove common question words and filler
    const questionWords = ["what", "why", "how", "when", "where", "who", "which", "is", "are", "do", "does", "did", "can", "could", "would", "should", "will", "shall"];
    const words = (text || "").toLowerCase().trim().split(/\s+/);
    
    // Remove question words and articles
    const filtered = words.filter(w => !questionWords.includes(w) && !["a", "an", "the"].includes(w));
    
    // Return first 2-3 important words for better search relevance
    const topic = filtered.slice(0, 3).join(" ");
    return topic || text;
  };

  const fetchTopicImage = async (query: string, langHint?: string, intentTopic?: string): Promise<string | null> => {
    let searchQuery = (intentTopic || query || "").trim();
    
    // If no intent topic provided, extract the main topic from the query
    if (!intentTopic && query) {
      searchQuery = extractMainTopic(query);
    }
    
    if (!searchQuery) return null;

    const originalLang = toWikiLangCode(langHint || language || "en");
    let translatedQuery = searchQuery;

    if (originalLang !== "en") {
      try {
        const translateResponse = await fetch("/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: searchQuery, to_language: "en" }),
        });
        if (translateResponse.ok) {
          const data = await translateResponse.json();
          translatedQuery = data.translated_text;
          console.log(`📝 Translated "${searchQuery}" to "${translatedQuery}" for image search.`);
        }
      } catch (e) {
        console.error("Translation failed, falling back to original query.", e);
      }
    }

    const wikiLang = "en"; // Always search english wikipedia for better image results
    const wikiBase = `https://${wikiLang}.wikipedia.org`;
    
    const isSafeExplanationImage = async (url: string): Promise<boolean> => {
      const src = String(url || "").trim();
      if (!src) return false;

      // Only allow known Wikipedia/Wikimedia image hosts.
      const allowedHosts = ["upload.wikimedia.org", "commons.wikimedia.org"];
      try {
        const parsed = new URL(src);
        if (!allowedHosts.includes(parsed.hostname)) return false;
      } catch {
        return false;
      }

      // If the browser can't do face detection, don't fail closed, but log it.
      const FaceDetectorCtor = (window as any)?.FaceDetector;
      if (!FaceDetectorCtor) {
        console.warn("⚠️ FaceDetector API not available. Cannot check for faces in images, so skipping this safety check.");
        return true;
      }

      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.src = src;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Image load failed"));
        });

        const canvas = document.createElement("canvas");
        const w = Math.min(512, img.naturalWidth || img.width || 0);
        const h = Math.min(512, img.naturalHeight || img.height || 0);
        if (!w || !h) return false;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return false;
        ctx.drawImage(img, 0, 0, w, h);

        const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await detector.detect(canvas);

        // If we detect a face, treat it as unsafe for the kids explanation image.
        return !Array.isArray(faces) || faces.length === 0;
      } catch {
        return false;
      }
    };
    try {
      console.log(`🖼️ Fetching topic image for: "${translatedQuery}"`);
      const resp = await fetch(`/topic-image?query=${encodeURIComponent(translatedQuery)}&lang=${encodeURIComponent(wikiLang)}`);
      if (!resp.ok) {
        console.warn(`⚠️ Topic image fetch failed: ${resp.status} ${resp.statusText}`);
        // continue to client-side fallback
      } else {
        const contentType = resp.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await resp.json();
          const imageUrl = typeof data?.imageUrl === "string" ? data.imageUrl : "";
          if (imageUrl) {
            console.log(`✅ Topic image found: ${imageUrl.substring(0, 80)}...`);
          } else {
            console.warn(`⚠️ No image URL in response for "${translatedQuery}"`);
          }
          if (imageUrl && (await isSafeExplanationImage(imageUrl))) return imageUrl;
          return null;
        }

        // If we got HTML (e.g., Vite dev server index.html), avoid JSON parsing.
        const preview = await resp.text().catch(() => "");
        if (preview.includes("<!DOCTYPE") || preview.includes("<html")) {
          // This typically happens when running the client-only dev server (vite) without the express server.
          // It's not fatal because we fall back to Wikipedia directly.
          if (!(window as any).__topicImageHtmlLogged) {
            console.info("ℹ️ /topic-image returned HTML; using client-side Wikipedia fallback");
            (window as any).__topicImageHtmlLogged = true;
          }
        }
      }

      // Client-side fallback: Use a two-step process for better relevance.
      // 1. Use opensearch to find the most relevant page title.
      // 2. Use that title to get the page image.
      const cleanedTranslatedQuery = cleanQuery(translatedQuery);
      const openSearchUrl = new URL(`${wikiBase}/w/api.php`);
      openSearchUrl.searchParams.set("action", "opensearch");
      openSearchUrl.searchParams.set("search", cleanedTranslatedQuery);
      openSearchUrl.searchParams.set("limit", "1");
      openSearchUrl.searchParams.set("namespace", "0");
      openSearchUrl.searchParams.set("format", "json");
      openSearchUrl.searchParams.set("origin", "*");

      const openSearchResp = await fetch(openSearchUrl.toString());
      if (!openSearchResp.ok) {
        console.warn(`⚠️ Wikipedia OpenSearch failed for "${translatedQuery}". Using fallback illustration.`);
        return buildIllustrationDataUrl(translatedQuery);
      }
      const openSearchData = await openSearchResp.json().catch(() => null);
      
      const pageTitle = openSearchData?.[1]?.[0];
      if (!pageTitle) {
        console.warn(`⚠️ No relevant Wikipedia page title found for "${translatedQuery}". Using fallback illustration.`);
        return buildIllustrationDataUrl(translatedQuery);
      }
      
      console.log(`✅ Found relevant page title: "${pageTitle}"`);

      const queryUrl = new URL(`${wikiBase}/w/api.php`);
      queryUrl.searchParams.set("action", "query");
      queryUrl.searchParams.set("format", "json");
      queryUrl.searchParams.set("origin", "*");
      queryUrl.searchParams.set("prop", "pageimages");
      queryUrl.searchParams.set("titles", pageTitle);
      queryUrl.searchParams.set("pithumbsize", "800");
      queryUrl.searchParams.set("utf8", "1");
      queryUrl.searchParams.set("redirects", "1");

      const queryResp = await fetch(queryUrl.toString());
      if (!queryResp.ok) {
        console.warn(`⚠️ Wikipedia query failed for "${pageTitle}". Using fallback illustration.`);
        return buildIllustrationDataUrl(translatedQuery);
      }
      const queryData = await queryResp.json().catch(() => null);
      const pagesObj = queryData?.query?.pages || {};
      const pages = Object.values(pagesObj) as any[];
      const page = pages?.[0];
      const imageUrl = typeof page?.thumbnail?.source === "string" ? page.thumbnail.source : "";
      if (imageUrl && (await isSafeExplanationImage(imageUrl))) {
        console.log(`✅ Topic image found: ${imageUrl.substring(0, 80)}...`);
        return imageUrl;
      }
      console.warn(`⚠️ No suitable image found for "${pageTitle}". Using fallback illustration.`);
      return buildIllustrationDataUrl(translatedQuery);
    } catch (e) {
      console.error(`❌ Topic image fetch error for "${translatedQuery}":`, e);
      return buildIllustrationDataUrl(translatedQuery);
    }
  };

  const handleMicClick = async () => {
    if (isListening) {
      isListeningRef.current = false;
      stopLiveTranscription();
      mediaRecorder?.stop();
      stopResponseRef.current = false;
      stopSpeechNow();
      setIsListening(false);
      setIsProcessing(true);
      setError(null);
      setCurrentSubtitle("Processing your question...");
    } else {
      try {
        setError(null);
        stopResponseRef.current = false;
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          stopSpeechNow();
        }

        // New question: clear any special video override
        setSpecialVideo(null);

        // Clear previous transcript and start live transcription (best-effort).
        setLiveTranscript("");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });

        const audioChunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;

          if (audioChunks.length === 0) {
            setIsProcessing(false);
            setError("No audio recorded. Please try again.");
            setCurrentSubtitle("Ready to listen!");
            return;
          }

          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          // Always send "auto" to enable automatic language detection from audio
          // Once detected, the backend will identify the language and respond accordingly
          const langToSend = language === "auto" || language.includes("IN") ? "auto" : language;
          formData.append("language", langToSend);
          formData.append("transcript", (liveTranscriptRef.current || "").trim());
          formData.append("character", character);
          formData.append("selected_class", selectedClass);

          try {
            setCurrentSubtitle("Sending to KIDZ-GPT...");
            const controller = new AbortController();
            processAbortControllerRef.current = controller;
            const response = await fetch("/process", {
              method: "POST",
              body: formData,
              signal: controller.signal,
            });

            // Check content-type before parsing
            const contentType = response.headers.get("content-type") || "";
            const isJson = contentType.includes("application/json");

            if (!response.ok) {
              let errorMessage = `Server error: ${response.status}`;
              if (isJson) {
                try {
                  const errorData = await response.json();
                  errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
                } catch (e) {
                  // If JSON parsing fails, use default message
                  console.error("Failed to parse error response:", e);
                }
              } else {
                // If response is HTML (error page), provide a helpful message
                const text = await response.text().catch(() => "");
                if (text.includes("<!DOCTYPE") || text.includes("<html")) {
                  errorMessage = "Backend server returned an error page. Please ensure the backend is running on port 8000.";
                } else {
                  errorMessage = text || errorMessage;
                }
              }
              throw new Error(errorMessage);
            }

            // Parse JSON response, but handle non-JSON responses gracefully
            let data;
            if (isJson) {
              try {
                data = await response.json();
              } catch (jsonError) {
                const text = await response.text().catch(() => "");
                if (text.includes("<!DOCTYPE") || text.includes("<html")) {
                  throw new Error("Backend server returned an HTML page instead of JSON. Please ensure the backend is running and accessible.");
                }
                throw new Error(`Failed to parse response: ${jsonError instanceof Error ? jsonError.message : "Unknown error"}`);
              }
            } else {
              // Response is not JSON - likely HTML error page
              const text = await response.text().catch(() => "");
              let errorMsg = `Backend returned ${contentType} instead of JSON.`;
              
              if (text.includes("<!DOCTYPE") || text.includes("<html") || text.includes("404") || text.includes("Not Found")) {
                errorMsg = "Backend endpoint not found. Please ensure the backend server is running on port 8000 and the /process endpoint exists.";
              } else if (text.includes("500") || text.includes("Internal Server Error")) {
                errorMsg = "Backend server error. Please check the backend logs.";
              } else if (response.status === 502 || response.status === 503) {
                errorMsg = "Backend server is not available. Please ensure it's running on port 8000.";
              }
              
              console.error("Non-JSON response from backend:", {
                status: response.status,
                contentType,
                textPreview: text.substring(0, 200)
              });
              
              throw new Error(errorMsg);
            }

            await handleBackendResult(data, language);
          } catch (error) {
            console.error("Processing error:", error);
            let errorMessage = "Failed to process audio. Please try again.";
            if (error instanceof DOMException && error.name === "AbortError") {
              errorMessage = "Request was stopped.";
            }
            
            if (error instanceof Error) {
              // Clean up error messages for better UX
              const message = error.message;
              if (message.includes("JSON") || message.includes("<!DOCTYPE") || message.includes("HTML")) {
                errorMessage = "Unable to connect to the backend server. Please ensure the backend is running on port 8000.";
              } else if (message.includes("Failed to reach backend") || message.includes("502")) {
                errorMessage = "Backend server is not available. Please check if the backend service is running.";
              } else if (message.includes("NetworkError") || message.includes("fetch")) {
                errorMessage = "Network error. Please check your connection and try again.";
              } else if (message.includes("transcription") || message.includes("Transcription") || message.includes("STT") || message.includes("Speech-to-text")) {
                errorMessage = "Could not understand your audio. Please try speaking more clearly or check if the transcription service is running.";
              } else if (message.includes("empty text") || message.includes("empty audio")) {
                errorMessage = "No audio was detected. Please try speaking again.";
              } else {
                errorMessage = message;
              }
            }
            
            setError(errorMessage);
            setCurrentSubtitle("Something went wrong. Try again!");
            
            // Add error message to chat (but make it more friendly)
            const friendlyMessage = errorMessage.includes("backend") || errorMessage.includes("server")
              ? "I'm having trouble connecting to my brain right now. Please make sure the backend server is running! 🤖"
              : `Sorry, I encountered an error: ${errorMessage}`;
            
            setChatHistory((prev) => [
              ...prev,
              { actor: "ai", text: friendlyMessage },
            ]);
          } finally {
            processAbortControllerRef.current = null;
            setIsProcessing(false);
          }
        };
        
        setMediaRecorder(recorder);
        recorder.start();
        isListeningRef.current = true;
        setIsListening(true);
        setCurrentSubtitle("Listening... Speak now!");

        // Start browser live transcription if supported (optional UX improvement).
        startLiveTranscription();
      } catch (error) {
        console.error("Microphone access error:", error);
        setError("Could not access microphone. Please check permissions.");
        setCurrentSubtitle("Microphone access needed!");
      }
    }
  };

  const handleTextSubmit = async () => {
    const trimmed = textInput.trim();
    if (!trimmed || isProcessing) return;

    try {
      setError(null);
      stopResponseRef.current = false;
      stopSpeechNow();
      setIsProcessing(true);
      setCurrentSubtitle("Thinking about your question...");

      // New text question: clear any special video override
      setSpecialVideo(null);

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      const controller = new AbortController();
      processAbortControllerRef.current = controller;
      const response = await fetch("/process-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmed,
          language,
          character,
          selected_class: selectedClass,
        }),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        if (isJson) {
          try {
            const errorData = await response.json();
            errorMessage =
              errorData.detail ||
              errorData.message ||
              errorData.error ||
              errorMessage;
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
        } else {
          const text = await response.text().catch(() => "");
          if (text.includes("<!DOCTYPE") || text.includes("<html")) {
            errorMessage =
              "Backend server returned an error page. Please ensure the backend is running on port 8000.";
          } else {
            errorMessage = text || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      let data: any;
      if (isJson) {
        try {
          data = await response.json();
        } catch (jsonError) {
          const text = await response.text().catch(() => "");
          if (text.includes("<!DOCTYPE") || text.includes("<html")) {
            throw new Error(
              "Backend server returned an HTML page instead of JSON. Please ensure the backend is running and accessible.",
            );
          }
          throw new Error(
            `Failed to parse response: ${
              jsonError instanceof Error
                ? jsonError.message
                : "Unknown error"
            }`,
          );
        }
      } else {
        const text = await response.text().catch(() => "");
        let errorMsg = `Backend returned ${contentType} instead of JSON.`;

        if (
          text.includes("<!DOCTYPE") ||
          text.includes("<html") ||
          text.includes("404") ||
          text.includes("Not Found")
        ) {
          errorMsg =
            "Backend endpoint not found. Please ensure the backend server is running on port 8000 and the /process-text endpoint exists.";
        } else if (
          text.includes("500") ||
          text.includes("Internal Server Error")
        ) {
          errorMsg = "Backend server error. Please check the backend logs.";
        } else if (response.status === 502 || response.status === 503) {
          errorMsg =
            "Backend server is not available. Please ensure it's running on port 8000.";
        }

        console.error("Non-JSON response from backend:", {
          status: response.status,
          contentType,
          textPreview: text.substring(0, 200),
        });

        throw new Error(errorMsg);
      }

      await handleBackendResult(data, language);
      setTextInput("");
    } catch (error) {
      console.error("Text processing error:", error);
      let errorMessage = "Failed to process text. Please try again.";

      if (error instanceof DOMException && error.name === "AbortError") {
        errorMessage = "Request was stopped.";
      }

      if (error instanceof Error) {
        const message = error.message;
        if (
          message.includes("JSON") ||
          message.includes("<!DOCTYPE") ||
          message.includes("HTML")
        ) {
          errorMessage =
            "Unable to connect to the backend server. Please ensure the backend is running on port 8000.";
        } else if (
          message.includes("Failed to reach backend") ||
          message.includes("502")
        ) {
          errorMessage =
            "Backend server is not available. Please check if the backend service is running.";
        } else if (
          message.includes("NetworkError") ||
          message.includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (
          message.includes("empty text") ||
          message.includes("empty audio")
        ) {
          errorMessage =
            "No text was detected. Please try typing your question again.";
        } else {
          errorMessage = message;
        }
      }

      setError(errorMessage);
      setCurrentSubtitle("Something went wrong. Try again!");

      const friendlyMessage =
        errorMessage.includes("backend") || errorMessage.includes("server")
          ? "I'm having trouble connecting to my brain right now. Please make sure the backend server is running! 🤖"
          : `Sorry, I encountered an error: ${errorMessage}`;

      setChatHistory((prev) => [
        ...prev,
        { actor: "ai", text: friendlyMessage },
      ]);
    } finally {
      processAbortControllerRef.current = null;
      setIsProcessing(false);
    }
  };

  const generateQuiz = async () => {
    if (!hasExplainer) return;
    const topic = topicExplainer.title || "this topic";
    
    try {
      stopResponseRef.current = false;
      stopSpeechNow();
      setIsProcessing(true);
      
      // Fetch quiz questions from backend
      const controller = new AbortController();
      processAbortControllerRef.current = controller;
      const response = await fetch("/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          explainer: {
            title: topicExplainer.title,
            summary: topicExplainer.answer,
            points: topicExplainer.points,
          },
          language: language,
          selected_class: selectedClass,
        }),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }
      
      const data = await response.json();
      const questions = data.questions || [];
      
      if (questions.length === 0) {
        throw new Error("No questions generated");
      }
      
      setQuizQuestions(questions);
      setCurrentQuizQuestion(0);
      setQuizScore(0);
      setSelectedAnswer(null);
      setShowQuizResult(false);
      setIsQuizComplete(false);
      setShowQuiz(true);
      
      // Speak the first question
      setTimeout(() => {
        if (questions[0]) {
          speakText(questions[0].question, language);
        }
      }, 500);
    } catch (error) {
      console.error("Quiz generation error:", error);
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("Quiz request was stopped.");
      } else {
        setError("Failed to generate quiz. Please try again!");
      }
    } finally {
      processAbortControllerRef.current = null;
      setIsProcessing(false);
    }
  };

  const handleQuizAnswer = async (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === quizQuestions[currentQuizQuestion].correctAnswer;
    
    if (isCorrect) {
      setQuizScore(quizScore + 1);
      stopResponseRef.current = false;
      await speakText("Correct! Great job!", language);
      setShowQuizResult(true);
      
      // Move to next question or show final score
      setTimeout(async () => {
        if (currentQuizQuestion < quizQuestions.length - 1) {
          setCurrentQuizQuestion(currentQuizQuestion + 1);
          setSelectedAnswer(null);
          setShowQuizResult(false);
          
          // Speak next question
          setTimeout(() => {
            speakText(quizQuestions[currentQuizQuestion + 1].question, language);
          }, 300);
        } else {
          setIsQuizComplete(true);
          await speakText(`Amazing! You scored ${quizScore + 1} out of ${quizQuestions.length}! You're a champion!`, language);
        }
      }, 2000);
    } else {
      stopResponseRef.current = false;
      await speakText("Oops! Try again and think carefully.", language);
      setTimeout(() => {
        setSelectedAnswer(null);
      }, 1500);
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setQuizQuestions([]);
    setCurrentQuizQuestion(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setShowQuizResult(false);
    setIsQuizComplete(false);
  };

  const handleTopicSelect = async (topic: string) => {
    // Clear any special video overlay
    setVideoCompleted(false);
    setSpecialVideo(null);
    
    // Scroll to chat area
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
    
    // Simulate a text question about the topic
    const question = `Tell me about ${topic}`;
    setTextInput(question);
    
    // Process the question after a short delay
    setTimeout(() => {
      handleTextSubmit();
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Cleanup any in-progress browser recognition.
      try {
        stopLiveTranscription();
      } catch {
        // ignore
      }
    };
  }, []);

  const hasAiResponse = chatHistory.some((msg) => msg.actor === "ai");
  const isPlaybackActive = isSpeechActive || isScenePlaying || isSceneActive;


  return (
    <div className="min-h-screen w-full animate-in fade-in duration-700 page-sky relative">
      {/* Floating background shapes */}
      <div className="floating-shape" style={{ width: 140, height: 140, top: "6%", left: "10%", background: "radial-gradient(circle, #FFFFFF 0%, transparent 65%)" }} />
      <div className="floating-shape" style={{ width: 110, height: 110, top: "26%", right: "12%", background: "radial-gradient(circle, #FFF9C4 0%, transparent 65%)", animationDelay: "2s" }} />
      <div className="floating-shape" style={{ width: 160, height: 160, bottom: "12%", left: "6%", background: "radial-gradient(circle, #E1BEE7 0%, transparent 65%)", animationDelay: "5s" }} />
      <div className="floating-shape" style={{ width: 90, height: 90, bottom: "24%", right: "18%", background: "radial-gradient(circle, #BBDEFB 0%, transparent 65%)", animationDelay: "8s" }} />
      {/* Stars (twinkles) */}
      <div className="floating-shape" style={{ width: 14, height: 14, top: "14%", left: "32%", background: "radial-gradient(circle, #FFF 0%, transparent 70%)", animationDuration: "12s" }} />
      <div className="floating-shape" style={{ width: 10, height: 10, top: "32%", right: "28%", background: "radial-gradient(circle, #FFF 0%, transparent 70%)", animationDuration: "10s", animationDelay: "1.5s" }} />
      <div className="floating-shape" style={{ width: 12, height: 12, bottom: "28%", right: "32%", background: "radial-gradient(circle, #FFF 0%, transparent 70%)", animationDuration: "11s", animationDelay: "2.5s" }} />
      {/* Drifting clouds */}
      <div className="floating-cloud" style={{ top: "10%", left: "-22%", width: 280, height: 140, background: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.9), transparent 55%)" }} />
      <div className="floating-cloud" style={{ top: "38%", left: "-28%", width: 320, height: 160, background: "radial-gradient(circle at 40% 50%, rgba(255,255,255,0.85), transparent 60%)", animationDuration: "60s" }} />
      {/* Corner blobs */}
      <div className="corner-blob tl" />
      <div className="corner-blob br" />
      {/* ================= HEADER ================= */}
      <header className="fixed top-0 left-0 right-0 z-[9999] px-4 md:px-6 lg:px-8 py-2 border-b-2 border-[var(--border-soft)] md:border-none bg-white/95 backdrop-blur-sm shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="KidzGPT Logo" className="h-12 md:h-14 object-contain" />
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-12 w-12 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow border-2 border-[var(--border-soft)] flex items-center justify-center"
                  aria-label="Settings"
                >
                  <Settings size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <label
                    className="block text-xs font-semibold opacity-70 mb-1"
                    htmlFor="learn-language"
                  >
                    {t("uiLanguage")}
                  </label>
                  <select
                    id="learn-language"
                    value={uiLanguage}
                    onChange={(e) => setUiLanguage(e.target.value as UILangCode)}
                    className="w-full bg-white px-3 py-2 rounded-md shadow-sm border-2 border-[var(--border-soft)] text-[var(--text-primary)] font-bold"
                    aria-label="Select UI language"
                  >
                    {Object.entries(UI_LANGUAGE_LABELS).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <label
                    className="block text-xs font-semibold opacity-70 mb-1"
                    htmlFor="character-select"
                  >
                    Character
                  </label>
                  <select
                    id="character-select"
                    value={character}
                    onChange={(e) => setCharacter(e.target.value as "boy" | "girl" | "ben10" | "oggy")}
                    className="w-full bg-white px-3 py-2 rounded-md shadow-sm border-2 border-[var(--border-soft)] text-[var(--text-primary)] font-bold"
                    aria-label="Select character"
                  >
                    <option value="boy">Boy 👦</option>
                    <option value="girl">Girl 👧</option>
                    <option value="oggy">Oggy</option>
                    <option value="ben10">Ben 10</option>
                  </select>
                </div>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <label
                    className="block text-xs font-semibold opacity-70 mb-1"
                    htmlFor="preset-video-speed"
                  >
                    Preset video speed
                  </label>
                  <select
                    id="preset-video-speed"
                    value={String(presetVideoSpeed)}
                    onChange={(e) => setPresetVideoSpeed(Number(e.target.value))}
                    className="w-full bg-white px-3 py-2 rounded-md shadow-sm border-2 border-[var(--border-soft)] text-[var(--text-primary)] font-bold"
                    aria-label="Select preset video speed"
                  >
                    <option value="0.5">0.5×</option>
                    <option value="0.75">0.75×</option>
                    <option value="1">1× (Normal)</option>
                    <option value="1.25">1.25×</option>
                    <option value="1.5">1.5×</option>
                    <option value="2">2×</option>
                  </select>
                </div>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem
                  onSelect={() => {
                    window.location.href = "/login";
                  }}
                >
                  <LogIn size={16} />
                  Login
                </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 pt-40 px-4 pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8 max-w-7xl mx-auto">
        <main className="flex-1 flex flex-col gap-6">
        
        {/* ================= UPPER SECTION: CHAT & ANIMATION ================= */}
        <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-[var(--border-soft)] p-4 md:p-6 animate-in slide-in-from-bottom-6 duration-700 delay-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[480px] lg:min-h-[58vh]">
          
          {/* LEFT: CHAT TRANSCRIPT */}
          <section className="lg:col-span-5 flex flex-col gap-4 h-full">
            {/* Back Button & Class Selection (upper-left of chat section) */}
            <div className="flex justify-start gap-3 items-center flex-wrap">
              <button
                type="button"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 border-2 border-[var(--border-soft)] text-[var(--text-primary)] font-bold"
                aria-label="Back to Home"
              >
                <ArrowLeft size={18} />
                <span className="text-sm">Back to Home</span>
              </button>

              {/* Class Selection Dropdown */}
              {selectedClass && (
                <div className="px-4 py-2 bg-gradient-to-r from-[#4CAF50] to-[#81C784] rounded-full shadow-md border-2 border-[var(--border-soft)] text-white font-bold text-sm flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  <span>Class: {selectedClass}</span>
                  <button
                    type="button"
                    onClick={() => setShowClassModal(true)}
                    className="ml-1 text-white hover:text-yellow-200 transition-colors"
                    aria-label="Change class"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>

            <div className="card flex-none flex flex-col relative border-4 border-[var(--border-soft)] h-[calc(100vh-320px)] max-h-[calc(100vh-320px)] min-h-[360px] overflow-hidden shadow-xl ring-4 ring-[var(--cta-voice)] ring-opacity-15 bg-chat-zone">
              {/* Floating decorative elements */}
              <div className="floating-element floating-dots animate-float" style={{ top: '10%', left: '5%' }}></div>
              <div className="floating-element floating-dots animate-float-slow" style={{ top: '60%', right: '8%', width: '30px', height: '30px' }}></div>
              <div className="floating-element floating-dots animate-float" style={{ bottom: '20%', left: '10%', width: '25px', height: '25px' }}></div>
              
              <div className="flex-1 overflow-y-auto space-y-4 p-6 custom-scrollbar" style={{ scrollBehavior: 'smooth', willChange: 'scroll-position' }}>
                {chatHistory.length > 0 ? (
                  chatHistory.map((chat, idx) => {
                    const isKid = chat.actor === "kid";
                    return (
                      <div
                        key={idx}
                        className={`animate-slide-in-left flex ${isKid ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-3xl px-5 py-4 shadow-lg border-3 font-bold text-base md:text-lg leading-relaxed transform transition-all duration-300 hover:scale-105 ${
                            isKid
                              ? "bg-gradient-to-r from-[#FF6B6B] via-[#FF8A65] to-[#FFA500] text-white border-[#FF5722] rounded-tr-sm"
                              : "bg-gradient-to-r from-[#4CAF50] via-[#81C784] to-[#A5D6A7] text-[#1B5E20] border-[#388E3C] rounded-tl-sm"
                          }`}
                        >
                          <div className="font-black text-sm opacity-80 mb-1">
                            {isKid ? "🎤 You" : "🤖 KidzGPT"}
                          </div>
                          {chat.text}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-[var(--text-secondary)] text-lg font-bold">
                      💬 Chat will appear here!
                    </div>
                  </div>
                )}

                {/* Live voice → text bubble (best-effort via Web Speech API). */}
                {(isListening || (isProcessing && !!liveTranscript)) && (
                  <div className="mt-4 animate-slide-in-right flex justify-start">
                    <div className="max-w-[85%] bg-gradient-to-r from-[#2196F3] via-[#64B5F6] to-[#90CAF9] text-white px-5 py-4 rounded-3xl rounded-tl-sm border-3 border-[#1976D2] shadow-lg font-bold text-base md:text-lg">
                      <div className="font-black text-sm opacity-90 mb-1">🎧 Listening...</div>
                      {liveTranscript
                        ? liveTranscript
                        : isProcessing
                        ? "Processing your question..."
                        : "Listening..."}
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="mt-4 animate-slide-in-left flex justify-start">
                    <div className="max-w-[85%] bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#FF9800] text-[#F57C00] px-5 py-4 rounded-3xl rounded-tl-sm border-3 border-[#FF6F00] shadow-lg font-black text-base md:text-lg animate-pulse flex items-center gap-2">
                      <span className="text-2xl">✨</span>
                      Thinking...
                      <span className="text-2xl">💭</span>
                    </div>
                  </div>
                )}
                      <div ref={chatEndRef} />

              </div>
            </div>

            {/* MIC BUTTON */}
            <div className="card p-4 flex flex-col gap-3 justify-center items-center">
              {error && (
                <div className="w-full bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-red-700 flex-1">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-800 text-lg font-bold"
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              )}
              <button
                className={`button ${
                  isListening
                    ? "button-voice shadow-lg ring-4 ring-[var(--cta-voice)] ring-opacity-20"
                    : isProcessing
                    ? "bg-gray-200 border-2 border-gray-400 text-gray-600 cursor-not-allowed"
                    : "button-primary shadow-xl ring-4 ring-[var(--cta-primary)] ring-opacity-25 animate-mic-pulse"
                } w-full flex justify-center gap-2 items-center text-xl transition-all duration-200`}
                onClick={handleMicClick}
                disabled={isProcessing}
              >
                <Mic
                  size={24}
                  className={isListening ? "animate-pulse" : ""}
                />
                {isProcessing
                  ? "Processing..."
                  : isListening
                  ? "Listening... Tap to Stop"
                  : "Tap to Speak"}
              </button>

              <div className="flex flex-wrap gap-3 w-full">
                <button
                  type="button"
                  onClick={stopResponsePlayback}
                  disabled={!isPlaybackActive && !isProcessing}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-[var(--accent-coral)] bg-white text-[var(--text-primary)] font-bold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-md transition-all"
                  aria-label="Stop current response"
                >
                  <Square size={18} />
                  Stop response
                </button>

                <button
                  type="button"
                  onClick={replayLastResponse}
                  disabled={!hasAiResponse || isProcessing || isListening || !!specialVideo}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-[var(--cta-primary)] bg-white text-[var(--text-primary)] font-bold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-md transition-all"
                  aria-label="Replay the last response"
                >
                  <RotateCcw size={18} />
                  Replay response
                </button>
              </div>

              {/* Text input toggle & expanding box */}
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[var(--border-soft)] bg-white text-sm font-bold text-[var(--text-primary)] shadow-sm hover:shadow-md transition-all"
                onClick={() => {
                  setIsTextMode((prev) => !prev);
                  setTimeout(() => {
                    if (!isTextMode && textAreaRef.current) {
                      textAreaRef.current.focus();
                    }
                  }, 50);
                }}
              >
                <User size={16} />
                {isTextMode ? "Hide typing box" : "Or type your question"}
              </button>

              {isTextMode && (
                <div className="w-full mt-2 flex flex-col gap-2">
                  <textarea
                    ref={textAreaRef}
                    value={textInput}
                    onChange={(e) => {
                      setTextInput(e.target.value);
                      const el = e.target as HTMLTextAreaElement;
                      el.style.height = "auto";
                      el.style.height = `${el.scrollHeight}px`;
                    }}
                    rows={2}
                    placeholder="Or type your question here..."
                    className="w-full rounded-2xl border-2 border-[var(--border-soft)] px-3 py-2 text-base resize-none focus:ring-2 focus:ring-[var(--cta-primary)] focus:outline-none bg-white shadow-inner max-h-40 overflow-y-auto"
                    disabled={isProcessing}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleTextSubmit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleTextSubmit}
                    disabled={isProcessing || !textInput.trim()}
                    className="self-end px-4 py-2 rounded-full bg-[var(--cta-primary)] text-white text-sm font-bold shadow-md disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg transition"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: ANIMATION & HIGHLIGHTS */}
          <section className="lg:col-span-7 flex flex-col gap-4 h-full">
            
            {/* CHARACTER / ANIMATION AREA */}
            <div className="character-container flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px] lg:min-h-[410px] bg-animation-zone animate-glow-border rounded-3xl">
              {/* Background Image - Hidden when preloaded video is playing */}
              <div 
                className={`absolute inset-0 z-0 bg-cover bg-center bg-no-repeat rounded-3xl transition-all duration-500 ${
                  specialVideo ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                style={{
                  backgroundImage: `url('/${currentBackground}')`,
                }}
              />

              {/* Floating decorative elements - Hidden when preloaded video is playing */}
              <div className={`absolute top-10 left-10 w-20 h-20 bg-white opacity-20 rounded-full blur-xl animate-float transition-opacity duration-300 ${specialVideo ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}></div>
              <div className={`absolute bottom-10 right-10 w-32 h-32 bg-[var(--bg-secondary)] opacity-30 rounded-full blur-2xl animate-float-slow transition-opacity duration-300 ${specialVideo ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}></div>
              <div className={`absolute top-1/2 left-1/4 w-16 h-16 bg-purple-300 opacity-15 rounded-full blur-lg animate-float transition-opacity duration-300 ${specialVideo ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ animationDelay: '1s' }}></div>

              {isProcessing ? (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/85 backdrop-blur-sm px-4 py-4">
                  <div className="w-full max-w-2xl flex flex-col items-center gap-3">
                    <video
                      src="/preloader.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full max-h-[360px] object-cover rounded-3xl shadow-xl border-4 border-[var(--cta-primary)]"
                    />
                    <p className="text-lg md:text-xl font-bold text-[var(--text-primary)] text-center drop-shadow-sm">
                      KIDZ-GPT is preparing personalized content... hang tight!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 z-10 flex items-center justify-center px-4 py-4">
                  {specialVideo ? (
                    <div ref={specialVideoContainerRef} className="w-full h-full">
                      <video
                        ref={specialVideoRef}
                        src={specialVideo}
                        autoPlay
                        muted={true}
                        controls={false}
                        playsInline
                        onLoadedMetadata={() => {
                          try {
                            if (specialVideoRef.current) {
                              specialVideoRef.current.playbackRate = presetVideoSpeed;
                            }
                          } catch {
                            // ignore
                          }
                        }}
                        onEnded={() => setVideoCompleted(true)}
                        className="w-full h-full object-cover rounded-3xl shadow-3xl border-4 border-[var(--cta-primary)]"
                      />
                    </div>
                  ) : (
                  <GestureZoomController
                    onZoomChange={setCameraZoom}
                    enableDetection={!isProcessing && !specialVideo}
                    showFullscreenButton={true}
                    fullscreenBackgroundImageUrl={`/${currentBackground}`}
                  >
                    <ScenePlayer
                      scenes={scenes.slice(currentSceneIndex, currentSceneIndex + 1)}
                      active={isSceneActive}
                      playing={isScenePlaying}
                      fallbackCharacter={character}
                      zoomLevel={cameraZoom}
                    />
                  </GestureZoomController>
                  )}
                </div>
              )}

              {/* Understanding Check - Shown after preloaded video completes */}
              {specialVideo && videoCompleted && !isSpeechActive && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl px-4 py-4">
                  <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-[var(--cta-primary)] max-w-md w-full flex flex-col items-center gap-6">
                    <h3 className="text-3xl font-bold text-[var(--text-primary)] font-[Comic Neue] text-center">
                      Did you understand it? 🤔
                    </h3>
                    
                    <div className="flex gap-4 w-full">
                      <button
                        onClick={() => {
                          setVideoCompleted(false);
                          setSpecialVideo(null);
                          setTimeout(() => {
                            const exploreSection = document.querySelector('[data-explore-section]');
                            exploreSection?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 200);
                        }}
                        className="flex-1 bg-gradient-to-r from-[#4CAF50] to-[#81C784] hover:shadow-xl text-white font-bold text-lg py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 border-4 border-[#2E7D32]"
                      >
                        ✅ Yes!
                      </button>
                      
                      <button
                        onClick={() => {
                          setVideoCompleted(false);
                          // For body parts videos, switch to alternate version
                          if (currentPreloadedKeyword && (currentPreloadedKeyword.includes("body") || currentPreloadedKeyword === "skin" || currentPreloadedKeyword === "bone" || currentPreloadedKeyword === "skeleton" || currentPreloadedKeyword === "organs" || currentPreloadedKeyword === "anatomy")) {
                            const nextVersion = bodyPartsVideoVersion === 1 ? 2 : 1;
                            setBodyPartsVideoVersion(nextVersion);
                            // Get the alternate video URL
                            const originalText = chatHistory[chatHistory.length - 2]?.text || "";
                            const alternateVideo = getPreloadedVideoUrl(originalText, nextVersion);
                            if (alternateVideo) {
                              setSpecialVideo(alternateVideo.url);
                              console.log(`🎬 Switching to body parts video version ${nextVersion}`);
                            }
                          }
                          // Replay the video
                          if (specialVideoRef.current) {
                            specialVideoRef.current.currentTime = 0;
                            specialVideoRef.current.play();
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-[#FF6B6B] to-[#FF8A65] hover:shadow-xl text-white font-bold text-lg py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 border-4 border-[#D32F2F]"
                      >
                        ❌ No, Show Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reward Badge (Floating) */}
              {/* <div className="absolute top-4 right-4 reward-badge shadow-lg animate-bounce">
                <Star fill="#5D4037" size={24} />
                <span className="ml-2 font-bold">+10 XP</span>
              </div> */}
            </div>

          </section>
          </div>
        </div>

        {hasExplainer && (
          <>
            {/* ================= MIDDLE SECTION: EXPLANATION ================= */}
            <div ref={topicExplainerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* IMAGE CARD */}
              <div className="md:col-span-1 card p-2 flex items-center justify-center bg-white border-4 border-[var(--bg-secondary)] overflow-hidden">
                <img 
                  src={topicExplainer.imageSrc} 
                  alt={topicExplainer.imageAlt} 
                  className="w-full h-full object-cover rounded-xl hover:scale-110 transition-transform duration-700"
                />
              </div>

              {/* TEXT EXPLANATION CARD */}
              <div className="md:col-span-2 card flex flex-col justify-center gap-4 relative overflow-hidden bg-knowledge-card">
                 {/* Decor */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[var(--bg-learning)] rounded-full opacity-50 pointer-events-none animate-float-slow"></div>

                <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[Comic Neue]">
                  {topicExplainer.title}
                </h2>

                {topicExplainer.question ? (
                  <p className="text-base md:text-lg text-[var(--text-secondary)] font-bold">
                    Q: <span className="font-[Poppins] font-medium">{topicExplainer.question}</span>
                  </p>
                ) : null}

                <p className="text-xl leading-relaxed text-[var(--text-secondary)] font-[Poppins]">
                  {topicExplainer.answer}
                </p>

                {/* Main points (visually highlighted using existing theme tokens) */}
                <div className="flex flex-wrap gap-2">
                  {topicExplainer.points.slice(0, 3).map((point, idx) => {
                    const dotBg =
                      idx === 0
                        ? "bg-[var(--cta-primary)]"
                        : idx === 1
                        ? "bg-[var(--accent-coral)]"
                        : "bg-[var(--reward-gold)]";

                    const chipBg =
                      idx === 0
                        ? "bg-[var(--bg-success)]"
                        : idx === 1
                        ? "bg-[var(--bg-secondary)]"
                        : "bg-[var(--bg-secondary)]";

                    const borderColor =
                      idx === 0
                        ? "border-[var(--cta-primary)]"
                        : idx === 1
                        ? "border-[var(--accent-coral)]"
                        : "border-[var(--reward-gold)]";

                    return (
                      <div
                        key={`${idx}-${point.substring(0, 12)}`}
                        className={`${chipBg} ${borderColor} border-2 rounded-xl px-3 py-2 flex items-start gap-2 shadow-sm`}
                      >
                        <span className={`mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotBg}`} />
                        <span className="text-[var(--text-primary)] font-[Poppins] font-semibold">
                          {point}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex gap-2 mt-2">
                   {topicExplainer.tags.slice(0, 2).map((tag) => (
                     <span key={tag} className="bg-[var(--bg-learning)] text-[var(--cta-voice)] px-3 py-1 rounded-full text-sm font-bold">
                       #{tag}
                     </span>
                   ))}
                </div>
              </div>

            </div>

            {/* ================= QUIZ CHALLENGE SECTION ================= */}
            <section className="mt-8 mb-4">
              <div className="relative bg-shimmer rounded-3xl p-8 shadow-2xl border-4 border-white overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                      <Trophy size={40} className="text-white animate-bounce animate-sparkle" />
                      <h3 className="text-3xl md:text-4xl font-bold text-white font-[Comic Neue]">
                        Test Your Knowledge!
                      </h3>
                      <PartyPopper size={40} className="text-white animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                    <p className="text-xl text-white font-[Poppins] opacity-90">
                      Take a fun quiz and become a Super Learner! 🌟
                    </p>
                  </div>
                  
                  <button
                    onClick={generateQuiz}
                    disabled={isProcessing || !hasExplainer}
                    className="bg-white text-[#FF6B6B] font-bold text-2xl py-5 px-10 rounded-full shadow-2xl hover:shadow-none hover:scale-110 transition-all duration-300 flex items-center gap-4 border-4 border-[#FFD700] animate-pulse disabled:opacity-50 disabled:cursor-not-allowed hover-wiggle"
                    style={{ animationDuration: "1.5s" }}
                  >
                    <span className="text-4xl">🎯</span>
                    Start Quiz!
                    <span className="text-4xl">✨</span>
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ================= BOTTOM SECTION: RELATED TOPICS ================= */}
        <section className="mt-4" data-explore-section>
          <div className="mb-6 px-2">
            <h3 className="text-4xl font-bold bg-gradient-to-r from-[#FF6B6B] via-[#FFA500] to-[#4CAF50] bg-clip-text text-transparent font-[Comic Neue] flex items-center gap-3 animate-pulse">
              Keep Exploring! 🚀
            </h3>
          </div>
          
          <div 
            ref={(el) => {
              if (el && !el.dataset.carouselActive) {
                el.dataset.carouselActive = 'true';
                const scrollInterval = setInterval(() => {
                  if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
                    el.scrollTo({ left: 0, behavior: 'smooth' });
                  } else {
                    el.scrollBy({ left: 240, behavior: 'smooth' });
                  }
                }, 1500);
                
                el.addEventListener('mouseenter', () => clearInterval(scrollInterval));
                el.addEventListener('mouseleave', () => {
                  const newInterval = setInterval(() => {
                    if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
                      el.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                      el.scrollBy({ left: 240, behavior: 'smooth' });
                    }
                  }, 1000);
                  el.addEventListener('mouseenter', () => clearInterval(newInterval), { once: true });
                });
              }
            }}
            className="flex gap-6 overflow-x-auto pb-4 snap-x px-1 scrollbar-hide"
          >
            {[
              { topic: 'Dinosaurs', emoji: '🦖', gradient: 'from-[#FF6B6B] to-[#FF8A65]' },
              { topic: 'Ocean Life', emoji: '🐳', gradient: 'from-[#2196F3] to-[#81D4FA]' },
              { topic: 'Volcanoes', emoji: '🌋', gradient: 'from-[#FF5722] to-[#FFAB91]' },
              { topic: 'Rainforest', emoji: '🌴', gradient: 'from-[#4CAF50] to-[#81C784]' },
              { topic: 'Space Travel', emoji: '🚀', gradient: 'from-[#9C27B0] to-[#CE93D8]' },
              { topic: 'Insects', emoji: '🐞', gradient: 'from-[#FFD700] to-[#FFE082]' },
              { topic: 'Ancient Egypt', emoji: '🏺', gradient: 'from-[#DEB887] to-[#F4A460]' },
              { topic: 'Weather', emoji: '⛈️', gradient: 'from-[#87CEEB] to-[#B0E0E6]' },
              { topic: 'Human Body', emoji: '🫀', gradient: 'from-[#FF69B4] to-[#FFB6C1]' },
              { topic: 'Robots', emoji: '🤖', gradient: 'from-[#708090] to-[#A9A9A9]' },
              { topic: 'Antarctica', emoji: '🐧', gradient: 'from-[#E0FFFF] to-[#B0E2FF]' },
              { topic: 'Magic Tricks', emoji: '🎩', gradient: 'from-[#4B0082] to-[#8A2BE2]' },
              { topic: 'Castles', emoji: '🏰', gradient: 'from-[#CD853F] to-[#DEB887]' },
              { topic: 'Music', emoji: '🎵', gradient: 'from-[#FF1493] to-[#FF69B4]' },
              { topic: 'Planets', emoji: '🪐', gradient: 'from-[#191970] to-[#4169E1]' },
              { topic: 'Sports', emoji: '⚽', gradient: 'from-[#32CD32] to-[#98FB98]' }
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => handleTopicSelect(item.topic)}
                disabled={isProcessing || isListening}
                className={`min-w-[180px] md:min-w-[220px] h-40 md:h-48 bg-gradient-to-br ${item.gradient} rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-4 p-6 cursor-pointer transition-all duration-300 border-4 border-white snap-start relative overflow-hidden group hover-lift hover-wiggle disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {/* Decorative shine effect */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-20 rounded-full blur-xl group-hover:opacity-40 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-10 rounded-full blur-lg"></div>
                
                <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-4xl md:text-5xl shadow-lg group-hover:scale-125 transition-transform duration-300">
                  {item.emoji}
                </div>
                <span className="relative z-10 font-bold text-white text-xl md:text-2xl drop-shadow-lg font-[Comic Neue] text-center">
                  {item.topic}
                </span>
              </button>
            ))}
          </div>
        </section>

        </main>
      </div>

      {/* ================= QUIZ MODAL ================= */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#FFE5E5] via-[#FFF9E5] to-[#E8F5E9] border-4 border-[var(--cta-primary)] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-[var(--text-primary)] font-[Comic Neue] flex items-center justify-center gap-3">
              <Trophy size={32} className="text-[#FFD700]" />
              Quiz Time! 🎉
              <PartyPopper size={32} className="text-[#FF6B6B]" />
            </DialogTitle>
          </DialogHeader>

          {!isQuizComplete ? (
            <div className="space-y-6 p-6">
              {/* Progress Bar */}
              <div className="flex gap-2 justify-center">
                {quizQuestions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-3 flex-1 rounded-full transition-all duration-300 ${
                      idx < currentQuizQuestion
                        ? "bg-green-500"
                        : idx === currentQuizQuestion
                        ? "bg-[#FFD700] animate-pulse"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Question Counter */}
              <div className="text-center text-lg font-bold text-[var(--text-primary)]">
                Question {currentQuizQuestion + 1} of {quizQuestions.length}
              </div>

              {/* Question */}
              {quizQuestions[currentQuizQuestion] && (
                <>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-[#FFA500]">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] text-center font-[Comic Neue]">
                      {quizQuestions[currentQuizQuestion].question}
                    </h3>
                  </div>

                  {/* Answer Options - 2 options */}
                  <div className="grid grid-cols-1 gap-4">
                    {quizQuestions[currentQuizQuestion].options.map((option: string, idx: number) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === quizQuestions[currentQuizQuestion].correctAnswer;
                      const showResult = selectedAnswer !== null;

                      const colors = [
                        { bg: "bg-[#D3EEE4]", border: "border-[#55ECB4]", hover: "hover:bg-[#55ECB4]" },
                        { bg: "bg-[#D8CCEB]", border: "border-[#AF8CE8]", hover: "hover:bg-[#AF8CE8]" },
                      ];

                      const colorScheme = colors[idx % 2];

                      let className = `${colorScheme.bg} ${colorScheme.border} ${colorScheme.hover} border-4 rounded-2xl p-4 text-lg font-bold text-[var(--text-primary)] text-center cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl`;

                      if (showResult) {
                        if (isSelected && isCorrect) {
                          className = "bg-green-500 border-green-700 border-4 rounded-2xl p-4 text-lg font-bold text-white text-center scale-110 shadow-2xl animate-bounce";
                        } else if (isSelected && !isCorrect) {
                          className = "bg-red-500 border-red-700 border-4 rounded-2xl p-4 text-lg font-bold text-white text-center shake";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleQuizAnswer(idx)}
                          disabled={selectedAnswer !== null}
                          className={className}
                        >
                          {option}
                          {showResult && isSelected && isCorrect && " ✓"}
                          {showResult && isSelected && !isCorrect && " ✗"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Result Message */}
                  {showQuizResult && selectedAnswer !== null && (
                    <div className="bg-green-100 border-4 border-green-500 rounded-2xl p-6 text-center animate-in slide-in-from-bottom-4 duration-500">
                      <div className="text-4xl mb-2">🎉</div>
                      <p className="text-2xl font-bold text-green-700 font-[Comic Neue]">
                        Correct! Great job! 🌟
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Quiz Complete - Show Prize */
            <div className="space-y-6 p-8 text-center">
              <div className="text-8xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-4xl font-bold text-[var(--text-primary)] font-[Comic Neue] mb-4">
                Amazing Work, Champion! 🎊
              </h2>
              <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-3xl p-8 shadow-2xl border-4 border-[#FF6B6B]">
                <p className="text-3xl font-bold text-white mb-4">
                  You scored {quizScore} out of {quizQuestions.length}!
                </p>
                <div className="flex justify-center gap-4 text-5xl mb-4">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>⭐</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>🎯</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>🎁</span>
                </div>
                <p className="text-2xl text-white font-[Poppins]">
                  You got a 🍫🍬
                </p>
              </div>
              
              <button
                onClick={closeQuiz}
                className="mt-6 bg-[var(--cta-primary)] text-white font-bold text-xl py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Continue Learning! 🚀
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= CLASS SELECTION MODAL ================= */}
      <Dialog open={showClassModal} onOpenChange={setShowClassModal}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-[#FFE5E5] via-[#FFF9E5] to-[#E8F5E9] border-4 border-[#4CAF50] rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold text-center text-[var(--text-primary)] font-[Comic Neue] flex items-center justify-center gap-3">
              <span className="text-5xl">📚</span>
              What Class Are You In?
              <span className="text-5xl">🎓</span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <p className="text-center text-xl text-[var(--text-secondary)] font-[Poppins] font-semibold">
              Choose your class level so we can pick the right difficulty level for you! 😊
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {classOptions.map((classLevel) => {
                const displayName = classLevel === "Kindergarten" ? "KG" : classLevel;
                return (
                  <button
                    key={classLevel}
                    onClick={() => handleClassSelect(classLevel)}
                    className="bg-white border-4 border-[#4CAF50] rounded-2xl p-6 text-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:bg-[#E8F5E9] active:scale-95"
                  >
                    <div className="text-4xl mb-2 font-bold">
                      {classLevel === "Nursery" && "👶"}
                      {classLevel === "Kindergarten" && "🎈"}
                      {classLevel === "1" && "1️⃣"}
                      {classLevel === "2" && "2️⃣"}
                      {classLevel === "3" && "3️⃣"}
                      {classLevel === "4" && "4️⃣"}
                      {classLevel === "5" && "5️⃣"}
                    </div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      {displayName}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-white/80 rounded-xl border-2 border-[#FFA500]">
              <p className="text-center text-sm text-[var(--text-secondary)] font-[Poppins]">
                ✨ You can change this anytime! Just click the pencil icon next to your class name. ✨
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function normalizeDialogueKey(dialogue: string): string {
  return String(dialogue || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}