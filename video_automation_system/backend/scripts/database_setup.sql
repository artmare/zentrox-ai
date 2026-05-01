-- ============================================================================
-- AI Content Generator - Database Setup Script
-- PostgreSQL Database Initialization
-- ============================================================================

-- Создание базы данных (запустить от имени postgres)
-- CREATE DATABASE video_automation;

-- Подключиться к базе данных
\c video_automation;

-- ============================================================================
-- ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    niche VARCHAR(100) NOT NULL,
    language VARCHAR(10) DEFAULT 'ru',
    platform VARCHAR(50) DEFAULT 'TikTok',
    scripts_per_day INTEGER DEFAULT 3,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии к таблице
COMMENT ON TABLE users IS 'Пользователи системы генерации контента';
COMMENT ON COLUMN users.niche IS 'Основная ниша контента (мотивация, финансы, здоровье и т.д.)';
COMMENT ON COLUMN users.language IS 'Код языка контента (ru, en, es и т.д.)';
COMMENT ON COLUMN users.platform IS 'Целевая платформа (TikTok, YouTube, Instagram)';
COMMENT ON COLUMN users.scripts_per_day IS 'Количество сценариев для генерации ежедневно';
COMMENT ON COLUMN users.settings IS 'Дополнительные настройки пользователя в JSON';

-- ============================================================================
-- ТАБЛИЦА СЦЕНАРИЕВ
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_scripts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    script_data JSONB NOT NULL,
    platform VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,4),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии к таблице
COMMENT ON TABLE video_scripts IS 'Сгенерированные видео-сценарии';
COMMENT ON COLUMN video_scripts.script_data IS 'Полный сценарий в JSON формате';
COMMENT ON COLUMN video_scripts.status IS 'Статус: draft, ready, published, archived';
COMMENT ON COLUMN video_scripts.engagement_rate IS 'Коэффициент вовлеченности (likes+comments)/views';

-- ============================================================================
-- ТАБЛИЦА ТРЕНДОВ
-- ============================================================================

CREATE TABLE IF NOT EXISTS youtube_trends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    niche VARCHAR(100) NOT NULL,
    language VARCHAR(10) DEFAULT 'ru',
    trend_data JSONB NOT NULL,
    videos_analyzed INTEGER,
    avg_views INTEGER,
    avg_engagement_rate DECIMAL(5,4),
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии к таблице
COMMENT ON TABLE youtube_trends IS 'Проанализированные тренды YouTube';
COMMENT ON COLUMN youtube_trends.trend_data IS 'Детальные данные анализа трендов в JSON';
COMMENT ON COLUMN youtube_trends.videos_analyzed IS 'Количество проанализированных видео';

-- ============================================================================
-- ТАБЛИЦА ЛОГОВ ГЕНЕРАЦИИ
-- ============================================================================

CREATE TABLE IF NOT EXISTS generation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    execution_time_seconds DECIMAL(10,2),
    trends_analyzed INTEGER DEFAULT 0,
    scripts_generated INTEGER DEFAULT 0,
    scripts_saved INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии к таблице
COMMENT ON TABLE generation_logs IS 'Логи процессов генерации контента';
COMMENT ON COLUMN generation_logs.status IS 'Статус: success, error, skipped';

-- ============================================================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- ============================================================================

-- Индексы для таблицы users
CREATE INDEX IF NOT EXISTS idx_users_niche ON users(niche);
CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Индексы для таблицы video_scripts
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON video_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON video_scripts(status);
CREATE INDEX IF NOT EXISTS idx_scripts_platform ON video_scripts(platform);
CREATE INDEX IF NOT EXISTS idx_scripts_created_at ON video_scripts(created_at);
CREATE INDEX IF NOT EXISTS idx_scripts_views ON video_scripts(views DESC);
CREATE INDEX IF NOT EXISTS idx_scripts_engagement ON video_scripts(engagement_rate DESC);

-- Индексы для таблицы youtube_trends
CREATE INDEX IF NOT EXISTS idx_trends_user_id ON youtube_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_trends_niche ON youtube_trends(niche);
CREATE INDEX IF NOT EXISTS idx_trends_analyzed_at ON youtube_trends(analyzed_at DESC);

-- Индексы для таблицы generation_logs
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_status ON generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON generation_logs(created_at DESC);

-- ============================================================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
-- ============================================================================

-- Функция для обновления поля updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at
    BEFORE UPDATE ON video_scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ФУНКЦИИ ДЛЯ РАСЧЁТА МЕТРИК
-- ============================================================================

-- Функция для расчёта коэффициента вовлеченности
CREATE OR REPLACE FUNCTION calculate_engagement_rate(
    p_views INTEGER,
    p_likes INTEGER,
    p_comments INTEGER
)
RETURNS DECIMAL(5,4) AS $$
BEGIN
    IF p_views > 0 THEN
        RETURN ROUND(((p_likes + p_comments)::DECIMAL / p_views), 4);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS)
-- ============================================================================

-- Представление: Топ сценарии по просмотрам
CREATE OR REPLACE VIEW top_scripts_by_views AS
SELECT 
    vs.id,
    vs.user_id,
    u.username,
    vs.title,
    vs.platform,
    vs.views,
    vs.likes,
    vs.engagement_rate,
    vs.created_at
FROM video_scripts vs
JOIN users u ON vs.user_id = u.id
WHERE vs.status = 'published'
ORDER BY vs.views DESC
LIMIT 100;

-- Представление: Статистика пользователей
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.username,
    u.niche,
    u.platform,
    COUNT(vs.id) as total_scripts,
    COUNT(CASE WHEN vs.status = 'published' THEN 1 END) as published_scripts,
    AVG(vs.views)::INTEGER as avg_views,
    AVG(vs.engagement_rate) as avg_engagement,
    MAX(vs.created_at) as last_script_date
FROM users u
LEFT JOIN video_scripts vs ON u.id = vs.user_id
GROUP BY u.id, u.username, u.niche, u.platform;

-- Представление: Ежедневная статистика генерации
CREATE OR REPLACE VIEW daily_generation_stats AS
SELECT 
    DATE(created_at) as generation_date,
    COUNT(*) as total_generations,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed,
    AVG(execution_time_seconds) as avg_execution_time,
    SUM(scripts_generated) as total_scripts_generated
FROM generation_logs
GROUP BY DATE(created_at)
ORDER BY generation_date DESC;

-- ============================================================================
-- ТЕСТОВЫЕ ДАННЫЕ (ОПЦИОНАЛЬНО)
-- ============================================================================

-- Вставка тестового пользователя
INSERT INTO users (username, email, niche, language, platform, scripts_per_day, settings)
VALUES 
    ('test_user', 'test@example.com', 'мотивация', 'ru', 'TikTok', 3, 
     '{"target_audience": "18-35", "tone": "energetic", "style": "fast-paced"}'::jsonb),
    ('demo_user', 'demo@example.com', 'финансы', 'ru', 'YouTube', 5,
     '{"target_audience": "25-45", "tone": "professional", "style": "educational"}'::jsonb)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- ПОЛЕЗНЫЕ ЗАПРОСЫ
-- ============================================================================

-- Проверка созданных таблиц
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Проверка индексов
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';

-- Статистика по таблицам
-- SELECT 
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- ЗАВЕРШЕНИЕ
-- ============================================================================

-- Вывод успешного завершения
SELECT 'Database setup completed successfully!' as status;

-- Вывод списка таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
