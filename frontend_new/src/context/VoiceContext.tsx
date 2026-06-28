import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// Define Speech Recognition Interfaces since they are not standard in TS yet
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export type AssistantState = 'Idle' | 'Requesting' | 'Listening' | 'Active' | 'Processing' | 'Speaking' | 'Error';

export interface VoiceContextType {
  state: AssistantState;
  transcript: string;
  feedback: string;
  isActiveListening: boolean;
  intent: { action: string, timestamp: number } | null;
  startActiveListening: () => void;
  pauseListening: () => void;
  triggerSos: () => void;
  speak: (text: string) => void;
  setFeedbackState: (fb: string) => void;
  setAssistantState: (st: AssistantState) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<AssistantState>('Idle');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(t('assistant.idle_msg'));
  const [isActiveListening, setIsActiveListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [intent, setIntent] = useState<{action: string, timestamp: number} | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Intent Handlers (to be wired up with other contexts)
  const processCommand = async (cmd: string) => {
    setState('Processing');
    setFeedback(t('assistant.processing'));
    setTranscript(cmd);

    try {
      // Use the *current* translation language to check intents 
      // (This works perfectly because Whisper just changed i18n.language before calling this!)
      const matchIntent = (intentKeys: string[]) => intentKeys.some(key => cmd.includes(key.toLowerCase()));
      
      const intentsFront = t('intents.front_of_me', { returnObjects: true }) as string[];
      const intentsRead = t('intents.read_text', { returnObjects: true }) as string[];
      const intentsSos = t('intents.help_sos', { returnObjects: true }) as string[];
      const intentsLocation = t('intents.location', { returnObjects: true }) as string[];
      const intentsStop = t('intents.stop', { returnObjects: true }) as string[];
      const intentsLaunch = t('intents.launch', { returnObjects: true }) as string[];
      const intentsDemo = t('intents.demo', { returnObjects: true }) as string[];
      const intentsLogin = t('intents.login', { returnObjects: true }) as string[];
      const intentsAdmin = t('intents.admin', { returnObjects: true }) as string[];

      if (matchIntent(intentsFront)) {
        setIntent({ action: 'vision_detect', timestamp: Date.now() });
      } else if (matchIntent(intentsRead)) {
        setIntent({ action: 'vision_ocr', timestamp: Date.now() });
      } else if (matchIntent(intentsSos)) {
        triggerSos();
      } else if (matchIntent(intentsLocation)) {
        setIntent({ action: 'location_get', timestamp: Date.now() });
      } else if (matchIntent(intentsStop)) {
        speak(t('assistant.stopping'));
        setIsActiveListening(false);
      } else if (matchIntent(intentsLaunch)) {
        speak(t('assistant.launching_app'));
        setTimeout(() => window.location.href = '/assistant', 1500);
      } else if (matchIntent(intentsDemo)) {
        speak(t('assistant.opening_demo'));
        setTimeout(() => window.location.href = '/#demo', 1500);
      } else if (matchIntent(intentsLogin)) {
        speak(t('assistant.opening_caregiver'));
        setTimeout(() => window.location.href = '/caregiver', 1500);
      } else if (matchIntent(intentsAdmin)) {
        speak(t('assistant.opening_admin'));
        setTimeout(() => window.location.href = '/admin', 1500);
      } else if (cmd.startsWith('run command ')) {
        const sysCmd = cmd.replace('run command ', '').trim();
        speak('Executing system command');
        try {
          const res = await fetch('http://localhost:5000/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: sysCmd })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            speak('Command executed successfully');
            console.log('Command Output:', data.stdout);
          } else {
            speak('Command execution failed');
            console.error('Command Error:', data.error || data.stderr);
          }
        } catch (e) {
          console.error(e);
          speak('Failed to reach execution server');
        }
      } else {
        speak(t('assistant.error_command'));
      }
    } catch (err) {
      speak(t('assistant.error_exec'));
    }
  };

  const setFeedbackState = (fb: string) => setFeedback(fb);
  const setAssistantState = (st: AssistantState) => setState(st);

  const speak = useCallback((text: string) => {
    setState('Speaking');
    setFeedback(text);
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const currentLangPrefix = i18n.language.split('-')[0]; // e.g. "en", "es", "fr", "hi", "te"
      const bestVoice = voices.find(v => v.lang.startsWith(currentLangPrefix) && (v.name.includes('Natural') || v.name.includes('Premium'))) 
                        || voices.find(v => v.lang.startsWith(currentLangPrefix)) 
                        || voices[0];
      utterance.voice = bestVoice;
    }

    utterance.onend = () => {
      // Resume listening
      if (!isActiveListening) {
        setState('Listening');
        setFeedback(t('assistant.wake_prompt'));
        try {
          if (recognition) recognition.start();
        } catch (e) {}
      } else {
        setState('Active');
        setFeedback(t('assistant.active_prompt'));
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [isActiveListening, recognition, i18n.language, t]);

  const triggerSos = async () => {
    speak(t('assistant.sos_activated'));
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          await fetch('http://localhost:5000/api/sos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: 'test_user_id', 
              latitude: pos.coords.latitude, 
              longitude: pos.coords.longitude 
            })
          });
        } catch (e) {
          console.error("SOS Trigger Error", e);
        }
      });
    } else {
      // Fallback SOS
      try {
        await fetch('http://localhost:5000/api/sos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'test_user_id' })
        });
      } catch (e) {}
    }
  };

  useEffect(() => {
    // Send periodic location updates
    const locInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          fetch('http://localhost:5000/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: 'test_user_id', 
              latitude: pos.coords.latitude, 
              longitude: pos.coords.longitude 
            })
          }).catch(() => {});
        });
      }
    }, 30000); // 30s as requested

    return () => clearInterval(locInterval);
  }, []);

  useEffect(() => {
    const SpeechRec = (window as IWindow).SpeechRecognition || (window as IWindow).webkitSpeechRecognition;
    if (!SpeechRec) {
      setState('Error');
      setFeedback(t('assistant.speech_not_supported'));
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'hi': 'hi-IN',
      'te': 'te-IN'
    };
    rec.lang = langMap[i18n.language] || 'en-US';

    rec.onstart = () => {
      if (state !== 'Speaking' && state !== 'Processing' && !isActiveListening) {
        setState('Listening');
      }
    };

    rec.onresult = (event: any) => {
      // If we are actively recording audio for Whisper, ignore local speech recognition
      if (isActiveListening) return;

      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      
      const text = (final || interim).toLowerCase().trim();
      setTranscript(text);
      setFeedback(`... ${text} ...`);

      if (final) {
        const wakeWords = t('wake_words', { returnObjects: true }) as string[];
        if (wakeWords.some(w => final.includes(w))) {
          startActiveListening();
        }
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setState('Error');
        setFeedback(t('assistant.mic_blocked'));
      }
    };

    rec.onend = () => {
      if (state !== 'Error' && state !== 'Speaking' && state !== 'Processing' && !isActiveListening) {
        try { rec.start(); } catch (err) {}
      }
    };

    setRecognition(rec);
  }, [isActiveListening, state, i18n.language, t]);

  useEffect(() => {
    if (recognition && state !== 'Error') {
      try {
        const langMap: Record<string, string> = {
          'en': 'en-US',
          'es': 'es-ES',
          'fr': 'fr-FR',
          'hi': 'hi-IN',
          'te': 'te-IN'
        };
        recognition.lang = langMap[i18n.language] || 'en-US';
        recognition.stop();
        if (!isActiveListening) {
           setTimeout(() => recognition.start(), 100);
        }
      } catch(e) {}
    }
    return () => {
      if (recognition) {
        try { recognition.stop(); } catch(e) {}
      }
    };
  }, [i18n.language]);

  const startActiveListening = async () => {
    setIsActiveListening(true);
    setState('Active');
    setFeedback("Listening... (Auto-Language Detection)");
    if (recognition) {
        try { recognition.stop(); } catch(e) {}
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        setState('Processing');
        setFeedback("Transcribing and Detecting Language...");
        
        const formData = new FormData();
        formData.append('file', audioBlob, 'command.webm');
        
        try {
          const res = await fetch('http://localhost:8000/api/v1/voice/transcribe', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          const { text, language } = data;
          
          if (text) {
             console.log("Whisper Output:", data);
             // Change i18n language based on detected language if supported
             if (['en', 'es', 'fr', 'hi', 'te'].includes(language)) {
               i18n.changeLanguage(language);
             }
             // Small timeout to allow i18n to change before processing intents
             setTimeout(() => processCommand(text.toLowerCase()), 100);
          } else {
             speak(t('assistant.error_command'));
             setIsActiveListening(false);
          }
        } catch (e) {
          console.error(e);
          speak(t('assistant.error_exec'));
          setIsActiveListening(false);
        }
      };

      mediaRecorder.start();
      
      // Stop recording automatically after 4 seconds to send it
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
           mediaRecorderRef.current.stop();
        }
      }, 4000);
      
    } catch (e) {
      console.error('Mic error:', e);
      setState('Error');
      setFeedback(t('assistant.mic_blocked'));
    }
  };

  const pauseListening = () => {
    setIsActiveListening(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
       mediaRecorderRef.current.stop();
    } else {
       setState('Listening');
       setFeedback(t('assistant.listening_paused'));
       if (recognition) {
           try { recognition.start(); } catch(e) {}
       }
    }
  };

  return (
    <VoiceContext.Provider value={{ state, transcript, feedback, isActiveListening, intent, startActiveListening, pauseListening, triggerSos, speak, setFeedbackState, setAssistantState }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) throw new Error("useVoice must be used within VoiceProvider");
  return context;
};
