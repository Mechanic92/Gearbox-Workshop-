import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Zap } from 'lucide-react';

/**
 * QR Code Scanner Component
 * For scanning vehicle QR codes to quickly start jobs
 */

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const qrScanner = new Html5Qrcode('qr-reader');
    setScanner(qrScanner);

    startScanning(qrScanner);

    return () => {
      stopScanning(qrScanner);
    };
  }, []);

  const startScanning = async (qrScanner: Html5Qrcode) => {
    try {
      await qrScanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success callback
          if ('vibrate' in navigator) {
            navigator.vibrate(100);
          }
          onScan(decodedText);
          stopScanning(qrScanner);
        },
        (errorMessage) => {
          // Error callback (ignore, happens frequently during scanning)
        }
      );
      setIsScanning(true);
    } catch (error) {
      console.error('QR Scanner error:', error);
      alert('Unable to access camera for QR scanning');
    }
  };

  const stopScanning = async (qrScanner: Html5Qrcode) => {
    if (isScanning) {
      try {
        await qrScanner.stop();
        setIsScanning(false);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Scanner Container */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div id="qr-reader" className="w-full max-w-md" />

        {/* Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
                <QrCode className="w-4 h-4 text-white" />
                <span className="text-sm font-black text-white uppercase tracking-widest">QR Scanner</span>
              </div>
              <div className="w-12" /> {/* Spacer */}
            </div>
          </div>

          {/* Center Frame */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64">
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-2xl" />
              
              {/* Scanning Line Animation */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-full h-1 bg-blue-500 shadow-lg shadow-blue-500/50 animate-scan" />
              </div>
            </div>
          </div>

          {/* Bottom Instructions */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-blue-500" />
                <p className="text-sm font-black text-white uppercase tracking-widest">Scanning Active</p>
              </div>
              <p className="text-xs font-bold text-white/70">Position QR code within the frame</p>
              <p className="text-xs font-bold text-white/50">Ensure good lighting for best results</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(256px);
          }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
