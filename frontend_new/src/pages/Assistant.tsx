import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import { useVision } from '../hooks/useVision';
import './Assistant.css';

const Assistant: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, feedback, isActiveListening, intent, startActiveListening, pauseListening, triggerSos, speak } = useVoice();
  const { loadModel, detectObjects, readText } = useVision();

  const statusMsg = state === 'Idle' || state === 'Listening' 
    ? 'Say "Hey SmartNav"' 
    : state === 'Active' 
      ? 'Listening...' 
      : state === 'Processing' 
        ? 'Processing...' 
        : state === 'Error' 
          ? 'Permissions Denied' 
          : 'Speaking...';

  useEffect(() => {
    // Setup camera on mount
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied:', err);
      }
    };
    setupCamera();
    loadModel();

    return () => {
      // Cleanup video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle Intents
  useEffect(() => {
    if (!intent) return;
    
    const handleIntent = async () => {
      if (intent.action === 'vision_detect') {
        speak("I am analyzing your surroundings.");
        const result = await detectObjects(videoRef.current);
        speak(result);
      } else if (intent.action === 'vision_ocr') {
        speak("Looking for text...");
        const result = await readText(videoRef.current);
        speak(result);
      } else if (intent.action === 'location_get') {
        speak("Getting your location...");
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            speak(`You are currently at latitude ${pos.coords.latitude.toFixed(4)} and longitude ${pos.coords.longitude.toFixed(4)}`);
          }, () => {
            speak("I could not get your location. Please check your permissions.");
          });
        } else {
          speak("Location is not supported on this device.");
        }
      }
    };

    handleIntent();
  }, [intent]);

  const handleMicClick = () => {
    if (state === 'Error') return;
    if (isActiveListening) {
      pauseListening();
    } else {
      startActiveListening();
    }
  };

  const handleSosClick = () => {
    triggerSos();
  };

  return (
    <div className="assistant-body">
      <div id="app" className="assistant-container">
        {/* Live Camera Background */}
        <video ref={videoRef} id="camera-feed" autoPlay playsInline muted className="assistant-video-bg"></video>
        <canvas id="capture-canvas" style={{ display: 'none' }}></canvas>

        {/* UI Overlay */}
        <div className="overlay-ui">
          <header className="assistant-header">
            <Link to="/" className="btn btn-secondary btn-back" aria-label="Back to home">← Exit</Link>
            <div className="status-indicator">
              <span className="dot" id="online-dot" style={{ backgroundColor: state === 'Error' ? 'red' : '#4ade80' }}></span> 
              <span id="online-status">{state === 'Error' ? 'Error' : 'Online'}</span>
            </div>
          </header>

          <div className="status-panel">
            <h1 id="status-text" aria-live="polite">{statusMsg}</h1>
            <p id="feedback-text" aria-live="assertive">{feedback}</p>
          </div>

          <div className="controls">
            <button 
              id="mic-btn" 
              className={`big-btn ${isActiveListening ? 'listening' : ''}`} 
              aria-label="Microphone Control: Tap to listen"
              onClick={handleMicClick}
              style={{
                transform: isActiveListening ? 'scale(1.1)' : 'scale(1)',
                boxShadow: isActiveListening ? '0 0 20px rgba(74, 222, 128, 0.8)' : 'none'
              }}
            >
              <span id="mic-icon" style={{ fontSize: '40px' }}>🎙️</span>
            </button>
            <button id="sos-btn" className="big-btn sos" aria-label="Emergency SOS: Double tap to trigger" onClick={handleSosClick}>
              <span style={{ fontSize: '24px' }}>SOS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
