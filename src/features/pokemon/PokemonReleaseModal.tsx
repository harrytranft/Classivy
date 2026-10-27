import React from 'react';
import { getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError } from '../../domain/pokemonProgression';
import { useApp } from '../../app/AppContext';

export const PokemonReleaseModal: React.FC = () => {
  const {
    handleBuyNewEgg, handleOpenEggAfterRelease, handleSelectReplacementPokemon,
    pokemonReleaseEvent, releaseEggShortfall, releaseStudent, showNextPokemonReleaseEvent
  } = useApp();
  return (
    <>
            {pokemonReleaseEvent && (
              <div className="fixed inset-0 z-[260] flex items-center justify-center bg-brand-forest-deep/70 p-4 backdrop-blur-xl animate-in fade-in duration-300">
                <div className="bg-rose-50 max-w-2xl w-full rounded-[36px] border-[8px] border-rose-700 p-6 sm:p-8 shadow-[0_0_90px_rgba(190,18,60,0.38)] text-center space-y-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(244,63,94,0.18),transparent_36%)] pointer-events-none" />
                  <div className="relative z-10 space-y-4">
                    <p className="text-xs font-black text-rose-800">Pokémon rời đội hình</p>
                    <h3 className="text-3xl sm:text-4xl text-rose-950 font-extrabold">Pokémon đã rời đội hình</h3>

                    <div className="bg-white/90 rounded-[28px] border border-rose-200 p-5 shadow-inner">
                      <img
                        referrerPolicy="no-referrer"
                        src={getPokemonArtworkUrl(pokemonReleaseEvent.releasedPet)}
      	                  onError={event => handlePokemonArtworkError(event, pokemonReleaseEvent.releasedPet)}
                        className={`w-36 h-36 object-contain mx-auto drop-shadow-xl grayscale-[20%] ${pokemonReleaseEvent.releasedPet.isShiny ? 'rounded-3xl bg-amber-100 ring-4 ring-amber-300' : ''}`}
                        alt={getPokemonDisplayName(pokemonReleaseEvent.releasedPet)}
                      />
                      <p className="text-lg font-black text-rose-950">
                        {pokemonReleaseEvent.releasedPet.isShiny ? '✨ ' : ''}{getPokemonDisplayName(pokemonReleaseEvent.releasedPet)} của {pokemonReleaseEvent.studentName} đã cạn HP và rời đội hình.
                      </p>
                      {pokemonReleaseEvent.cause && (
                        <p className="mt-2 text-xs font-bold text-rose-700">{pokemonReleaseEvent.cause}</p>
                      )}
                    </div>

                    {pokemonReleaseEvent.remainingPets.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs font-black text-rose-800">Chọn Pokémon đồng hành mới</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {pokemonReleaseEvent.remainingPets.map(pet => (
                            <button
                              key={pet.instanceId || `${pet.dexId}-${pet.name}-${pet.baseDexId || pet.dexId}`}
                              onClick={() => handleSelectReplacementPokemon(pet)}
                              className="bg-white hover:bg-rose-50 border-2 border-rose-200 hover:border-rose-600 rounded-3xl p-3 transition-all shadow-sm"
                            >
                              <img
                                referrerPolicy="no-referrer"
                                src={getPokemonArtworkUrl(pet)}
      	                          onError={event => handlePokemonArtworkError(event, pet)}
                                className="w-20 h-20 object-contain mx-auto"
                                alt={getPokemonDisplayName(pet)}
                              />
                              <p className="text-xs font-black text-emerald-950 truncate">{pet.isShiny ? '✨ ' : ''}{getPokemonDisplayName(pet)}</p>
                              <div className="mt-1 grid grid-cols-3 gap-1 text-xs font-black text-rose-800">
                                <span className="rounded-lg bg-rose-50 px-1 py-0.5">Lv.{pet.level || 1}</span>
                                <span className="rounded-lg bg-emerald-50 px-1 py-0.5 text-emerald-700">HP {pet.hp ?? 100}</span>
                                <span className="rounded-lg bg-pink-50 px-1 py-0.5 text-pink-700">B{pet.bond || 0}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm font-bold text-rose-900">Bạn không còn Pokémon nào trong bộ sưu tập.</p>
                        {releaseEggShortfall > 0 && (
                          <p className="rounded-2xl bg-white/85 p-3 text-xs font-black text-rose-700 border border-rose-200">
                            Cần thêm {releaseEggShortfall} Hào Quang để mua trứng.
                          </p>
                        )}
                        <button
                          disabled={!releaseStudent || releaseEggShortfall > 0}
                          onClick={() => {
                            if (!releaseStudent) return;
                            const bought = handleBuyNewEgg(releaseStudent.id);
                            if (bought) showNextPokemonReleaseEvent();
                          }}
                          className="bg-rose-700 hover:bg-rose-800 disabled:bg-gray-300 disabled:text-gray-500 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg transition-all"
                        >
                          Mua trứng Pokémon mới — 10 Hào Quang
                        </button>
                        <div>
                          <button
                            onClick={handleOpenEggAfterRelease}
                            className="text-xs font-black text-rose-700 hover:text-rose-950"
                          >
                            Mở hồ sơ ấp trứng
                          </button>
                        </div>
                        <button
                          onClick={showNextPokemonReleaseEvent}
                          className="text-xs font-bold text-gray-500 hover:text-gray-800"
                        >
                          Tiếp tục học không có Pokémon
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
    </>
  );
};
