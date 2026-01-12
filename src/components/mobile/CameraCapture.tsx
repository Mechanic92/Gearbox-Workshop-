import React, { useState, useRef } from 'react';
import { Camera, X, Check, RotateCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Mobile Camera Capture Component
 * Optimized for workshop use - quick photo capture for DVI
 */

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  maxPhotos?: number;
}

export default function CameraCapture({ onCapture, onClose, maxPhotos = 10 }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to compressed JPEG
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    setCapturedImages(prev => [...prev, imageData]);

    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const confirmCaptures = () => {
    capturedImages.forEach(img => onCapture(img));
    onClose();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video Preview */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
              <Camera className="w-4 h-4 text-white" />
              <span className="text-sm font-black text-white">{capturedImages.length}/{maxPhotos}</span>
            </div>
            <button
              onClick={switchCamera}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
            >
              <RotateCw className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          {/* Thumbnail Strip */}
          {capturedImages.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {capturedImages.map((img, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img
                    src={img}
                    alt={`Capture ${i + 1}`}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-white/50"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Capture Button */}
          <div className="flex items-center justify-center gap-4">
            {capturedImages.length > 0 && (
              <Button
                onClick={confirmCaptures}
                className="rounded-full h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest shadow-xl"
              >
                <Check className="w-5 h-5 mr-2" />
                Done ({capturedImages.length})
              </Button>
            )}
            
            <button
              onClick={capturePhoto}
              disabled={capturedImages.length >= maxPhotos}
              className="w-20 h-20 rounded-full bg-white border-4 border-white/30 shadow-2xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <Camera className="w-8 h-8 text-neutral-900" />
              </div>
            </button>
          </div>

          {/* Quick Tips */}
          <div className="mt-4 text-center">
            <p className="text-xs font-bold text-white/70">Tap to capture • Hold steady for clarity</p>
          </div>
        </div>

        {/* Flash Effect */}
        {capturedImages.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full bg-white animate-flash" />
          </div>
        )}
      </div>
    </div>
  );
}
