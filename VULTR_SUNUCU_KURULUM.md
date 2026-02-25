# Vultr Sunucu Kurulum Rehberi (Flixify için)

## 📋 Gereksinimler

- Vultr hesabı (kredi kartı/PayPal ile)
- Domain adı (varsa - opsiyonel)
- SSH Key (önerilir)

---

## 🚀 Adım 1: SSH Key Oluşturma (Local Bilgisayarınızda)

### Windows (PowerShell / Git Bash):
```powershell
ssh-keygen -t ed25519 -C "email@example.com"
# Dosya yeri: Enter'a bas (default)
# Parola: Boş bırakabilirsin (Enter)
```

### Public Key'i Kopyala:
```powershell
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard
# veya
clip < ~/.ssh/id_ed25519.pub
```

---

## 🖥️ Adım 2: Vultr'da Sunucu Oluşturma

### 2.1 Giriş Yap
- https://my.vultr.com adresine git
- Hesap oluştur veya giriş yap

### 2.2 "Deploy Server" Butonu
1. **Choose Server**: "Cloud Compute" (Shared CPU)
   - GPU/High Frequency gerekmez

2. **Choose Location**: 
   - 🇳🇱 Amsterdam (Türkiye'ye en yakın)
   - veya 🇫🇷 Paris

3. **Choose Image**:
   - **Ubuntu 22.04 LTS x64** (TAVSİYE)
   - veya Ubuntu 24.04 LTS

4. **Choose Plan**:
   ```
   ★ TAVSİYE: $24/ay (2 vCPU / 4GB RAM / 80GB SSD)
   Alternatif: $12/ay (1 vCPU / 2GB RAM) - minimum
   ```
   - Flixify + Coolify için 4GB RAM önerilir

5. **Additional Features**:
   - ✅ Auto Backups (isteğe bağlı, +$4/ay)
   - ✅ IPv6 Enabled

6. **SSH Keys**:
   - "Add New" → Az önce kopyaladığın public key'i yapıştır
   - İsim ver: "Macbook" veya "Windows PC"

7. **Server Hostname & Label**:
   ```
   Hostname: flixify-prod
   Label: Flixify Production
   ```

8. **Deploy Now** 🚀

---

## ⏱️ Adım 3: Sunucu Hazır Olana Kadar Bekle

- Kurulum ~5-10 dakika sürer
- Sunucu durumu "Running" olunca hazır
- **IP Adresini** not et (örn: `45.32.123.45`)

---

## 🔐 Adım 4: İlk Bağlantı ve Temel Ayarlar

### 4.1 Sunucuya Bağlan
```bash
ssh root@SUNUCU_IP_ADRESI
```

İlk bağlantıda şunu görürsün:
```
Are you sure you want to continue connecting (yes/no)?
```
→ `yes` yaz ve Enter

### 4.2 Sunucuyu Güncelle
```bash
apt update && apt upgrade -y
```

### 4.3 Gerekli Paketleri Kur
```bash
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release
```

---

## 🛡️ Adım 5: Güvenlik Ayarları

### 5.1 UFW Firewall'ı Yapılandır
```bash
# Varsayılan: Gelenleri reddet, gidenlere izin ver
ufw default deny incoming
ufw default allow outgoing

# SSH'ye izin ver (kendini dışarıda bırakma!)
ufw allow ssh

# HTTP ve HTTPS'e izin ver
ufw allow 80/tcp
ufw allow 443/tcp

# Coolify panel portu (8000)
ufw allow 8000/tcp

# UFW'yi aktif et
ufw enable

# Durumu kontrol et
ufw status
```

### 5.2 Fail2Ban (Brute-force koruması)
```bash
# Zaten kurulu, sadece ayarlayalım
systemctl enable fail2ban
systemctl start fail2ban
```

### 5.3 Root Login'ı Kapat (Opsiyonel ama Önerilir)
```bash
# Yeni bir kullanıcı oluştur
adduser flixify
usermod -aG sudo flixify

# SSH config'i düzenle
vim /etc/ssh/sshd_config
```

Şu satırları bul ve değiştir:
```
PermitRootLogin no
PasswordAuthentication no
```

```bash
# SSH'yi yeniden başlat
systemctl restart sshd
```

⚠️ **DİKKAT**: Bundan sonra `flixify` kullanıcısı ile bağlan:
```bash
ssh flixify@SUNUCU_IP
```

---

## 🐳 Adım 6: Docker Kurulumu (Coolify için gerekli)

```bash
# Docker resmi kurulum script'i
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker'ı başlat ve enable et
systemctl start docker
systemctl enable docker

# Root olmayan kullanıcıya docker yetkisi ver (opsiyonel)
usermod -aG docker flixify

# Docker Compose kur
apt install -y docker-compose-plugin

# Test
docker --version
docker compose version
```

---

## ✅ Adım 7: Sunucu Hazır mı Kontrol Et

```bash
# Sistem bilgisi
hostnamectl

# Disk kullanımı
df -h

# RAM kullanımı
free -h

# Çalışan servisler
systemctl list-units --type=service --state=running

# Açık portlar
ss -tulpn
```

---

## 🎉 Sonraki Adım: Coolify Kurulumu

Sunucun hazır! Şimdi Coolify kurulumuna geç:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Kurulum tamamlandığında ekranda şuna benzer bilgiler göreceksin:
```
🎉 Coolify installed successfully!
📱 Access Coolify at: http://SUNUCU_IP:8000
🔑 Initial setup key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Bu bilgileri kaydet ve Coolify panelinden devam et!

---

## 📋 Özet: Ne Yaptık?

| Adım | Durum |
|------|-------|
| ✅ Vultr'da Ubuntu 22.04 sunucu | Running |
| ✅ SSH Key ile güvenli erişim | Aktif |
| ✅ Firewall (UFW) yapılandırıldı | Aktif |
| ✅ Docker + Docker Compose | Kurulu |
| ✅ Sistem güncellemeleri | Tamamlandı |

---

## 🆘 Sorun Giderme

### SSH Bağlantı Reddedildi
```bash
# Vultr panelinden Console'a gir (Web üzerinden)
# Sunucu içinden:
cat ~/.ssh/authorized_keys
# Key'in doğru olduğundan emin ol
```

### UFW Açtım, SSH Gitti
Vultr web konsolundan sunucuya gir:
```bash
ufw disable
# veya
ufw allow ssh
```

### Disk Dolu
```bash
# Büyük dosyaları bul
ncdu /
# veya
du -h / | sort -rh | head -20
```

---

## 💰 Maliyet Özeti

| Plan | Özellikler | Aylık Fiyat |
|------|------------|-------------|
| **Tavsiye Edilen** | 2 vCPU / 4GB RAM / 80GB NVMe | **$24** |
| Minimum | 1 vCPU / 2GB RAM / 50GB NVMe | $12 |
| Güçlü | 4 vCPU / 8GB RAM / 160GB NVMe | $48 |

---

Hazır olduğunda **Coolify kurulumuna** geçebiliriz! 🚀
