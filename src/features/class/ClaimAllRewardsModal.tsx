import React from 'react';
import { StudentAvatar } from '../../components/StudentAvatar';
import { useApp } from '../../app/AppContext';

export const ClaimAllRewardsModal: React.FC = () => {
  const {
    claimAllRewardSummary, setClaimAllRewardSummary, students
  } = useApp();
  return (
    <>
      {claimAllRewardSummary && (
        <div className="fixed inset-0 z-[245] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[36px] border-4 border-amber-300 bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-700 via-amber-600 to-red-800 p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-100">Nhận quà cả lớp</p>
              <h3 className="mt-1 text-3xl font-royal uppercase">Tổng kết phần thưởng</h3>
              <p className="mt-1 text-xs font-bold text-white/80">
                {claimAllRewardSummary.length > 0
                  ? `${claimAllRewardSummary.length} học sinh có quà Expedition hoặc rương sẵn sàng.`
                  : 'Chưa có Expedition hoặc rương nào sẵn sàng trong lớp hiện tại.'}
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-amber-50/60 p-5 custom-scrollbar">
              {claimAllRewardSummary.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-amber-300 bg-white p-8 text-center">
                  <div className="text-5xl">🎁</div>
                  <p className="mt-3 text-sm font-black text-amber-950">Không có quà nào cần nhận lúc này.</p>
                </div>
              ) : claimAllRewardSummary.map(summary => {
                const summaryStudent = students.find(student => student.id === summary.studentId);
                return (
                  <div key={summary.studentId} className="flex gap-4 rounded-3xl border border-amber-200 bg-white p-4 shadow-sm">
                    {summaryStudent && (
                      <StudentAvatar student={summaryStudent} className="h-16 w-16 shrink-0 rounded-2xl border-2 border-amber-400 shadow" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black text-amber-950">{summary.studentName}</p>
                      <div className="mt-2 space-y-2">
                        {summary.expeditionMessage && (
                          <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
                            🧭 Expedition: {summary.expeditionMessage}
                          </p>
                        )}
                        {summary.chestMessage && (
                          <p className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-xs font-bold text-sky-900">
                            🎁 Rương: {summary.chestMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-amber-200 bg-white p-4">
              <button
                onClick={() => setClaimAllRewardSummary(null)}
                className="w-full rounded-2xl bg-amber-600 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-amber-700"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
