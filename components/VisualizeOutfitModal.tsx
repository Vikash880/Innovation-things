
import React, { useEffect } from 'react';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import { OutfitSuggestion } from '../types';

interface VisualizeOutfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfit: OutfitSuggestion | null;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const VisualizeOutfitModal: React.FC<VisualizeOutfitModalProps> = ({ isOpen, onClose, outfit, imageUrl, isLoading, error }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            {outfit?.outfitName || 'Outfit Visualization'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="p-6 flex-grow flex justify-center items-center overflow-y-auto">
          {isLoading && <Spinner />}
          {error && <ErrorMessage message={error} />}
          {imageUrl && !isLoading && !error && (
            <img 
              src={`data:image/png;base64,${imageUrl}`} 
              alt={`Visualization of ${outfit?.outfitName}`}
              className="max-w-full max-h-full object-contain rounded-lg" 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default VisualizeOutfitModal;
