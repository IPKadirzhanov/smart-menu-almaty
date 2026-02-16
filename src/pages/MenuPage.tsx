import React, { useState, useMemo } from 'react';
import { menuItems, categoryLabels, tagLabels, Category, Tag } from '@/data/menu';
import MenuCard from '@/components/MenuCard';
import VoiceAssistant from '@/components/VoiceAssistant';
import VoiceAssistantFoodInfo from '@/components/VoiceAssistantFoodInfo';
import { Search, X, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const categories: Category[] = ['hookah', 'sets', 'appetizers', 'hot', 'salads', 'desserts', 'drinks'];
const tags: Tag[] = ['halal', 'not-spicy', 'no-alcohol', 'vegan', 'for-hookah', 'sweet', 'no-sugar'];

const MenuPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [showVoice, setShowVoice] = useState(false);
  const [showFoodInfo, setShowFoodInfo] = useState(false);

  const filtered = useMemo(() => {
    return menuItems.filter(item => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (activeTags.length > 0 && !activeTags.every(t => item.tags.includes(t))) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase()) &&
          !item.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, activeCategory, activeTags]);

  const toggleTag = (tag: Tag) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <main className="pt-20 pb-12">
      <div className="page-container">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-display font-bold mb-6"
        >
          Меню
        </motion.h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по меню..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-xl glass-card text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              !activeCategory ? 'gradient-primary text-primary-foreground' : 'glass-button text-muted-foreground'
            }`}
          >
            Все
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeCategory === c ? 'gradient-primary text-primary-foreground' : 'glass-button text-muted-foreground'
              }`}
            >
              {categoryLabels[c]}
            </button>
          ))}
        </div>

        {/* Tags */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {tags.map(t => (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTags.includes(t) ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-transparent'
              }`}
            >
              {tagLabels[t]}
            </button>
          ))}
        </div>

        {/* Voice buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowVoice(!showVoice)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-button text-sm font-medium"
          >
            🎙 Голосовой помощник
          </button>
          <button
            onClick={() => setShowFoodInfo(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-button text-sm font-medium"
          >
            <Info className="w-4 h-4" />
            Спросить про блюдо (голосом)
          </button>
          {showVoice && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="w-full mt-3">
              <VoiceAssistant onOpenFoodInfo={() => setShowFoodInfo(true)} />
            </motion.div>
          )}
        </div>

        <VoiceAssistantFoodInfo open={showFoodInfo} onClose={() => setShowFoodInfo(false)} />

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <MenuCard key={item.id} item={item} index={i} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Ничего не найдено. Попробуйте изменить фильтры.</p>
        )}
      </div>
    </main>
  );
};

export default MenuPage;
