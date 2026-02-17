import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, BookOpen, Users, Sparkles, ChefHat } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7 },
};

const Index: React.FC = () => {
  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="min-h-[90vh] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(43_72%_52%/0.08),transparent_60%)]" />
        <div className="page-container relative z-10 py-20">
          <motion.div {...fadeUp} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lounge & Bar • Алматы</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold leading-[1.05] mb-6">
              Меню{' '}
              <span className="gradient-text">Aurora Lounge</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-lg">
              Не знаете что выбрать? Помощник меню подберёт блюда по вашему бюджету и предпочтениям.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/ai"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm transition-all duration-300 hover:shadow-xl glow-gold active:scale-[0.98]"
              >
                <Mic className="w-5 h-5" />
                Помочь выбрать
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl glass-button font-semibold text-sm"
              >
                <BookOpen className="w-4 h-4" />
                Посмотреть меню
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="page-container">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-display font-bold text-center mb-14"
          >
            Как это работает
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Расскажите о компании', desc: 'Количество гостей, бюджет и предпочтения — текстом или голосом.' },
              { icon: Sparkles, title: 'Получите варианты', desc: 'Сбалансированный, сытный или лёгкий — с итоговой суммой и возможностью замены.' },
              { icon: ChefHat, title: 'Оформите заказ', desc: 'Выберите набор, укажите стол — и ваш заказ уже на кухне.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card-hover rounded-2xl p-8 text-center"
              >
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5">
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card-hover rounded-2xl p-8"
            >
              <h3 className="font-display text-xl font-bold mb-3 gradient-text">Для гостей</h3>
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
              <h3 className="font-display text-xl font-bold mb-3 gradient-text">Для заведения</h3>
              <p className="text-muted-foreground leading-relaxed">
                Меньше времени на приём заказа — выше оборот столов и средний чек. Гости довольны, персонал свободен.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="page-container text-center">
          <p className="text-xs text-muted-foreground">Демонстрация интерфейса для гостей ресторана</p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
