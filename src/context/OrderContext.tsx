import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CartItem } from './CartContext';

export interface Order {
  id: string;
  table: string;
  items: CartItem[];
  total: number;
  comment: string;
  status: 'new' | 'cooking' | 'served';
  createdAt: string;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
  updateStatus: (id: string, status: Order['status']) => void;
}

const OrderContext = createContext<OrderContextType | null>(null);

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be inside OrderProvider');
  return ctx;
};

const STORAGE_KEY = 'smartmenu_orders';

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  // Polling for cross-tab sync
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setOrders(prev => {
            if (JSON.stringify(prev) !== stored) return parsed;
            return prev;
          });
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const addOrder = useCallback((data: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    const order: Order = {
      ...data,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => {
      const next = [order, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateStatus = useCallback((id: string, status: Order['status']) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === id ? { ...o, status } : o);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateStatus }}>
      {children}
    </OrderContext.Provider>
  );
};
