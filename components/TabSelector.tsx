
import React from 'react';

type Tab = 'occasion' | 'item' | 'live' | 'saved';

interface TabSelectorProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, setActiveTab }) => {
  const getButtonClasses = (tabName: Tab) => {
    return `w-1/4 py-3 px-4 text-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
      activeTab === tabName
        ? 'bg-purple-600 text-white shadow-md'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`;
  };

  return (
    <div className="flex bg-gray-800 p-1 rounded-xl shadow-inner">
      <button
        onClick={() => setActiveTab('occasion')}
        className={getButtonClasses('occasion')}
      >
        Suggest by Occasion
      </button>
      <button
        onClick={() => setActiveTab('item')}
        className={getButtonClasses('item')}
      >
        Match My Item
      </button>
      <button
        onClick={() => setActiveTab('live')}
        className={getButtonClasses('live')}
      >
        Live Stylist
      </button>
      <button
        onClick={() => setActiveTab('saved')}
        className={getButtonClasses('saved')}
      >
        Saved Outfits
      </button>
    </div>
  );
};

export default TabSelector;
