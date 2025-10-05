# Mola Takip Sistemi

Çalışanların mola sürelerini takip etmek, yönetmek ve raporlamak için geliştirilmiş modern web tabanlı sistem.

## 🚀 Özellikler

### Çalışan Özellikleri
- ✅ Kullanıcı girişi (login/logout)
- ✅ Mola başlat/bitir butonu
- ✅ Aktif mola süresini gerçek zamanlı gösterme
- ✅ Günlük/haftalık mola geçmişi
- ✅ Kalan mola hakkı gösterimi
- ✅ Mola tiplerini seçme
- ✅ Mola notları ekleme

### Yönetici Özellikleri
- ✅ Tüm çalışanların mola durumlarını anlık görüntüleme
- ✅ Departman/ekip bazlı raporlar
- ✅ Mola süresi istatistikleri
- ✅ Mola kurallarını belirleme (günlük limit, minimum/maksimum süre)
- ✅ Excel/PDF rapor çıktısı
- ✅ Gerçek zamanlı dashboard
- ✅ Kullanıcı yönetimi

### Teknik Özellikler
- ✅ Modern React + TypeScript frontend
- ✅ Node.js + Express backend
- ✅ PostgreSQL veritabanı
- ✅ JWT tabanlı kimlik doğrulama
- ✅ WebSocket ile gerçek zamanlı güncellemeler
- ✅ Responsive tasarım (mobil uyumlu)
- ✅ Güvenlik önlemleri (rate limiting, CORS, helmet)
- ✅ Otomatik mola bitirme
- ✅ Validasyon ve hata yönetimi

## 🛠️ Teknoloji Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Veritabanı
- **JWT** - Kimlik doğrulama
- **Socket.IO** - Gerçek zamanlı iletişim
- **bcryptjs** - Şifre hash'leme
- **Express Rate Limit** - Rate limiting
- **Helmet** - Güvenlik middleware
- **ExcelJS** - Excel rapor oluşturma
- **Puppeteer** - PDF rapor oluşturma

### Frontend
- **React 18** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - CSS framework
- **React Router** - Sayfa yönlendirme
- **Axios** - HTTP istekleri
- **Socket.IO Client** - Gerçek zamanlı iletişim
- **Moment.js** - Tarih/saat işlemleri
- **Chart.js** - Grafik oluşturma

## 📋 Gereksinimler

### Sistem Gereksinimleri
- Node.js (v16 veya üzeri)
- PostgreSQL (v12 veya üzeri)
- npm veya yarn

### Kurulum

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd mola
```

2. **Backend bağımlılıklarını yükleyin**
```bash
npm install
```

3. **Frontend bağımlılıklarını yükleyin**
```bash
cd client
npm install
cd ..
```

4. **Veritabanını kurun**
```bash
# PostgreSQL'de veritabanı oluşturun
createdb mola_takip

# Şemayı import edin
psql -d mola_takip -f database/schema.sql
```

5. **Çevre değişkenlerini ayarlayın**
```bash
# env.example dosyasını .env olarak kopyalayın
cp env.example .env

# .env dosyasını düzenleyin
nano .env
```

6. **Uygulamayı başlatın**

**Development modu:**
```bash
# Backend ve frontend'i birlikte başlat
npm run dev-full

# Veya ayrı ayrı:
# Backend
npm run dev

# Frontend (yeni terminal)
npm run client
```

**Production modu:**
```bash
# Frontend build
npm run build

# Backend başlat
npm start
```

## ⚙️ Konfigürasyon

### Çevre Değişkenleri (.env)

```env
# Veritabanı Ayarları
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mola_takip
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Ayarları
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=24h

# Sunucu Ayarları
PORT=5000
NODE_ENV=development

# Frontend URL
CLIENT_URL=http://localhost:3000

