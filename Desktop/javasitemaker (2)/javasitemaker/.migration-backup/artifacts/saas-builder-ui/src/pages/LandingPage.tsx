import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import AppHeader from "@/components/AppHeader";
import {
  ArrowsOutCardinal, SquaresFour, Browser, ChartLineUp,
  RocketLaunch, ShieldStar,
  ChatCenteredDots, EnvelopeOpen, PhoneCall,
} from "@phosphor-icons/react";

const FEATURES = [
  {
    Icon: ArrowsOutCardinal,
    title: "Drag & Drop редактор",
    desc: "Перетаскивайте блоки в любом направлении, меняйте порядок и ширину прямо на холсте без единой строки кода.",
  },
  {
    Icon: SquaresFour,
    title: "22+ готовых блока",
    desc: "Hero, Pricing, Gallery, FAQ, Team, Stats, Video, Map, ZERO_BLOCK и другие — уже готовые компоненты для любого сайта.",
  },
  {
    Icon: Browser,
    title: "Ваш домен .lilluucore.com",
    desc: "Каждый сайт получает уникальную ссылку вида mysite.lilluucore.com с SSL прямо при публикации.",
  },
  {
    Icon: ChartLineUp,
    title: "Подробная аналитика",
    desc: "Просмотры, клики, уникальные посетители, время на сайте и процент отказов — всё в одном дашборде с графиками.",
  },
  {
    Icon: RocketLaunch,
    title: "Мгновенный деплой",
    desc: "Публикуйте сайт одной кнопкой — без хостингов, серверов и настроек. Сайт сразу доступен в сети.",
  },
  {
    Icon: ShieldStar,
    title: "Безопасность и бэкапы",
    desc: "Данные каждого сайта изолированы, ZERO_BLOCK защищён sandbox-iframe. PostgreSQL с ежедневными бэкапами.",
  },
];

const STEPS = [
  { n: "01", title: "Создайте аккаунт", desc: "Регистрация занимает 30 секунд. Бесплатно." },
  { n: "02", title: "Выберите тип сайта", desc: "Лендинг, магазин, музыкальный лейбл или фитнес-клуб." },
  { n: "03", title: "Добавляйте блоки", desc: "Перетаскивайте нужные блоки на холст, редактируйте контент." },
  { n: "04", title: "Публикуйте", desc: "Нажмите «Опубликовать» — сайт сразу доступен по вашей ссылке." },
];

