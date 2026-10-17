# DeliveryLab

Türkiye'de iki yemek platformunda görülen restoranları sepetsiz kaydeden ve
sepet fiyatlarını yerelde karşılaştıran Faz 1C fizibilite prototipi.
**Canlı sağlayıcı entegrasyonu yoktur.** Yemeksepeti ve
Uber Eats Trendyol Go tek arayüzde kullanıcı gözlemleriyle karşılaştırılır.
Erişim kanıtları ve engeller: [docs/FEASIBILITY.md](docs/FEASIBILITY.md).
Gerçek kullanıcı gözlemleriyle deneme adımları ve boş kontrol şablonu:
[docs/PILOT_TEST.md](docs/PILOT_TEST.md). Saha kontrolü henüz yapılmadı (NOT RUN);
manuel kontrolün başarısı otomatik platform erişimini doğrulamaz.

## Yerel kurulum

Node.js 22.12+ (veya 24+), npm ve güncel bir tarayıcı gerekir.

```sh
npm ci
npm run dev
```

Tarayıcıda **http://127.0.0.1:5173** açın. Vite yalnızca loopback üzerinde dinler;
port doluysa başka adrese geçmek yerine hata verir. Durdurmak için Ctrl+C.
Backend, hesap, API anahtarı, ücretli servis veya bulut gerekmiyor.

```sh
npm test
npm run build
npm run preview
```

Build `dist/` üretir. Preview **http://127.0.0.1:4173** adresinde yerel build'i
sunar; yayın/deploy yapmaz. `npm test` dış platformlara istek göndermeyen Vitest
testlerini çalıştırır; `npm run build` TypeScript kontrolünü de içerir.

## Tarayıcı testleri

```sh
npm run test:e2e
```

Playwright, makinede kurulu Google Chrome'u ayrı geçici profillerde kullanır;
kullanıcının profilini/çerezlerini okumaz. Chrome kurulu olmalıdır. Test sunucusu
gerektiğinde localhost:5173 üzerinde otomatik başlar ve test bitince kapanır.
Masaüstü 1365×1000 ve dar ekran 375×812 projeleri çalışır. Ekran görüntüsü ve
hata izleri Git'e alınmayan `test-results/` içindedir. Gerçek mobil cihaz testi
yerine tarayıcı viewport testi yapılır. E2E sırasında dış HTTP istekleri engellenir.

## Kullanım

1. İlk açılış boştur. Adres etiketini kaydedin; koordinat isteğe bağlıdır.
   “Konumumu kullan” yalnızca tıklandığında tarayıcı izni ister.
2. Yemek seçmediyseniz “Restoran gözlemi ekle”yi kullanın. Platform, restoran,
   fiziksel şube, bağlantı ve gözlem zamanını kaydedin. Sepet, ürün fiyatı veya
   teslimat ücreti gerekmez. “Bu adres için listelendi” teslimat doğrulaması
   değildir. Teslimatı ayrıca doğruladıysanız gördüğünüz ek bilgiyi kısaca yazın;
   bu açıklama da kullanıcı beyanıdır, sağlayıcı doğrulaması değildir.
3. Fiyat karşılaştırmak istediğinizde ürün, porsiyon, seçenek ve adetleri girip
   hedef sepeti kaydedin. Gördüğünüz sepeti “Sepet fiyatı gözlemi ekle” ile kaydedin.
   Fiyatlar TL girilir, kuruş tam sayısına çevrilir. Bilinmeyen ücretleri boş
   bırakın; yalnızca gerçekten sıfır olduğunu biliyorsanız 0 girin.
4. Fiyatlar olmadan da “Fiyat olmadan da şube eşleştirin” alanında iki platformun
   fiziksel şubesini kontrol edip açık onayla eşleştirebilirsiniz. Fiyat kayıtları
   aynı şube kartında görünür. Onay karttan geri alınabilir; isim benzerliği tek
   başına birleştirme yapmaz. Diğer platformun verisi yoksa “Doğrulanmadı” görünür;
   bu, restoranın o platformda bulunmadığı anlamına gelmez.
5. Eksiksiz, aynı bağlama ait ve en fazla 30 dakikalık gözlemler karşılaştırılır.
   Bunun için iki farklı platformun sepet fiyatı kaydını “Karşılaştır” ile seçin.
   “En ucuz” yalnızca bu iki fiyat kaydı için matematiksel sonuçtur. Yalnız keşif
   kaydı olan kart “Sepet fiyatı bulunmuyor” der ve kazanan üretemez.
6. Resmî bağlantı platformu açar; sepet aktarımı, sipariş veya ödeme yapılmaz.

Demo açıkça seçilerek açılır; restoran ve fiyatları sentetiktir, manuel kayıtlarla
karışmaz, kalıcı kaydedilmez ve canlı erişim hatasında otomatik açılmaz.

## Hesaplama ve kayıt kuralları

- Toplam = ürünler + teslimat + hizmet/diğer zorunlu ücretler − uygun indirimler.
- İndirim uygunluğu bilinmiyorsa sonuç karşılaştırmaya alınmaz. Aynı indirim
  kimliği iki kez uygulanmaz. Faz 1, indirimi ürün toplamıyla sınırlar; bunu aşan
  karmaşık teslimat/ürün kampanyası yeniden kontrol gerektirir.
