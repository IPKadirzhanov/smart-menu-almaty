import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders, Order } from '@/context/OrderContext';
import { formatPrice } from '@/lib/aiLogic';
import { motion } from 'framer-motion';
import { Lock, Clock, ChefHat, CheckCircle, LogOut } from 'lucide-react';
import AdminLoginModal from '@/components/AdminLoginModal';

const statusConfig: Record<Order['status'], { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'Новый', color: 'bg-blue-100 text-blue-700', icon: Clock },
  cooking: { label: 'Готовится', color: 'bg-amber-100 text-amber-700', icon: ChefHat },
  served: { label: 'Подано', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

const nextStatus: Record<Order['status'], Order['status'] | null> = {
  new: 'cooking',
  cooking: 'served',
  served: null,
};

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthed = sessionStorage.getItem('admin_authed') === '1';
  const [showLogin, setShowLogin] = useState(false);
  const { orders, updateStatus } = useOrders();

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authed');
    navigate('/');
  };

  if (!isAuthed) {
    return (
      <>
        <main className="pt-20 pb-12">
          <div className="page-container max-w-sm py-20">
            <div className="glass-card rounded-2xl p-8 text-center">
              <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-xl font-display font-bold mb-4">Доступ запрещён</h1>
              <p className="text-sm text-muted-foreground mb-4">Для доступа необходима авторизация</p>
              <button
                onClick={() => setShowLogin(true)}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
              >
                Войти
              </button>
            </div>
          </div>
        </main>
        <AdminLoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      </>
    );
  }

  return (
    <main className="pt-20 pb-12">
      <div className="page-container">
        <div className="flex items-center justify-between mb-2">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold">
            Заказы
          </motion.h1>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-button text-sm font-medium text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Обновляется каждые 2 сек.</p>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Заказов пока нет</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const sc = statusConfig[order.status];
              const ns = nextStatus[order.status];
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold">Стол {order.table}</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${sc.color}`}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items.map(ci => (
                      <div key={ci.item.id} className="flex justify-between text-sm">
                        <span>{ci.item.name} × {ci.quantity}</span>
                        <span className="text-muted-foreground">{formatPrice(ci.item.priceKZT * ci.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  {order.comment && <p className="text-xs text-muted-foreground italic mb-3">💬 {order.comment}</p>}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="font-bold">{formatPrice(order.total)}</span>
                    {ns && (
                      <button
                        onClick={() => updateStatus(order.id, ns)}
                        className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold"
                      >
                        {ns === 'cooking' ? '🍳 Начать готовить' : '✅ Подано'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminPage;
