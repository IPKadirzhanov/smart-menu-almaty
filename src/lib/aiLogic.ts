import { MenuItem, menuItems, Tag } from '@/data/menu';

export interface AIRequest {
  people: number;
  budget: number;
  mustHave: string[];  // e.g. ['hookah', 'sets']
  exclude: Tag[];
  preferences: Tag[];
}

export interface AISet {
  name: string;
  description: string;
  items: MenuItem[];
  total: number;
  upsell?: MenuItem;
}

export function parseUserMessage(msg: string): AIRequest {
  const lower = msg.toLowerCase();

  // People
  let people = 2;
  const pMatch = lower.match(/(\d+)\s*(человек|чел|людей|нас|гост|персон)/);
  if (pMatch) people = parseInt(pMatch[1]);
  const pMatch2 = lower.match(/нас\s+(\d+)/);
  if (pMatch2) people = parseInt(pMatch2[1]);
  const wordMap: Record<string, number> = { двое: 2, трое: 3, четверо: 4, пятеро: 5, шестеро: 6 };
  for (const [w, n] of Object.entries(wordMap)) {
    if (lower.includes(w)) people = n;
  }

  // Budget
  let budget = 30000;
  const bMatch = lower.match(/(\d[\d\s]*)\s*₸|бюджет\s*(\d[\d\s]*)|(\d[\d\s]*)\s*тенге|(\d[\d\s]*)\s*тг/);
  if (bMatch) {
    const raw = (bMatch[1] || bMatch[2] || bMatch[3] || bMatch[4]).replace(/\s/g, '');
    budget = parseInt(raw);
  }

  // Must-have categories
  const mustHave: string[] = [];
  if (lower.includes('кальян')) mustHave.push('hookah');
  if (lower.includes('центр') || lower.includes('сет')) mustHave.push('sets');

  // Exclude tags
  const exclude: Tag[] = [];
  if (lower.includes('без алкоголя') || lower.includes('безалкоголь')) exclude.push('no-alcohol');
  if (lower.includes('без свинины') || lower.includes('халяль')) exclude.push('halal');
  if (lower.includes('не остр') || lower.includes('без остр')) exclude.push('not-spicy');
  if (lower.includes('веган')) exclude.push('vegan');

  // Preferences
  const preferences: Tag[] = [];
  if (lower.includes('сладк')) preferences.push('sweet');
  if (lower.includes('под кальян')) preferences.push('for-hookah');

  return { people, budget, mustHave, exclude, preferences };
}

function filterMenu(items: MenuItem[], exclude: Tag[]): MenuItem[] {
  if (exclude.length === 0) return items;
  // If exclude contains 'no-alcohol', only keep items that have 'no-alcohol' tag
  // If exclude contains 'halal', only keep items that have 'halal' tag
  return items.filter(item => {
    for (const tag of exclude) {
      if (!item.tags.includes(tag)) return false;
    }
    return true;
  });
}

function pickFromCategory(filtered: MenuItem[], category: string, count: number, usedIds: Set<string>): MenuItem[] {
  const available = filtered.filter(i => i.category === category && !usedIds.has(i.id));
  const shuffled = [...available].sort(() => Math.random() - 0.3);
  return shuffled.slice(0, count);
}

