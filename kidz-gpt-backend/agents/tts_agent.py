import uuid
import os
import base64
import pyttsx3
import subprocess
import tempfile

def generate_tts(text, language):
    # Validate input text
    if not text or not isinstance(text, str) or not text.strip():
        raise ValueError(f"TTS requires non-empty text. Received: {repr(text)}")
    
    text = text.strip()
    wav_filename = f"audio_{uuid.uuid4()}.wav"
    mp3_filename = None
    engine = pyttsx3.init()

    # Find a voice for the given language
    voices = engine.getProperty('voices')
    selected_voice = None
    
    # Map language codes to voice search patterns
    lang_voice_map = {
        "hi": ["hi", "hindi", "hin"],
        "bn": ["bn", "bengali", "ben"],
        "ta": ["ta", "tamil", "tam"],
        "te": ["te", "telugu", "tel"],
        "en": ["en", "english", "eng"]
    }
    
    search_patterns = lang_voice_map.get(language.lower(), [language.lower()])
    
    for pattern in search_patterns:
        for voice in voices:
            if hasattr(voice, 'lang') and voice.lang:
                voice_lang = voice.lang.lower()
                if pattern in voice_lang or voice_lang.startswith(pattern):
                    selected_voice = voice.id
                    break
        if selected_voice:
            break
    
    # If no exact match, try to find a partial match
    if not selected_voice:
        for voice in voices:
            if hasattr(voice, 'lang') and voice.lang and voice.lang.startswith(language):
                selected_voice = voice.id
                break

    if not selected_voice:
        print(f"⚠️ Warning: No voice found for language '{language}'. Falling back to default voice.")
        try:
            available_voices = []
            for voice in voices:
                if hasattr(voice, 'lang') and voice.lang:
                    available_voices.append(f"- ID: {voice.id}, Lang: {voice.lang}, Name: {voice.name}")
            if available_voices:
                print("ℹ️ Available voices:")
                for v in available_voices[:5]:  # Limit output
                    print(v)
            else:
                print("ℹ️ No voices with language information found.")
        except Exception as e:
            print(f"ℹ️ Could not list available voices: {e}")

    if selected_voice:
        engine.setProperty('voice', selected_voice)

    # Generate audio file
    try:
        engine.save_to_file(text, wav_filename)
        engine.runAndWait()
        
        # Check if file was created
        if not os.path.exists(wav_filename) or os.path.getsize(wav_filename) == 0:
            raise Exception("TTS engine failed to generate audio file")
        
        # Convert WAV to MP3 for better browser compatibility
        mp3_filename = wav_filename.replace('.wav', '.mp3')
        try:
            # Use ffmpeg to convert WAV to MP3
            subprocess.run(
                ['ffmpeg', '-i', wav_filename, '-acodec', 'libmp3lame', '-ab', '128k', '-y', mp3_filename],
                check=True,
                capture_output=True,
                timeout=10
            )
            
            # Read MP3 file
            with open(mp3_filename, 'rb') as audio_file:
                audio_bytes = audio_file.read()
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Clean up files
            if os.path.exists(wav_filename):
                os.remove(wav_filename)
            if os.path.exists(mp3_filename):
                os.remove(mp3_filename)
            
            return audio_base64
            
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
            # Fallback to WAV if ffmpeg is not available
            print(f"⚠️ FFmpeg conversion failed, using WAV: {e}")
            with open(wav_filename, 'rb') as audio_file:
                audio_bytes = audio_file.read()
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            if os.path.exists(wav_filename):
                os.remove(wav_filename)
            
            return audio_base64
            
    except Exception as e:
        # Clean up on error
        for f in [wav_filename, mp3_filename]:
            if f and os.path.exists(f):
                try:
                    os.remove(f)
                except:
                    pass
        raise Exception(f"Failed to generate TTS audio: {str(e)}")
