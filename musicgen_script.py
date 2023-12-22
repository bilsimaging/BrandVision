from transformers import AutoProcessor, MusicgenForConditionalGeneration
import scipy.io.wavfile

def generate_music(input_text):
    processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
    model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
    inputs = processor(text=[input_text], padding=True, return_tensors="pt")
    audio_values = model.generate(**inputs, max_new_tokens=512)
    sampling_rate = model.config.audio_encoder.sampling_rate

    audio_filename = "generated_music.wav"
    scipy.io.wavfile.write(audio_filename, rate=sampling_rate, data=audio_values[0, 0].numpy())
    return audio_filename
