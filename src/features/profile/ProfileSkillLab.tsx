import React from 'react';
import { useApp } from '../../app/AppContext';

// Pokémon Skill Lab (Phase 12D: nằm cuối cùng của tab Pokémon). Chỉ hiện khi có Pokémon đồng hành.
export const ProfileSkillLab: React.FC = () => {
  const { editingStudent, handleBuySkill, petSkills } = useApp();
  return (
    <div className="space-y-8">
                        <div className="space-y-4 pt-4">
                          <h4 className="flex items-center gap-2 border-b border-[#e6e2d4] pb-2 text-xl font-extrabold tracking-tight text-brand-ink">
                            <span>🎓</span>
                            <span>Pokémon Skill Lab</span>
                          </h4>
                          <p className="text-xs text-purple-800/70">Huấn luyện skill cho Pokémon để hỗ trợ trainer trong các hoạt động học tập.</p>

                          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                            {petSkills.map(sk => {
                              const isLearned = editingStudent.pet?.skills.includes(sk.id);
                              return (
                                <div key={sk.id} className="bg-white p-4 border border-gray-100 rounded-3xl flex items-center justify-between gap-4 shadow-sm hover:border-purple-200 hover:bg-purple-50/10 transition-all">
                                  <div className="w-10 h-10 shrink-0 bg-purple-50 rounded-2xl flex items-center justify-center text-2xl border border-purple-100">
                                    {sk.icon}
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Trainer skill</span>
                                    <h5 className="font-extrabold text-sm text-gray-800 mt-1">{sk.name}</h5>
                                    <p className="text-xs text-gray-400 mt-0.5 italic leading-relaxed">{sk.description}</p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    {isLearned ? (
                                      <span className="bg-purple-100 text-purple-800 font-extrabold border border-purple-200 text-xs px-4 py-2 rounded-2xl tracking-tighter">
                                        ☘️ Đã Giác Ngộ
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleBuySkill(editingStudent.id, sk.id, sk.cost, sk.name)}
                                        className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2 rounded-2xl tracking-tight shadow active:translate-y-px transition-all"
                                      >
                                        Rèn ({sk.cost}đ)
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
    </div>
  );
};
