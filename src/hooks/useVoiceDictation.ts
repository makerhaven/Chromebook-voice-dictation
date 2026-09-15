import { useState, useEffect, useRef, useCallback } from 'react';
import { playEarcon } from '../utils/audioSynthesis';

interface VoiceDictationHook {
  isListening: boolean;
  isPaused: boolean;
  thoughtComplete: boolean;
  rawDraft: string;
  interimTranscript: string;
  audioLevel: number;
  micError: string | null;
  supported: boolean;
  startListening: () => void;
  stopListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  markThoughtComplete: () => void;
  setRawDraft: (text: string) => void;
  clearDraft: () => void;
  simulateSpeechPhrase: (customPhrase?: string) => void;
}

const SAMPLE_CHROMEBOOK_PHRASES = [
  "and up please make sure the design review is scheduled and uploaded for tomorrow morning up on the shared drive",
  "and we need to sync up with the product manager and finalize the accessibility requirements up for ChromeOS",
  "um basically I wanted to follow up and see if the presentation slides are ready and approved by the team",
  "and up let's send an email to the client confirming the deployment date and time up for next Tuesday",
  "and I am typing this voice note directly into the Chromebook target text box and verifying the transcript",
];

export function useVoiceDictation(onSpeechEnd?: (finalText: string) => void): VoiceDictationHook {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [thoughtComplete, setThoughtComplete] = useState<boolean>(false);
  const [rawDraft, setRawDraft] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const draftAccumulatorRef = useRef<string>('');

  // Check Web Speech API availability
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  // Audio waveform meter setup
  const startAudioMeter = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch {
      // Audio level fallback simulation will trigger if mic permission is limited
      const simulateMeter = () => {
        if (!isListening || isPaused) {
          setAudioLevel(0);
          return;
        }
        setAudioLevel(Math.floor(25 + Math.random() * 55));
        animFrameRef.current = requestAnimationFrame(simulateMeter);
      };
      simulateMeter();
    }
  }, [isListening, isPaused]);

  const stopAudioMeter = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    // After 1.6 seconds of silence, flag the thought as complete
    silenceTimerRef.current = setTimeout(() => {
      if (draftAccumulatorRef.current.trim().length > 0) {
        setThoughtComplete(true);
      }
    }, 1600);
  }, []);

  const startListening = useCallback(() => {
    setMicError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback: run simulated real-time dictation stream for demonstration
      setIsListening(true);
      setIsPaused(false);
      setThoughtComplete(false);
      playEarcon('start');
      simulateSpeechPhrase();
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setIsPaused(false);
        setThoughtComplete(false);
        playEarcon('start');
        startAudioMeter();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += ' ' + transcriptChunk;
          } else {
            interim += ' ' + transcriptChunk;
          }
        }

        if (final.trim()) {
          draftAccumulatorRef.current = (draftAccumulatorRef.current + ' ' + final).trim();
          setRawDraft(draftAccumulatorRef.current);
          setInterimTranscript('');
          setThoughtComplete(false);
          resetSilenceTimer();
        } else if (interim.trim()) {
          setInterimTranscript(interim.trim());
          setThoughtComplete(false);
          resetSilenceTimer();
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Microphone access blocked. Click "Simulate Phrase" to test without microphone.');
          setIsListening(false);
          stopAudioMeter();
        }
      };

      recognition.onend = () => {
        // If still flagged as listening and not paused, restart continuous recognition
        if (isListening && !isPaused) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            stopAudioMeter();
          }
        } else {
          setIsListening(false);
          stopAudioMeter();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      // Fallback
      setIsListening(true);
      simulateSpeechPhrase();
    }
  }, [isListening, isPaused, resetSilenceTimer, startAudioMeter, stopAudioMeter]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setIsPaused(false);
    playEarcon('stop');
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    stopAudioMeter();
    if (draftAccumulatorRef.current.trim().length > 0) {
      setThoughtComplete(true);
    }
  }, [stopAudioMeter]);

  const pauseListening = useCallback(() => {
    setIsPaused(true);
    playEarcon('click');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setThoughtComplete(true);
    stopAudioMeter();
  }, [stopAudioMeter]);

  const resumeListening = useCallback(() => {
    setIsPaused(false);
    startListening();
  }, [startListening]);

  const markThoughtComplete = useCallback(() => {
    setThoughtComplete(true);
    playEarcon('click');
  }, []);

  const clearDraft = useCallback(() => {
    setRawDraft('');
    setInterimTranscript('');
    draftAccumulatorRef.current = '';
    setThoughtComplete(false);
  }, []);

  // Simulator helper: streams words one by one as if live voice
  const simulateSpeechPhrase = useCallback((customPhrase?: string) => {
    const phrase =
      customPhrase ||
      SAMPLE_CHROMEBOOK_PHRASES[Math.floor(Math.random() * SAMPLE_CHROMEBOOK_PHRASES.length)];
    const words = phrase.split(' ');
    let currentIdx = 0;
    let accumulated = '';

    setIsListening(true);
    setIsPaused(false);
    setThoughtComplete(false);

    // Audio meter pulse during simulation
    const meterInterval = setInterval(() => {
      setAudioLevel(Math.floor(30 + Math.random() * 60));
    }, 120);

    const wordInterval = setInterval(() => {
      if (currentIdx < words.length) {
        accumulated += (accumulated ? ' ' : '') + words[currentIdx];
        draftAccumulatorRef.current = accumulated;
        setRawDraft(accumulated);
        setInterimTranscript(words.slice(currentIdx + 1, currentIdx + 3).join(' '));
        currentIdx++;
      } else {
        clearInterval(wordInterval);
        clearInterval(meterInterval);
        setInterimTranscript('');
        setAudioLevel(0);
        setIsListening(false);
        setThoughtComplete(true);
        playEarcon('stop');
      }
    }, 280);
  }, []);

  return {
    isListening,
    isPaused,
    thoughtComplete,
    rawDraft,
    interimTranscript,
    audioLevel,
    micError,
    supported,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    markThoughtComplete,
    setRawDraft: (t: string) => {
      draftAccumulatorRef.current = t;
      setRawDraft(t);
    },
    clearDraft,
    simulateSpeechPhrase,
  };
}
