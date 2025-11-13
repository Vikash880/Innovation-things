
import React from 'react';
import { OutfitSuggestion } from '../types';
import ShirtIcon from './icons/ShirtIcon';
import PantsIcon from './icons/PantsIcon';
import ShoesIcon from './icons/ShoesIcon';
import WatchIcon from './icons/WatchIcon';
import SunglassesIcon from './icons/SunglassesIcon';
import ChainIcon from './icons/ChainIcon';
import DressIcon from './icons/DressIcon';
import HeartIcon from './icons/HeartIcon';
import SparkleIcon from './icons/SparkleIcon';

interface SuggestionCardProps {
  suggestion: OutfitSuggestion;
  isSaved: boolean;
  onSaveToggle: (suggestion: OutfitSuggestion) => void;
  onVisualize: (suggestion: OutfitSuggestion) => void;
}

const getAccessoryIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('watch')) return <WatchIcon />;
  if (lowerName.includes('sun') || lowerName.includes('glasses')) return <SunglassesIcon />;
  if (lowerName.includes('chain') || lowerName.includes('necklace')) return <ChainIcon />;
  return <div className="w-6 h-6 bg-gray-600 rounded-full" />;
};

const ItemRow: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => {
  const searchQuery = encodeURIComponent(`${description} ${title}`);
  // Using Google Shopping search as a placeholder for finding similar items.
  const searchUrl = `https://www.google.com/search?q=${searchQuery}&tbm=shop`;

  return (
    <div className="flex items-start justify-between space-x-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 text-purple-400 mt-1">{icon}</div>
            <div>
                <h4 className="font-semibold text-gray-200">{title}</h4>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
        <a 
            href={searchUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-shrink-0 ml-4 text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors whitespace-nowrap mt-1 font-medium"
            aria-label={`Shop for similar ${title}`}
        >
            Shop similar
        </a>
    </div>
  );
};

const ColorPalette: React.FC<{ palette: string }> = ({ palette }) => {
  // Example: "Earthy tones: olive green, beige, and terracotta brown"
  const colorsStr = palette.includes(':') ? palette.split(':')[1] : palette;
  const colors = colorsStr.split(',').map(c => c.replace(/and/gi, '').trim().toLowerCase());

  const getCssColor = (colorName: string): string => {
    // A simple attempt to convert to a valid CSS color by removing spaces.
    return colorName.replace(/\s+/g, '');
  };

  return (
    <div className="pt-3 mt-4 border-t border-gray-700/50">
      <h5 className="font-semibold text-sm text-gray-300 mb-2">Color Palette</h5>
      <p className="text-xs text-gray-400 mb-2">{palette}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <span
            key={index}
            className="block w-5 h-5 rounded-full border-2 border-gray-600"
            style={{ backgroundColor: getCssColor(color) }}
            title={color}
            aria-label={color}
          />
        ))}
      </div>
    </div>
  );
};


const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, isSaved, onSaveToggle, onVisualize }) => {
  return (
    <div className="relative bg-gray-800/70 rounded-xl shadow-lg p-5 flex flex-col space-y-4 border border-gray-700 hover:border-purple-500 transition-all duration-300 transform hover:-translate-y-1">
      <button
        onClick={() => onSaveToggle(suggestion)}
        className={`absolute top-4 right-4 p-1 rounded-full transition-colors z-10 ${
            isSaved ? 'text-pink-500 hover:text-pink-400' : 'text-gray-500 hover:text-pink-500'
        }`}
        aria-label={isSaved ? 'Unsave outfit' : 'Save outfit'}
      >
        <HeartIcon filled={isSaved} />
      </button>

      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 pr-8">
        {suggestion.outfitName}
      </h3>
      <p className="text-gray-400 text-sm">{suggestion.description}</p>
      
      <div className="space-y-4 pt-2 border-t border-gray-700/50 flex-grow">
        {suggestion.dress && <ItemRow icon={<DressIcon />} title={suggestion.dress.type} description={suggestion.dress.description} />}
        {suggestion.shirt && <ItemRow icon={<ShirtIcon />} title={suggestion.shirt.type} description={suggestion.shirt.description} />}
        {suggestion.pants && <ItemRow icon={<PantsIcon />} title={suggestion.pants.type} description={suggestion.pants.description} />}
        {suggestion.shoes && <ItemRow icon={<ShoesIcon />} title={suggestion.shoes.type} description={suggestion.shoes.description} />}
        
        {suggestion.accessories.length > 0 && (
          <div className="space-y-4">
            {suggestion.accessories.map((acc, index) => (
              <ItemRow key={index} icon={getAccessoryIcon(acc.name)} title={acc.name} description={acc.description} />
            ))}
          </div>
        )}
      </div>
      {suggestion.colorPalette && <ColorPalette palette={suggestion.colorPalette} />}
      <div className="pt-2 mt-auto">
        <button
          onClick={() => onVisualize(suggestion)}
          className="w-full flex items-center justify-center gap-2 bg-purple-600/50 hover:bg-purple-600 text-purple-200 hover:text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-all duration-300"
        >
          <SparkleIcon />
          Visualize Outfit
        </button>
      </div>
    </div>
  );
};

export default SuggestionCard;
