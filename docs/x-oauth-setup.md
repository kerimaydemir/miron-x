# X OAuth Kurulumu

Bu proje tarayici cerezlerini kullanmaz. X API v2 icin OAuth 1.0a kullanir.

1. [X Developer Portal](https://developer.x.com/en/portal/dashboard) icinde bir Project ve App ac.
2. App ayarlarinda **User authentication settings** bolumunu etkinlestir.
3. Authentication type olarak **OAuth 1.0a**, izin olarak **Read and write** sec.
4. **Keys and tokens** sayfasindan uygulamanin API Key ve API Key Secret degerlerini; ardindan hesabina ait Access Token ve Access Token Secret degerlerini uret.
5. GitHub deposunda **Settings -> Secrets and variables -> Actions** altina su dort repository secret'i ekle:

   - `X_API_KEY`
   - `X_API_KEY_SECRET`
   - `X_ACCESS_TOKEN`
   - `X_ACCESS_TOKEN_SECRET`

6. `Manual X Test Tweet` workflow'unu `naber` metniyle calistir. Bu basarili olduktan sonra `Manual Live Tweet Cleanup` toplu silme akisinda kullanilabilir.

Anahtarlar sadece GitHub Secrets'te kalir. Issue, commit, `.env`, terminal ciktisi veya sohbet mesajina eklenmez.
