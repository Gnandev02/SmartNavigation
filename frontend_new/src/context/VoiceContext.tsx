import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

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
  const [state, setState] = useState<AssistantState>('Idle');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('Tap the mic to begin.');
  const [isActiveListening, setIsActiveListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [intent, setIntent] = useState<{action: string, timestamp: number} | null>(null);

  // Intent Handlers (to be wired up with other contexts)
  const processCommand = async (cmd: string) => {
    setState('Processing');
    setFeedback('Processing...');
    if (recognition) recognition.stop(); // Stop recognition while processing

    try {
      if (cmd.includes('front of me') || cmd.includes('surroundings')) {
        setIntent({ action: 'vision_detect', timestamp: Date.now() });
      } else if (cmd.includes('read') && (cmd.includes('sign') || cmd.includes('text'))) {
        setIntent({ action: 'vision_ocr', timestamp: Date.now() });
      } else if (cmd.includes('help') || cmd.includes('sos') || cmd.includes('emergency')) {
        triggerSos();
      } else if (cmd.includes('where am i') || cmd.includes('location')) {
        setIntent({ action: 'location_get', timestamp: Date.now() });
      } else if (cmd.includes('stop') || cmd.includes('pause')) {
        speak("Stopping active assistance. I am still listening for the wake word.");
        setIsActiveListening(false);
      } else {
        speak("I didn't catch that command. You can ask me what is in front of you, or ask for help.");
      }
    } catch (err) {
      speak("Sorry, I encountered an error executing that command.");
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
      const bestVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Premium'))) 
                        || voices.find(v => v.lang.startsWith('en')) 
                        || voices[0];
      utterance.voice = bestVoice;
    }

    utterance.onend = () => {
      // Resume listening
      if (!isActiveListening) {
        setState('Listening');
        setFeedback('Say "Hey SmartNav" or tap mic.');
      } else {
        setState('Active');
        setFeedback('How can I help?');
      }
      try {
        if (recognition) recognition.start();
      } catch (e) {}
    };

    window.speechSynthesis.speak(utterance);
  }, [isActiveListening, recognition]);

  const triggerSos = async () => {
    speak("Emergency SOS activated. Contacting caregivers immediately.");
    
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
      setFeedback("Speech APIs not supported on this browser.");
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      if (state !== 'Speaking' && state !== 'Processing') {
        setState(isActiveListening ? 'Active' : 'Listening');
      }
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      
      const text = (final || interim).toLowerCase().trim();
      setTranscript(text);

      if (isActiveListening) {
        setFeedback(text);
      } else {
        setFeedback(`... ${text} ...`);
      }

      if (final) {
        if (!isActiveListening) {
          if (final.includes('hey smart') || final.includes('smart nav')) {
            setIsActiveListening(true);
            setState('Active');
            setFeedback('How can I help?');
          }
        } else {
          processCommand(final);
        }
      }
    };

    rec.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error);
      if (e.error === 'not-allowed') {
        setState('Error');
        setFeedback("Microphone access blocked.");
      }
    };

    rec.onend = () => {
      if (state !== 'Error' && state !== 'Speaking' && state !== 'Processing') {
        try { rec.start(); } catch (err) {}
      }
    };

    setRecognition(rec);
  }, [isActiveListening, state]);

  useEffect(() => {
    if (recognition && state !== 'Error') {
      try {
        recognition.start();
      } catch(e) {}
    }
    return () => {
      if (recognition) {
        try { recognition.stop(); } catch(e) {}
      }
    };
  }, [recognition]);

  const startActiveListening = () => {
    setIsActiveListening(true);
    setState('Active');
    setFeedback('How can I help?');
  };

  const pauseListening = () => {
    setIsActiveListening(false);
    setState('Listening');
    setFeedback('Listening paused. Say wake phrase or tap mic to resume.');
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
