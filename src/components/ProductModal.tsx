import React, { useState } from 'react';
import { Product, ProductExtra } from '../types';
import { X, Plus, Minus, Flame, Check, Sparkles } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    spicyChoice?: 'NORMAL' | 'SPICY',
    extras?: { id: string; nameAr: string; price: number }[],
    notes?: string
  ) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [spicyChoice, setSpicyChoice] = useState<'NORMAL' | 'SPICY'>('NORMAL');
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');

  if (!product) return null;

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => ({ ...prev, [extraId]: !prev[extraId] }));
  };

  const selectedExtrasList = (product.extras || []).filter((e) => selectedExtras[e.id]);
  const extrasTotal = selectedExtrasList.reduce((sum, e) => sum + e.price, 0);
  const itemTotal = (product.price + extrasTotal) * quantity;

  const handleAdd = () => {
    onAddToCart(
      product,
      quantity,
      product.hasSpicyOption ? spicyChoice : undefined,
      selectedExtrasList.map((e) => ({ id: e.id, nameAr: e.nameAr, price: e.price })),
      notes.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Hero image with close button */}
        <div className="relative h-56 bg-slate-900">
          <img
            src={product.image}
            alt={product.nameAr}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 left-3 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 right-4 left-4 text-white">
            <h2 className="text-xl font-bold">{product.nameAr}</h2>
            <p className="text-xs text-slate-300 font-medium">{product.nameEn}</p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Description */}
          <p className="text-slate-600 text-sm leading-relaxed">{product.descriptionAr}</p>

          {/* Spicy Option if available */}
          {product.hasSpicyOption && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>درجة الحرارة (مجاناً)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSpicyChoice('NORMAL')}
                  className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
                    spicyChoice === 'NORMAL'
                      ? 'border-[#FF6321] bg-orange-50 text-[#FF6321] shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span>بارد / عادي</span>
                  {spicyChoice === 'NORMAL' && <Check className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSpicyChoice('SPICY')}
                  className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
                    spicyChoice === 'SPICY'
                      ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>سبايسي حار 🔥</span>
                  {spicyChoice === 'SPICY' && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Extras */}
          {product.extras && product.extras.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>إضافات مميزة</span>
              </label>
              <div className="space-y-2">
                {product.extras.map((extra) => {
                  const isChecked = !!selectedExtras[extra.id];
                  return (
                    <div
                      key={extra.id}
                      onClick={() => toggleExtra(extra.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition ${
                        isChecked
                          ? 'border-[#FF6321] bg-orange-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-[#FF6321] border-[#FF6321] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm font-bold text-slate-800">{extra.nameAr}</span>
                      </div>
                      <span className="text-xs font-bold text-[#FF6321]">+{extra.price} ج.م</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">ملاحظات خاصة على الوجبة</label>
            <input
              type="text"
              placeholder="مثال: بدون مايونيز، صوص زيادة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#FF6321]"
            />
          </div>
        </div>

        {/* Footer with Quantity & Add Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-bold text-base">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex-1 bg-[#FF6321] hover:bg-[#e85516] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-between shadow-xs active:scale-95 transition"
          >
            <span>أضف إلى الطلب</span>
            <span className="text-base font-bold">{itemTotal} ج.م</span>
          </button>
        </div>
      </div>
    </div>
  );
};
