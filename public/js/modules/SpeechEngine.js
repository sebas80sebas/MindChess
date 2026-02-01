export default class SpeechEngine {
    constructor(callbacks) {
        this.language = 'en-US';
        this.recognition = null;
        this.isListening = false;
        this.synth = window.speechSynthesis;
        
        // callbacks: { onCommand: (text) => void, onError: (error) => void, onStateChange: (state) => void }
        this.onCommand = callbacks.onCommand;
        this.onError = callbacks.onError;
        this.onStateChange = callbacks.onStateChange;

        this._initRecognition();
    }

    _initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = this.language;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.stopListening(); // Auto-stop after one command (as per original logic, can be changed later)
                if (this.onCommand) this.onCommand(transcript);
            };

            this.recognition.onerror = (event) => {
                this.isListening = false;
                if (this.onStateChange) this.onStateChange(false);
                if (this.onError) this.onError(event.error);
            };

            this.recognition.onend = () => {
                // If we want continuous listening, we'd restart here. 
                // For now, mirroring original behavior: button toggle or 'V' key toggles.
                // However, the original code had a restart logic if isListening was true.
                if (this.isListening) {
                    try {
                        this.recognition.start();
                    } catch (e) {
                        this.isListening = false;
                        if (this.onStateChange) this.onStateChange(false);
                    }
                } else {
                     if (this.onStateChange) this.onStateChange(false);
                }
            };
        } else {
            console.warn("Speech Recognition not supported in this browser.");
        }
    }

    get isSupported() {
        return !!this.recognition;
    }

    setLanguage(lang) {
        this.language = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    toggleListening() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (!this.recognition || this.isListening) return;
        try {
            this.recognition.start();
            this.isListening = true;
            if (this.onStateChange) this.onStateChange(true);
        } catch (e) {
            console.error("Error starting recognition:", e);
        }
    }

    stopListening() {
        if (!this.recognition || !this.isListening) return;
        this.isListening = false;
        this.recognition.stop();
        if (this.onStateChange) this.onStateChange(false);
    }

    speak(text, priority = false) {
        if (priority) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.language;
        utterance.pitch = 1.0; // Normalized pitch
        utterance.rate = 0.9;
        utterance.volume = 1.0;

        // Voice selection logic
        const voices = this.synth.getVoices();
        if (voices.length > 0) {
            this._setVoice(utterance, voices);
            this.synth.speak(utterance);
        } else {
            this.synth.onvoiceschanged = () => {
                const updatedVoices = this.synth.getVoices();
                this._setVoice(utterance, updatedVoices);
                this.synth.speak(utterance);
            };
        }
    }

    _setVoice(utterance, voices) {
        const langCode = this.language.split('-')[0];
        const langVoices = voices.filter(v => v.lang.startsWith(langCode));
        const preferredVoice = langVoices.find(v => v.name.includes('Google')) || langVoices[0] || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
    }
}
