from functools import lru_cache
from deep_translator import GoogleTranslator

@lru_cache(maxsize=128)
def translate_text(text: str, to_language: str = "en") -> str:
    if not text or not text.strip():
        return ""
    try:
        # Using GoogleTranslator from deep-translator
        return GoogleTranslator(source='auto', target=to_language).translate(text)
    except Exception as e:
        print(f"Error translating text: {e}")
        return text