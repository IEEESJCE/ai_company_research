import { VoiceStatus } from '@/types/accountPlan';

export interface VoiceCallbacks {
  onResult: (text: string) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export class VoiceRecognition {
  private recognition: any = null;
  private synthesis: any;
  private isListening = false;
  private isSpeaking = false;
  private callbacks: VoiceCallbacks | null = null;

  constructor() {
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    if (typeof window !== 'undefined') {
      // @ts-ignore - SpeechRecognition API types
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
      }
    }

    if (this.recognition) {
      this.setupRecognition();
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks?.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Send final results, ignore interim for cleaner UX
      if (finalTranscript) {
        this.callbacks?.onResult(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = 'Voice recognition error';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not available. Please check your permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Voice recognition service not available.';
          break;
        default:
          errorMessage = `Voice recognition error: ${event.error}`;
      }

      this.isListening = false;
      this.callbacks?.onError(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks?.onEnd?.();
    };
  }

  startListening(callbacks: VoiceCallbacks): void {
    if (!this.isSupported()) {
      callbacks.onError('Voice recognition is not supported in this browser');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.callbacks = callbacks;

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        callbacks.onError('Failed to start voice recognition');
      }
    } else {
      callbacks.onError('Speech recognition not available');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  speak(text: string, callbacks?: Partial<VoiceCallbacks>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        const error = 'Text-to-speech is not supported in this browser';
        callbacks?.onError?.(error);
        reject(new Error(error));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        this.isSpeaking = true;
        callbacks?.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        callbacks?.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        const errorMessage = `Text-to-speech error: ${event.error}`;
        callbacks?.onError?.(errorMessage);
        reject(new Error(errorMessage));
      };

      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  isSupported(): boolean {
    return !!(typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) &&
      window.speechSynthesis);
  }

  getStatus(): VoiceStatus {
    return {
      isSupported: this.isSupported(),
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
    };
  }

  // Get available voices for language selection
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices().filter(voice => voice.lang.startsWith('en'));
  }

  // Check for microphone permissions
  async checkMicrophonePermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      return 'prompt'; // Unknown
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state;
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      return 'prompt';
    }
  }

  // Request microphone permission
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up
      return true;
    } catch (error) {
      console.warn('Microphone permission denied:', error);
      return false;
    }
  }

  // Set recognition language
  setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  // Set speech options
  setSpeechOptions(options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  }): void {
    // Store options for next utterance
    this.speechOptions = options;
  }

  private speechOptions: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  } = {};

  // Apply stored options to utterance
  private applySpeechOptions(utterance: SpeechSynthesisUtterance): void {
    if (this.speechOptions.rate !== undefined) {
      utterance.rate = this.speechOptions.rate;
    }
    if (this.speechOptions.pitch !== undefined) {
      utterance.pitch = this.speechOptions.pitch;
    }
    if (this.speechOptions.volume !== undefined) {
      utterance.volume = this.speechOptions.volume;
    }
    if (this.speechOptions.voice) {
      utterance.voice = this.speechOptions.voice;
    }
  }

  // Enhanced speak method with options
  speakWithOptions(
    text: string,
    callbacks?: Partial<VoiceCallbacks>,
    options?: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: SpeechSynthesisVoice;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        const error = 'Text-to-speech is not supported in this browser';
        callbacks?.onError?.(error);
        reject(new Error(error));
        return;
      }

      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';

      // Apply provided options or stored defaults
      const finalOptions = { ...this.speechOptions, ...options };
      if (finalOptions.rate !== undefined) utterance.rate = finalOptions.rate;
      if (finalOptions.pitch !== undefined) utterance.pitch = finalOptions.pitch;
      if (finalOptions.volume !== undefined) utterance.volume = finalOptions.volume;
      if (finalOptions.voice) utterance.voice = finalOptions.voice;

      utterance.onstart = () => {
        this.isSpeaking = true;
        callbacks?.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        callbacks?.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        const errorMessage = `Text-to-speech error: ${event.error}`;
        callbacks?.onError?.(errorMessage);
        reject(new Error(errorMessage));
      };

      this.synthesis.speak(utterance);
    });
  }

  // Cleanup method
  destroy(): void {
    this.stopListening();
    this.stopSpeaking();
    this.callbacks = null;
  }
}

// Singleton instance for the application
export const voiceRecognition = new VoiceRecognition();