import React from 'react';
import { PokemonReactionToast } from '../../components/PokemonReactionToast';
import { useApp } from '../../app/AppContext';

export const PokemonReactionLayer: React.FC = () => {
  const {
    pokemonReactionEvents, pokemonReactionTimerRef, pokemonReactionTitle,
    setPokemonReactionEvents
  } = useApp();
  return (
    <PokemonReactionToast
      events={pokemonReactionEvents}
      title={pokemonReactionTitle}
      onClose={() => {
        if (pokemonReactionTimerRef.current) {
          window.clearTimeout(pokemonReactionTimerRef.current);
          pokemonReactionTimerRef.current = null;
        }
        setPokemonReactionEvents([]);
      }}
    />
  );
};