- Minimum sepetin indirim öncesi/sonrası temeli bilinmiyorsa karşılaştırma engellenir.
  Koşul olmadığını biliyorsanız minimum tutarı 0 girin.
- Kaynakta görülen nihai toplam isteğe bağlıdır; girilmişse hesapla tam kuruş
  eşleşmesi gerekir. Bilinmeyen ücret bu toplamla örtülü olarak tamamlanmaz.
- Aynı adres veya aynı içerikteki sepet yeniden kaydedilince kimlik korunur;
  gözlem zamanı ve 30 dakika sınırı değişmez. Adres etiketinde büyük/küçük harf,
  Unicode ve boşluk biçimi farkları yok sayılır; koordinatlar tam değerleriyle
  karşılaştırılır. Sepette satır sırası önemsizdir; aynı ürün satırlarının adetleri
  toplanır, ürün/porsiyon/seçenek içerikleri ve toplam adet eşleşmelidir.
- Restoran keşfi belirli bir sepete bağlı değildir; sepet değişiminde korunur.
  Keşif gözlemi de 30 dakika sonra eski sayılır; teslimat/listelenme yeniden
  kontrol edilmelidir. Eski kayıt güncel teslimat veya fiyat garantisi değildir.
- Gerçek adres/koordinat veya sepet değişiminde yeni kimlik oluşur. Önceki içeriğe
  dönmek eski teklifi canlandırmaz. Keşif yalnız mevcut adres bağlamını gösterir;
  diğer adreslerin fiyat kayıtları “Geçmiş adres gözlemleri”, sepetsiz kayıtları
  “Geçmiş restoran keşifleri” içinde silinmeden ve salt okunur saklanır;
  karşılaştırmaya alınmaz. Aynı adresin eskimiş veya farklı
  sepetli kayıtları keşifte kalır, gerekçeleri görünür ve kazanan olamaz.
- Şubeler ad benzerliğiyle birleştirilmez. Kayıt bulunmaması, platformda restoran
  bulunmadığı iddiası oluşturmaz. Arama ve platform filtresi yalnız yerel kayıtları tarar.

## Verinin saklanması ve JSON

MANUAL çalışma alanının JSON sürümü **2**; LocalStorage anahtarı
`deliverylab.workspace.v2`'dir. v2 yoksa geçerli `deliverylab.workspace.v1`
kayıtları okunur; fiyatlar, bağlamlar ve şube eşleştirmeleri aynen korunur,
keşif listesi boş başlar. Okuma depolamayı değiştirmez. İlk başarılı kayıtta v2
yazılır, eski v1 anahtarı yedek olarak bırakılır. v2 varsa önceliklidir;
bozuksa v1'e sessizce dönülmez. Eski uygulama sürümleri v2'yi okuyamaz.

Veriler sunucuya gönderilmez; aynı tarayıcı/origin altında kalır.
Yerel depolama şifreli kasa değildir. Depolama hatası görünür şekilde bildirilir;
bozuk kayıt sessizce ezilmez, yeni veriler oturumda kalır ve dışa aktarılabilir.

JSON dışa aktarımı adres ve gözlemleri içerir; kişisel dosyaları Git'e koymayın.
`local-data/` ve `deliverylab-export*.json` Git dışında tutulur. İçe aktarma en fazla
1 MB / toplam 500 fiyat ve keşif kaydı kabul eder; önizleme ve açık değiştirme
eylemi gerektirir. Geçerli v1 ve v2 JSON okunur; dışa aktarım her zaman v2'dir.
Geçersiz JSON, beklenmeyen alan, yanlış tür, çelişen eşleşme, uygun olmayan kaynak
URL'si veya LIVE/DEMO etiketi reddedilir. Hata mevcut kayıtları değiştirmez.
HTML metinleri React tarafından metin olarak işlenir; dış linkler resmî HTTPS
alan adlarıyla sınırlandırılmıştır.

## Kod düzeni

- `src/domain/model.ts`: türler, sağlayıcı kimlikleri ve kaynak URL sınırları.
- `src/domain/comparison.ts`: kuruş hesabı, koşullar, revizyon/yaş ve şube denetimi.
- `src/domain/context.ts`: anlamlı değişimde kimlik yenileme ve adres geçmişi ayrımı.
- `src/domain/discovery.ts`: keşif eskimesi ve iki kayıt türünde şube onayını koruyan silme.
- `src/domain/storage.ts`: katı sürümlü şema, içe/dışa aktarım doğrulaması.
- `src/domain/adapters.ts`: gerçek yerel kayıt adapterleri ve sağlayıcı hata izolasyonu.
- `src/domain/demo.ts`: yalnız açık demo için sentetik kayıtlar.
- `src/components/`: adres/sepet, gözlem formu ve karşılaştırma arayüzleri.
- `src/domain/*.test.ts`, `e2e/app.spec.ts`: çevrimdışı hesap ve tarayıcı akışları.

Ürün kararları [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), doğrulanmış sonuçlar
[PROJECT_STATE.md](PROJECT_STATE.md), ortak geliştirme protokolü
[AGENTS.md](AGENTS.md) içindedir. Sites yalnızca yerel geliştirme için kullanıldı;
hosting kaydı veya deploy oluşturulmadı.
