
import React, { useState, useEffect } from 'react';
import { OutfitSuggestion, StyleProfile } from './types';
import TabSelector from './components/TabSelector';
import OccasionStylist from './components/OccasionStylist';
import ItemMatcher from './components/ItemMatcher';
import SuggestionCard from './components/SuggestionCard';
import Spinner from './components/Spinner';
import ErrorMessage from './components/ErrorMessage';
import StyleProfileModal from './components/StyleProfile';
import LiveStylist from './components/LiveStylist';
import SavedOutfits from './components/SavedOutfits';
import VisualizeOutfitModal from './components/VisualizeOutfitModal';
import { visualizeOutfit } from './services/geminiService';

type Tab = 'occasion' | 'item' | 'live' | 'saved';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('occasion');
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedItemUrl, setUploadedItemUrl] = useState<string | null>(null);
  const [styleProfile, setStyleProfile] = useState<StyleProfile>({ style: '', colors: '', gender: '', savedOutfits: [] });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // State for the new visualization modal
  const [isVisualizeModalOpen, setIsVisualizeModalOpen] = useState<boolean>(false);
  const [visualizingOutfit, setVisualizingOutfit] = useState<OutfitSuggestion | null>(null);
  const [visualizationImageUrl, setVisualizationImageUrl] = useState<string | null>(null);
  const [isVisualizing, setIsVisualizing] = useState<boolean>(false);
  const [visualizationError, setVisualizationError] = useState<string | null>(null);

  useEffect(() => {
    if (!styleProfile.gender) {
      setIsProfileModalOpen(true);
    }
  }, []); // Run only on mount

  const handleNewSuggestions = (newSuggestions: OutfitSuggestion[]) => {
    setSuggestions(newSuggestions);
    setError(null);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    setUploadedItemUrl(null);
  };

  const handleProfileSave = (newProfile: StyleProfile) => {
    // Preserve saved outfits when updating profile from modal
    setStyleProfile(prev => ({ ...newProfile, savedOutfits: prev.savedOutfits }));
    setIsProfileModalOpen(false);
  };

  const handleSaveToggle = (outfit: OutfitSuggestion) => {
    setStyleProfile(prevProfile => {
      const isSaved = prevProfile.savedOutfits?.some(o => o.outfitName === outfit.outfitName);
      let updatedSavedOutfits;
      if (isSaved) {
        updatedSavedOutfits = prevProfile.savedOutfits?.filter(o => o.outfitName !== outfit.outfitName);
      } else {
        updatedSavedOutfits = [...(prevProfile.savedOutfits || []), outfit];
      }
      return { ...prevProfile, savedOutfits: updatedSavedOutfits };
    });
  };

  const isOutfitSaved = (outfit: OutfitSuggestion) => {
    return styleProfile.savedOutfits?.some(o => o.outfitName === outfit.outfitName) ?? false;
  };

  const handleVisualize = async (outfit: OutfitSuggestion) => {
    setIsVisualizeModalOpen(true);
    setIsVisualizing(true);
    setVisualizingOutfit(outfit);
    setVisualizationImageUrl(null);
    setVisualizationError(null);

    try {
      const imageUrl = await visualizeOutfit(outfit, styleProfile);
      setVisualizationImageUrl(imageUrl);
    } catch (err: any) {
      setVisualizationError(err.message || 'An unexpected error occurred during visualization.');
    } finally {
      setIsVisualizing(false);
    }
  };

  const closeVisualizeModal = () => {
    setIsVisualizeModalOpen(false);
    setVisualizingOutfit(null);
    setVisualizationImageUrl(null);
    setIsVisualizing(false);
    setVisualizationError(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'occasion':
        return <OccasionStylist onSuggestions={handleNewSuggestions} setLoading={setIsLoading} setError={setError} styleProfile={styleProfile} />;
      case 'item':
        return <ItemMatcher onSuggestions={handleNewSuggestions} setLoading={setIsLoading} setError={setError} setUploadedItemUrl={setUploadedItemUrl} styleProfile={styleProfile} />;
      case 'live':
        return <LiveStylist onSuggestions={handleNewSuggestions} setLoading={setIsLoading} setError={setError} styleProfile={styleProfile} />;
      case 'saved':
        return <SavedOutfits savedOutfits={styleProfile.savedOutfits || []} onSaveToggle={handleSaveToggle} onVisualize={handleVisualize} />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
       {isProfileModalOpen && (
        <StyleProfileModal
          profile={styleProfile}
          onSave={handleProfileSave}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
      <VisualizeOutfitModal
        isOpen={isVisualizeModalOpen}
        onClose={closeVisualizeModal}
        outfit={visualizingOutfit}
        imageUrl={visualizationImageUrl}
        isLoading={isVisualizing}
        error={visualizationError}
      />
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI Fashion Stylist
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Your personal guide to the perfect look.</p>
           <button
            onClick={() => setIsProfileModalOpen(true)}
            className="mt-4 inline-block bg-gray-700/50 hover:bg-gray-700 text-purple-300 font-semibold py-2 px-4 border border-gray-600 rounded-lg shadow-sm transition-colors duration-300"
          >
            Edit Style Profile
          </button>
        </header>

        <main>
          <TabSelector activeTab={activeTab} setActiveTab={handleTabChange} />

          <div className="mt-6 p-6 bg-gray-800/50 rounded-xl shadow-lg backdrop-blur-sm border border-gray-700">
            {renderContent()}
          </div>

          <div className="mt-10">
            {uploadedItemUrl && activeTab === 'item' && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-300 mb-4 text-center">
                  {isLoading ? "Analyzing your item..." : "Suggestions for your item:"}
                </h3>
                <div className="flex justify-center">
                  <div className="relative p-2 bg-gray-800/50 rounded-xl border border-gray-700 inline-block">
                    <img src={uploadedItemUrl} alt="Uploaded item" className="max-h-64 rounded-lg shadow-lg" />
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Spinner />
              </div>
            ) : error ? (
              <ErrorMessage message={error} />
            ) : suggestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={index}
                    suggestion={suggestion}
                    isSaved={isOutfitSaved(suggestion)}
                    onSaveToggle={handleSaveToggle}
                    onVisualize={handleVisualize}
                  />
                ))}
              </div>
            ) : (
              (activeTab !== 'item' || !uploadedItemUrl) && activeTab !== 'live' && activeTab !== 'saved' && (
                  <div className="text-center py-16 px-6 bg-gray-800/50 rounded-xl border border-gray-700">
                    <h3 className="text-2xl font-semibold text-gray-300">Ready for your style upgrade?</h3>
                    <p className="text-gray-400 mt-2">Enter an occasion, upload an item, or try the Live Stylist to get started.</p>
                  </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
