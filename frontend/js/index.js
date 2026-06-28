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
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const preview = document.getElementById('demo-preview');
    const btnDetect = document.getElementById('btn-detect');
    const btnOcr = document.getElementById('btn-ocr');
    const output = document.getElementById('demo-output');

    let currentFile = null;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) return;
        currentFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
            dropZone.querySelector('h3').style.display = 'none';
            dropZone.querySelector('p').style.display = 'none';
            dropZone.querySelector('span').style.display = 'none';
        };
        reader.readAsDataURL(file);

        btnDetect.disabled = false;
        btnOcr.disabled = false;
        output.textContent = "Image loaded. Select an action above.";
    }

    const SpeechSynthesis = window.speechSynthesis;

    btnDetect.addEventListener('click', async () => {
        if (!currentFile) return;
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
        if (!currentFile) return;
        output.textContent = "Loading OCR Engine...";
        btnOcr.disabled = true;
        
        try {
            const img = document.getElementById('demo-preview');
            output.textContent = "Reading text from image...";
            const result = await Tesseract.recognize(img, 'eng');
            
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