# Mola Ayarları
MAX_DAILY_BREAK_MINUTES=60
MIN_BREAK_DURATION_MINUTES=5
MAX_BREAK_DURATION_MINUTES=30
AUTO_END_BREAK_MINUTES=120
```

### Veritabanı Şeması

Sistem aşağıdaki ana tabloları içerir:

- **users** - Kullanıcı bilgileri
- **breaks** - Mola kayıtları
- **break_types** - Mola tipleri
- **departments** - Departman bilgileri
- **system_settings** - Sistem ayarları
- **break_rules** - Mola kuralları
- **user_sessions** - Kullanıcı oturumları

## 👥 Kullanım

### Demo Hesapları

Sistem kurulumunda varsayılan admin hesabı oluşturulur:
- **Email:** admin@mola.com
- **Şifre:** admin123

### Çalışan Paneli

1. **Giriş Yapma**
   - Email ve şifre ile giriş yapın
   - Dashboard'da güncel durumunuz görüntülenir

2. **Mola Başlatma**
   - "Mola Başlat" butonuna tıklayın
   - İsteğe bağlı olarak mola tipi seçin
   - Kronometre çalışmaya başlar

3. **Mola Bitirme**
   - "Mola Bitir" butonuna tıklayın
   - İsteğe bağlı notlar ekleyin
   - Mola kaydedilir ve geçmişe eklenir

4. **Geçmiş Görüntüleme**
   - Mola geçmişinizi tarih aralığı ile filtreleyebilirsiniz
   - Detaylı istatistikleri görüntüleyebilirsiniz

### Yönetici Paneli

1. **Dashboard**
   - Anlık aktif molalar
   - Günlük istatistikler
   - Departman bazlı analizler

2. **Raporlar**
   - Detaylı mola raporları
   - Excel/PDF çıktısı
   - Grafik analizleri

3. **Kullanıcı Yönetimi**
   - Yeni kullanıcı ekleme
   - Kullanıcı bilgilerini güncelleme
   - Departman ataması

4. **Sistem Ayarları**
   - Mola kurallarını belirleme
   - Mola tiplerini yönetme
   - Departman tanımları

## 🔒 Güvenlik

- **HTTPS** kullanımı (production'da)
- **JWT** tabanlı kimlik doğrulama
- **bcrypt** ile şifre hash'leme
- **Rate limiting** ile API koruması
- **CORS** politikaları
- **SQL injection** koruması
- **Helmet** ile güvenlik header'ları
- **Rol tabanlı** yetkilendirme

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Giriş yap
- `POST /api/auth/register` - Kayıt ol
- `POST /api/auth/logout` - Çıkış yap
- `GET /api/auth/me` - Kullanıcı bilgileri

### Breaks
- `GET /api/breaks/status/:userId` - Mola durumu
- `POST /api/breaks/start` - Mola başlat
- `POST /api/breaks/end/:breakId` - Mola bitir
- `GET /api/breaks/history/:userId` - Mola geçmişi
- `GET /api/breaks/types` - Mola tipleri

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/reports` - Detaylı raporlar
- `GET /api/admin/reports/excel` - Excel raporu
- `GET /api/admin/reports/pdf` - PDF raporu
- `GET /api/admin/charts/data` - Grafik verileri

### Users
- `GET /api/users` - Kullanıcı listesi
- `GET /api/users/:id` - Kullanıcı detayı
- `POST /api/users` - Kullanıcı oluştur
- `PUT /api/users/:id` - Kullanıcı güncelle

### Settings
- `GET /api/settings` - Sistem ayarları
- `PUT /api/settings` - Ayarları güncelle
- `GET /api/settings/break-types` - Mola tipleri
- `POST /api/settings/break-types` - Mola tipi oluştur

## 🚀 Deployment

### Docker ile Deployment

```bash
# Docker image oluştur
docker build -t mola-takip .

# Container çalıştır
docker run -p 5000:5000 -p 3000:3000 mola-takip
```

### Production Ayarları

1. **Çevre değişkenlerini ayarlayın**
2. **PostgreSQL production veritabanını kurun**
3. **Frontend build alın**
4. **HTTPS sertifikası kurun**
5. **Reverse proxy (nginx) yapılandırın**

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 📞 İletişim

Proje hakkında sorularınız için:
- Email: your-email@example.com
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Teşekkürler

- [React](https://reactjs.org/) - UI kütüphanesi
- [Express.js](https://expressjs.com/) - Web framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [PostgreSQL](https://www.postgresql.org/) - Veritabanı
- [Socket.IO](https://socket.io/) - Gerçek zamanlı iletişim

