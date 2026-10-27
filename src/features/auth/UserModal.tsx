import React from 'react';
import { AuthLoginForm } from './AuthLoginForm';
import { DEFAULT_SKILLS } from '../../data/constants';
import { Button, Modal } from '../../components/ui';
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
        <Modal onClose={() => setShowUserModal(false)} title={user ? 'Tài khoản giáo viên' : 'Đăng nhập'} subtitle={user ? user.email : 'Kết nối để tự động sao lưu dữ liệu lớp'} icon={user ? <img src={editingPhotoURL || 'https://api.dicebear.com/7.x/bottts/svg'} className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" alt="Ảnh đại diện" /> : '🌱'} size="md" zIndex="z-[100]">
            <div className="space-y-5">
              {!user ? (
                <AuthLoginForm onSuccess={() => setShowUserModal(false)} />
              ) : (
                <>
                  {/* Change Display Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-brand-ink">Tên hiển thị</label>
                    <input 
                      type="text" 
                      className="w-full rounded-brand-md border border-[#d9d6ca] p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-emerald/30"
                      value={editingDisplayName} 
                      onChange={e => setEditingDisplayName(e.target.value)}
                      placeholder="Gõ tên hiển thị..."
                    />
                  </div>

                  {/* Change Photo URL */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-brand-ink">Ảnh đại diện (URL)</label>
                    <input 
                      type="text" 
                      className="w-full rounded-brand-md border border-[#d9d6ca] p-3 text-sm outline-none focus:ring-2 focus:ring-brand-emerald/30"
                      value={editingPhotoURL} 
                      onChange={e => setEditingPhotoURL(e.target.value)}
                      placeholder="Dán link ảnh bảo ảnh..."
                    />
                  </div>

                  {/* Quick Avatars Picker */}
                  <div className="space-y-1.5">
                    <label className="block text-center text-sm font-bold text-brand-ink">Ảnh gợi ý</label>
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
                          className={`h-10 w-10 overflow-hidden rounded-full border-2 p-0.5 transition-transform hover:scale-105 ${editingPhotoURL === url ? 'border-brand-forest shadow-md' : 'border-[#d9d6ca]'}`}
                        >
                          <img src={url} className="w-full h-full object-cover rounded-full" alt="option" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cloud Sync Status Info */}
                  <div className="space-y-1 rounded-brand-md border border-brand-emerald/20 bg-[#f4f8f1] p-3 text-left text-xs text-brand-forest">
                    <div className="flex items-center justify-between font-bold">
                      <span>Trạng thái đồng bộ</span>
                      <span className="rounded-full bg-brand-emerald px-2 py-0.5 text-xs font-bold text-white">Đang bật</span>
                    </div>
                    <p className="leading-snug text-brand-ink/70">
                      Tự động sao lưu sau 1,5 giây khi có thay đổi. Dữ liệu chưa đổi vẫn được giữ nguyên.
                    </p>
                  </div>

                  <div className="pt-2 space-y-2.5">
                    <Button
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
                      className="w-full"
                      loading={profileSaving}
                    >Lưu thay đổi</Button>

                    {!confirmLogout ? (
                      <Button
                        onClick={() => setConfirmLogout(true)}
                        className="w-full" variant="secondary">
                        Đăng xuất
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full animate-in fade-in duration-200">
                        <Button
                          onClick={async () => {
                            await logout();
                            setShowUserModal(false);
                            setConfirmLogout(false);
                            // Clear states
                            setStudents([]);
                            setSkills(DEFAULT_SKILLS);
                            setInitialCloudLoadComplete(false);
                          }}
                          className="flex-1" variant="danger">
                          Xác nhận đăng xuất
                        </Button>
                        <Button
                          onClick={() => setConfirmLogout(false)}
                          className="flex-1" variant="secondary">
                          Quay Lại
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
        </Modal>
      )}
    </>
  );
};
