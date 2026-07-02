import base64
import json
from openai import OpenAI
from ..core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def detect_objects(image_bytes: bytes, lang: str = 'en') -> list[str]:
    try:
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text", 
                            "text": f"List the primary objects in this image accurately. Respond ONLY with a JSON object containing a single key 'objects' which is an array of strings, translated into the ISO 639-1 language code '{lang}'. For example: {{\"objects\": [\"20 Indian Rupee note\", \"hand\"]}}"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=150,
            response_format={ "type": "json_object" }
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        return data.get("objects", [])
    except Exception as e:
        print(f"Error in object detection: {e}")
        return []
