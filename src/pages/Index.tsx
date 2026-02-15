import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Mic, Users, Wallet, ChefHat } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const Index: React.FC = () => {
  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="min-h-[85vh] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="page-container relative z-10 py-20">
          <motion.div {...fadeUp} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Алматы • Умное меню</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.1] mb-6">
              Соберём идеальный заказ{' '}
              <span className="gradient-text">за секунды</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Укажите бюджет и предпочтения — AI подберёт лучшие блюда для вашей компании. Быстро, точно, без лишних вопросов.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4" />
                Открыть меню
              </Link>
              <Link
                to="/ai"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass-button font-semibold text-sm"
              >
                <Sparkles className="w-4 h-4" />
                AI-помощник
              </Link>
              <Link
                to="/ai"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass-button font-semibold text-sm"
              >
                <Mic className="w-4 h-4" />
                Голосом
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-secondary/30">
        <div className="page-container">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-display font-bold text-center mb-12"
          >
            Как это работает
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Скажите, сколько вас', desc: 'Укажите количество гостей, бюджет и предпочтения — текстом или голосом.' },
              { icon: Sparkles, title: 'AI подберёт 3 набора', desc: 'Сбалансированный, сытный или лёгкий — с итоговой суммой и возможностью замены.' },
              { icon: ChefHat, title: 'Оформите заказ', desc: 'Выберите набор, укажите стол — и ваш заказ уже на кухне.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card-hover rounded-2xl p-7 text-center"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card-hover rounded-2xl p-8"
            >
              <h3 className="font-display text-xl font-bold mb-3">Для гостей</h3>
              <p className="text-muted-foreground leading-relaxed">
                Быстро собираем заказ под ваш бюджет. Не нужно листать меню, считать сумму или спрашивать официанта. Просто скажите, что любите — и получите готовые варианты.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card-hover rounded-2xl p-8"
            >
              <h3 className="font-display text-xl font-bold mb-3">Для заведения</h3>
              <p className="text-muted-foreground leading-relaxed">
                Меньше времени на приём заказа — выше оборот столов и средний чек. Гости довольны, персонал свободен, апселлы работают автоматически.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="page-container text-center">
          <p className="text-sm text-muted-foreground">SmartMenu AI • Алматы</p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
