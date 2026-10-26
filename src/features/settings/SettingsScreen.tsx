import React from 'react';
import { SettingsSection } from './SettingsSection';
import { BOSS_ENCOUNTER_FREQUENCY_OPTIONS } from '../../domain/bossSystem';
import { DEFAULT_LUCKY_WHEEL_REWARDS, DEFAULT_LUDO_TILES, WHEEL_FINISH_SOUND_KEY, WHEEL_SPIN_SOUND_KEY } from '../../data/constants';
import { Gender, LuckyWheelRewardType, Skill, Student } from '../../types';
import { LIST_PET_SKILLS as DEFAULT_PET_SKILLS } from '../../data/pokemonData';
import { createEgg } from '../../domain/eggs';
import { useApp } from '../../app/AppContext';

export const SettingsScreen: React.FC = () => {
  const {
    activeTab, addLuckyWheelReward, addPetSkill, bossEncounterFrequency,
    currentBossFrequencyOption, currentBossState, customLudoTiles, deleteCustomTile,
    editCustomTile, editingTileIndex, handleBossEncounterFrequencyChange, handleExportJSON,
    handleImportJSON, handleResetPokemonLevels, handleSaveCustomTile, luckyWheelRewards,
    negSoundUrl, petSkills, posSoundUrl, refreshWeatherByAddress,
    refreshWeatherByBrowserLocation, resetTileForm, setCustomLudoTiles, setLuckyWheelRewards,
    setNegSoundUrl, setPetSkills, setPosSoundUrl, setSkills, setStudents, setTileFormDesc,
    setTileFormIcon, setTileFormIndex, setTileFormTitle, setTileFormType, setTileFormValue,
    setTimerSoundUrl, setWeatherLocationInput, setWheelFinishSoundUrl, setWheelSpinSoundUrl,
    settingsCollapsed, skills, tileFormDesc, tileFormIcon, tileFormIndex, tileFormTitle,
    tileFormType, tileFormValue, timerSoundUrl, toggleSettingsSection, trainerLocation,
    trainerWeather, updateLuckyWheelReward, updatePetSkill, updateSkill, weatherError,
    weatherLoading, weatherLocationInput, wheelFinishSoundUrl, wheelSpinSoundUrl
  } = useApp();
  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8 pb-12">
      <h2 className="text-3xl font-royal text-teal-800 text-center uppercase">Trainer Settings</h2>

      <SettingsSection id="weather" icon="☀️" title="Weather Plaza" subtitle="Cài vị trí để Trainer Plaza đổi nắng, mưa hoặc trời tối theo thời tiết thật." collapsedSections={settingsCollapsed} onToggle={toggleSettingsSection}>
        <div className="grid grid-cols-1 gap-4 rounded-[32px] border border-sky-100 bg-sky-50/60 p-5 md:grid-cols-[1fr_auto_auto]">
          <input
            value={weatherLocationInput}
            onChange={event => {
              setWeatherLocationInput(event.target.value);
              localStorage.setItem('trainer_weather_location_input', event.target.value);
            }}
            placeholder="Nhập thành phố hoặc địa chỉ, ví dụ: Hanoi"
            className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-sky-950 outline-none focus:ring-4 focus:ring-sky-100"
          />
          <button
            onClick={refreshWeatherByAddress}
            disabled={weatherLoading}
            className="rounded-2xl bg-sky-700 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-sky-800 disabled:opacity-50"
          >
            Update Weather
          </button>
          <button
            onClick={refreshWeatherByBrowserLocation}
            disabled={weatherLoading}
            className="rounded-2xl border border-sky-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-sky-800 shadow-sm hover:bg-sky-50 disabled:opacity-50"
          >
            Auto Location
          </button>
          <div className="md:col-span-3 text-xs font-bold text-sky-900/70">
            {weatherLoading
              ? 'Đang cập nhật thời tiết...'
              : weatherError
                ? weatherError
                : trainerWeather
                  ? `${trainerLocation?.label || 'Vị trí'} · ${trainerWeather.label} · ${trainerWeather.temperature}°C · cập nhật ${new Date(trainerWeather.updatedAt).toLocaleTimeString('vi-VN')}`
                  : 'Chưa có dữ liệu thời tiết.'}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection id="bossRaid" icon="👹" title="Boss Raid" subtitle="Cài tần suất Boss xuất hiện sau các lượt Random Solo/Battle." collapsedSections={settingsCollapsed} onToggle={toggleSettingsSection}>
        <div className="rounded-[32px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-amber-50 p-5 text-left shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {BOSS_ENCOUNTER_FREQUENCY_OPTIONS.map(option => {
              const active = bossEncounterFrequency === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleBossEncounterFrequencyChange(option.id)}
                  className={`rounded-3xl border-2 p-4 text-left transition-all ${
                    active
                      ? 'border-red-700 bg-red-800 text-white shadow-xl shadow-red-900/20'
                      : 'border-red-100 bg-white text-red-950 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <p className="text-sm font-black uppercase tracking-wider">{option.label}</p>
                  <p className={`mt-2 text-xs font-bold leading-relaxed ${active ? 'text-red-50' : 'text-red-700'}`}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-amber-200 bg-white/80 p-4 text-xs font-black text-amber-950 md:grid-cols-3">
            <div>
              <p className="uppercase tracking-[0.18em] text-amber-500">Đang chọn</p>
              <p className="mt-1 text-base text-red-900">{currentBossFrequencyOption.label}</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-amber-500">Khoảng xuất hiện</p>
              <p className="mt-1 text-base text-red-900">{currentBossFrequencyOption.minGap}-{currentBossFrequencyOption.maxGap} Random</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-amber-500">Lớp hiện tại</p>
              <p className="mt-1 text-base text-red-900">
                {currentBossState
                  ? `${currentBossState.randomsSinceLastEncounter}/${currentBossState.nextEncounterAt} lượt`
                  : 'Chọn một lớp'}
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection id="sound" icon="🔊" title="Cài Đặt Âm Thanh" subtitle="Youtube hoặc audio URL cho cộng điểm, trừ điểm, timer và vòng quay may mắn." collapsedSections={settingsCollapsed} onToggle={toggleSettingsSection}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {[
            ['Cộng Điểm (Tích cực)', posSoundUrl, setPosSoundUrl],
            ['Trừ Điểm (Cần cố gắng)', negSoundUrl, setNegSoundUrl],
            ['Timer Hết Giờ', timerSoundUrl, setTimerSoundUrl],
            ['Vòng Quay Đang Quay', wheelSpinSoundUrl, setWheelSpinSoundUrl],
            ['Vòng Quay Kết Thúc', wheelFinishSoundUrl, setWheelFinishSoundUrl]
          ].map(([label, value, setter]) => (
            <div key={label as string} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400">{label as string}</label>
              <input
                className="w-full border p-3 rounded-xl text-xs outline-none focus:ring-2 ring-red-800/20"
                value={value as string}
                onChange={e => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                placeholder="Link âm thanh..."
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            localStorage.setItem('imperial_sound_pos', posSoundUrl);
            localStorage.setItem('imperial_sound_neg', negSoundUrl);
            localStorage.setItem('imperial_sound_tim', timerSoundUrl);
            localStorage.setItem(WHEEL_SPIN_SOUND_KEY, wheelSpinSoundUrl);
            localStorage.setItem(WHEEL_FINISH_SOUND_KEY, wheelFinishSoundUrl);
            alert("Đã lưu cài đặt âm thanh!");
          }}
          className="bg-red-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-red-900 transition-all uppercase text-xs"
        >
          Lưu Âm Thanh
        </button>
      </SettingsSection>

      <SettingsSection id="skills" icon="✨" title="Công Trạng" subtitle="Tùy chỉnh điểm cộng/trừ trong bảng feedback." collapsedSections={settingsCollapsed} onToggle={toggleSettingsSection}>
        <div className="flex justify-end">
          <button onClick={() => {
            const type = activeTab;
            const newSkill: Skill = { id: Date.now().toString(), name: "Skill mới", icon: "✨", points: type === 'positive' ? 1 : -1, type };
            setSkills(prev => [...prev, newSkill]);
          }} className="bg-purple-800 text-white px-6 py-2 rounded-xl font-bold text-xs">+ Thêm Skill</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {['positive', 'negative'].map(type => (
            <div key={type} className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-[0.2em] opacity-40 text-purple-800">{type === 'positive' ? 'Tích Cực' : 'Cần Cố Gắng'}</h4>
              {skills.filter(s => s.type === type).map(sk => (
                <div key={sk.id} className="bg-white p-4 rounded-2xl border flex items-center gap-3 group shadow-sm">
                  <input value={sk.icon} onChange={e => updateSkill(sk.id, 'icon', e.target.value)} className="w-10 h-10 text-xl text-center bg-gray-50 rounded-lg outline-none focus:ring-2 ring-purple-100" />
                  <input value={sk.name} onChange={e => updateSkill(sk.id, 'name', e.target.value)} className="flex-1 min-w-0 font-bold text-sm outline-none bg-transparent border-b border-transparent focus:border-purple-200" placeholder="Tên skill..." />
                  <input type="number" value={sk.points} onChange={e => updateSkill(sk.id, 'points', parseInt(e.target.value) || 0)} className="w-14 text-center font-black text-xs p-1 bg-gray-50 rounded outline-none focus:ring-2 ring-purple-100" />
                  <button onClick={() => { if(confirm('Xóa skill này?')) setSkills(prev => prev.filter(x => x.id !== sk.id)); }} className="text-gray-300 hover:text-red-500 transition-colors p-2">🗑️</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection id="petSkills" icon="⚡" title="Skills Pokémon" subtitle="Tùy chỉnh skill Pokémon, giá mua và mô tả hiển thị trong hồ sơ trainer." collapsedSections={settingsCollapsed} onToggle={toggleSettingsSection}>
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={addPetSkill} className="bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-xs">+ Thêm Pokémon Skill</button>
          <button onClick={() => { if(confirm('Khôi phục danh sách Pokémon skills mặc định?')) setPetSkills(DEFAULT_PET_SKILLS); }} className="bg-indigo-100 text-indigo-900 px-6 py-2 rounded-xl font-bold text-xs border border-indigo-200">Khôi Phục Mặc Định</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {petSkills.map(sk => (
            <div key={sk.id} className="bg-white p-4 rounded-3xl border border-indigo-100 shadow-sm space-y-3">
              <div className="grid grid-cols-[48px_1fr_86px_auto] gap-3 items-center">
                <input value={sk.icon} onChange={e => updatePetSkill(sk.id, 'icon', e.target.value)} className="w-12 h-12 text-2xl text-center bg-indigo-50 rounded-2xl outline-none focus:ring-2 ring-indigo-100" />
                <input value={sk.name} onChange={e => updatePetSkill(sk.id, 'name', e.target.value)} className="min-w-0 font-black text-sm border-b border-transparent focus:border-indigo-200 outline-none" />
                <input type="number" value={sk.cost} onChange={e => updatePetSkill(sk.id, 'cost', parseInt(e.target.value) || 0)} className="w-full text-center font-black text-xs p-2 bg-indigo-50 rounded-xl outline-none focus:ring-2 ring-indigo-100" />
                <button onClick={() => { if(confirm('Xóa Pokémon skill này?')) setPetSkills(prev => prev.filter(x => x.id !== sk.id)); }} className="text-gray-300 hover:text-red-500 transition-colors p-2">🗑️</button>
              </div>
              <textarea value={sk.description} onChange={e => updatePetSkill(sk.id, 'description', e.target.value)} className="w-full min-h-20 border border-indigo-100 rounded-2xl p-3 text-xs outline-none focus:ring-2 ring-indigo-100 resize-y" />
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection id="pokemonReset" icon="🧬" title="Reset Pokémon" subtitle="Đưa toàn bộ Pokémon hiện có về Level 1 mà vẫn giữ Hào Quang, HP, kỹ năng và phụ kiện." className="bg-emerald-50 p-6 sm:p-10 rounded-[40px] border-4 border-emerald-200 text-left space-y-6 my-8" collapsedSections={settingsCollapsed} onToggle={toggleSettingsSection}>
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-left space-y-1">
            <h4 className="font-black text-emerald-950 text-sm uppercase">Reset Level Pokémon</h4>
            <p className="text-xs text-emerald-800/80 font-sans">Tất cả Pokémon của trainer sẽ trở về Level 1, XP/Mastery về 0.</p>
          </div>
          <button
            onClick={handleResetPokemonLevels}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
          >
            Reset Level
          </button>
        </div>
      </SettingsSection>

      <SettingsSection id="ludo" icon="🐴" title="Customize Cá Ngựa" subtitle="Thêm, chỉnh sửa hoặc xóa ô đặc biệt trên bàn cờ 0-49." className="bg-amber-50 p-6 sm:p-10 rounded-[40px] border-4 border-amber-300 text-left space-y-6 my-8" collapsedSections={settingsCollapsed} onToggle={toggleSettingsSection}>
        <div className="flex justify-end">
          <button onClick={() => setCustomLudoTiles(DEFAULT_LUDO_TILES)} className="bg-amber-200 hover:bg-amber-300 text-amber-950 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all">
            Khôi Phục Mặc Định 🔄
          </button>
        </div>
        <div className="bg-white p-5 rounded-3xl border-2 border-amber-200 space-y-4">
          <h4 className="font-black text-amber-950 text-sm uppercase">{editingTileIndex !== null ? `Chỉnh Sửa Ô Số ${editingTileIndex}` : 'Thêm/Sửa Ô Đặc Biệt Mới'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="number" min={0} max={49} value={tileFormIndex} onChange={e => setTileFormIndex(parseInt(e.target.value) || 0)} className="w-full border-2 border-amber-200 p-2.5 rounded-xl font-bold text-xs bg-amber-50/50" />
            <input type="text" placeholder="Tên ô đặc biệt" value={tileFormTitle} onChange={e => setTileFormTitle(e.target.value)} className="w-full border-2 border-amber-200 p-2.5 rounded-xl font-bold text-xs bg-amber-50/50" />
            <input type="text" placeholder="🚀" value={tileFormIcon} onChange={e => setTileFormIcon(e.target.value)} className="w-full border-2 border-amber-200 p-2.5 rounded-xl font-bold text-xs bg-amber-50/50" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={tileFormType} onChange={e => setTileFormType(e.target.value as any)} className="w-full border-2 border-amber-200 p-2.5 rounded-xl font-bold text-xs bg-amber-50/50">
              <option value="portal">🌀 Dịch Chuyển Tiến Bước</option>
              <option value="curse">📜 Bùa Chú Đẩy Lùi</option>
              <option value="monster">👹 Quái Vật Chặn Đường</option>
              <option value="treasure">💎 Rương Báu Cộng Điểm</option>
              <option value="restart">🌀 Lùi Về Xuất Phát</option>
            </select>
            <input type="number" value={tileFormValue} onChange={e => setTileFormValue(parseInt(e.target.value) || 0)} className="w-full border-2 border-amber-200 p-2.5 rounded-xl font-bold text-xs bg-amber-50/50" />
          </div>
          <input type="text" placeholder="Mô tả khi dẫm vào ô..." value={tileFormDesc} onChange={e => setTileFormDesc(e.target.value)} className="w-full border-2 border-amber-200 p-2.5 rounded-xl font-bold text-xs bg-amber-50/50" />
          <div className="flex gap-2">
            <button onClick={handleSaveCustomTile} className="bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow">{editingTileIndex !== null ? 'Cập Nhật Ô' : 'Lưu Ô Đặc Biệt'}</button>
            {editingTileIndex !== null && <button onClick={resetTileForm} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs uppercase">Hủy</button>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
          {Object.values(customLudoTiles).sort((a, b) => a.tileIndex - b.tileIndex).map(tile => (
            <div key={tile.tileIndex} className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{tile.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-950 truncate">Ô {tile.tileIndex}: {tile.title}</p>
                  <p className="text-[9px] text-amber-800 truncate">{tile.desc}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => editCustomTile(tile)} className="text-amber-700 hover:bg-amber-100 p-1 rounded font-bold text-xs">✏️</button>
                <button onClick={() => deleteCustomTile(tile.tileIndex)} className="text-red-600 hover:bg-red-100 p-1 rounded font-bold text-xs">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection id="luckyWheel" icon="🎡" title="Customize Vòng Quay May Mắn" subtitle="Tùy chỉnh phần thưởng, hình phạt, HP, Pokémon skill và lượt lắc Cá Ngựa." className="bg-fuchsia-50 p-6 sm:p-10 rounded-[40px] border-4 border-fuchsia-200 text-left space-y-6 my-8" collapsedSections={settingsCollapsed} onToggle={toggleSettingsSection}>
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={() => addLuckyWheelReward('points')} className="bg-fuchsia-700 hover:bg-fuchsia-800 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all">
            + Thêm Mục Quay
          </button>
          <button onClick={() => addLuckyWheelReward('ludo_rolls')} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all">
            + Thêm Lượt Cá Ngựa
          </button>
          <button onClick={() => { if(confirm('Khôi phục danh sách Vòng quay may mắn mặc định?')) setLuckyWheelRewards(DEFAULT_LUCKY_WHEEL_REWARDS); }} className="bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-950 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border border-fuchsia-200">
            Khôi Phục Mặc Định
          </button>
        </div>

        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
          {luckyWheelRewards.map(reward => {
            const needsAmount = reward.type === 'points' || reward.type === 'hp' || reward.type === 'ludo_rolls';
            return (
              <div key={reward.id} className="bg-white p-4 rounded-3xl border border-fuchsia-100 shadow-sm space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-[56px_1fr_150px_100px_80px_auto] gap-3 items-center">
                  <input value={reward.icon} onChange={e => updateLuckyWheelReward(reward.id, 'icon', e.target.value)} className="w-14 h-14 text-2xl text-center bg-fuchsia-50 rounded-2xl outline-none focus:ring-2 ring-fuchsia-100" />
                  <input value={reward.label} onChange={e => updateLuckyWheelReward(reward.id, 'label', e.target.value)} className="min-w-0 font-black text-sm border-b border-transparent focus:border-fuchsia-200 outline-none" />
                  <select value={reward.type} onChange={e => updateLuckyWheelReward(reward.id, 'type', e.target.value as LuckyWheelRewardType)} className="w-full bg-fuchsia-50 border border-fuchsia-100 rounded-xl p-2.5 text-xs font-black outline-none">
                    <option value="points">Điểm</option>
                    <option value="pokemon">Tặng Pokémon</option>
                    <option value="skill">Tặng Skill Pokémon</option>
                    <option value="hp">HP Pokémon</option>
                    <option value="ludo_rolls">Lượt Cá Ngựa</option>
                  </select>
                  <input
                    type="number"
                    min={reward.type === 'ludo_rolls' ? 1 : undefined}
                    max={reward.type === 'ludo_rolls' ? 5 : undefined}
                    disabled={!needsAmount}
                    value={reward.amount ?? 0}
                    onChange={e => {
                      const raw = parseInt(e.target.value) || 0;
                      const value = reward.type === 'ludo_rolls' ? Math.min(5, Math.max(1, raw)) : raw;
                      updateLuckyWheelReward(reward.id, 'amount', value);
                    }}
                    className="w-full text-center font-black text-xs p-2.5 bg-fuchsia-50 rounded-xl outline-none focus:ring-2 ring-fuchsia-100 disabled:opacity-30"
                  />
                  <input type="color" value={reward.color} onChange={e => updateLuckyWheelReward(reward.id, 'color', e.target.value)} className="w-20 h-11 bg-white border border-fuchsia-100 rounded-xl p-1" />
                  <button onClick={() => { if(confirm('Xóa mục vòng quay này?')) setLuckyWheelRewards(prev => prev.filter(x => x.id !== reward.id)); }} className="text-gray-300 hover:text-red-500 transition-colors p-2">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection id="data" icon="☁️" title="Dữ liệu" subtitle="Import/export danh sách trainer và JSON backup toàn bộ hệ thống." className="bg-red-50 p-6 sm:p-12 rounded-[50px] border-4 border-red-100 text-center space-y-8" collapsedSections={settingsCollapsed} onToggle={toggleSettingsSection}>
        <div className="bg-white p-6 rounded-3xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h4 className="font-bold text-red-950 text-sm">Danh Sách Trainer (CSV / Excel)</h4>
            <p className="text-xs text-red-800/80 font-sans">Nhập danh sách trainer từ bảng CSV.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 shrink-0 font-sans">
            <button onClick={() => {
              const BOM = '\uFEFF';
              const csv = "Họ tên, Lớp, Số điểm hiện tại, Giới tính (Nam/Nữ)\nNguyễn Văn A, 10A1, 100, Nam\nTrần Thị B, 10A1, 80, Nữ";
              const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.setAttribute("download", "mau_csv_trainer.csv");
              link.click();
            }} className="bg-white border-2 border-red-800 text-red-800 p-3 px-6 rounded-2xl font-bold hover:bg-red-800 hover:text-white transition-all text-xs shadow-md">Mẫu Excel 📥</button>
            <label className="bg-red-800 hover:bg-red-950 text-white p-3 px-6 rounded-2xl font-bold cursor-pointer transition-all text-xs shadow-md">
              Tải Lên Danh Sách 📤
              <input type="file" accept=".csv" onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const text = event.target?.result as string;
                  const lines = text.split('\n').filter(l => l.trim());
                  const newItems: Student[] = lines.slice(1).map(line => {
                    const [name, cls, pts, gender] = line.split(',').map(v => v.trim());
                    return { id: Math.random().toString(36).substr(2, 9), name: name || 'Ẩn danh', className: cls || 'Pokemon Class', points: parseInt(pts) || 0, gender: gender === 'Nữ' ? Gender.FEMALE : Gender.MALE, history: [], egg: createEgg('normal') };
                  });
                  setStudents(prev => [...prev, ...newItems]);
                  alert("Đã tiếp nhận!");
                };
                reader.readAsText(file);
              }} className="hidden" />
            </label>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h4 className="font-bold text-red-950 text-sm">Sao Lưu Toàn Bộ Hệ Thống (JSON Backup)</h4>
            <p className="text-xs text-red-800/80 font-sans">Bao gồm trainer, điểm, lịch sử, Pokémon, công trạng, Pokémon skills và âm thanh.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 shrink-0 font-sans">
            <button onClick={handleExportJSON} className="bg-[#D4AF37] hover:bg-amber-600 text-white p-3 px-6 rounded-2xl font-bold transition-all text-xs shadow-md">Export JSON Backup 📦</button>
            <label className="bg-teal-700 hover:bg-teal-900 text-white p-3 px-6 rounded-2xl font-bold cursor-pointer transition-all text-xs shadow-md">
              Import JSON Restore 📥
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};
