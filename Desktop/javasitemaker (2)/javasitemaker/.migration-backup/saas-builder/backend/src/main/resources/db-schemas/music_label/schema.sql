-- Music Label business type schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Artists
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    genres TEXT[] DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    avatar_url TEXT,
    banner_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Releases (albums, singles, EPs)
CREATE TABLE IF NOT EXISTS releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    release_type VARCHAR(50) NOT NULL DEFAULT 'single',
    release_date DATE,
    cover_url TEXT,
    description TEXT,
    label VARCHAR(255),
    spotify_id VARCHAR(255),
    apple_music_id VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tracks
CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    duration INTEGER,
    audio_url TEXT,
    track_number SMALLINT NOT NULL DEFAULT 1,
    plays BIGINT NOT NULL DEFAULT 0,
    lyrics TEXT,
    explicit BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Play history
CREATE TABLE IF NOT EXISTS play_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID NOT NULL REFERENCES tracks(id),
    listener_ip INET,
    session_id VARCHAR(255),
    played_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Artist users (personal cabinet)
CREATE TABLE IF NOT EXISTS artist_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    artist_id UUID REFERENCES artists(id),
    role VARCHAR(50) NOT NULL DEFAULT 'artist',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sample data
INSERT INTO artists (name, bio, genres) VALUES
    ('The Sample Artist', 'Инди-поп исполнитель из Москвы', ARRAY['indie', 'pop', 'electronic']),
    ('DJ Nova', 'Электронная музыка и deep house', ARRAY['electronic', 'deep-house', 'techno']);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_releases_artist ON releases(artist_id);
CREATE INDEX IF NOT EXISTS idx_releases_date ON releases(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_release ON tracks(release_id);
CREATE INDEX IF NOT EXISTS idx_tracks_plays ON tracks(plays DESC);
CREATE INDEX IF NOT EXISTS idx_play_history_track ON play_history(track_id);
CREATE INDEX IF NOT EXISTS idx_play_history_date ON play_history(played_at DESC);
