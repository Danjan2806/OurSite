-- Landing page business type schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads (form captures)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT,
    source VARCHAR(100) DEFAULT 'website',
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    text TEXT NOT NULL,
    avatar_url TEXT,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Page views analytics
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path VARCHAR(500),
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    session_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sample data
INSERT INTO testimonials (author, role, text, rating, position) VALUES
    ('Иван Петров', 'Генеральный директор', 'Отличный сервис, рекомендую всем!', 5, 0),
    ('Мария Сидорова', 'Маркетолог', 'Помогло увеличить конверсию на 40%', 5, 1);

INSERT INTO faqs (question, answer, position) VALUES
    ('Как начать?', 'Просто зарегистрируйтесь и создайте свой первый сайт.', 0),
    ('Сколько стоит?', 'У нас есть бесплатный план и платные тарифы от 999 руб/мес.', 1);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
