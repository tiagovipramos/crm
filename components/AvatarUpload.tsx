'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar?: string;
  onSave: (imageData: string) => void;
  onClose: () => void;
}

export default function AvatarUpload({ currentAvatar, onSave, onClose }: AvatarUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setImageOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - imageOffset.x, y: touch.clientY - imageOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    setImageOffset({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const cropImage = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Tamanho final do avatar (circular)
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    // Calcular a área da imagem que está dentro do círculo central
    // O círculo está no centro do container (150, 150) com raio 100
    const containerSize = 300;
    const circleRadius = 100;
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;

    // Calcular origem do crop na imagem original
    const imgWidth = imageRef.current.naturalWidth;
    const imgHeight = imageRef.current.naturalHeight;
    
    // Escala da imagem renderizada vs original
    const renderedWidth = imageRef.current.width * zoom;
    const renderedHeight = imageRef.current.height * zoom;
    const scaleX = imgWidth / renderedWidth;
    const scaleY = imgHeight / renderedHeight;

    // Posição do centro do círculo na imagem (considerando offset e zoom)
    const cropCenterX = (centerX - imageOffset.x) * scaleX;
    const cropCenterY = (centerY - imageOffset.y) * scaleY;

    // Tamanho do crop na imagem original
    const cropSize = (circleRadius * 2) * scaleX;

    // Posição de início do crop
    const sx = cropCenterX - (cropSize / 2);
    const sy = cropCenterY - (cropSize / 2);

    // Desenhar imagem recortada
    ctx.drawImage(
      imageRef.current,
      sx,
      sy,
      cropSize,
      cropSize,
      0,
      0,
      size,
      size
    );

    // Criar máscara circular
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL('image/jpeg', 0.9);
  }, [imageOffset, zoom]);

  const handleSave = () => {
    const croppedImage = cropImage();
    if (croppedImage) {
      onSave(croppedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl font-bold text-gray-800">Foto de Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!selectedImage ? (
            <div className="space-y-4">
              {/* Botão Tirar Selfie */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Camera className="w-6 h-6" />
                📸 Tirar Selfie
              </button>

              {/* Botão Escolher Foto */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Upload className="w-6 h-6" />
                🖼️ Escolher Foto
              </button>

              {/* Inputs escondidos */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-sm text-blue-800 font-semibold mb-2">💡 Dica:</p>
                <p className="text-xs text-blue-700">
                  Para melhor resultado, tire a foto com boa iluminação e focando no rosto!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Área de Crop */}
              <div className="relative bg-gray-100 rounded-2xl overflow-hidden">
                <div
                  className="relative mx-auto"
                  style={{ width: '300px', height: '300px' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{
                      transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${zoom})`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    draggable={false}
                  />
                  
                  {/* Overlay com círculo de crop */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg width="300" height="300" className="absolute inset-0">
                      <defs>
                        <mask id="circleMask">
                          <rect width="300" height="300" fill="white" />
                          <circle cx="150" cy="150" r="100" fill="black" />
                        </mask>
                      </defs>
                      <rect
                        width="300"
                        height="300"
                        fill="black"
                        opacity="0.6"
                        mask="url(#circleMask)"
                      />
                      <circle
                        cx="150"
                        cy="150"
                        r="100"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                    </svg>
                  </div>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                  <Move className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Arraste para ajustar
                  </span>
                </div>
              </div>

              {/* Controles de Zoom */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <ZoomIn className="w-4 h-4 text-purple-600" />
                  Zoom
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Zoom: {(zoom * 100).toFixed(0)}%
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setZoom(1);
                    setImageOffset({ x: 0, y: 0 });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Salvar
                </button>
              </div>

              {/* Canvas escondido para processar crop */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
