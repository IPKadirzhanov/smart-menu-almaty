import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { menuItems, MenuItem } from '@/data/menu';
import { formatPrice } from '@/lib/aiLogic';

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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="glass-card rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold">{payload.title}</h2>
              <button onClick={onClose} className="p-1 rounded hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {payload.variants.map((variant, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                  <h3 className="font-semibold text-sm mb-3">{variant.name}</h3>
                  <div className="space-y-1.5">
                    {variant.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="font-bold text-sm">Итого: {formatPrice(variant.total)}</span>
                    <button
                      onClick={() => applyVariantToCart(variant)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Выбрать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MenuPickerModal;
