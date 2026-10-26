import React, { useState } from 'react';
import { EggKind } from '../../types';
import { ShopReviewItem } from '../../types/app';
import { PetSkill } from '../../data/pokemonData';

// State Shop.
export const useShopState = () => {
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopSelections, setShopSelections] = useState<Record<string, { egg?: Exclude<EggKind, 'legendary'>; skills: string[] }>>({});
  const [shopReview, setShopReview] = useState<ShopReviewItem[] | null>(null);
  const [selectedShopSkill, setSelectedShopSkill] = useState<PetSkill | null>(null);

  return {
    showShopModal, setShowShopModal, shopSelections, setShopSelections, shopReview,
    setShopReview, selectedShopSkill, setSelectedShopSkill
  };
};
