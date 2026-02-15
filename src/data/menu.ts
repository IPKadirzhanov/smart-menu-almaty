export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceKZT: number;
  category: Category;
  tags: Tag[];
  allergens: string[];
}

export type Category = 'hookah' | 'sets' | 'appetizers' | 'hot' | 'salads' | 'desserts' | 'drinks';
export type Tag = 'halal' | 'not-spicy' | 'no-alcohol' | 'vegan' | 'for-hookah' | 'sweet' | 'no-sugar';

export const categoryLabels: Record<Category, string> = {
  hookah: 'Кальяны',
  sets: 'Сеты в центр',
  appetizers: 'Закуски',
  hot: 'Горячее',
  salads: 'Салаты',
  desserts: 'Десерты',
  drinks: 'Напитки',
};

export const tagLabels: Record<Tag, string> = {
  halal: 'Халяль',
  'not-spicy': 'Не острое',
  'no-alcohol': 'Без алкоголя',
  vegan: 'Веган',
  'for-hookah': 'Под кальян',
  sweet: 'Сладкое',
  'no-sugar': 'Без сахара',
};

export const menuItems: MenuItem[] = [
  // Кальяны
  { id: 'h1', name: 'Классический кальян', description: 'Табак на выбор, свежий уголь', priceKZT: 7000, category: 'hookah', tags: ['for-hookah'], allergens: [] },
  { id: 'h2', name: 'Премиум кальян', description: 'Авторский микс, ледяная колба', priceKZT: 9500, category: 'hookah', tags: ['for-hookah'], allergens: [] },
  { id: 'h3', name: 'Фруктовый кальян', description: 'На грейпфруте с мятой', priceKZT: 11000, category: 'hookah', tags: ['for-hookah'], allergens: [] },
  // Сеты в центр
  { id: 's1', name: 'Сет «Алматы»', description: 'Хумус, бабагануш, лепёшки, овощная нарезка', priceKZT: 5500, category: 'sets', tags: ['halal', 'not-spicy', 'no-alcohol', 'vegan'], allergens: ['глютен'] },
  { id: 's2', name: 'Сет «Мясной»', description: 'Казы, жужук, конская колбаса, лепёшки', priceKZT: 8500, category: 'sets', tags: ['halal', 'not-spicy'], allergens: ['глютен'] },
  { id: 's3', name: 'Сет «Сырный»', description: 'Брынза, камамбер, чеддер, мёд, орехи', priceKZT: 7000, category: 'sets', tags: ['not-spicy', 'no-alcohol'], allergens: ['молоко', 'орехи'] },
  { id: 's4', name: 'Сет «Морской»', description: 'Креветки, кальмар, мидии, лимон', priceKZT: 9500, category: 'sets', tags: ['not-spicy', 'no-alcohol'], allergens: ['морепродукты'] },
  { id: 's5', name: 'Сет «Микс»', description: 'Хумус, куриные крылья, сырные палочки', priceKZT: 6500, category: 'sets', tags: ['halal', 'not-spicy'], allergens: ['глютен', 'молоко'] },
  // Закуски
  { id: 'a1', name: 'Хумус с лепёшкой', description: 'Классический хумус с тёплой лепёшкой', priceKZT: 2200, category: 'appetizers', tags: ['halal', 'vegan', 'not-spicy', 'no-alcohol'], allergens: ['глютен'] },
  { id: 'a2', name: 'Брускетты с томатом', description: '3 шт., чиабатта, базилик, пармезан', priceKZT: 2800, category: 'appetizers', tags: ['not-spicy', 'no-alcohol'], allergens: ['глютен', 'молоко'] },
  { id: 'a3', name: 'Куриные крылья BBQ', description: '6 крыльев, фирменный BBQ соус', priceKZT: 3200, category: 'appetizers', tags: ['halal'], allergens: [] },
  { id: 'a4', name: 'Сырные палочки', description: 'Моцарелла во фритюре, томатный дип', priceKZT: 2500, category: 'appetizers', tags: ['not-spicy', 'no-alcohol'], allergens: ['молоко', 'глютен'] },
  { id: 'a5', name: 'Эдамаме', description: 'С морской солью и чили хлопьями', priceKZT: 1800, category: 'appetizers', tags: ['vegan', 'no-alcohol', 'halal'], allergens: ['соя'] },
  { id: 'a6', name: 'Начос с гуакамоле', description: 'Кукурузные чипсы, гуакамоле, сальса', priceKZT: 2600, category: 'appetizers', tags: ['vegan', 'not-spicy', 'no-alcohol'], allergens: [] },
  // Горячее
  { id: 'g1', name: 'Стейк рибай', description: '300 г, medium rare, овощи гриль', priceKZT: 8900, category: 'hot', tags: ['halal', 'not-spicy'], allergens: [] },
  { id: 'g2', name: 'Лосось на гриле', description: '250 г, спаржа, лимонный соус', priceKZT: 7500, category: 'hot', tags: ['not-spicy', 'no-alcohol'], allergens: ['рыба'] },
  { id: 'g3', name: 'Паста карбонара', description: 'Спагетти, бекон, пармезан, яйцо', priceKZT: 4200, category: 'hot', tags: ['not-spicy'], allergens: ['глютен', 'молоко', 'яйцо'] },
  { id: 'g4', name: 'Бургер классический', description: 'Говядина 200 г, чеддер, овощи, картофель фри', priceKZT: 4500, category: 'hot', tags: ['halal'], allergens: ['глютен', 'молоко'] },
  { id: 'g5', name: 'Том Ям с креветками', description: 'Острый тайский суп, грибы, лемонграсс', priceKZT: 4800, category: 'hot', tags: ['no-alcohol'], allergens: ['морепродукты'] },
  { id: 'g6', name: 'Плов по-алматински', description: 'Баранина, морковь, нут, специи', priceKZT: 3800, category: 'hot', tags: ['halal', 'not-spicy', 'no-alcohol'], allergens: [] },
  { id: 'g7', name: 'Куриный шашлык', description: '4 шампура, маринад, лаваш, лук', priceKZT: 4200, category: 'hot', tags: ['halal', 'not-spicy', 'no-alcohol'], allergens: ['глютен'] },
  // Салаты
  { id: 'sl1', name: 'Цезарь с курицей', description: 'Романо, пармезан, гренки, соус цезарь', priceKZT: 3500, category: 'salads', tags: ['not-spicy'], allergens: ['глютен', 'молоко', 'яйцо'] },
  { id: 'sl2', name: 'Греческий салат', description: 'Огурцы, томаты, оливки, фета', priceKZT: 2800, category: 'salads', tags: ['not-spicy', 'no-alcohol', 'halal'], allergens: ['молоко'] },
  { id: 'sl3', name: 'Салат с тунцом', description: 'Тунец, авокадо, микрогрин, кунжут', priceKZT: 4200, category: 'salads', tags: ['not-spicy', 'no-alcohol'], allergens: ['рыба'] },
  { id: 'sl4', name: 'Овощной боул', description: 'Киноа, авокадо, эдамаме, тахини', priceKZT: 3200, category: 'salads', tags: ['vegan', 'not-spicy', 'no-alcohol', 'halal'], allergens: ['соя'] },
  { id: 'sl5', name: 'Тёплый салат с говядиной', description: 'Говядина, руккола, черри, бальзамик', priceKZT: 4500, category: 'salads', tags: ['halal', 'not-spicy'], allergens: [] },
  // Десерты
  { id: 'd1', name: 'Чизкейк Нью-Йорк', description: 'Классический, ягодный соус', priceKZT: 2500, category: 'desserts', tags: ['not-spicy', 'no-alcohol', 'sweet'], allergens: ['молоко', 'глютен', 'яйцо'] },
  { id: 'd2', name: 'Тирамису', description: 'Маскарпоне, эспрессо, какао', priceKZT: 2800, category: 'desserts', tags: ['not-spicy', 'sweet'], allergens: ['молоко', 'глютен', 'яйцо'] },
  { id: 'd3', name: 'Панна-котта', description: 'Ваниль, манго-маракуйя', priceKZT: 2200, category: 'desserts', tags: ['not-spicy', 'no-alcohol', 'sweet'], allergens: ['молоко'] },
  { id: 'd4', name: 'Фруктовая тарелка', description: 'Сезонные фрукты и ягоды', priceKZT: 3500, category: 'desserts', tags: ['vegan', 'not-spicy', 'no-alcohol', 'no-sugar', 'halal'], allergens: [] },
  { id: 'd5', name: 'Шоколадный фондан', description: 'Тёплый, с шариком мороженого', priceKZT: 3000, category: 'desserts', tags: ['not-spicy', 'no-alcohol', 'sweet'], allergens: ['молоко', 'глютен', 'яйцо'] },
  { id: 'd6', name: 'Мороженое (3 шарика)', description: 'Ваниль, шоколад, фисташка', priceKZT: 1800, category: 'desserts', tags: ['not-spicy', 'no-alcohol', 'sweet'], allergens: ['молоко', 'орехи'] },
  // Напитки
  { id: 'n1', name: 'Лимонад домашний', description: 'Лимон, мята, тростниковый сахар', priceKZT: 1200, category: 'drinks', tags: ['no-alcohol', 'halal', 'for-hookah'], allergens: [] },
  { id: 'n2', name: 'Морс облепиховый', description: 'Облепиха, мёд', priceKZT: 1400, category: 'drinks', tags: ['no-alcohol', 'halal', 'for-hookah'], allergens: [] },
  { id: 'n3', name: 'Айран', description: 'Кисломолочный, охлаждённый', priceKZT: 800, category: 'drinks', tags: ['no-alcohol', 'halal', 'not-spicy'], allergens: ['молоко'] },
  { id: 'n4', name: 'Капучино', description: 'Двойной эспрессо, молочная пенка', priceKZT: 1500, category: 'drinks', tags: ['no-alcohol', 'not-spicy'], allergens: ['молоко'] },
  { id: 'n5', name: 'Чай зелёный (чайник)', description: 'Улун с жасмином, 500 мл', priceKZT: 1200, category: 'drinks', tags: ['no-alcohol', 'halal', 'vegan', 'no-sugar', 'for-hookah'], allergens: [] },
  { id: 'n6', name: 'Смузи манго-банан', description: 'Свежие фрукты, йогурт', priceKZT: 1800, category: 'drinks', tags: ['no-alcohol', 'sweet', 'for-hookah'], allergens: ['молоко'] },
  { id: 'n7', name: 'Кола 0.5 л', description: 'Coca-Cola', priceKZT: 700, category: 'drinks', tags: ['no-alcohol'], allergens: [] },
  { id: 'n8', name: 'Вода газ. 0.5 л', description: 'Минеральная', priceKZT: 500, category: 'drinks', tags: ['no-alcohol', 'halal', 'vegan', 'no-sugar'], allergens: [] },
  { id: 'n9', name: 'Свежевыжатый апельсин', description: '300 мл, без сахара', priceKZT: 1600, category: 'drinks', tags: ['no-alcohol', 'halal', 'vegan', 'no-sugar', 'for-hookah'], allergens: [] },
  { id: 'n10', name: 'Молочный коктейль', description: 'Ваниль / шоколад / клубника', priceKZT: 1800, category: 'drinks', tags: ['no-alcohol', 'sweet'], allergens: ['молоко'] },
];
