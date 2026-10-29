import React, { useMemo } from 'react';
import { useApp } from '../../app/AppContext';
import { WILD_RARITY_LABELS } from '../../domain/wildHunt';
import { createPokemonPetFromDexId, getPokemonArtworkUrl, handlePokemonArtworkError } from '../../domain/pokemonProgression';

// Thông báo nổi khi Pokémon hoang dã xuất hiện. Không chặn thao tác (role="status", không phải hộp thoại) nên phím tắt vẫn dùng được.
export const WildEncounterToast: React.FC = () => {
  const { wildEncounter, routeClassName, routeSubPage, startWildHunt, dismissWildEncounter } = useApp();
  const pet = useMemo(
    () => (wildEncounter ? createPokemonPetFromDexId(wildEncounter.dexId, undefined, { isShiny: false }) : undefined),
    [wildEncounter?.dexId]
  );

  if (!wildEncounter || wildEncounter.status !== 'announced' || !pet) return null;
  if (routeClassName !== wildEncounter.className || routeSubPage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="wild-toast"
      className="fixed right-5 top-5 z-[250] flex w-[22rem] max-w-[calc(100vw-7rem)] items-center gap-3 rounded-3xl border-2 border-emerald-300 bg-white p-3 shadow-2xl animate-in slide-in-from-right duration-300"
    >
      <img
        src={getPokemonArtworkUrl(pet)}
        onError={event => handlePokemonArtworkError(event, pet)}
        alt=""
        aria-hidden
        className="h-20 w-20 shrink-0 object-contain brightness-0 drop-shadow"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-tight text-emerald-950">Một Pokémon hoang dã vừa xuất hiện!</p>
        <p className="text-xs font-bold text-emerald-800/80">Độ hiếm: {WILD_RARITY_LABELS[wildEncounter.rarity]}</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={startWildHunt} data-testid="wild-toast-go" className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow hover:bg-emerald-700">Săn ngay</button>
          <button type="button" onClick={dismissWildEncounter} data-testid="wild-toast-later" className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-black text-emerald-900 hover:bg-emerald-50">Để sau</button>
        </div>
      </div>
    </div>
  );
};
