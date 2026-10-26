import React from 'react';
import { useApp } from '../../app/AppContext';

export const ShopReviewModal: React.FC = () => {
  const {
    handleConfirmShopPurchase, setShopReview, shopReview
  } = useApp();
  return (
    <>
      {shopReview && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-[32px] border-2 border-white/80 bg-white p-6 shadow-[0_30px_90px_rgba(15,118,110,0.32)]">
            <h3 className="font-royal text-2xl text-teal-950">Xác nhận đơn Shop</h3>
            <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {shopReview.map(item => (
                <div key={item.studentId} className={`rounded-2xl border p-4 ${item.canAfford ? 'border-teal-100 bg-teal-50/50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-teal-950">{item.studentName}</p>
                    <p className={`text-sm font-black ${item.canAfford ? 'text-red-700' : 'text-red-900'}`}>-{item.totalCost}đ</p>
                  </div>
                  <p className="mt-1 text-xs font-bold text-stone-600">{item.itemLabels.join(', ')}</p>
                  {!item.canAfford && <p className="mt-1 text-[10px] font-black uppercase text-red-700">Không đủ Hào Quang ({item.pointBalance}đ)</p>}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={() => setShopReview(null)} className="rounded-2xl border border-stone-200 bg-white px-6 py-3 text-xs font-black uppercase text-stone-500 hover:bg-stone-50">Quay lại</button>
              <button onClick={handleConfirmShopPurchase} className="rounded-2xl bg-teal-700 px-6 py-3 text-xs font-black uppercase text-white shadow-lg hover:bg-teal-900">Xác nhận mua</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
