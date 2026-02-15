import React, { useState } from 'react';
import { parseUserMessage, generateSets, formatPrice, AISet } from '@/lib/aiLogic';
import { useCart } from '@/context/CartContext';
import { MenuItem, Tag } from '@/data/menu';
import ReplacementModal from '@/components/ReplacementModal';
import VoiceAssistant from '@/components/VoiceAssistant';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, ShoppingCart, ArrowRightLeft, Mic } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  text: string;
  sets?: AISet[];
}

const AIPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSets, setCurrentSets] = useState<AISet[]>([]);
  const [excludeTags, setExcludeTags] = useState<Tag[]>([]);
  const [replaceItem, setReplaceItem] = useState<MenuItem | null>(null);
  const [replaceSetIdx, setReplaceSetIdx] = useState<number>(0);
  const [showVoice, setShowVoice] = useState(false);
  const { addItem } = useCart();

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    const req = parseUserMessage(userMsg);
    setExcludeTags(req.exclude);
    const sets = generateSets(req);
    setCurrentSets(sets);

    const aiText = `Отлично! Для ${req.people} человек с бюджетом ${formatPrice(req.budget)} подготовил 3 варианта. Выберите подходящий или замените позиции.`;
    setMessages(prev => [...prev, { role: 'ai', text: aiText, sets }]);
  };

  const addSetToCart = (set: AISet) => {
    set.items.forEach(item => addItem(item));
    if (set.upsell) addItem(set.upsell);
    setMessages(prev => [...prev, { role: 'ai', text: `✅ ${set.name} добавлен в корзину! Итого: ${formatPrice(set.total)}. Перейдите в корзину для оформления.` }]);
  };

  const handleReplace = (oldId: string, newItem: MenuItem) => {
    setCurrentSets(prev => prev.map((set, idx) => {
      if (idx !== replaceSetIdx) return set;
      const newItems = set.items.map(i => i.id === oldId ? newItem : i);
      return { ...set, items: newItems, total: newItems.reduce((s, i) => s + i.priceKZT, 0) };
    }));
    // Also update in messages
    setMessages(prev => prev.map(m => {
      if (!m.sets) return m;
      return {
        ...m,
        sets: m.sets.map((set, idx) => {
          if (idx !== replaceSetIdx) return set;
          const newItems = set.items.map(i => i.id === oldId ? newItem : i);
          return { ...set, items: newItems, total: newItems.reduce((s, i) => s + i.priceKZT, 0) };
        })
      };
    }));
  };

  return (
    <main className="pt-20 pb-12">
      <div className="page-container max-w-3xl">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold mb-2">
          AI Помощник
        </motion.h1>
        <p className="text-sm text-muted-foreground mb-6">
          Напишите: «нас трое, бюджет 30000, кальян обязателен, без алкоголя» — и получите 3 готовых набора.
        </p>

        {/* Voice toggle */}
        <div className="mb-4">
          <button onClick={() => setShowVoice(!showVoice)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-button text-sm font-medium">
            <Mic className="w-4 h-4" /> Голосовой помощник
          </button>
          <AnimatePresence>
            {showVoice && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                <VoiceAssistant />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat */}
        <div className="space-y-4 mb-4 min-h-[200px]">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <Sparkles className="w-10 h-10 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Задайте параметры заказа в чате ниже</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'gradient-primary text-primary-foreground' : 'glass-card'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                {msg.sets && (
                  <div className="mt-4 space-y-4">
                    {msg.sets.map((set, si) => (
                      <div key={si} className="bg-background/50 rounded-xl p-4 border border-border/50">
                        <h4 className="font-semibold text-sm mb-1">{set.name}</h4>
                        <p className="text-xs text-muted-foreground mb-3">{set.description}</p>
                        <div className="space-y-1.5">
                          {set.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className="truncate flex-1">{item.name}</span>
                              <div className="flex items-center gap-2 ml-2">
                                <span className="text-muted-foreground">{formatPrice(item.priceKZT)}</span>
                                <button
                                  onClick={() => { setReplaceItem(item); setReplaceSetIdx(si); }}
                                  className="p-1 rounded hover:bg-secondary"
                                  title="Заменить"
                                >
                                  <ArrowRightLeft className="w-3 h-3 text-primary" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {set.upsell && (
                          <p className="text-xs text-primary mt-2">💡 Можно добавить: {set.upsell.name} (+{formatPrice(set.upsell.priceKZT)})</p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                          <span className="font-bold text-sm">Итого: {formatPrice(set.total)}</span>
                          <button
                            onClick={() => addSetToCart(set)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            В корзину
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="sticky bottom-4">
          <div className="flex gap-2 glass-card rounded-2xl p-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Нас трое, бюджет 30000, кальян, без алкоголя..."
              className="flex-1 px-4 py-3 bg-transparent text-sm outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-3 rounded-xl gradient-primary text-primary-foreground disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Replacement modal */}
      {replaceItem && (
        <ReplacementModal
          item={replaceItem}
          exclude={excludeTags}
          onReplace={handleReplace}
          onClose={() => setReplaceItem(null)}
        />
      )}
    </main>
  );
};

export default AIPage;
