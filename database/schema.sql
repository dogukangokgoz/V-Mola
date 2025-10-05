-- Mola Takip Sistemi Veritabanı Şeması

-- Kullanıcılar tablosu
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departmanlar tablosu
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mola tipleri tablosu
CREATE TABLE break_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Molalar tablosu
CREATE TABLE breaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    break_type_id INTEGER REFERENCES break_types(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    notes TEXT,
    is_auto_ended BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sistem ayarları tablosu
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kullanıcı oturumları tablosu (güvenlik için)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mola kuralları tablosu (departman bazlı)
CREATE TABLE break_rules (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id),
    max_daily_minutes INTEGER DEFAULT 60,
    min_break_duration INTEGER DEFAULT 5,
    max_break_duration INTEGER DEFAULT 30,
    auto_end_after_minutes INTEGER DEFAULT 120,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_breaks_user_id ON breaks(user_id);
CREATE INDEX idx_breaks_start_time ON breaks(start_time);
CREATE INDEX idx_breaks_end_time ON breaks(end_time);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Varsayılan mola tipleri
INSERT INTO break_types (name, description) VALUES 
('Yemek Molası', 'Öğle yemeği için mola'),
('Kahve Molası', 'Kısa kahve/çay molası'),
('Kişisel Mola', 'Kişisel ihtiyaçlar için mola'),
('Sigara Molası', 'Sigara molası');

-- Varsayılan sistem ayarları
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('max_daily_break_minutes', '60', 'Günlük maksimum mola süresi (dakika)'),
('min_break_duration', '5', 'Minimum mola süresi (dakika)'),
('max_break_duration', '30', 'Maksimum tek mola süresi (dakika)'),
('auto_end_break_minutes', '120', 'Otomatik mola bitirme süresi (dakika)'),
('timezone', 'Europe/Istanbul', 'Sistem saat dilimi');

-- Varsayılan departmanlar
INSERT INTO departments (name, description) VALUES 
('İnsan Kaynakları', 'İnsan kaynakları departmanı'),
('Bilgi İşlem', 'IT departmanı'),
('Muhasebe', 'Muhasebe departmanı'),
('Satış', 'Satış departmanı'),
('Pazarlama', 'Pazarlama departmanı');

-- Varsayılan admin kullanıcısı (şifre: admin123)
INSERT INTO users (first_name, last_name, email, password_hash, department, role) VALUES 
('Admin', 'User', 'admin@mola.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'İnsan Kaynakları', 'admin');

-- Güncelleme trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at trigger'ları
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_breaks_updated_at BEFORE UPDATE ON breaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_break_rules_updated_at BEFORE UPDATE ON break_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

