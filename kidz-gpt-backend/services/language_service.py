from langdetect import detect, detect_langs
import re

def detect_language(text):
    """
    Detect the language of the given text with support for Indian languages.
    Returns ISO 639-1 language code (e.g., 'hi', 'en', 'bn', 'ta', 'te').
    """
    if not text or text.strip() == "":
        return "unknown"
    
    try:
        # Try to get probabilities for better confidence
        try:
            detected_langs = detect_langs(text)
            if detected_langs and len(detected_langs) > 0:
                # Get the language with highest probability
                top_lang = detected_langs[0]
                lang_code = top_lang.lang
                confidence = top_lang.prob
                print(f"🔍 Language detection: {lang_code} (confidence: {confidence:.2f})")
                return lang_code
        except:
            pass
        
        # Fallback to basic detect if probabilities fail
        result = detect(text)
        print(f"🔍 Language detected: {result}")
        return result
        
    except Exception as e:
        print(f"⚠️ Language detection failed: {e}")
        # Check for script-based detection as last resort
        if _contains_devanagari(text):
            return "hi"
        elif _contains_bengali(text):
            return "bn"
        elif _contains_tamil(text):
            return "ta"
        elif _contains_telugu(text):
            return "te"
        return "unknown"

def _contains_devanagari(text):
    """Check if text contains Devanagari script (Hindi, Sanskrit, Marathi)."""
    devanagari_range = re.compile(r'[\u0900-\u097F]')
    return bool(devanagari_range.search(text))

def _contains_bengali(text):
    """Check if text contains Bengali script."""
    bengali_range = re.compile(r'[\u0980-\u09FF]')
    return bool(bengali_range.search(text))

def _contains_tamil(text):
    """Check if text contains Tamil script."""
    tamil_range = re.compile(r'[\u0B80-\u0BFF]')
    return bool(tamil_range.search(text))

def _contains_telugu(text):
    """Check if text contains Telugu script."""
    telugu_range = re.compile(r'[\u0C60-\u0C7F]')
    return bool(telugu_range.search(text))
