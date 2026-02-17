import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Info, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { menuItems } from '@/data/menu';
import { formatPrice } from '@/lib/aiLogic';
import InlineFoodInfoPanel from '@/components/InlineFoodInfoPanel';

export interface MenuPickerVariant {
  name: string;
  items: { id: string; name: string; price: number }[];
  total: number;
}

export interface MenuPickerPayload {
  title: string;
  variants: MenuPickerVariant[];
}

interface MenuPickerModalProps {
  payload: MenuPickerPayload | null;
  onClose: () => void;
}

const MenuPickerModal: React.FC<MenuPickerModalProps> = ({ payload, onClose }) => {
  const [showFoodInfo, setShowFoodInfo] = useState(false);
  const { addItem } = useCart();

  if (!payload) return null;

  const applyVariantToCart = (variant: MenuPickerVariant) => {
    variant.items.forEach(vi => {
      const found = menuItems.find(m => m.id === vi.id);
      if (found) addItem(found);
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {payload && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="glass-card rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto border border-border/50"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-bold">{payload.title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {payload.variants.map((variant, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-5 border border-border/50 relative">
                  {i === 0 && (
                    <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold gradient-primary text-primary-foreground">
                      <Star className="w-3 h-3" /> Рекомендуем
                    </span>
                  )}
                  <h3 className="font-semibold text-sm mb-3">{variant.name}</h3>
                  <div className="space-y-1.5">
                    {variant.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="text-muted-foreground">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <span className="font-bold text-lg gradient-text">{formatPrice(variant.total)}</span>
                    <button
                      onClick={() => applyVariantToCart(variant)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold transition-all glow-gold hover:shadow-lg active:scale-[0.98]"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Выбрать
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Inline Food Info toggle */}
            {!showFoodInfo && (
              <div className="mt-5 pt-5 border-t border-border/50">
                <button
                  onClick={() => setShowFoodInfo(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all glass-button"
                >
                  <Info className="w-4 h-4" /> 🎙 Спросить о составе
                </button>
              </div>
            )}

            {/* Inline Food Info Panel */}
            <InlineFoodInfoPanel open={showFoodInfo} onClose={() => setShowFoodInfo(false)} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MenuPickerModal;
