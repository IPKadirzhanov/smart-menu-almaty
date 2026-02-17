import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrderContext';
import { formatPrice } from '@/lib/aiLogic';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const { addOrder } = useOrders();
  const [table, setTable] = useState('');
  const [comment, setComment] = useState('');
  const [ordered, setOrdered] = useState(false);
  const navigate = useNavigate();

  const handleOrder = () => {
    if (!table.trim()) return;
    addOrder({ table: table.trim(), items, total, comment: comment.trim() });
    clearCart();
    setOrdered(true);
  };

  if (ordered) {
    return (
      <main className="pt-20 pb-12">
        <div className="page-container max-w-lg text-center py-20">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold mb-2">Заказ оформлен!</h1>
          <p className="text-muted-foreground mb-6">Стол {table} • Ожидайте, мы уже готовим</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm glow-gold">
            На главную
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 pb-12">
      <div className="page-container max-w-2xl">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold mb-6">
          Корзина
        </motion.h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Корзина пуста</p>
            <button onClick={() => navigate('/menu')} className="mt-4 px-5 py-2.5 rounded-xl glass-button text-sm font-medium">
              Перейти в меню
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {items.map((ci, i) => (
                <motion.div key={ci.item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ci.item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(ci.item.priceKZT)} за шт.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{ci.quantity}</span>
                    <button onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="font-bold text-sm w-24 text-right gradient-text">{formatPrice(ci.item.priceKZT * ci.quantity)}</span>
                  <button onClick={() => removeItem(ci.item.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-display font-bold">Итого</span>
                <span className="text-xl font-bold gradient-text">{formatPrice(total)}</span>
              </div>

              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  placeholder="Номер стола *"
                  value={table}
                  onChange={e => setTable(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-sm outline-none focus:ring-2 focus:ring-primary/20 border border-border/50"
                />
                <textarea
                  placeholder="Комментарий к заказу (необязательно)"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none border border-border/50"
                />
              </div>

              <button
                onClick={handleOrder}
                disabled={!table.trim()}
                className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm transition-all glow-gold hover:shadow-lg disabled:opacity-40"
              >
                Оформить заказ
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default CartPage;
