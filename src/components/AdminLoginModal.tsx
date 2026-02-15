import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('ers@mail.ru');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (email === 'ers@mail.ru' && password === '123') {
      sessionStorage.setItem('admin_authed', '1');
      setError('');
      onClose();
      navigate('/admin');
    } else {
      setError('Неверные данные');
    }
  };

  return (
    <AnimatePresence>
      {open && (
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
            className="glass-card rounded-2xl p-8 w-full max-w-sm mx-4 text-center"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold mb-4">Админ-панель</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-sm outline-none mb-3 focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-sm outline-none mb-3 focus:ring-2 focus:ring-primary/20"
            />
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
            >
              Войти
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminLoginModal;