function buildSet(
  name: string,
  description: string,
  filtered: MenuItem[],
  req: AIRequest,
  style: 'balanced' | 'hearty' | 'light',
  usedIdsGlobal: Set<string>
): AISet {
  const budget = req.budget;
  const people = req.people;
  const items: MenuItem[] = [];
  const usedIds = new Set<string>(usedIdsGlobal);
  let remaining = budget;

  // Must-have: hookah
  if (req.mustHave.includes('hookah')) {
    const hookahs = filtered.filter(i => i.category === 'hookah' && !usedIds.has(i.id));
    if (hookahs.length > 0) {
      const h = style === 'hearty' ? hookahs.sort((a, b) => b.priceKZT - a.priceKZT)[0] :
                style === 'light' ? hookahs.sort((a, b) => a.priceKZT - b.priceKZT)[0] :
                hookahs[Math.floor(Math.random() * hookahs.length)];
      items.push(h); usedIds.add(h.id); remaining -= h.priceKZT;
    }
  }

  // Must-have: set
  if (req.mustHave.includes('sets')) {
    const sets = filtered.filter(i => i.category === 'sets' && !usedIds.has(i.id) && i.priceKZT <= remaining);
    if (sets.length > 0) {
      const s = style === 'hearty' ? sets.sort((a, b) => b.priceKZT - a.priceKZT)[0] :
                style === 'light' ? sets.sort((a, b) => a.priceKZT - b.priceKZT)[0] :
                sets[Math.floor(Math.random() * sets.length)];
      items.push(s); usedIds.add(s.id); remaining -= s.priceKZT;
    }
  }

  // Main course
  const hotCount = style === 'hearty' ? Math.min(people, 3) : style === 'light' ? 1 : Math.min(people, 2);
  const hots = filtered.filter(i => (i.category === 'hot' || i.category === 'salads') && !usedIds.has(i.id) && i.priceKZT <= remaining)
    .sort((a, b) => style === 'hearty' ? b.priceKZT - a.priceKZT : a.priceKZT - b.priceKZT);
  for (let i = 0; i < hotCount && i < hots.length; i++) {
    if (remaining - hots[i].priceKZT >= 0) {
      items.push(hots[i]); usedIds.add(hots[i].id); remaining -= hots[i].priceKZT;
    }
  }

  // Appetizers / salads
  if (style !== 'light') {
    const apps = filtered.filter(i => i.category === 'appetizers' && !usedIds.has(i.id) && i.priceKZT <= remaining);
    const appCount = style === 'hearty' ? 2 : 1;
    for (let i = 0; i < appCount && i < apps.length; i++) {
      items.push(apps[i]); usedIds.add(apps[i].id); remaining -= apps[i].priceKZT;
    }
  }

  // Drinks
  const drinkCount = Math.min(people, 3);
  const drinks = filtered.filter(i => i.category === 'drinks' && !usedIds.has(i.id) && i.priceKZT <= remaining)
    .sort(() => Math.random() - 0.5);
  for (let i = 0; i < drinkCount && i < drinks.length; i++) {
    if (remaining - drinks[i].priceKZT >= 0) {
      items.push(drinks[i]); usedIds.add(drinks[i].id); remaining -= drinks[i].priceKZT;
    }
  }

  // Dessert for balanced/hearty
  if (style !== 'light' && remaining > 1500) {
    const desserts = filtered.filter(i => i.category === 'desserts' && !usedIds.has(i.id) && i.priceKZT <= remaining);
    if (desserts.length > 0) {
      items.push(desserts[0]); usedIds.add(desserts[0].id); remaining -= desserts[0].priceKZT;
    }
  }

  // Fill remaining budget (try to hit 90-100%)
  const allRemaining = filtered.filter(i => !usedIds.has(i.id) && i.priceKZT <= remaining)
    .sort((a, b) => Math.abs(remaining - a.priceKZT) - Math.abs(remaining - b.priceKZT));
  while (remaining > budget * 0.1 && allRemaining.length > 0) {
    const next = allRemaining.shift()!;
    if (next.priceKZT <= remaining) {
      items.push(next); usedIds.add(next.id); remaining -= next.priceKZT;
    }
  }

  const total = items.reduce((s, i) => s + i.priceKZT, 0);

  // Upsell if <10% budget remaining
  let upsell: MenuItem | undefined;
  if (remaining > 0 && remaining < budget * 0.1) {
    const upsells = filtered.filter(i => !usedIds.has(i.id) && i.priceKZT <= remaining + budget * 0.05 &&
      (i.category === 'drinks' || i.category === 'desserts' || i.category === 'appetizers'));
    if (upsells.length > 0) upsell = upsells[0];
  }

  // Save used IDs globally
  usedIds.forEach(id => usedIdsGlobal.add(id));

  return { name, description, items, total, upsell };
}

export function generateSets(req: AIRequest): AISet[] {
  const filtered = filterMenu(menuItems, req.exclude);
  const usedIds = new Set<string>();

  return [
    buildSet('Набор A — Сбалансированный', 'Оптимальный микс закусок, горячего и напитков', filtered, req, 'balanced', usedIds),
    buildSet('Набор B — Сытный', 'Больше горячего и закусок для плотного ужина', filtered, req, 'hearty', usedIds),
    buildSet('Набор C — Лёгкий', 'Акцент на салаты и лёгкие блюда', filtered, req, 'light', usedIds),
  ];
}

export function getReplacements(currentItem: MenuItem, exclude: Tag[]): MenuItem[] {
  const filtered = filterMenu(menuItems, exclude);
  return filtered
    .filter(i => i.id !== currentItem.id && i.category === currentItem.category)
    .sort((a, b) => Math.abs(a.priceKZT - currentItem.priceKZT) - Math.abs(b.priceKZT - currentItem.priceKZT))
    .slice(0, 6);
}

export function formatPrice(price: number | undefined | null): string {
  if (price == null) return '0 ₸';
  return price.toLocaleString('ru-KZ') + ' ₸';
}
