import React from 'react';
import { getWeatherMood } from '../../domain/weather';
import { StudentAvatar } from '../../components/StudentAvatar';
import { getPokemonArtworkUrl, getPokemonDisplayName, handlePokemonArtworkError } from '../../domain/pokemonProgression';
import { useApp } from '../../app/AppContext';

export const PlazaScreen: React.FC = () => {
  const {
    setCurrentScreen, setEditingStudent, students, trainerLocation, trainerWeather,
    weatherLoading
  } = useApp();
  return (
    <div className="py-8 animate-in fade-in duration-500">
      {(() => {
        const mood = getWeatherMood(trainerWeather);
        const plazaStudents = students;
        const campusZones = [
          {
            id: 'battle',
            title: 'Battle Court',
            subtitle: 'Trainer đang luyện phản xạ và thi đấu nhanh.',
            icon: '⚔️',
            tone: 'from-rose-100/95 via-orange-50/95 to-amber-100/95 border-rose-200',
            students: plazaStudents.filter((_, index) => index % 4 === 0)
          },
          {
            id: 'training',
            title: 'Training Lawn',
            subtitle: 'Khu cỏ luyện tập cùng Pokémon đồng hành.',
            icon: '🌿',
            tone: 'from-emerald-100/95 via-lime-50/95 to-teal-100/95 border-emerald-200',
            students: plazaStudents.filter((_, index) => index % 4 === 1)
          },
          {
            id: 'lake',
            title: 'Lake Walk',
            subtitle: 'Nơi trainer trò chuyện, hồi phục và trao đổi.',
            icon: '💧',
            tone: 'from-sky-100/95 via-cyan-50/95 to-indigo-100/95 border-sky-200',
            students: plazaStudents.filter((_, index) => index % 4 === 2)
          },
          {
            id: 'market',
            title: 'Shop Plaza',
            subtitle: 'Khu mua trứng, skill và chuẩn bị cho buổi học.',
            icon: '🛒',
            tone: 'from-violet-100/95 via-fuchsia-50/95 to-amber-100/95 border-violet-200',
            students: plazaStudents.filter((_, index) => index % 4 === 3)
          }
        ];
        const activityLabels = ['Battle ready', 'Training', 'Chatting', 'Trading tips', 'Resting'];

        return (
          <section className={`relative overflow-hidden rounded-[40px] border-2 border-white/80 shadow-2xl ${
            mood === 'night'
              ? 'bg-gradient-to-b from-slate-950 via-indigo-950 to-emerald-950'
              : mood === 'rain'
                ? 'bg-gradient-to-b from-slate-500 via-sky-700 to-emerald-800'
                : mood === 'fog'
                  ? 'bg-gradient-to-b from-slate-200 via-sky-100 to-emerald-200'
                  : 'bg-gradient-to-b from-sky-300 via-cyan-100 to-emerald-300'
          }`}>
            <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_78%_18%,rgba(253,224,71,0.82),transparent_12%),radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.55),transparent_14%)]" />
            <div className="absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(34,197,94,0.95)_0%,rgba(16,185,129,0.86)_40%,rgba(20,83,45,0.7)_100%)]" />
            <div className="absolute left-1/2 top-[18%] h-[84%] w-24 -translate-x-1/2 bg-stone-100/70 shadow-inner" />
            <div className="absolute left-[8%] right-[8%] top-[47%] h-24 rounded-full bg-stone-100/70 shadow-inner" />
            <div className="absolute bottom-[9%] right-[6%] h-40 w-56 rounded-[50%] bg-sky-300/70 shadow-[inset_0_8px_28px_rgba(14,116,144,0.35)]" />
            <div className="absolute bottom-[14%] right-[9%] h-24 w-36 rounded-[50%] bg-cyan-100/60 blur-sm" />
            {mood === 'night' && <div className="absolute inset-0 bg-slate-950/45" />}
            {mood === 'rain' && (
              <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(115deg,rgba(255,255,255,0.45)_0_1px,transparent_1px_12px)] [background-size:18px_36px] animate-pulse" />
            )}
            {mood === 'fog' && <div className="absolute inset-0 bg-white/35 backdrop-blur-[1px]" />}
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/80">Trainer Plaza</p>
                <h2 className="font-royal text-4xl text-white drop-shadow">Pokémon Trainer Campus</h2>
                <p className="mt-1 max-w-xl text-sm font-bold text-white/85">
                  Một bản đồ sống của lớp học: toàn bộ trainer và Pokémon được chia vào các khu battle, luyện tập, hồ nước và shop plaza.
                </p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/25 px-4 py-3 text-right text-white shadow-lg backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-wider">{trainerLocation?.label || 'Weather location'}</p>
                <p className="mt-1 text-2xl font-black">{trainerWeather ? `${trainerWeather.temperature}°C` : '--°C'}</p>
                <p className="text-xs font-bold">{trainerWeather ? trainerWeather.label : weatherLoading ? 'Đang tải thời tiết' : 'Chưa có dữ liệu thời tiết'}</p>
              </div>
            </div>

            {plazaStudents.length === 0 ? (
              <div className="relative z-10 mx-auto my-40 max-w-md rounded-[32px] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
                <p className="text-sm font-black text-teal-900">Chưa có trainer nào trong lớp.</p>
              </div>
            ) : (
              <div className="relative z-10 grid gap-5 p-5 pt-2 lg:grid-cols-2">
                {campusZones.map(zone => (
                  <div key={zone.id} className={`min-h-[260px] rounded-[32px] border-2 bg-gradient-to-br ${zone.tone} p-4 shadow-xl backdrop-blur-xl`}>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
                          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/80 text-xl shadow-sm">{zone.icon}</span>
                          {zone.title}
                        </h3>
                        <p className="mt-1 text-xs font-bold text-slate-600">{zone.subtitle}</p>
                      </div>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-black uppercase text-slate-500 shadow-sm">
                        {zone.students.length}/{plazaStudents.length} trainer
                      </span>
                    </div>

                    {zone.students.length === 0 ? (
                      <div className="grid min-h-[170px] place-items-center rounded-[24px] border border-dashed border-slate-300/70 bg-white/40 text-xs font-bold text-slate-400">
                        Khu này đang trống
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {zone.students.map((student, index) => {
                          const pet = student.pet;
                          return (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => {
                                setEditingStudent(student);
                                setCurrentScreen('profile');
                              }}
                              className="group/trainer relative flex w-[150px] items-center gap-2 rounded-3xl border border-white/80 bg-white/80 p-2.5 text-left shadow-md backdrop-blur transition-all hover:-translate-y-1 hover:bg-white hover:ring-2 hover:ring-amber-300/70 hover:shadow-[0_18px_45px_rgba(14,116,144,0.28),0_0_35px_rgba(250,204,21,0.25)]"
                            >
                              <div className="relative shrink-0">
                                <StudentAvatar student={student} className="h-12 w-12 rounded-2xl border-2 border-white shadow" />
                                {pet && (
                                  <img
                                    src={getPokemonArtworkUrl(pet)}
                                    onError={event => handlePokemonArtworkError(event, pet)}
                                    className="absolute -right-4 -top-4 h-8 w-8 object-contain drop-shadow-lg transition-transform group-hover/trainer:scale-125"
                                    alt={getPokemonDisplayName(pet)}
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-black text-slate-950">{student.name}</p>
                                <p className="truncate text-[9px] font-bold uppercase text-teal-700">{student.className}</p>
                                <p className="mt-1 truncate text-[9px] font-black text-slate-400">
                                  {pet ? `${getPokemonDisplayName(pet)} · Lv.${pet.level || 1}` : 'Đang ấp trứng'}
                                </p>
                              </div>
                              <span className="absolute -bottom-2 left-4 hidden rounded-full border border-white bg-slate-950 px-2 py-0.5 text-[8px] font-black text-white shadow-md group-hover/trainer:block">
                                {activityLabels[(index + zone.id.length) % activityLabels.length]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="relative z-10 px-6 pb-6">
              <div className="rounded-[28px] border border-white/70 bg-white/70 p-4 text-xs font-bold text-slate-600 shadow-lg backdrop-blur-xl">
                Campus Map đang hiển thị toàn bộ {plazaStudents.length} trainer trong lớp. Thời tiết lấy từ vị trí đã cài ở Settings và tự đổi mood mưa/nắng/tối cho toàn cảnh.
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
};
