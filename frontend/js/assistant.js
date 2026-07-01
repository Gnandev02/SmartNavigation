document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const video = document.getElementById('camera-feed');
    const overlayCanvas = document.getElementById('overlay-canvas');
    const captureCanvas = document.getElementById('capture-canvas');
    const statusText = document.getElementById('status-text');
    const sosBtn = document.getElementById('sos-btn');
    const onlineStatus = document.getElementById('online-status');
    const onlineDot = document.getElementById('online-dot');

    // Models
    let objectDetector = null;
    let tesseractWorker = null;

    // AI Tracking State
    let detectionCooldowns = {};
    const COOLDOWN_MS = 5000;
    let isDetectionRunning = false;
    let lastGoAheadTime = 0;

    // --- State Update ---
    function updateState(newState, displayMsg = "") {
        console.log(`[Detection State] -> ${newState}`);
        if (displayMsg) statusText.textContent = displayMsg;

        if (newState === 'Error') {
            if (onlineStatus) onlineStatus.textContent = 'Error';
            if (onlineDot) onlineDot.style.backgroundColor = 'red';
        } else if (newState === 'Loading AI Models') {
            if (onlineStatus) onlineStatus.textContent = 'Loading Models';
            if (onlineDot) onlineDot.style.backgroundColor = 'orange';
        } else {
            if (onlineStatus) onlineStatus.textContent = 'Online';
            if (onlineDot) onlineDot.style.backgroundColor = '#4ade80';
        }
    }

    // Use GlobalAssistant for speaking if available
    const speak = (text) => {
        if (window.GlobalAssistant) {
            window.GlobalAssistant.speak(text, false);
        } else {
            console.log("[Detection Alert] " + text);
        }
    };

    // --- AI Model Loading ---
    const loadAIModels = async () => {
        updateState('Loading AI Models', "Loading AI Models...");
        try {
            console.log("[AI] Loading COCO-SSD model...");
            objectDetector = await cocoSsd.load();
            console.log("[AI] COCO-SSD loaded successfully.");
            
            console.log("[AI] Loading Tesseract.js...");
            tesseractWorker = await Tesseract.createWorker('eng');
            await tesseractWorker.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM ? Tesseract.PSM.SPARSE_TEXT : '11',
            });
            console.log("[AI] Tesseract.js loaded successfully.");

            updateState('Ready', 'Say "Hey SmartNav"');
            startObjectDetection();
        } catch (err) {
            console.error("[AI] Error loading models:", err);
            updateState('Error', "Failed to load AI models.");
            speak("There was an error loading the detection models.");
        }
    };

    // --- Camera & Microphone Setup ---
    const requestPermissions = async () => {
        updateState('Requesting permission', "Requesting camera...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            console.log("[Permissions] Camera access granted.");
            video.srcObject = stream;
            
            video.onloadedmetadata = () => {
                video.play();
                overlayCanvas.width = video.videoWidth;
                overlayCanvas.height = video.videoHeight;
                loadAIModels();
            };
        } catch (err) {
            console.error("[Permissions Error]", err);
            updateState('Error', "Camera Permission Denied");
            speak("Camera access was denied. SmartNav detection requires it to function.");
        }
    };

    // --- AI Detection Logic ---
    const calculateDistance = (bboxHeight, videoHeight, className) => {
        // Estimate average real height in meters based on object class
        let realHeight = 1.0; // default 1 meter
        if (className === 'person') realHeight = 1.7;
        else if (['car', 'truck', 'bus'].includes(className)) realHeight = 1.8;
        else if (className === 'chair') realHeight = 0.9;
        else if (className === 'table') realHeight = 0.8;
        else if (className === 'cell phone' || className === 'remote') realHeight = 0.15;
        else if (className === 'cup' || className === 'bottle') realHeight = 0.2;
        
        // Approximate focal length in pixels (heuristic for typical webcams)
        const focalLength = videoHeight * 0.4; 
        
        // Distance = (Real Height * Focal Length) / Perceived Height (in pixels)
        const distance = (realHeight * focalLength) / bboxHeight;
        
        // Clamp between 0.3 meters and 15 meters for realistic voice feedback
        return Math.max(0.3, Math.min(15, distance)).toFixed(1);
    };

    const calculateDirection = (bboxX, bboxWidth, videoWidth) => {
        const centerX = bboxX + (bboxWidth / 2);
        const ratio = centerX / videoWidth;
        if (ratio < 0.4) return { pos: "on your left", action: "move right" };
        if (ratio > 0.6) return { pos: "on your right", action: "move left" };
        return { pos: "ahead", action: "move left or right" };
    };

    const processDetections = (predictions) => {
        if (!predictions) return;
        
        const now = Date.now();
        // If GlobalAssistant is actively listening or speaking a command response, we shouldn't interrupt with ambient detections
        const isGlobalBusy = window.GlobalAssistant && window.GlobalAssistant.globalWidget &&
                             (window.GlobalAssistant.globalWidget.style.background === 'rgb(59, 130, 246)' /* speaking */ || 
                              window.GlobalAssistant.globalWidget.style.background === 'rgb(74, 222, 128)' /* listening strongly */);

        if (isGlobalBusy) return;

        let hasObstacle = false;

        predictions.forEach(pred => {
            if (pred.score < 0.75) return; // Increased confidence threshold for better accuracy
            
            const className = pred.class;
            const distance = parseFloat(calculateDistance(pred.bbox[3], video.videoHeight, className));
            
            // Do not alert for objects further than 5 meters
            if (distance > 5.0) return;

            const dirInfo = calculateDirection(pred.bbox[0], pred.bbox[2], video.videoWidth);
            const direction = dirInfo.pos;
            const action = dirInfo.action;
            
            const movableObjects = ['person', 'car', 'truck', 'vehicle', 'bicycle', 'motorcycle', 'bus', 'train', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'];
            const isMovable = movableObjects.includes(className);

            if (!isMovable && distance > 1.0) {
                return; // Skip warning for stationary objects further than 1 meter
            }

            // If the object is not in the direct path ("ahead"), do not alert.
            // This ensures the user is not warned if the path is clear to walk.
            if (direction !== "ahead") {
                return;
            }

            hasObstacle = true;

            if (!detectionCooldowns[className] || (now - detectionCooldowns[className] > COOLDOWN_MS)) {
                detectionCooldowns[className] = now;
                
                let announcement = "";
                if (isMovable) {
                    if (className === 'person') {
                        announcement = `Person detected ${distance.toFixed(1)} meters ${direction}. Please ${action}.`;
                    } else {
                        announcement = `Warning. ${className} detected ${distance.toFixed(1)} meters ${direction}. Please ${action}.`;
                    }
                } else {
                    if (className === 'stairs') {
                        announcement = `Warning. Stairs detected ${direction}. Please ${action} carefully.`;
                    } else {
                        announcement = `Warning. ${className} detected ${distance.toFixed(1)} meters ${direction}. Please ${action}.`;
                    }
                }
                
                speak(announcement);
            }
        });

        if (!hasObstacle) {
            // Suppressed "Path is clear" audio announcement to reduce noise
        }
    };

    const startObjectDetection = () => {
        if (!objectDetector || isDetectionRunning) return;
        isDetectionRunning = true;
        
        const ctx = overlayCanvas.getContext('2d');
        
        const detectLoop = async () => {
            if (video.readyState >= 2) {
                if (overlayCanvas.width !== video.videoWidth) {
                    overlayCanvas.width = video.videoWidth;
                    overlayCanvas.height = video.videoHeight;
                }
                
                try {
                    const predictions = await objectDetector.detect(video);
                    
                    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                    
                    // Draw Route Path Overlay (Safe Zone)
                    ctx.fillStyle = 'rgba(74, 222, 128, 0.1)'; 
                    ctx.fillRect(overlayCanvas.width * 0.4, 0, overlayCanvas.width * 0.2, overlayCanvas.height);
                    
                    ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
                    ctx.setLineDash([5, 15]);
                    ctx.beginPath();
                    ctx.moveTo(overlayCanvas.width * 0.4, 0);
                    ctx.lineTo(overlayCanvas.width * 0.4, overlayCanvas.height);
                    ctx.moveTo(overlayCanvas.width * 0.6, 0);
                    ctx.lineTo(overlayCanvas.width * 0.6, overlayCanvas.height);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    predictions.forEach(prediction => {
                        const [x, y, width, height] = prediction.bbox;
                        const dirInfo = calculateDirection(x, width, overlayCanvas.width);
                        const isAhead = dirInfo.pos === "ahead";
                        
                        const color = isAhead ? '#ef4444' : '#4ade80'; // Red if blocking, green if safe
                        
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 4;
                        ctx.strokeRect(x, y, width, height);
                        
                        ctx.fillStyle = color;
                        ctx.font = '18px Arial';
                        ctx.fillText(
                            `${prediction.class} (${Math.round(prediction.score * 100)}%)`, 
                            x, 
                            y > 20 ? y - 5 : y + 20
                        );
                    });
                    
                    processDetections(predictions);
                } catch (err) {
                    console.error("[Detection Error]", err);
                }
            }
            requestAnimationFrame(detectLoop);
        };
        
        detectLoop();
    };

    // Expose Read Text Command for Global Assistant
    window.processReadTextCommand = async () => {
        if (window.GlobalAssistant) {
            await window.GlobalAssistant.speak("Reading text...");
        }
        if (!tesseractWorker) {
            if (window.GlobalAssistant) await window.GlobalAssistant.speak("Text reader is not ready yet.");
            return;
        }
        
        try {
            const ocrCanvas = document.createElement('canvas');
            const scale = 2.5; // Upscale by 2.5x for Tesseract to see better
            ocrCanvas.width = video.videoWidth * scale;
            ocrCanvas.height = video.videoHeight * scale;
            const ctx = ocrCanvas.getContext('2d');
            
            // Disable smoothing for sharper edges
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(video, 0, 0, ocrCanvas.width, ocrCanvas.height);
            
            console.log("[OCR] Processing image...");
            const { data: { text } } = await tesseractWorker.recognize(ocrCanvas);
            
            const cleanText = text.trim();
            if (cleanText.length > 0) {
                if (window.GlobalAssistant) await window.GlobalAssistant.speak(`I read: ${cleanText}`);
            } else {
                if (window.GlobalAssistant) await window.GlobalAssistant.speak("I couldn't detect any readable text.");
            }
        } catch (err) {
            console.error("OCR Error", err);
            if (window.GlobalAssistant) await window.GlobalAssistant.speak("Failed to read text.");
        }
    };

    sosBtn.addEventListener('click', () => {
        if (window.GlobalAssistant) {
            window.GlobalAssistant.triggerSOS();
        }
    });

    // Start
    requestPermissions();
});
