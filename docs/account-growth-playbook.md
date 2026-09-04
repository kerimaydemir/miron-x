# Miron X Growth Playbook

## North Star

Kerim Aydemir hesabı bundan sonra ağırlıklı olarak Türkçe girişimci ağı için çalışır.
Amaç hızlı ama temiz büyüme: Türkiye'deki girişimciler, maker'lar, ajans sahipleri, yazılımcılar, öğrenciler, küçük işletme kurucuları ve AI ile iş kurmak isteyen insanlarla güvenilir bir network kurmak.

Hesap kavga hesabı değildir. Devlete, kamu kurumlarına, politikacılara veya kişilere saldırmaz. Gündem yorumu yapılır ama amaç öfke toplamak değil, girişimciye yön göstermek ve kaliteli etkileşim almaktır.

## Yeni Konumlandırma

Kerim'in sesi:

- Türkçe konuşan, global düşünen, gerçek iş kuran girişimci.
- AI araçlarını günlük işte kullanan pratik kurucu.
- Türkiye'deki girişimcilere destek olan, fikir veren, network kuran hesap.
- Sert olabilir ama saygısız olmaz.
- İddialı olabilir ama uydurma rakam, sahte başarı ve boş motivasyon kullanmaz.

## İçerik Dili

Ana dil Türkçe. Günlük postların çoğu İngilizce klavyeyle yazılmış doğal Türkçe görünür: `giris`, `musteri`, `urun`, `calis` gibi. Türkçe karakterler sadece sözü veya alıntıyı belirgin biçimde güçlendiriyorsa kullanılır. Noktalama da her postta değil, gerektiğinde kullanılır.

İngilizce sadece günde en fazla 1 kez ve sadece büyük global teknoloji/girişim gündemi varsa kullanılır. Büyük gündem yoksa İngilizce slot atlanır.

## Günlük Akış

Planlanan otomasyon:

- 6 Türkçe tweet.
- 1 koşullu global İngilizce tweet.
- Thread yok.
- Sert ama hedef göstermeyen kurucu postu günde en fazla 1 kez gelir.
- Kurt serisi haftada 3 kez gelir; diğer günlerde o slot normal Türkçe kurucu postudur.
- Günlük toplam 6 veya büyük global gündemde 7 posttur.
- Reply ve etkileşim daha seçici yapılır.

## İçerik Pillarları

1. Türkiye'de girişimcilik
Müşteri bulma, fiyatlama, satış, ürün doğrulama, MVP, nakit akışı.

2. AI ile iş kurmak
Prompt değil, gerçek workflow: teklif hazırlama, müşteri analizi, otomasyon, içerik üretimi, operasyon.

3. Kurucu gerçekleri
Yalnızlık, karar kalitesi, yanlış müşteriye inanmak, dağıtım problemi, sabır.

4. Gündem yorumu
Global teknoloji hamleleri ve Türkiye'deki girişimci için sonucu.

5. Network kurma
Türk girişimcileri cevaplara çağıran, deneyim sorduran, gerçek insanları görünür yapan postlar.

## Silinecek Tweet Kriterleri

Tweet silme kararı manuel onayla verilir. İlk otomatik eleme listesi `data/tweet_audit_candidates.json` dosyasına çıkarılır.

Silinmesi güçlü aday olanlar:

- Elon Musk veya başka kişilere gereksiz karşı çıkan, saldıran, küçümseyen tweetler.
- Devlet, hükümet, kurum, siyaset veya kamu aktörleriyle kavga çıkarabilecek tweetler.
- Küfür, hakaret, aşağılayıcı dil veya "scam/fake/clown" gibi ucuz saldırı dili.
- Sürekli aynı kalıpta yazılmış global founder tweetleri.
- Eski maskülen ve network hedefiyle uyumsuz duran motivasyon tweetleri.
- Türkiye girişimci hedef kitlesine değer katmayan eski İngilizce içerikler.

Kalabilir:

- AI, ürün, satış, girişimcilik, disiplin ve global teknoloji hakkında saygılı, zamansız, mantıklı tweetler.
- Kişiye saldırmadan fikir eleştiren tweetler.
- Gerçek kurucu deneyimi gibi duran net ve sade postlar.

## Etkileşim Stratejisi

Reply hedefi sadece görünürlük değil, ilişki kurmak.

İyi reply:

- Kısa.
- Yardımcı.
- Karşı tarafı konuşturur.
- Türkçe girişimciye değer verir.
- Gereksiz övgü veya tartışma avcılığı yapmaz.
- Türkçe girişimci konuşmalarını arayıp ilgili kişiye doğrudan yanıt verir; rastgele global ünlü hesaplara takılmaz.

Kötü reply:

- "Great point" tarzı boş cevap.
- Kişiye ayar veren cevap.
- Politik veya toplumsal kavga çıkaran cevap.
- Herkese aynı tona benzeyen cevap.

## Büyüme Ritmi

İlk hedef kalite:

- 30 gün boyunca Türkçe positioning otursun.
- Her hafta en iyi 10 tweet ve en kötü 10 tweet elle incelensin.
- Takipçi sayısı kadar doğru insanın gelmesi önemli.
- Türk girişimci ağındaki hesaplara düzenli ama saygılı cevap verilsin.

İkinci hedef hız:

- Mavi tik sonrası görünürlük artarsa günde 4-5 kaliteli post korunur.
- En iyi çalışan pillar iki katına çıkarılır.
- Kötü çalışan formatlar kesilir.

## Ölçüm

Haftalık bakılacak metrikler:

- Profil ziyaretinden takipçiye dönüşüm.
- Türkçe tweet başına reply sayısı.
- Kaydetmeye/paylaşmaya değer post sayısı.
- Yeni girişimci bağlantıları.
- Tekrarlı hook oranı.
- Negatif/yanlış anlaşılma riski taşıyan tweet sayısı.

## Operasyon Notu

Hesap yönetimi X'in normal web veya mobil arayuzunden elle yapilir. Bu repoda oturum bilgisi, API anahtari, otomatik tweet, otomatik silme ya da GitHub Actions ile X islemi bulunmaz.

## Manuel Temizlik Akisi

1. Profildeki postlar ve reply'lar tek tek gozden gecirilir.
2. Repostlara dokunulmaz.
3. Saldirgan, siyasi, baglamsiz, tekrar eden veya profil yonuyle uyusmayan icerikler silinir.
4. Saklanacak postlar netlesmeden toplu karar verilmez.
