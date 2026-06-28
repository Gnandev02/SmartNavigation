import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useVision = () => {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const { i18n, t } = useTranslation();

  const loadModel = useCallback(async () => {
    // Relying on backend now, no local model to load
    setIsModelLoading(false);
  }, []);

  const detectObjects = useCallback(async (videoElement: HTMLVideoElement | null): Promise<string> => {
    if (!videoElement) return t('assistant.error_exec');
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(t('assistant.error_exec'));
        return;
      }
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(t('assistant.error_exec'));
          return;
        }
        const formData = new FormData();
        formData.append('file', blob, 'capture.jpg');
        
        try {
          // Assuming backend runs on 8000
          const res = await fetch(`http://localhost:8000/api/v1/vision/detect?lang=${i18n.language}`, {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          resolve(data.message || t('assistant.error_exec'));
        } catch (e) {
          resolve(t('assistant.error_exec'));
        }
      }, 'image/jpeg');
    });
  }, [i18n.language, t]);

  const readText = useCallback(async (videoElement: HTMLVideoElement | null): Promise<string> => {
    if (!videoElement) return t('assistant.error_exec');

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(t('assistant.error_exec'));
        return;
      }
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(t('assistant.error_exec'));
          return;
        }
        const formData = new FormData();
        formData.append('file', blob, 'capture.jpg');
        
        try {
          const res = await fetch(`http://localhost:8000/api/v1/vision/read-text?lang=${i18n.language}`, {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          resolve(data.message || t('assistant.error_exec'));
        } catch (e) {
          resolve(t('assistant.error_exec'));
        }
      }, 'image/jpeg');
    });
  }, [i18n.language, t]);

  return { loadModel, isModelLoading, detectObjects, readText };
};
