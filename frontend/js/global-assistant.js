// Global Voice Assistant for SmartNav

const GlobalAssistant = {
    recognition: null,
    speechSynthesis: window.speechSynthesis,
    isActive: sessionStorage.getItem('assistant_active') !== 'false', // Default to true
    isListening: false,
    autoRestart: true,
    lastSpokenText: "",
    
    // UI
    globalWidget: null,
    
    init() {
        console.log("[GlobalAssistant] Mounted on page:", window.location.pathname);
        
        // Setup SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("[GlobalAssistant] Speech API not supported.");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.setupRecognitionEvents();
        this.createGlobalWidget();

        // Check if it should start automatically based on session storage
        if (this.isActive) {
            console.log("[GlobalAssistant] Session active. Starting automatically.");
            if (!sessionStorage.getItem('mic_granted')) {
                // First time load, explicitly request mic to show prompt
                navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
                    sessionStorage.setItem('mic_granted', 'true');
                    this.startListening(true);
                }).catch(e => {
                    console.warn("Microphone not allowed on load:", e);
                    this.isActive = false;
                    sessionStorage.setItem('assistant_active', 'false');
                });
            } else {
                this.startListening(true); // silent start
            }
        }

        // Attach to specific Start Assistant buttons if they exist
        const startBtns = document.querySelectorAll('.start-assistant-btn');
        startBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.activateAssistant();
            });
        });

        // Introduction on first load
        if (this.isActive && !sessionStorage.getItem('assistant_introduced')) {
            sessionStorage.setItem('assistant_introduced', 'true');
            setTimeout(() => {
                this.speak("Welcome to SmartNav. You can say Read Page, Start Detection, Read Sign, Share My Location, or Help Me.");
            }, 1000);
        }
    },

    createGlobalWidget() {
        // If we are on assistant.html, we don't need a global widget
        if (document.getElementById('mic-btn')) return;

        this.globalWidget = document.createElement('div');
        this.globalWidget.id = 'global-assistant-widget';
        this.globalWidget.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: #2563eb;
            color: white;
            border-radius: 50%;
            display: ${this.isActive ? 'flex' : 'none'};
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        this.globalWidget.innerHTML = '🎙️';
        this.globalWidget.title = 'SmartNav Assistant Listening...';
        
        this.globalWidget.addEventListener('click', () => {
            this.isActive = false;
            sessionStorage.setItem('assistant_active', 'false');
            this.stopListening();
            this.updateWidgetState();
        });

        document.body.appendChild(this.globalWidget);
        this.updateWidgetState();
    },

    updateWidgetState(state = 'idle') {
        if (this.globalWidget) {
            this.globalWidget.style.display = this.isActive ? 'flex' : 'none';
            if (state === 'listening') {
                this.globalWidget.style.transform = 'scale(1.1)';
                this.globalWidget.style.boxShadow = '0 0 20px rgba(74, 222, 128, 0.8)';
                this.globalWidget.style.background = '#4ade80';
            } else if (state === 'speaking') {
                this.globalWidget.style.transform = 'scale(1.1)';
                this.globalWidget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)';
                this.globalWidget.style.background = '#3b82f6';
            } else {
                this.globalWidget.style.transform = 'scale(1)';
                this.globalWidget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                this.globalWidget.style.background = '#2563eb';
            }
        }
        
        // Update local page UI if on detection page
        const localStatus = document.getElementById('status-text');
        const localMic = document.getElementById('mic-btn');
        if (localStatus) {
            if (state === 'listening') localStatus.textContent = 'Listening...';
            if (state === 'speaking') localStatus.textContent = 'Speaking...';
        }
        if (localMic) {
            if (state === 'listening') {
                localMic.classList.add('listening');
                localMic.style.transform = 'scale(1.1)';
            } else {
                localMic.classList.remove('listening');
                localMic.style.transform = 'scale(1)';
            }
        }
    },

    async activateAssistant() {
        console.log("[GlobalAssistant] Requesting microphone permission.");
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("[GlobalAssistant] Microphone Permission Granted.");
            
            this.isActive = true;
            sessionStorage.setItem('assistant_active', 'true');
            
            this.updateWidgetState();
            
            await this.speak("SmartNav assistant activated.");
            this.startListening();
        } catch (err) {
            console.error("[GlobalAssistant] Microphone Permission Denied.", err);
            alert("Microphone permission is required for the Voice Assistant.");
        }
    },

    startListening(silent = false) {
        if (!this.recognition || this.isListening) return;
        try {
            this.recognition.start();
        } catch (e) {
            console.error("[GlobalAssistant] Recognition start error:", e);
        }
    },

    stopListening() {
        if (!this.recognition || !this.isListening) return;
        this.autoRestart = false;
        try {
            this.recognition.stop();
        } catch (e) {}
    },

    setupRecognitionEvents() {
        this.recognition.onstart = () => {
            console.log("[GlobalAssistant] Recognition Started.");
            this.isListening = true;
            this.updateWidgetState('listening');
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                console.log(`[GlobalAssistant] Transcript Received: "${finalTranscript.trim()}"`);
                this.handleCommand(finalTranscript.toLowerCase().trim());
            }
        };

        this.recognition.onerror = (event) => {
            console.error("[GlobalAssistant] Recognition Error:", event.error);
            if (event.error === 'not-allowed') {
                this.isActive = false;
                sessionStorage.setItem('assistant_active', 'false');
            }
        };

        this.recognition.onend = () => {
            console.log("[GlobalAssistant] Recognition Ended.");
            this.isListening = false;
            this.updateWidgetState('idle');
            
            if (this.isActive && this.autoRestart && !this.speechSynthesis.speaking) {
                setTimeout(() => this.startListening(), 100);
            }
        };
    },

    speak(text, wait = true) {
        return new Promise((resolve) => {
            console.log(`[GlobalAssistant] Speech Output Triggered: "${text}"`);
            this.lastSpokenText = text;
            
            this.autoRestart = false; // pause listening while speaking
            this.stopListening();
            
            this.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            
            // local feedback text update if exists
            const ft = document.getElementById('feedback-text');
            if (ft) ft.textContent = text;
            
            this.updateWidgetState('speaking');

            utterance.onend = () => {
                this.autoRestart = true;
                if (this.isActive) this.startListening();
                else this.updateWidgetState('idle');
                resolve();
            };
            
            utterance.onerror = () => {
                this.autoRestart = true;
                if (this.isActive) this.startListening();
                else this.updateWidgetState('idle');
                resolve();
            };

            this.speechSynthesis.speak(utterance);
            
            if (!wait) resolve(); // Resolve immediately if wait is false
        });
    },

    async handleCommand(command) {
        console.log(`[GlobalAssistant] Command Matched: "${command}"`);
        
        const feedbackText = document.getElementById('feedback-text');
        if (feedbackText) feedbackText.textContent = command;

        try {
            if (command.includes("read page") || command.includes("read home page") || command.includes("what is on this page") || command.includes("describe this page")) {
                await this.readPageContent();
            }
            else if (command.includes("open features") || command.includes("go to features")) {
                await this.navigateRoute('#features', "Opening Features Section.");
            }
            else if (command.includes("open live demo")) {
                await this.navigateRoute('#demo', "Opening Live Demo.");
            }
            else if (command.includes("open accessibility")) {
                await this.navigateRoute('#accessibility', "Opening Accessibility Section.");
            }
            else if (command.includes("open caregiver portal")) {
                await this.navigateRoute('caregiver.html', "Opening Caregiver Portal.");
            }
            else if (command.includes("go home")) {
                await this.navigateRoute('index.html', "Going to Home Page.");
            }
            else if (command.includes("scroll down") || command.includes("next section")) {
                await this.speak("Scrolling down.");
                window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
            }
            else if (command.includes("scroll up") || command.includes("previous section")) {
                await this.speak("Scrolling up.");
                window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
            }
            else if (command.includes("start detection") || command.includes("launch website") || command.includes("launch web app") || command.includes("open website")) {
                // If not on assistant.html, go there
                if (!window.location.pathname.includes('assistant.html')) {
                    await this.navigateRoute('assistant.html', "Detection started. Opening camera.");
                } else {
                    await this.speak("Detection is already running.");
                }
            }
            else if (command.includes("read sign") || command.includes("read text") || command.includes("scan nearby text")) {
                if (window.location.pathname.includes('assistant.html') && window.processReadTextCommand) {
                    await window.processReadTextCommand();
                } else {
                    await this.navigateRoute('assistant.html', "Opening camera to read text. Please point it at the sign.");
                }
            }
            else if (command.includes("where am i")) {
                const pageInfo = this.getCurrentPageInfo();
                await this.speak(`You are currently ${pageInfo}.`);
            }
            else if (command.includes("share my location") || command.includes("start navigation")) {
                await this.shareLocation();
            }
            else if (command.includes("help me") || command.includes("emergency") || command.includes("send sos")) {
                await this.triggerSOS();
            }
            else if (command.includes("read this section") || command.includes("explain this section")) {
                await this.readCurrentSection();
            }
            else {
                // Optional fallback, but sometimes ambient noise triggers this.
                // await this.speak("I didn't catch that command.");
            }
        } catch (e) {
            console.error("[GlobalAssistant] Command Execution Error:", e);
        }
    },

    async navigateRoute(target, announcement) {
        await this.speak(announcement);
        
        if (target.startsWith('#')) {
            const el = document.querySelector(target);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            } else if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                // We are not on the home page, need to go there first
                window.location.href = `index.html${target}`;
            }
        } else {
            window.location.href = target;
        }
    },

    getCurrentPageInfo() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        if (path.includes('caregiver.html')) return "on the Caregiver Portal";
        if (path.includes('admin.html')) return "on the Admin Dashboard";
        if (path.includes('assistant.html')) return "on the Detection Page";
        
        if (hash === '#features') return "viewing the Features Section";
        if (hash === '#demo') return "viewing the Live Demo Section";
        if (hash === '#accessibility') return "viewing the Accessibility Section";
        
        return "on the SmartNav Home Page";
    },

    async readPageContent() {
        await this.speak("Reading current page.");
        
        // Find visible headings and paragraphs
        const elements = document.querySelectorAll('h1, h2, h3, p');
        let textToRead = "";
        
        elements.forEach(el => {
            // Check if element is visible
            const rect = el.getBoundingClientRect();
            if (rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && el.offsetParent !== null) {
                textToRead += el.innerText + ". ";
            }
        });

        if (textToRead) {
            await this.speak(textToRead);
        } else {
            await this.speak("I couldn't find any readable text on the screen.");
        }
    },

    async readCurrentSection() {
        // Find the section that takes up most of the viewport
        const sections = document.querySelectorAll('section, main');
        let currentSection = null;
        let maxVisible = 0;

        sections.forEach(sec => {
            const rect = sec.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
            if (visibleHeight > maxVisible) {
                maxVisible = visibleHeight;
                currentSection = sec;
            }
        });

        if (currentSection) {
            const text = currentSection.innerText;
            await this.speak("Reading current section. " + text.substring(0, 500) + (text.length > 500 ? "..." : "")); // Limit length for demo
        } else {
            await this.readPageContent();
        }
    },

    async shareLocation() {
        return new Promise((resolve) => {
            this.speak("Getting your location...", false);
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const lat = pos.coords.latitude.toFixed(4);
                    const lng = pos.coords.longitude.toFixed(4);
                    await this.speak(`Your current coordinates are latitude ${lat}, and longitude ${lng}. Location shared.`);
                    resolve();
                }, async (err) => {
                    await this.speak("I could not determine your location. Please check your location settings.");
                    resolve();
                });
            } else {
                this.speak("Geolocation is not supported by your browser.").then(resolve);
            }
        });
    },

    async triggerSOS() {
        await this.speak("Emergency SOS activated. Sending alert and sharing location to caregivers.");
        // Mock SOS send
        console.log("[SOS] Alert sent.");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GlobalAssistant.init();
    // Expose for debugging/external calling
    window.GlobalAssistant = GlobalAssistant;
});
