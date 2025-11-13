
import React, { useState, useRef, ChangeEvent } from 'react';
import { OutfitSuggestion, StyleProfile } from '../types';
import { getMatchesForItem } from '../services/geminiService';

interface ItemMatcherProps {
  onSuggestions: (suggestions: OutfitSuggestion[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUploadedItemUrl: (url: string | null) => void;
  styleProfile: StyleProfile;
}

const ItemMatcher: React.FC<ItemMatcherProps> = ({ onSuggestions, setLoading, setError, setUploadedItemUrl, styleProfile }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setPreviewUrl(url);
        setUploadedItemUrl(url);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadedItemUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select an image file.');
      return;
    }

    setLoading(true);
    setError(null);
    onSuggestions([]);

    try {
      const results = await getMatchesForItem(selectedFile, styleProfile);
      onSuggestions(results);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col justify-center items-center cursor-pointer hover:border-purple-500 hover:bg-gray-700/50 transition-colors"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
        ) : (
          <div className="text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="mt-2">Click to upload an image</p>
            <p className="text-xs">PNG, JPG, or WEBP</p>
          </div>
        )}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selectedFile}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        Find Matches
      </button>
    </div>
  );
};

export default ItemMatcher;
