package com.lilluucore.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SiteTemplateService {

    public record BlockDefault(String content, String styles) {}

    private static final Map<String, BlockDefault> BLOCK_DEFAULTS = new LinkedHashMap<>();
    private static final Map<String, List<String>> TEMPLATES = new LinkedHashMap<>();
    private static final Map<String, Map<String, BlockDefault>> BUSINESS_OVERRIDES = new LinkedHashMap<>();

    static {
        BLOCK_DEFAULTS.put("HERO", new BlockDefault(
            "{\"title\":\"Создайте что-то великое\",\"subtitle\":\"Профессиональный лендинг за минуты — без кода\",\"cta\":\"Начать бесплатно\",\"ctaUrl\":\"#\",\"ctaSecondary\":\"Узнать больше\",\"ctaSecondaryUrl\":\"#\",\"bgImage\":\"\"}",
            "{\"bg\":\"#0a0a1a\",\"textColor\":\"#ffffff\",\"ctaColor\":\"#7C3AED\",\"align\":\"center\",\"minHeight\":\"90vh\"}"
        ));
        BLOCK_DEFAULTS.put("FEATURES", new BlockDefault(
            "{\"title\":\"Почему выбирают нас\",\"subtitle\":\"Всё необходимое для успеха вашего бизнеса\",\"items\":[{\"icon\":\"Zap\",\"title\":\"Молниеносная скорость\",\"desc\":\"Страницы загружаются мгновенно. Core Web Vitals 100/100.\"},{\"icon\":\"Shield\",\"title\":\"Надёжная безопасность\",\"desc\":\"SSL, DDoS-защита и ежедневное резервное копирование.\"},{\"icon\":\"Palette\",\"title\":\"Гибкий дизайн\",\"desc\":\"Сотни блоков и неограниченная кастомизация.\"},{\"icon\":\"BarChart2\",\"title\":\"Встроенная аналитика\",\"desc\":\"Следите за посещаемостью в реальном времени.\"},{\"icon\":\"Globe\",\"title\":\"Кастомный домен\",\"desc\":\"Подключите свой домен за 2 минуты.\"},{\"icon\":\"Headphones\",\"title\":\"Поддержка 24/7\",\"desc\":\"Команда готова помочь в любое время.\"}]}",
            "{\"bg\":\"#0f0f23\",\"textColor\":\"#e2e8f0\",\"columns\":3}"
        ));
        BLOCK_DEFAULTS.put("PRICING", new BlockDefault(
            "{\"title\":\"Простые тарифы\",\"subtitle\":\"Начните бесплатно, масштабируйтесь по мере роста\",\"plans\":[{\"name\":\"Free\",\"price\":\"$0\",\"period\":\"мес\",\"features\":[\"1 сайт\",\"5 блоков\",\"Домен .lilluucore.com\"],\"cta\":\"Начать\",\"ctaUrl\":\"#\"},{\"name\":\"Pro\",\"price\":\"$19\",\"period\":\"мес\",\"features\":[\"10 сайтов\",\"∞ блоков\",\"Кастомный домен\",\"Аналитика\",\"Приоритетная поддержка\"],\"highlighted\":true,\"cta\":\"Попробовать 14 дней\",\"ctaUrl\":\"#\"},{\"name\":\"Business\",\"price\":\"$49\",\"period\":\"мес\",\"features\":[\"∞ сайтов\",\"∞ блоков\",\"White Label\",\"API доступ\",\"Команда\"],\"cta\":\"Обсудить\",\"ctaUrl\":\"#\"}]}",
            "{\"bg\":\"#0a0a14\",\"textColor\":\"#ffffff\"}"
        ));
        BLOCK_DEFAULTS.put("TESTIMONIALS", new BlockDefault(
            "{\"title\":\"Что говорят клиенты\",\"subtitle\":\"Тысячи предпринимателей уже используют наш сервис\",\"items\":[{\"text\":\"Создал лендинг за 20 минут. Конверсия выросла на 40%!\",\"author\":\"Иван Петров\",\"role\":\"CEO, Startup.ru\",\"avatar\":\"\"},{\"text\":\"Наконец-то конструктор, который не нужно изучать неделями.\",\"author\":\"Мария Смирнова\",\"role\":\"Фрилансер\",\"avatar\":\"\"},{\"text\":\"Клиенты думают, что это ручная разработка. Я не говорю иначе.\",\"author\":\"Алексей Новиков\",\"role\":\"Digital-маркетолог\",\"avatar\":\"\"}]}",
            "{\"bg\":\"#0f0f23\",\"textColor\":\"#cbd5e1\"}"
        ));
        BLOCK_DEFAULTS.put("CTA", new BlockDefault(
            "{\"title\":\"Готовы создать сайт мечты?\",\"subtitle\":\"Присоединяйтесь к 10 000+ пользователей. Первый сайт — бесплатно.\",\"cta\":\"Начать бесплатно\",\"ctaUrl\":\"#\",\"ctaSecondary\":\"Посмотреть демо\",\"ctaSecondaryUrl\":\"#\"}",
            "{\"bg\":\"linear-gradient(135deg, #7C3AED, #4F46E5)\",\"textColor\":\"#ffffff\"}"
        ));
        BLOCK_DEFAULTS.put("FOOTER", new BlockDefault(
            "{\"company\":\"Моя Компания\",\"slogan\":\"Строим будущее вместе\",\"links\":[{\"label\":\"О нас\",\"url\":\"#\"},{\"label\":\"Блог\",\"url\":\"#\"},{\"label\":\"Документация\",\"url\":\"#\"},{\"label\":\"Контакты\",\"url\":\"#\"},{\"label\":\"Политика\",\"url\":\"#\"}],\"socials\":[\"twitter\",\"instagram\",\"linkedin\"],\"copyright\":\"© 2025 Моя Компания. Все права защищены.\"}",
            "{\"bg\":\"#050510\",\"textColor\":\"#475569\"}"
        ));
        BLOCK_DEFAULTS.put("PRODUCTS", new BlockDefault(
            "{\"title\":\"Каталог товаров\",\"subtitle\":\"Лучшее из нашей коллекции\",\"items\":[{\"name\":\"Товар 1\",\"price\":\"1 200₽\",\"image\":\"\",\"badge\":\"Хит\",\"description\":\"Описание товара\"},{\"name\":\"Товар 2\",\"price\":\"2 800₽\",\"image\":\"\",\"badge\":\"Новинка\",\"description\":\"Описание товара\"},{\"name\":\"Товар 3\",\"price\":\"950₽\",\"image\":\"\",\"badge\":\"\",\"description\":\"Описание товара\"}]}",
            "{\"bg\":\"#0f0f23\",\"textColor\":\"#ffffff\",\"columns\":3}"
        ));
        BLOCK_DEFAULTS.put("GALLERY", new BlockDefault(
            "{\"title\":\"Галерея\",\"subtitle\":\"Наши работы\",\"images\":[]}",
            "{\"bg\":\"#0a0a14\",\"textColor\":\"#ffffff\",\"columns\":3}"
        ));
        BLOCK_DEFAULTS.put("VIDEO", new BlockDefault(
            "{\"title\":\"Смотрите как это работает\",\"url\":\"\",\"description\":\"Короткое демо нашего продукта\"}",
            "{\"bg\":\"#0f0f23\",\"textColor\":\"#ffffff\"}"
        ));
        BLOCK_DEFAULTS.put("TEXT", new BlockDefault(
            "{\"title\":\"Заголовок блока\",\"body\":\"Здесь будет ваш текст. Расскажите о себе, своей компании или продукте.\",\"link\":\"\",\"linkLabel\":\"\"}",
            "{\"bg\":\"#0f0f23\",\"textColor\":\"#e2e8f0\",\"align\":\"left\"}"
        ));
        BLOCK_DEFAULTS.put("STATS", new BlockDefault(
            "{\"title\":\"В цифрах\",\"subtitle\":\"Результаты, которыми мы гордимся\",\"items\":[{\"value\":\"10K+\",\"label\":\"Довольных клиентов\",\"icon\":\"Users\"},{\"value\":\"99.9%\",\"label\":\"Uptime\",\"icon\":\"Server\"},{\"value\":\"24/7\",\"label\":\"Поддержка\",\"icon\":\"Headphones\"},{\"value\":\"150+\",\"label\":\"Стран мира\",\"icon\":\"Globe\"}]}",
            "{\"bg\":\"#0a0a1a\",\"textColor\":\"#ffffff\"}"
        ));
        BLOCK_DEFAULTS.put("TEAM", new BlockDefault(
            "{\"title\":\"Наша команда\",\"subtitle\":\"Профессионалы своего дела\",\"members\":[{\"name\":\"Алексей Кузнецов\",\"role\":\"CEO & Founder\",\"bio\":\"10+ лет в tech-стартапах\",\"avatar\":\"\",\"linkedin\":\"\"},{\"name\":\"Светлана Морозова\",\"role\":\"CTO\",\"bio\":\"Эксперт в облачных технологиях\",\"avatar\":\"\",\"linkedin\":\"\"},{\"name\":\"Дмитрий Волков\",\"role\":\"Head of Design\",\"bio\":\"Дизайн думает за пользователя\",\"avatar\":\"\",\"linkedin\":\"\"}]}",
            "{\"bg\":\"#0f0f23\",\"textColor\":\"#ffffff\"}"
        ));
        BLOCK_DEFAULTS.put("FAQ", new BlockDefault(
            "{\"title\":\"Часто задаваемые вопросы\",\"subtitle\":\"Не нашли ответ? Напишите нам.\",\"items\":[{\"q\":\"Нужны ли знания программирования?\",\"a\":\"Нет. lilluucore создан для всех — от новичков до профессионалов.\"},{\"q\":\"Можно ли подключить свой домен?\",\"a\":\"Да, на тарифах Pro и Business вы можете подключить любой домен.\"},{\"q\":\"Как работает бесплатный план?\",\"a\":\"Бесплатный план включает 1 сайт с 5 блоками. Никаких скрытых платежей.\"},{\"q\":\"Можно ли отменить подписку?\",\"a\":\"Конечно. Отмена происходит в один клик в настройках профиля.\"}]}",
            "{\"bg\":\"#0f0f23\",\"textColor\":\"#e2e8f0\"}"
        ));
        BLOCK_DEFAULTS.put("CONTACTS", new BlockDefault(
            "{\"title\":\"Свяжитесь с нами\",\"subtitle\":\"Мы отвечаем в течение 24 часов\",\"email\":\"hello@company.com\",\"phone\":\"+7 (999) 123-45-67\",\"address\":\"Москва, ул. Примерная, 1\",\"telegram\":\"@company\",\"whatsapp\":\"+79991234567\",\"formTitle\":\"Напишите нам\",\"fields\":[\"Имя\",\"Email\",\"Сообщение\"],\"ctaLabel\":\"Отправить\",\"ctaUrl\":\"\"}",
            "{\"bg\":\"#0a0a14\",\"textColor\":\"#e2e8f0\"}"
        ));
        BLOCK_DEFAULTS.put("MUSIC_PLAYER", new BlockDefault(
            "{\"title\":\"Новый трек\",\"artist\":\"Исполнитель\",\"album\":\"Альбом 2025\",\"coverUrl\":\"\",\"trackUrl\":\"\",\"spotifyUrl\":\"\",\"appleUrl\":\"\",\"youtubeUrl\":\"\"}",
            "{\"bg\":\"#0f172a\",\"textColor\":\"#f1f5f9\"}"
        ));
        BLOCK_DEFAULTS.put("DISCOGRAPHY", new BlockDefault(
            "{\"title\":\"Дискография\",\"albums\":[{\"title\":\"Альбом 1\",\"year\":\"2024\",\"cover\":\"\",\"spotifyUrl\":\"\",\"tracks\":12},{\"title\":\"Синглы\",\"year\":\"2023\",\"cover\":\"\",\"spotifyUrl\":\"\",\"tracks\":5}]}",
            "{\"bg\":\"#1e293b\",\"textColor\":\"#e2e8f0\"}"
        ));
        BLOCK_DEFAULTS.put("SCHEDULE", new BlockDefault(
            "{\"title\":\"Расписание занятий\",\"subtitle\":\"Запишитесь онлайн\",\"items\":[{\"day\":\"Пн, Ср, Пт\",\"time\":\"07:00–09:00\",\"type\":\"Утренняя йога\",\"trainer\":\"Анна В.\",\"ctaUrl\":\"#\"},{\"day\":\"Вт, Чт\",\"time\":\"18:00–20:00\",\"type\":\"Силовые тренировки\",\"trainer\":\"Дмитрий С.\",\"ctaUrl\":\"#\"},{\"day\":\"Сб\",\"time\":\"10:00–12:00\",\"type\":\"Кроссфит\",\"trainer\":\"Михаил П.\",\"ctaUrl\":\"#\"}]}",
            "{\"bg\":\"#1e293b\",\"textColor\":\"#e2e8f0\"}"
        ));
        BLOCK_DEFAULTS.put("COACHES", new BlockDefault(
            "{\"title\":\"Наши тренеры\",\"subtitle\":\"Сертифицированные профессионалы\",\"members\":[{\"name\":\"Дмитрий Соколов\",\"role\":\"Силовые тренировки\",\"bio\":\"КМС по пауэрлифтингу, 8 лет опыта\",\"avatar\":\"\",\"instagram\":\"\"},{\"name\":\"Анна Власова\",\"role\":\"Йога и пилатес\",\"bio\":\"Сертификат RYT-500, 6 лет практики\",\"avatar\":\"\",\"instagram\":\"\"}]}",
            "{\"bg\":\"#1a1a2e\",\"textColor\":\"#ffffff\"}"
        ));
        BLOCK_DEFAULTS.put("FORM", new BlockDefault(
            "{\"title\":\"Оставьте заявку\",\"subtitle\":\"Мы перезвоним в течение часа\",\"fields\":[{\"label\":\"Ваше имя\",\"type\":\"text\",\"placeholder\":\"Иван Иванов\",\"required\":true},{\"label\":\"Email\",\"type\":\"email\",\"placeholder\":\"you@example.com\",\"required\":true},{\"label\":\"Телефон\",\"type\":\"tel\",\"placeholder\":\"+7 (999) 000-00-00\",\"required\":false},{\"label\":\"Сообщение\",\"type\":\"textarea\",\"placeholder\":\"Расскажите о вашем проекте...\",\"required\":false}],\"ctaLabel\":\"Отправить заявку\",\"successText\":\"Спасибо! Мы свяжемся с вами скоро.\"}",
            "{\"bg\":\"#0f0f23\",\"textColor\":\"#e2e8f0\",\"ctaColor\":\"#7C3AED\"}"
        ));
        BLOCK_DEFAULTS.put("BLOG", new BlockDefault(
            "{\"title\":\"Блог\",\"subtitle\":\"Последние статьи и новости\",\"items\":[{\"title\":\"Как создать продающий лендинг за час\",\"date\":\"12 марта 2025\",\"tag\":\"Маркетинг\",\"preview\":\"Рассказываем о ключевых блоках...\",\"url\":\"#\"},{\"title\":\"5 ошибок при запуске интернет-магазина\",\"date\":\"5 марта 2025\",\"tag\":\"E-commerce\",\"preview\":\"Разбираем типичные ошибки и как их избежать...\",\"url\":\"#\"}]}",
            "{\"bg\":\"#0f0f23\",\"textColor\":\"#e2e8f0\"}"
        ));
        BLOCK_DEFAULTS.put("HEADER_MENU", new BlockDefault(
            "{\"logo\":\"Компания\",\"links\":[{\"label\":\"Главная\",\"url\":\"#\",\"active\":true},{\"label\":\"О нас\",\"url\":\"#\"},{\"label\":\"Услуги\",\"url\":\"#\"},{\"label\":\"Цены\",\"url\":\"#\"},{\"label\":\"Контакты\",\"url\":\"#\"}],\"cta\":\"Связаться\",\"ctaUrl\":\"#\"}",
            "{\"bg\":\"#070711\",\"textColor\":\"#e2e8f0\",\"ctaColor\":\"#7C3AED\"}"
        ));

        TEMPLATES.put("LANDING", List.of("HEADER_MENU","HERO","FEATURES","STATS","TESTIMONIALS","FAQ","CTA","FOOTER"));
        TEMPLATES.put("ECOMMERCE", List.of("HEADER_MENU","HERO","PRODUCTS","FEATURES","STATS","TESTIMONIALS","FAQ","FOOTER"));
        TEMPLATES.put("MUSIC_LABEL", List.of("HEADER_MENU","HERO","MUSIC_PLAYER","DISCOGRAPHY","TEAM","GALLERY","CONTACTS","FOOTER"));
        TEMPLATES.put("FITNESS", List.of("HEADER_MENU","HERO","STATS","FEATURES","SCHEDULE","COACHES","PRICING","TESTIMONIALS","FAQ","FOOTER"));

        Map<String, BlockDefault> ecommerceOverrides = new LinkedHashMap<>();
        ecommerceOverrides.put("HERO", new BlockDefault(
            "{\"title\":\"Откройте для себя лучшее\",\"subtitle\":\"Уникальные товары по лучшим ценам — доставка по всей России\",\"cta\":\"Смотреть каталог\",\"ctaUrl\":\"#\",\"ctaSecondary\":\"Акции\",\"ctaSecondaryUrl\":\"#\"}",
            "{\"bg\":\"linear-gradient(135deg, #0a0a1a, #1a0a2e)\",\"textColor\":\"#ffffff\",\"ctaColor\":\"#7C3AED\"}"
        ));
        ecommerceOverrides.put("FEATURES", new BlockDefault(
            "{\"title\":\"Почему покупают у нас\",\"subtitle\":\"Миллионы довольных покупателей по всей стране\",\"items\":[{\"icon\":\"🚚\",\"title\":\"Быстрая доставка\",\"desc\":\"Доставим ваш заказ уже завтра. Бесплатно от 3 000₽.\"},{\"icon\":\"🔒\",\"title\":\"Безопасные платежи\",\"desc\":\"Оплата картой, наличными или через СБП. 100% защита.\"},{\"icon\":\"↩️\",\"title\":\"Лёгкий возврат\",\"desc\":\"30 дней на возврат без вопросов. Деньги вернём сразу.\"},{\"icon\":\"💎\",\"title\":\"Гарантия качества\",\"desc\":\"Работаем только с проверенными брендами и поставщиками.\"},{\"icon\":\"📦\",\"title\":\"Широкий ассортимент\",\"desc\":\"Более 50 000 товаров в наличии на складе.\"},{\"icon\":\"🎁\",\"title\":\"Программа лояльности\",\"desc\":\"Накапливайте баллы и обменивайте на скидки.\"}]}",
            null
        ));
        ecommerceOverrides.put("STATS", new BlockDefault(
            "{\"title\":\"Наши достижения\",\"items\":[{\"value\":\"50K+\",\"label\":\"Товаров в каталоге\"},{\"value\":\"2M+\",\"label\":\"Довольных покупателей\"},{\"value\":\"98%\",\"label\":\"Положительных отзывов\"},{\"value\":\"24ч\",\"label\":\"Среднее время доставки\"}]}",
            null
        ));
        BUSINESS_OVERRIDES.put("ECOMMERCE", ecommerceOverrides);

        Map<String, BlockDefault> musicOverrides = new LinkedHashMap<>();
        musicOverrides.put("HERO", new BlockDefault(
            "{\"title\":\"Музыка, которая меняет мир\",\"subtitle\":\"Независимый лейбл. Подлинное звучание. Мы создаём будущее музыкальной индустрии.\",\"cta\":\"Слушать сейчас\",\"ctaUrl\":\"#\",\"ctaSecondary\":\"О лейбле\",\"ctaSecondaryUrl\":\"#\"}",
            "{\"bg\":\"linear-gradient(135deg, #0f172a, #1e1b4b)\",\"textColor\":\"#ffffff\",\"ctaColor\":\"#8B5CF6\"}"
        ));
        musicOverrides.put("GALLERY", new BlockDefault(
            "{\"title\":\"Фотографии\",\"subtitle\":\"Наши артисты и события\",\"images\":[]}",
            "{\"bg\":\"#0f172a\",\"textColor\":\"#e2e8f0\",\"columns\":3}"
        ));
        musicOverrides.put("CONTACTS", new BlockDefault(
            "{\"title\":\"Свяжитесь с нами\",\"subtitle\":\"Для сотрудничества и пресс-запросов\",\"email\":\"booking@label.com\",\"phone\":\"+7 (999) 000-00-00\",\"address\":\"Москва, Россия\",\"telegram\":\"@music_label\"}",
            "{\"bg\":\"#0a0a14\",\"textColor\":\"#e2e8f0\"}"
        ));
        BUSINESS_OVERRIDES.put("MUSIC_LABEL", musicOverrides);

        Map<String, BlockDefault> fitnessOverrides = new LinkedHashMap<>();
        fitnessOverrides.put("HERO", new BlockDefault(
            "{\"title\":\"Измени себя. Начни сегодня.\",\"subtitle\":\"Профессиональные тренеры, современное оборудование, результат уже через месяц.\",\"cta\":\"Первое занятие бесплатно\",\"ctaUrl\":\"#\",\"ctaSecondary\":\"Смотреть расписание\",\"ctaSecondaryUrl\":\"#\"}",
            "{\"bg\":\"linear-gradient(135deg, #0a0a1a, #1a2000)\",\"textColor\":\"#ffffff\",\"ctaColor\":\"#16a34a\"}"
        ));
        fitnessOverrides.put("FEATURES", new BlockDefault(
            "{\"title\":\"Почему выбирают нас\",\"subtitle\":\"Мы создаём среду, в которой хочется тренироваться\",\"items\":[{\"icon\":\"💪\",\"title\":\"Опытные тренеры\",\"desc\":\"КМС и мастера спорта. Персональные программы для каждого.\"},{\"icon\":\"🏋️\",\"title\":\"Современный зал\",\"desc\":\"Новейшее оборудование. Полная замена воздуха каждый час.\"},{\"icon\":\"📱\",\"title\":\"Приложение\",\"desc\":\"Отслеживайте прогресс, бронируйте занятия, связывайтесь с тренером.\"},{\"icon\":\"🥗\",\"title\":\"Нутрициолог\",\"desc\":\"Индивидуальное питание. Анализ состава тела каждый месяц.\"},{\"icon\":\"🛁\",\"title\":\"SPA-зона\",\"desc\":\"Сауна, джакузи и зона отдыха включены в абонемент.\"},{\"icon\":\"⏰\",\"title\":\"Работаем 24/7\",\"desc\":\"Открыты в любое время — тренируйтесь когда удобно.\"}]}",
            null
        ));
        fitnessOverrides.put("STATS", new BlockDefault(
            "{\"title\":\"Наши результаты в цифрах\",\"items\":[{\"value\":\"2 000+\",\"label\":\"Активных членов\"},{\"value\":\"50+\",\"label\":\"Тренеров и инструкторов\"},{\"value\":\"15 лет\",\"label\":\"На рынке фитнеса\"},{\"value\":\"93%\",\"label\":\"Достигают цели\"}]}",
            null
        ));
        fitnessOverrides.put("PRICING", new BlockDefault(
            "{\"title\":\"Выберите свой абонемент\",\"subtitle\":\"Первое пробное занятие — бесплатно для всех\",\"plans\":[{\"name\":\"Базовый\",\"price\":\"3 900₽\",\"period\":\"мес\",\"features\":[\"Доступ в зал 7:00–22:00\",\"Групповые тренировки\",\"Раздевалка и душ\",\"Онлайн-расписание\"],\"cta\":\"Выбрать\"},{\"name\":\"Стандарт\",\"price\":\"6 900₽\",\"period\":\"мес\",\"features\":[\"Доступ 24/7\",\"Все групповые тренировки\",\"Консультация нутрициолога\",\"SPA-зона\",\"1 персональная тренировка\"],\"highlighted\":true,\"cta\":\"Лучший выбор\"},{\"name\":\"VIP\",\"price\":\"14 900₽\",\"period\":\"мес\",\"features\":[\"Безлимитный доступ 24/7\",\"Персональный тренер 4×/нед\",\"SPA-зона без ограничений\",\"Нутрициолог + диетолог\",\"Гостевые визиты\"],\"cta\":\"VIP опыт\"}]}",
            null
        ));
        BUSINESS_OVERRIDES.put("FITNESS", fitnessOverrides);
    }

    public BlockDefault getDefault(String type) {
        return BLOCK_DEFAULTS.getOrDefault(type, new BlockDefault("{}", "{}"));
    }

    public List<String> getTemplate(String businessType) {
        return TEMPLATES.getOrDefault(businessType, TEMPLATES.get("LANDING"));
    }

    public BlockDefault getOverride(String businessType, String blockType) {
        Map<String, BlockDefault> overrides = BUSINESS_OVERRIDES.get(businessType);
        if (overrides == null) return null;
        return overrides.get(blockType);
    }

    public String resolveContent(String businessType, String blockType) {
        BlockDefault override = getOverride(businessType, blockType);
        if (override != null && override.content() != null) return override.content();
        return getDefault(blockType).content();
    }

    public String resolveStyles(String businessType, String blockType) {
        BlockDefault override = getOverride(businessType, blockType);
        if (override != null && override.styles() != null) return override.styles();
        return getDefault(blockType).styles();
    }
}
