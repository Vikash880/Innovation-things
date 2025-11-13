
import React, { useState } from 'react';
import { OutfitSuggestion, StyleProfile } from '../types';
import { getSuggestionsForOccasion } from '../services/geminiService';

interface OccasionStylistProps {
  onSuggestions: (suggestions: OutfitSuggestion[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  styleProfile: StyleProfile;
}

const OccasionStylist: React.FC<OccasionStylistProps> = ({ onSuggestions, setLoading, setError, styleProfile }) => {
  const [occasion, setOccasion] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occasion.trim()) {
      setError('Please enter an occasion.');
      return;
    }

    setLoading(true);
    setError(null);
    onSuggestions([]);

    try {
      const results = await getSuggestionsForOccasion(occasion, styleProfile);
      onSuggestions(results);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="occasion" className="block text-sm font-medium text-gray-300 mb-2">
          What's the occasion?
        </label>
        <input
          type="text"
          id="occasion"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder="e.g., Beach wedding, job interview..."
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105"
      >
        Get Suggestions
      </button>
    </form>
  );
};

export default OccasionStylist;
