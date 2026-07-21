import { useCallback, useMemo, useRef, useState } from 'react';

export function getVoiceCapabilities(browser = globalThis) {
  const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  return {
    Recognition,
    canRecognize: typeof Recognition === 'function',
    canSynthesize: Boolean(browser.speechSynthesis && typeof browser.SpeechSynthesisUtterance === 'function')
  };
}

export function voiceErrorMessage(errorCode) {
  if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
    return 'Microphone permission was not allowed. You can type or tap a response instead.';
  }
  if (errorCode === 'no-speech') {
    return 'I did not hear words that time. You can try again, type, or tap a response.';
  }
  return 'Voice input is taking a pause. You can type or tap a response instead.';
}

export function useVoice({ browser = globalThis, onTranscript } = {}) {
  const capabilities = useMemo(() => getVoiceCapabilities(browser), [browser]);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!capabilities.canRecognize) {
      setError('Voice input is not available here. You can type or tap a response instead.');
      return false;
    }

    setError('');
    setTranscript('');
    const recognition = new capabilities.Recognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const words = Array.from(event.results).map((result) => result[0].transcript).join('').trim();
      setTranscript(words);
      if (event.results[event.results.length - 1]?.isFinal && words) { setIsListening(false); onTranscript?.(words); }
    };
    recognition.onerror = (event) => {
      setError(voiceErrorMessage(event.error));
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
      return true;
    } catch (_error) {
      setError(voiceErrorMessage());
      return false;
    }
  }, [capabilities, onTranscript]);

  const speak = useCallback((message) => {
    if (!capabilities.canSynthesize) {
      setError('Voice playback is not available here. The companion’s words are still on screen.');
      return false;
    }

    const utterance = new browser.SpeechSynthesisUtterance(message);
    setIsSpeaking(true);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setError('Voice playback paused, but the companion’s words are still on screen.');
    };
    browser.speechSynthesis.cancel();
    browser.speechSynthesis.speak(utterance);
    return true;
  }, [browser, capabilities]);

  return { ...capabilities, isListening, isSpeaking, transcript, error, startListening, stopListening, speak };
}
