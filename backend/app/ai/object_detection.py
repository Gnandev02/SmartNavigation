from ultralytics import YOLO
import cv2
import numpy as np
from .translations import translate

# Load the YOLOv8 nano model (downloads automatically on first run if not present)
model = YOLO('yolov8n.pt')

def detect_objects(image_bytes: bytes, lang: str = 'en') -> list[str]:
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Run inference
    results = model(img)
    
    detected_items = []
    # Parse results
    for r in results:
        boxes = r.boxes
        for box in boxes:
            # get class ID and map to class name
            cls_id = int(box.cls[0])
            class_name = model.names[cls_id]
            # Optional: filter by confidence if needed (e.g. conf > 0.5)
            conf = float(box.conf[0])
            if conf > 0.5:
                detected_items.append(translate(class_name, lang))
    
    # Return unique items to avoid "chair chair chair"
    return list(set(detected_items))
