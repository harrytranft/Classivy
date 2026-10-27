import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { PokemonUiEvent } from '../../domain/gameEvents';
import { HatchAnnouncementItem, LevelUpAnnouncement } from '../../types/app';
import { PokemonReleaseEvent } from '../../types';

// Sự kiện giao diện dùng chung: toast Pokémon, level-up, thông báo nở trứng, hàng đợi Pokémon rời đi.
const useUiEventsValue = () => {
  const [pokemonReactionEvents, setPokemonReactionEvents] = useState<PokemonUiEvent[]>([]);
  const [pokemonReactionTitle, setPokemonReactionTitle] = useState('Tiến triển Pokémon');
  const [levelUpAnnouncement, setLevelUpAnnouncement] = useState<LevelUpAnnouncement | null>(null);
  const pokemonReactionTimerRef = useRef<number | null>(null);
  const [showHatchModal, setShowHatchModal] = useState(false);
  const [hatchSuccessMessage, setHatchSuccessMessage] = useState<string>('');
  const [hatchAnnouncementItems, setHatchAnnouncementItems] = useState<HatchAnnouncementItem[] | null>(null);
  const [pokemonReleaseEvent, setPokemonReleaseEvent] = useState<PokemonReleaseEvent | null>(null);
  const [pokemonReleaseQueue, setPokemonReleaseQueue] = useState<PokemonReleaseEvent[]>([]);

  useEffect(() => {
    return () => {
      if (pokemonReactionTimerRef.current) {
        window.clearTimeout(pokemonReactionTimerRef.current);
      }
    };
  }, []);

  const showPokemonReaction = (events: PokemonUiEvent[], title = 'Tiến triển Pokémon') => {
    if (events.length === 0) return;
    if (pokemonReactionTimerRef.current) {
      window.clearTimeout(pokemonReactionTimerRef.current);
    }
    setPokemonReactionTitle(title);
    setPokemonReactionEvents(events.slice(0, 4));
    const levelEvents = events.filter(event => event.type === 'level-up');
    if (levelEvents.length > 0) {
      setLevelUpAnnouncement({
        title,
        events: levelEvents.slice(0, 3)
      });
    }
  };

  const showHatchAnnouncement = (items: HatchAnnouncementItem[], fallbackMessage: string) => {
    setHatchAnnouncementItems(items.length > 0 ? items : null);
    setHatchSuccessMessage(fallbackMessage);
    setShowHatchModal(true);
  };

  const queuePokemonReleaseEvents = (events: PokemonReleaseEvent[]) => {
    if (events.length === 0) return;
    setPokemonReleaseEvent(events[0]);
    setPokemonReleaseQueue(events.slice(1));
  };

  const showNextPokemonReleaseEvent = () => {
    setPokemonReleaseQueue(prev => {
      const [nextEvent, ...rest] = prev;
      setPokemonReleaseEvent(nextEvent || null);
      return rest;
    });
  };

  return {
    pokemonReactionEvents, setPokemonReactionEvents, pokemonReactionTitle,
    setPokemonReactionTitle, levelUpAnnouncement, setLevelUpAnnouncement,
    pokemonReactionTimerRef, showHatchModal, setShowHatchModal, hatchSuccessMessage,
    setHatchSuccessMessage, hatchAnnouncementItems, setHatchAnnouncementItems,
    pokemonReleaseEvent, setPokemonReleaseEvent, pokemonReleaseQueue, setPokemonReleaseQueue,
    showPokemonReaction, showHatchAnnouncement, queuePokemonReleaseEvents,
    showNextPokemonReleaseEvent
  };
};

export type UiEventsValue = ReturnType<typeof useUiEventsValue>;

const UiEventsContext = createContext<UiEventsValue | null>(null);

export const UiEventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useUiEventsValue();
  return <UiEventsContext.Provider value={value}>{children}</UiEventsContext.Provider>;
};

export const useUiEvents = (): UiEventsValue => {
  const value = useContext(UiEventsContext);
  if (!value) throw new Error('useUiEvents must be used inside UiEventsProvider');
  return value;
};
