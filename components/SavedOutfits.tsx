
import React from 'react';
import { OutfitSuggestion } from '../types';
import SuggestionCard from './SuggestionCard';

interface SavedOutfitsProps {
    savedOutfits: OutfitSuggestion[];
    onSaveToggle: (suggestion: OutfitSuggestion) => void;
}

const SavedOutfits: React.FC<SavedOutfitsProps> = ({ savedOutfits, onSaveToggle }) => {
    if (!savedOutfits || savedOutfits.length === 0) {
        return (
            <div className="text-center py-16 px-6">
                <h3 className="text-2xl font-semibold text-gray-300">No saved outfits yet!</h3>
                <p className="text-gray-400 mt-2">Start exploring and save your favorite looks here.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-6 text-center">Your Saved Outfits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedOutfits.map((suggestion) => (
                    <SuggestionCard
                        key={suggestion.outfitName}
                        suggestion={suggestion}
                        onSaveToggle={onSaveToggle}
                        isSaved={true} // Always true on this screen
                    />
                ))}
            </div>
        </div>
    );
};

export default SavedOutfits;
