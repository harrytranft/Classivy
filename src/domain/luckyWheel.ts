import { LuckyWheelReward } from '../types';
import { getRandomIndex } from './random';

// Logic thuần của Vòng quay may mắn.

export const shuffleLuckyWheelRewards = (rewards: LuckyWheelReward[]) => {
  const next = [...rewards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = getRandomIndex(i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export const isGoodLuckyWheelReward = (reward: LuckyWheelReward) => {
  if (reward.type === 'points' || reward.type === 'hp') return (reward.amount || 0) > 0;
  return reward.type === 'pokemon' || reward.type === 'skill' || reward.type === 'ludo_rolls';
};
