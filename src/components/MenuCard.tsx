import React from 'react';
import { MenuItem } from '@/data/menu';
import { formatPrice } from '@/lib/aiLogic';
import { useCart } from '@/context/CartContext';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  item: MenuItem;
  index?: number;
}

const MenuCard: React.FC<Props> = ({ item, index = 0 }) => {
  const { addItem } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="glass-card-hover rounded-2xl p-5 flex flex-col justify-between gap-3"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight">{item.name}</h3>
          <span className="text-sm font-bold text-primary whitespace-nowrap">{formatPrice(item.priceKZT)}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {item.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
              {tag === 'halal' ? 'Халяль' : tag === 'not-spicy' ? 'Не остр.' : tag === 'no-alcohol' ? 'Безалк.' : tag === 'vegan' ? 'Веган' : tag === 'for-hookah' ? 'Под кальян' : tag === 'sweet' ? 'Сладкое' : 'Без сахара'}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => addItem(item)}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" />
        В корзину
      </button>
    </motion.div>
  );
};

export default MenuCard;
