
export interface Accessory {
  name: string;
  description: string;
}

export interface ClothingItem {
  type: string;
  description: string;
}

export interface Shoes {
  type: string;
  description: string;
}

export interface OutfitSuggestion {
  outfitName: string;
  description: string;
  shirt?: ClothingItem;
  pants?: ClothingItem;
  dress?: ClothingItem;
  shoes: Shoes;
  accessories: Accessory[];
  colorPalette?: string;
}

export interface StyleProfile {
  style: string;
  colors: string;
  gender: string;
  savedOutfits?: OutfitSuggestion[];
}
