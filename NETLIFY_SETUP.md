# Netlify Veritabanı Kurulum Rehberi

Bu rehber, Mola Takip projenizi Netlify'de veritabanı ile nasıl çalıştıracağınızı açıklar.

## 1. Supabase Veritabanı Kurulumu

### Supabase Hesabı Oluşturma
1. [Supabase](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın
4. Yeni bir proje oluşturun

### Veritabanı Kurulumu
1. Supabase dashboard'da SQL Editor'a gidin
2. `database/schema.sql` dosyasındaki tüm SQL komutlarını kopyalayın
3. SQL Editor'da çalıştırın

### API Anahtarlarını Alma
1. Supabase dashboard'da Settings > API'ye gidin
2. Aşağıdaki bilgileri not edin:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_ANON_KEY)

## 2. Netlify Kurulumu

### Proje Deploy Etme
1. [Netlify](https://netlify.com) adresine gidin
2. "New site from Git" seçin
3. GitHub repository'nizi seçin
4. Build settings:
   - Build command: `cd client && npm run build && cd ../netlify/functions && npm install`
   - Publish directory: `client/build`

### Environment Variables Ayarlama
Netlify dashboard'da Site settings > Environment variables'a gidin ve şunları ekleyin:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h
```

## 3. Frontend API URL'lerini Güncelleme

`client/src/services/api.ts` dosyasında API base URL'ini güncelleyin:

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-netlify-site.netlify.app/api'
  : 'http://localhost:5000/api';
```

## 4. Test Etme

### Yerel Test
```bash
# Netlify CLI ile test
npm install -g netlify-cli
netlify dev
```

### Production Test
1. Netlify'de site deploy edildikten sonra
2. `https://your-site.netlify.app/api/auth` endpoint'ini test edin
3. Frontend uygulamasını test edin

## 5. API Endpoints

Deploy edildikten sonra şu endpoint'ler kullanılabilir:

- `POST /api/auth` - Kullanıcı girişi
- `GET /api/users` - Kullanıcı bilgileri
- `PUT /api/users` - Kullanıcı güncelleme
- `GET /api/breaks` - Mola listesi
- `POST /api/breaks` - Yeni mola başlat
- `PUT /api/breaks` - Mola bitir

## 6. Güvenlik Notları

- JWT_SECRET'i güçlü ve benzersiz yapın
- Supabase RLS (Row Level Security) politikalarını ayarlayın
- Production'da CORS ayarlarını kısıtlayın

## 7. Sorun Giderme

### Yaygın Hatalar
1. **Environment variables bulunamıyor**: Netlify dashboard'dan kontrol edin
2. **CORS hatası**: netlify.toml'daki headers ayarlarını kontrol edin
3. **Database bağlantı hatası**: Supabase URL ve key'lerini kontrol edin

### Log Kontrolü
Netlify dashboard > Functions > View logs ile hata loglarını görüntüleyebilirsiniz.