const STATS_ROW = [
  { value: "10,000+", label: "Активных сайтов" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.8★", label: "Рейтинг" },
  { value: "<1s", label: "Время загрузки" },
];

const FAQ_ITEMS = [
  {
    q: "Как работает функция «Создать из скриншота»?",
    a: "Вы загружаете скриншот любого сайта в редактор, и встроенный AI (GPT-4o) анализирует его дизайн: определяет структуру блоков, извлекает точные цвета, шрифты и тексты. Через несколько секунд на текущей странице появляются готовые блоки, максимально повторяющие оригинальный дизайн. Вы можете сразу редактировать их или использовать как стартовую точку для своего сайта.",
  },
  {
    q: "Нужны ли навыки программирования?",
    a: "Нет. lilluucore создан специально для людей без технических знаний. Всё управляется через визуальный drag-and-drop редактор — просто перетаскивайте блоки, вводите текст и публикуйте.",
  },
  {
    q: "Можно ли подключить свой домен?",
    a: "Да. На тарифах Pro и Business вы можете подключить собственный домен (например, mysite.ru). На бесплатном тарифе сайт публикуется на субдомене *.lilluucore.com.",
  },
  {
    q: "Что такое ZERO_BLOCK?",
    a: "ZERO_BLOCK — специальный блок для продвинутых пользователей, который позволяет вставить произвольный HTML/CSS-код. Код выполняется в изолированном iframe без доступа к JavaScript, что обеспечивает безопасность всего сайта.",
  },
  {
    q: "Сколько сайтов я могу создать?",
    a: "На бесплатном тарифе — 1 сайт. На тарифе Pro — до 10 сайтов. На тарифе Business — неограниченное количество сайтов. Переключиться между тарифами можно в разделе «Профиль → Сменить тариф».",
  },
  {
    q: "Что происходит, если я не оплачу подписку?",
    a: "Аккаунт переводится на бесплатный тариф. Если у вас было более 1 сайта, лишние сайты переходят в статус «Черновик» и временно недоступны для посетителей. Данные сохраняются в течение 30 дней после истечения подписки.",
  },
  {
    q: "Могут ли мой сайт или аккаунт быть заблокированы?",
    a: "Да, в случае нарушения Пользовательского соглашения: публикация запрещённого контента, нарушение авторских прав, мошенничество, нарушение законодательства или требований государственных органов. В большинстве случаев вы получите предупреждение с возможностью исправить нарушение. В серьёзных случаях блокировка может быть немедленной.",
  },
  {
    q: "Что такое «заморозка» сайта?",
    a: "Модератор может временно заморозить ваш сайт, если обнаружено нарушение. Замороженный сайт недоступен для посетителей, но ваши данные сохранены. Вы получите уведомление с причиной и инструкцией для разморозки. После устранения нарушения подайте заявку на разморозку через раздел поддержки.",
  },
  {
    q: "Как работает аналитика?",
    a: "Встроенная аналитика фиксирует просмотры страниц, уникальных посетителей, клики, среднее время на сайте и показатель отказов. Данные отображаются в дашборде с графиками за 7 дней, 30 дней или год в зависимости от вашего тарифа.",
  },
  {
    q: "Есть ли возможность командной работы?",
    a: "На тарифе Business доступен командный доступ: вы можете добавить других пользователей в качестве редакторов. Каждый член команды получает отдельный аккаунт с правами, которые вы настраиваете.",
  },
  {
    q: "Поддерживаются ли несколько страниц на одном сайте?",
    a: "Да. Вы можете создавать неограниченное количество страниц внутри одного сайта, добавлять меню с навигацией между ними и настраивать якорные ссылки. Каждая страница управляется независимо.",
  },
  {
    q: "Как работает система уведомлений?",
    a: "Уведомления отображаются в колокольчике рядом с профилем. Иконка с красным счётчиком показывает непрочитанные. Есть три категории: новостные (необязательные), системные и уведомления от модерации (важные). Важные уведомления также дублируются на ваш email (если не отключено в настройках).",
  },
  {
    q: "Можно ли удалить мои данные?",
    a: "Да. Вы можете удалить отдельные сайты или полностью удалить аккаунт через раздел настроек. При удалении аккаунта все данные удаляются безвозвратно в течение 24 часов. Если вы хотите удалить данные по требованию GDPR или другого законодательства, напишите на privacy@lilluucore.com.",
  },
  {
    q: "Какие форматы изображений поддерживаются?",
    a: "В блоках и аватаре профиля поддерживаются JPG, PNG, GIF и WebP. Максимальный размер файла — 5 МБ. Рекомендуем использовать WebP для наилучшей производительности.",
  },
  {
    q: "Есть ли бесплатный пробный период для платных тарифов?",
    a: "На текущий момент бесплатный пробный период не предоставляется, однако бесплатный тариф Free позволяет полностью оценить редактор и создать один сайт без ограничения по времени.",
  },
];

export default function LandingPage() {
  const [, nav] = useLocation();
  const [showSupport, setShowSupport] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <AppHeader />

      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-8">
              ✨ Новое: AI генерация сайта из скриншота
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]"
          >
            Создавайте сайты<br />
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">без кода</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            lilluucore — визуальный конструктор с drag&drop редактором, готовыми блоками и встроенной аналитикой. Опубликуйте сайт за 5 минут.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button onClick={() => nav("/auth")}
              className="gradient-purple text-white font-bold px-8 py-4 rounded-2xl text-lg hover:opacity-90 transition shadow-xl shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]">
              Начать бесплатно →
            </button>
            <button onClick={() => nav("/pricing")}
              className="border border-white/12 bg-white/5 text-foreground font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-white/10 transition">
              Посмотреть тарифы
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-y border-white/6 bg-white/2">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS_ROW.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
              <p className="text-3xl font-black text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black mb-4">Всё, что нужно для запуска</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Профессиональные инструменты, собранные в одном конструкторе</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="glass rounded-2xl p-6 hover:border-primary/25 border border-white/6 transition-all group">
              <div className="mb-4 group-hover:scale-110 transition-transform inline-block">
                <Icon size={40} weight="light" className="text-foreground" />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white/2 border-y border-white/6 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black mb-4">Как это работает</h2>
            <p className="text-muted-foreground text-lg">Четыре шага до готового сайта</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-5xl font-black text-primary/20 mb-3">{s.n}</div>
                <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — item 10: restored and significantly expanded */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="text-4xl font-black mb-4">Часто задаваемые вопросы</h2>
          <p className="text-muted-foreground text-lg">Ответы на самые популярные вопросы о lilluucore</p>
        </motion.div>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
              className="glass border border-white/6 rounded-2xl overflow-hidden">
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-white/3 transition"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span className="font-semibold text-foreground text-sm md:text-base">{item.q}</span>
                <span className={`flex-shrink-0 text-primary transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                  </svg>
                </span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden">
                    <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed border-t border-white/6 pt-4">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10 text-center">
          <p className="text-muted-foreground text-sm mb-4">Не нашли ответа на свой вопрос?</p>
          <button onClick={() => setShowSupport(true)}
            className="gradient-purple text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition text-sm">
            Связаться с поддержкой
          </button>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl md:text-5xl font-black mb-6">Готовы создать свой сайт?</h2>
          <p className="text-muted-foreground text-xl mb-10">Начните бесплатно. Без кредитной карты.</p>
          <button onClick={() => nav("/auth")}
            className="gradient-purple text-white font-bold px-10 py-5 rounded-2xl text-xl hover:opacity-90 transition shadow-2xl shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]">
            Создать сайт бесплатно
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="gradient-purple w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs">L</div>
            <span className="text-foreground font-semibold">lilluucore</span>
            <span className="text-muted-foreground text-sm">© 2025</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <button onClick={() => nav("/pricing")} className="hover:text-foreground transition">Тарифы</button>
            <button onClick={() => nav("/docs")} className="hover:text-foreground transition">Документация</button>
            <button onClick={() => setShowSupport(true)} className="hover:text-foreground transition">Поддержка</button>
            <button onClick={() => nav("/privacy")} className="hover:text-foreground transition">Конфиденциальность</button>
          </div>
        </div>
      </footer>

      {/* Support modal */}
      <AnimatePresence>
        {showSupport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowSupport(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
              <div className="flex justify-center mb-4">
                <ChatCenteredDots size={52} weight="light" className="text-foreground" />
              </div>
              <h3 className="text-foreground font-black text-2xl mb-2">Поддержка</h3>
              <p className="text-muted-foreground text-sm mb-6">Свяжитесь с нами удобным способом — ответим в течение нескольких часов</p>
              <div className="space-y-3 text-left">
                <a href="mailto:support@lilluucore.com"
                  className="flex items-center gap-3 glass border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition group">
                  <EnvelopeOpen size={28} weight="light" className="text-foreground flex-shrink-0" />
                  <div>
                    <p className="text-foreground font-semibold text-sm group-hover:text-primary transition">support@lilluucore.com</p>
                    <p className="text-muted-foreground text-xs">Email поддержка</p>
                  </div>
                </a>
                <a href="tel:+79527771488"
                  className="flex items-center gap-3 glass border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition group">
                  <PhoneCall size={28} weight="light" className="text-foreground flex-shrink-0" />
                  <div>
                    <p className="text-foreground font-semibold text-sm group-hover:text-primary transition">+7 952 777-14-88</p>
                    <p className="text-muted-foreground text-xs">Звонки Пн–Пт, 9:00–18:00</p>
                  </div>
                </a>
              </div>
              <button onClick={() => setShowSupport(false)}
                className="mt-6 w-full gradient-purple text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition">
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
