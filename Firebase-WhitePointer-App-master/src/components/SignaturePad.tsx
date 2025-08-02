import React, { useRef, useEffect, useState } from 'react';
import { getClientIP } from '@/lib/utils';

type SignaturePadProps = {
  caseId: string;
  documentType: string;
  signerName: string;
  onSignComplete: (signedDoc: any) => void;
  onError: (error: Error) => void;
};

export const SignaturePad: React.FC<SignaturePadProps> = ({
  caseId,
  documentType,
  signerName,
  onSignComplete,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<{
    base64: string;
    vectorPoints: number[];
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Drawing handlers
    const startDrawing = (e: MouseEvent | TouchEvent) => {
      setIsDrawing(true);
      const pos = getPosition(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      const pos = getPosition(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      setIsDrawing(false);
      updateSignatureData();
    };

    // Get mouse/touch position
    const getPosition = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e as MouseEvent).clientX - rect.left || 
           (e as TouchEvent).touches[0].clientX - rect.left,
        y: (e as MouseEvent).clientY - rect.top || 
           (e as TouchEvent).touches[0].clientY - rect.top
      };
    };

    // Event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isDrawing]);

  const updateSignatureData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const base64 = canvas.toDataURL('image/png');
    setSignatureData({
      base64,
      vectorPoints: [] // Can be enhanced to capture vector points
    });
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const handleSignComplete = async () => {
    if (!signatureData) {
      onError(new Error('Please provide a signature first'));
      return;
    }

    try {
      // Call API to create signed document
      const response = await fetch('/api/signature/create-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          documentType,
          signerName,
          signatureData,
          userAgent: navigator.userAgent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create signed document');
      }

      const signedDoc = await response.json();
      onSignComplete(signedDoc);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Signing failed'));
    }
  };

  return (
    <div className="signature-pad-container">
      <canvas 
        ref={canvasRef}
        width={400}
        height={200}
        className="border border-gray-300 rounded-md"
      />
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={clearSignature}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Clear
        </button>
        
        <button
          onClick={handleSignComplete}
          disabled={!signatureData}
          className={`px-4 py-2 rounded-md ${signatureData 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Sign & Save
        </button>
      </div>
    </div>
  );
};
