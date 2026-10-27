import React from 'react';
import { AuthLoginForm } from './AuthLoginForm';
import { DEFAULT_SKILLS } from '../../data/constants';
import { useApp } from '../../app/AppContext';

export const UserModal: React.FC = () => {
  const {
    confirmLogout, editingDisplayName, editingPhotoURL, logout, profileSaving,
    setConfirmLogout, setEditingDisplayName, setEditingPhotoURL, setInitialCloudLoadComplete,
    setProfileSaving, setShowUserModal, setSkills, setStudents,
    showUserModal, updateUserProfile, user
  } = useApp();
  return (
    <>
      {showUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-4 border-[#D4AF37]">
            <div className="bg-red-800 p-6 text-center text-white relative">
              <button onClick={() => setShowUserModal(false)} className="absolute top-4 right-5 text-2xl text-white/70 hover:text-white transition-colors">&times;</button>

              {user ? (
                <>
                  <div className="relative inline-block mb-3 mt-1">
                    <img 
                      src={editingPhotoURL || 'https://api.dicebear.com/7.x/bottts/svg'} 
                      className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-xl object-cover mx-auto" 
                      referrerPolicy="no-referrer"
                      alt="Review Avatar"
                    />
                  </div>
                  <h2 className="text-xl font-royal font-bold uppercase tracking-wide">Tài khoản giáo viên</h2>
                  <p className="text-[10px] text-amber-300 font-mono mt-0.5 opacity-80">{user.email}</p>
                </>
              ) : (
                <div className="py-2">
                  <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-2 border-2 border-amber-200">
                    🏮
                  </div>
                  <h2 className="text-xl font-royal font-bold uppercase tracking-wide">Đăng nhập</h2>
                  <p className="text-[10px] text-amber-200 mt-0.5">Kết nối tài khoản để tự động sao lưu đám mây</p>
                </div>
              )}
            </div>

            <div className="p-6 space-y-5">
              {!user ? (
                <AuthLoginForm onSuccess={() => setShowUserModal(false)} />
              ) : (
                <>
                  {/* Change Display Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 font-sans">Tôn Hiệu / Tên Hiển Thị</label>
                    <input 
                      type="text" 
                      className="w-full border p-2.5 rounded-2xl text-xs font-bold outline-none focus:ring-2 ring-red-800/20 font-sans" 
                      value={editingDisplayName} 
                      onChange={e => setEditingDisplayName(e.target.value)}
                      placeholder="Gõ tên hiển thị..."
                    />
                  </div>

                  {/* Change Photo URL */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 font-sans">Ảnh Đại Diện (URL)</label>
                    <input 
                      type="text" 
                      className="w-full border p-2.5 rounded-2xl text-xs font-medium outline-none focus:ring-2 ring-red-800/20 font-sans" 
                      value={editingPhotoURL} 
                      onChange={e => setEditingPhotoURL(e.target.value)}
                      placeholder="Dán link ảnh bảo ảnh..."
                    />
                  </div>

                  {/* Quick Avatars Picker */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 block font-sans text-center">Thần Tướng Gợi Ý</label>
                    <div className="flex gap-2 justify-center">
                      {[
                        "https://api.dicebear.com/7.x/adventurer/svg?seed=Lucky",
                        "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
                        "https://api.dicebear.com/7.x/bottts/svg?seed=Sparks",
                        "https://api.dicebear.com/7.x/lorelei/svg?seed=Willow"
                      ].map((url, i) => (
                        <button 
                          key={i} 
                          onClick={() => setEditingPhotoURL(url)} 
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all p-0.5 bg-gray-50 hover:scale-110 active:scale-95 ${editingPhotoURL === url ? 'border-red-800 scale-110 shadow-md' : 'border-gray-200'}`}
                        >
                          <img src={url} className="w-full h-full object-cover rounded-full" alt="option" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cloud Sync Status Info */}
                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-left text-[11px] font-sans text-amber-900 space-y-1">
                    <div className="font-bold flex items-center justify-between text-amber-950">
                      <span>⚡ Trạng thái Auto Sync:</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">ĐÃ KÍCH HOẠT</span>
                    </div>
                    <p className="leading-snug text-[10px] text-amber-800">
                      Tự động sao lưu sau 1.5s khi có thay đổi mới. Dữ liệu cũ không đổi sẽ được giữ nguyên (Differential Sync).
                    </p>
                  </div>

                  <div className="pt-2 space-y-2.5 font-sans">
                    <button 
                      onClick={async () => {
                        if (!editingDisplayName.trim()) {
                          alert("Vui lòng nhập tên hiển thị.");
                          return;
                        }
                        setProfileSaving(true);
                        try {
                          await updateUserProfile(editingDisplayName, editingPhotoURL);
                        alert("Đã lưu thông tin tài khoản thành công!");
                          setShowUserModal(false);
                        } catch (err) {
                          alert("Có lỗi xảy ra: " + (err instanceof Error ? err.message : String(err)));
                        } finally {
                          setProfileSaving(false);
                        }
                      }}
                      disabled={profileSaving}
                      className="w-full bg-red-800 text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-red-900 shadow-lg text-xs transition-all disabled:opacity-50"
                    >
                      {profileSaving ? "Đang Ghi Sách..." : "Lưu Thay Đổi"}
                    </button>

                    {!confirmLogout ? (
                      <button 
                        onClick={() => setConfirmLogout(true)}
                        className="w-full bg-[#fcf8e3] hover:bg-amber-100/50 text-amber-800 border border-amber-300 py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all text-center leading-normal"
                      >
                        Đăng xuất
                      </button>
                    ) : (
                      <div className="flex gap-2 w-full animate-in fade-in duration-200">
                        <button 
                          onClick={async () => {
                            await logout();
                            setShowUserModal(false);
                            setConfirmLogout(false);
                            // Clear states
                            setStudents([]);
                            setSkills(DEFAULT_SKILLS);
                            setInitialCloudLoadComplete(false);
                          }}
                          className="flex-1 bg-red-800 text-white py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-widest hover:bg-red-900 transition-all text-center"
                        >
                          Xác nhận đăng xuất
                        </button>
                        <button 
                          onClick={() => setConfirmLogout(false)}
                          className="flex-1 bg-stone-100 text-stone-600 border border-stone-200 py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-widest hover:bg-stone-200 transition-all text-center"
                        >
                          Quay Lại
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
