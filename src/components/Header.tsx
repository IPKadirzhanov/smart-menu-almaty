import React, { useState, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLoginModal from '@/components/AdminLoginModal';

const navLinks = [
  { to: '/menu', label: 'Меню' },
  { to: '/ai', label: 'Помощь с выбором' },
];

const Header: React.FC = () => {
  const { count } = useCart();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const clickTimestamps = useRef<number[]>([]);
  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const now = Date.now();
    clickTimestamps.current.push(now);
    if (clickTimestamps.current.length > 3) {
      clickTimestamps.current = clickTimestamps.current.slice(-3);
    }
    if (clickTimestamps.current.length === 3) {
      const diff = clickTimestamps.current[2] - clickTimestamps.current[0];
      if (diff <= 1200) {
        setShowAdminLogin(true);
        clickTimestamps.current = [];
      }
    }
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="page-container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
            <span className="text-xl font-display font-bold gradient-text tracking-wide">Aurora Lounge</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest hidden sm:block">Алматы</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  location.pathname === l.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative p-2 rounded-lg glass-button">
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold"
                >
                  {count}
                </motion.span>
              )}
            </Link>
            <button className="md:hidden p-2 rounded-lg glass-button" onClick={() => setOpen(!open)}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border/50"
            >
              <div className="page-container py-3 flex flex-col gap-1">
                {navLinks.map(l => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium ${
                      location.pathname === l.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <AdminLoginModal open={showAdminLogin} onClose={() => setShowAdminLogin(false)} />
    </>
  );
};

export default Header;
