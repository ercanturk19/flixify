# Flixify - Coolify Deployment Rehberi

## 📋 Gereksinimler

- Vultr VPS (Ubuntu 22.04 LTS önerilir)
- Minimum 2 CPU / 4GB RAM / 80GB SSD
- Domain (örn: flixify.com)
- BunnyCDN Hesabı (Opsiyonel - Static assets için)

---

## 🚀 Adım 1: Vultr Sunucu Kurulumu

### 1.1 Sunucu Oluşturma
1. Vultr paneline giriş yap
2. "Deploy New Server" → "Cloud Compute"
3. Location: Türkiye'ye yakın (Paris/Amsterdam)
4. Image: Ubuntu 22.04 LTS
5. Plan: 2 CPU / 4GB RAM (en az)
6. SSH Key ekle (şifre yerine)
7. Deploy

### 1.2 Sunucuya Bağlanma
```bash
ssh root@SUNUCU_IP_ADRESI
```

### 1.3 Temel Güvenlik Güncellemeleri
```bash
apt update && apt upgrade -y
apt install -y curl wget git nginx
```

---

## 🎯 Adım 2: Coolify Kurulumu

### 2.1 Coolify'i Kur
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Kurulum tamamlandıktan sonra ekranda çıkan URL ve key bilgilerini kaydet.

### 2.2 Coolify Paneline Erişim
```
http://SUNUCU_IP:8000
```
- İlk kurulumda sizden key isteyecek
- Kalan adımları web arayüzünden tamamlayın

---

## 🔧 Adım 3: Coolify'da Proje Yapılandırması

### 3.1 Git Entegrasyonu
1. Coolify Panel → "Create New Resource"
2. "Application" seç
3. Git Provider olarak GitHub/GitLab bağla
4. Flixify repo'sunu seç

### 3.2 Build Ayarları
```
Build Pack: Dockerfile
Dockerfile Path: ./Dockerfile
Port: 80
```

### 3.3 Environment Variables
```
NODE_ENV=production
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 3.4 Proxy Servisi İçin Ayrı Container
Aynı repodan ikinci bir application oluştur:
```
Name: flixify-proxy
Build Pack: Dockerfile
Dockerfile Path: ./proxy-server/Dockerfile
Port: 3001
```

---

## 🌐 Adım 4: Domain ve SSL Yapılandırması

### 4.1 Domain DNS Ayarları
DNS panelinden:
```
A     @     SUNUCU_IP
A     *     SUNUCU_IP
```

### 4.2 Coolify'da Domain Ekleme
1. Flixify app → "Settings" → "Domains"
2. Domain ekle: `flixify.com`
3. "Enable SSL" seçeneğini aktif et (Let's Encrypt)

### 4.3 Proxy için Domain (Opsiyonel)
Eğer proxy'yi ayrı subdomain'de istersen:
```
api.flixify.com → flixify-proxy servisine yönlendir
```

---

## 🐰 Adım 5: BunnyCDN Yapılandırması (Opsiyonel)

### 5.1 Pull Zone Oluşturma
1. BunnyCDN Panel → "Pull Zones" → "Add Pull Zone"
2. Name: flixify-static
3. Origin URL: `https://flixify.com` (sunucu domainin)
4. Tier: Standard

### 5.2 CNAME Ayarı
```
CNAME  cdn  flixify-static.b-cdn.net
```

### 5.3 Edge Rules (Önemli)
**Canlı yayın URL'lerini cache'leme!**

Edge Rule ekle:
```
IF: URL matches /api/proxy*
THEN: Disable Cache
```

### 5.4 Flixify'da CDN Kullanımı
`index.html` veya config'de asset URL'lerini güncelle:
```javascript
// Örnek: Statik asset'ler CDN'den yüklensin
const CDN_URL = 'https://cdn.flixify.com';
```

---

## ✅ Adım 6: Doğrulama

### 6.1 Servislerin Çalıştığını Kontrol Et
```bash
# Sunucuya SSH ile bağlan
docker ps

# Çıktıda şunları görmelisin:
# - flixify-app
# - flixify-proxy
```

### 6.2 Log Kontrolü
```bash
# Coolify logları
cd /data/coolify && docker-compose logs -f

# Spesifik container logları
docker logs -f flixify-app
docker logs -f flixify-proxy
```

### 6.3 Stream Testi
1. Flixify sitesini aç
2. Bir kanal seç
3. HLS stream'in çalıştığını doğrula
4. Browser DevTools → Network tab'da `/api/proxy` isteklerini kontrol et

---

## 🔒 Güvenlik Notları

### IP Whitelist (Önerilen)
IPTV sunucuları IP kısıtlaması yapıyorsa, Vultr sunucunuzun IP'sini whitelist'e ekleyin.

### Rate Limiting
Nginx'de rate limiting ekleyebilirsin:
```nginx
limit_req_zone $binary_remote_addr zone=iptv:10m rate=10r/s;

location /api/proxy {
    limit_req zone=iptv burst=20 nodelay;
    # ... diğer ayarlar
}
```

---

## 🐛 Sorun Giderme

### Stream Açılmıyor
1. Proxy loglarını kontrol et: `docker logs flixify-proxy`
2. IPTV linkinin çalıştığını doğrula (curl ile test et)
3. CORS hataları için proxy'nin çalıştığını kontrol et

### SSL Hatası
```bash
# Certbot ile manuel yenileme (gerekirse)
certbot renew
```

### 502 Bad Gateway
1. Proxy container'ının çalıştığını doğrula
2. Docker network'ünü kontrol et
3. Port mapping doğru mu kontrol et

---

## 📊 Monitoring (Opsiyonel)

Coolify'da built-in monitoring var. Ek olarak:
- **Uptime Kuma**: Açık kaynak uptime monitoring
- **BunnyCDN Stats**: Bandwidth ve hit ratio takibi

---

## 💰 Maliyet Tahmini

| Servis | Aylık Maliyet |
|--------|---------------|
| Vultr (2CPU/4GB) | ~$24 |
| BunnyCDN (1TB bandwidth) | ~$10 |
| Domain | ~$12/yıl |
| **Toplam** | **~$34/ay** |

---

## 🎉 Sonuç

Artık Flixify'niz Vultr üzerinde Coolify ile çalışıyor! 

- **Frontend**: https://flixify.com
- **Proxy API**: https://flixify.com/api/proxy
- **Admin Panel**: https://SUNUCU_IP:8000 (Coolify)
