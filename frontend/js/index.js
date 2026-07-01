document.addEventListener('DOMContentLoaded', () => {
    // FAQ Toggle Logic
    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all others
            document.querySelectorAll('.faq-item').forEach(faq => {
                faq.classList.remove('active');
                faq.querySelector('.accordion-btn').setAttribute('aria-expanded', 'false');
            });

            if (!isActive) {
                item.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Sticky Nav Blur Logic
    const nav = document.getElementById('main-nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }

    // Live Demo Logic
    const cameraZone = document.getElementById('camera-zone');
    const cameraPlaceholderIcon = document.getElementById('camera-placeholder-icon');
    const cameraPlaceholderText = document.getElementById('camera-placeholder-text');
    const video = document.getElementById('demo-camera-feed');
    const captureCanvas = document.getElementById('demo-capture-canvas');
    const preview = document.getElementById('demo-preview');
    const btnDetect = document.getElementById('btn-detect');
    const btnOcr = document.getElementById('btn-ocr');
    const output = document.getElementById('demo-output');

    let demoStream = null;
    let hasCapturedImage = false;

    window.openDemoCamera = async () => {
        if (demoStream) return; // Already open
        try {
            output.textContent = "Requesting camera...";
            demoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            video.srcObject = demoStream;
            video.style.display = 'block';
            cameraPlaceholderIcon.style.display = 'none';
            cameraPlaceholderText.style.display = 'none';
            preview.style.display = 'none';
            output.textContent = "Camera ready. Tap feed to capture.";
        } catch (err) {
            output.textContent = "Error: Camera access denied.";
            console.error(err);
        }
    };

    window.captureDemoImage = () => {
        if (!demoStream) return;
        
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const ctx = captureCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        
        preview.src = captureCanvas.toDataURL('image/png');
        preview.style.display = 'block';
        video.style.display = 'none';
        
        // Stop stream
        demoStream.getTracks().forEach(track => track.stop());
        demoStream = null;
        
        hasCapturedImage = true;
        btnDetect.disabled = false;
        btnOcr.disabled = false;
        output.textContent = "Image captured. Select an action above.";
        cameraPlaceholderText.textContent = "Tap to Re-Open Camera";
    };

    cameraZone.addEventListener('click', () => {
        if (!demoStream && !hasCapturedImage) {
            window.openDemoCamera();
        } else if (!demoStream && hasCapturedImage) {
            // Re-open camera
            hasCapturedImage = false;
            btnDetect.disabled = true;
            btnOcr.disabled = true;
            window.openDemoCamera();
        } else if (demoStream) {
            // Capture
            window.captureDemoImage();
        }
    });

    const SpeechSynthesis = window.speechSynthesis;

    btnDetect.addEventListener('click', async () => {
        if (!hasCapturedImage) return;
        output.textContent = "Loading AI Model (COCO-SSD)...";
        btnDetect.disabled = true;
        
        try {
            const img = document.getElementById('demo-preview');
            const model = await cocoSsd.load();
            output.textContent = "Analyzing image...";
            const predictions = await model.detect(img);
            
            let message = "I didn't detect any objects.";
            if (predictions.length > 0) {
                const objectNames = predictions.map(p => p.class);
                message = "I detected: " + objectNames.join(', ');
            }
            output.textContent = `Result: ${message}`;
            
            // Speak result
            const utterance = new SpeechSynthesisUtterance(message);
            SpeechSynthesis.speak(utterance);
        } catch (err) {
            output.textContent = `Error: ${err.message}`;
        } finally {
            btnDetect.disabled = false;
        }
    });

    btnOcr.addEventListener('click', async () => {
        if (!hasCapturedImage) return;
        output.textContent = "Loading OCR Engine...";
        btnOcr.disabled = true;
        
        try {
            const img = document.getElementById('demo-preview');
            output.textContent = "Reading text from image...";
            
            // Preprocess image for better OCR
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                // Convert to grayscale
                const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                
                // Apply contrast
                const contrast = 1.5; // Increase contrast
                let val = ((luma / 255 - 0.5) * contrast + 0.5) * 255;
                val = Math.min(Math.max(val, 0), 255);
                
                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            }
            ctx.putImageData(imageData, 0, 0);

            const result = await Tesseract.recognize(canvas, 'eng');
            
            const text = result.data.text.trim();
            let message = "I couldn't read any text.";
            if (text) {
                message = "I read: " + text;
            }
            output.textContent = `Result: ${message}`;
            
            // Speak result
            const utterance = new SpeechSynthesisUtterance(message);
            SpeechSynthesis.speak(utterance);
        } catch (err) {
            output.textContent = `Error: ${err.message}`;
        } finally {
            btnOcr.disabled = false;
        }
    });
});
