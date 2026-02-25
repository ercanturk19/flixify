$host = "45.63.40.225"
$user = "root"
$localPath = "dist\*"
$remotePath = "/var/www/flixify/"

Write-Host "Flixify Deploy Script" -ForegroundColor Cyan
Write-Host "Dosyalar sunucuya yükleniyor..." -ForegroundColor Yellow
Write-Host "Şifre sorulduğunda girin: 3,sNP}W8zke7[*4X" -ForegroundColor Magenta

scp -r dist/* root@45.63.40.225:/var/www/flixify/

if ($?) {
    Write-Host "Yükleme Başarılı!" -ForegroundColor Green
    Write-Host "Siteyi test edebilirsiniz: https://flixify.pro"
} else {
    Write-Host "Yükleme Başarısız!" -ForegroundColor Red
}
