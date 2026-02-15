import React, { useState } from 'react';
import { MenuItem } from '@/data/menu';
import { formatPrice, getReplacements } from '@/lib/aiLogic';
import { Tag } from '@/data/menu';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft } from 'lucide-react';

interface Props {
  item: MenuItem;
  exclude: Tag[];
  onReplace: (oldId: string, newItem: MenuItem) => void;
  onClose: () => void;
}

const ReplacementModal: React.FC<Props> = ({ item, exclude, onReplace, onClose }) => {
  const replacements = getReplacements(item, exclude);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Заменить: {item.name}</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {replacements.map(r => (
              <button
                key={r.id}
                onClick={() => { onReplace(item.id, r); onClose(); }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="text-sm font-bold text-primary">{formatPrice(r.priceKZT)}</span>
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
            {replacements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Нет доступных замен</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReplacementModal;
