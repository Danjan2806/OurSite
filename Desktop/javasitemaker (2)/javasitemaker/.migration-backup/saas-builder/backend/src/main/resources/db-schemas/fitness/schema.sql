-- Fitness club business type schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Members
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    photo_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trainers
CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    specializations TEXT[] DEFAULT '{}',
    photo_url TEXT,
    experience_years INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    trainer_id UUID REFERENCES trainers(id),
    date_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    max_participants INTEGER NOT NULL DEFAULT 20,
    class_type VARCHAR(100),
    room VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(member_id, class_id)
);

-- Membership types
CREATE TABLE IF NOT EXISTS membership_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    classes_per_month INTEGER,
    features JSONB DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Memberships
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    type_id UUID NOT NULL REFERENCES membership_types(id),
    starts_at DATE NOT NULL,
    expires_at DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sample data
INSERT INTO trainers (name, bio, specializations, experience_years) VALUES
    ('Алексей Власов', 'Мастер спорта по пауэрлифтингу', ARRAY['силовые', 'кроссфит'], 8),
    ('Анна Кузнецова', 'Сертифицированный инструктор йоги', ARRAY['йога', 'пилатес', 'растяжка'], 5);

INSERT INTO membership_types (name, description, price, duration_days, classes_per_month, features) VALUES
    ('Базовый', 'Доступ к тренажёрному залу', 1500.00, 30, NULL, '["Тренажёрный зал", "Раздевалка"]'),
    ('Стандарт', '8 групповых занятий + зал', 2500.00, 30, 8, '["Тренажёрный зал", "8 занятий", "Раздевалка", "Сауна"]'),
    ('Премиум', 'Безлимит + персональный тренер', 5000.00, 30, NULL, '["Безлимит", "Персональный тренер", "Бассейн", "Сауна", "Раздевалка"]');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classes_datetime ON classes(date_time);
CREATE INDEX IF NOT EXISTS idx_classes_trainer ON classes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_member ON bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_bookings_class ON bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_memberships_member ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_expires ON memberships(expires_at);
