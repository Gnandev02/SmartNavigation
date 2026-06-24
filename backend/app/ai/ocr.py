import easyocr
import cv2
import numpy as np

# Initialize the EasyOCR reader for English. 
# gpu=False assumes CPU deployment as requested implicitly by avoiding explicit GPU setup unless available.
reader = easyocr.Reader(['en'], gpu=False)

def read_text_from_image(image_bytes: bytes) -> str:
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Run OCR
    results = reader.readtext(img)
    
    # Extract text and join
    text_blocks = [result[1] for result in results if result[2] > 0.5] # Filtering by confidence
    return " ".join(text_blocks)
