from google.cloud import texttospeech
import uuid

client = texttospeech.TextToSpeechClient()

def generate_tts(text, language_code="hi-IN"):
    synthesis_input = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code=language_code,
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )

    filename = f"audio_{uuid.uuid4()}.mp3"
    with open(filename, "wb") as f:
        f.write(response.audio_content)

    return filename
