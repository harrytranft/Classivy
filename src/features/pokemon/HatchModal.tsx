import React from 'react';
import { StudentAvatar } from '../../components/StudentAvatar';
import { getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError } from '../../domain/pokemonProgression';
import { useApp } from '../../app/AppContext';

export const HatchModal: React.FC = () => {
  const {
    hatchAnnouncementItems, hatchSuccessMessage, posSoundUrl, setHatchAnnouncementItems,
    setShowHatchModal, showHatchModal, students
  } = useApp();
  return (
    <>
      {showHatchModal && (
        <div className="classivy-game-modal fixed inset-0 z-[250] flex items-center justify-center bg-brand-forest-deep/70 p-4 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-amber-50/95 max-w-2xl w-full rounded-[45px] border-[10px] border-amber-400 p-8 shadow-[0_0_120px_rgba(245,158,11,0.6)] text-center space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Ambient burst bg */}
            <div className="absolute inset-0 bg-radial-gradient from-amber-300/30 via-transparent to-transparent pointer-events-none" />

            <h3 className="text-3xl font-royal text-amber-800 uppercase tracking-widest">🐣 Pokémon Thức Giấc 🐣</h3>

            {!hatchAnnouncementItems && (
              <div className="relative inline-block py-6">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
              <div className="text-8xl select-none animate-bounce relative z-10">🦖🧬🔥</div>
              </div>
            )}

            <div className="bg-white/90 p-6 rounded-3xl border border-amber-200/50 relative z-10 shadow-inner">
              {hatchAnnouncementItems && hatchAnnouncementItems.length > 0 ? (
                <div className="space-y-4">
                  <p className="font-extrabold text-amber-950 text-sm leading-relaxed whitespace-pre-line">
                    {hatchSuccessMessage}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {hatchAnnouncementItems.map(item => {
                      const student = students.find(current => current.id === item.studentId);
                      return (
                        <div key={`${item.studentId}-${item.pet.instanceId || item.pet.dexId}`} className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-left shadow-sm">
                          <div className="flex items-center gap-3">
                            {student && <StudentAvatar student={student} className="h-12 w-12 rounded-2xl border-2 border-white shadow" />}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-amber-950">{item.studentName}</p>
                              <p className="truncate text-xs font-bold text-amber-700">nhận được {item.pet.isShiny ? 'Shiny ' : ''}{getPokemonDisplayName(item.pet)}</p>
                            </div>
                          </div>
                          <img
                            referrerPolicy="no-referrer"
                            src={getPokemonArtworkUrl(item.pet)}
                            onError={event => handlePokemonArtworkError(event, item.pet)}
                            className={`mx-auto mt-3 h-28 w-28 object-contain drop-shadow-xl ${item.pet.isShiny ? 'rounded-3xl bg-amber-100 ring-4 ring-amber-300' : ''}`}
                            alt={getPokemonDisplayName(item.pet)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="font-extrabold text-amber-950 text-sm leading-relaxed whitespace-pre-line">
                  {hatchSuccessMessage}
                </p>
              )}
            </div>

            <div className="relative z-10 pt-2">
              <button 
                onClick={() => {
                  setShowHatchModal(false);
                  setHatchAnnouncementItems(null);
                  new Audio(posSoundUrl).play().catch(() => {});
                }} 
                className="bg-amber-500 text-white px-10 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-600 hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl border-b-4 border-amber-700"
              >
                Cực Kỳ Đáng Yêu
              </button>
            </div>

            <div className="text-[9px] uppercase font-bold text-amber-900/40 tracking-wider">Trainer Hub - Pokémon Companion</div>
          </div>
        </div>
      )}
    </>
  );
};
