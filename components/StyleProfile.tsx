
import React, { useState, useEffect } from 'react';
import { StyleProfile } from '../types';

interface StyleProfileModalProps {
  profile: StyleProfile;
  onSave: (profile: StyleProfile) => void;
  onClose: () => void;
}

const StyleProfileModal: React.FC<StyleProfileModalProps> = ({ profile, onSave, onClose }) => {
  const [currentProfile, setCurrentProfile] = useState<StyleProfile>(profile);
  const [error, setError] = useState<string | null>(null);
  const isInitialSetup = !profile.gender;

  useEffect(() => {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSave = () => {
    if (!currentProfile.gender) {
        setError('Please select a gender to get personalized suggestions.');
        return;
    }
    setError(null);
    onSave(currentProfile);
  };
  
  const handleClose = () => {
    // Prevent closing the modal during the initial setup
    if (!isInitialSetup) {
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentProfile(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md m-4 border border-gray-700"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
          {isInitialSetup ? "Welcome! Let's Get Started" : "Your Style Profile"}
        </h2>
        <p className="text-gray-400 mb-6">
            {isInitialSetup ? "First, tell us a bit about your style so we can give you the best suggestions." : "Help us tailor suggestions to your unique taste."}
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">
              Gender <span className="text-red-400">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={currentProfile.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
            </select>
          </div>
          <div>
            <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-2">
              Personal Style
            </label>
            <input
              type="text"
              id="style"
              name="style"
              value={currentProfile.style}
              onChange={handleChange}
              placeholder="e.g., Minimalist, Bohemian, Classic"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="colors" className="block text-sm font-medium text-gray-300 mb-2">
              Favorite Colors
            </label>
            <input
              type="text"
              id="colors"
              name="colors"
              value={currentProfile.colors}
              onChange={handleChange}
              placeholder="e.g., Earth tones, pastels, black"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        
        <div className="mt-8 flex justify-end space-x-3">
          {!isInitialSetup && (
            <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
            >
                Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg shadow-lg"
          >
            {isInitialSetup ? "Save & Continue" : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleProfileModal;
