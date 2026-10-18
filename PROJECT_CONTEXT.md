# DeliveryLab — Kararlar ve gelecek planları

Son kayıt tarihi: 2026-10-18 (Europe/Istanbul).

Bu belge kararları ve planları saklar. Gerçek implementasyon ve doğrulama durumu
`PROJECT_STATE.md` içindedir; aşağıdaki planlar tamamlanmış özellikler değildir.

## Ürün vizyonu ve hedefler

Ürün kapsamının kaynağı, kullanıcının 2026-10-17 tarihinde verdiği “Faz 1 — İlk
çalışan fizibilite prototipi” görevidir. DeliveryLab kesinleşmiş ticari ürün
değildir; Türkiye'deki yemek teslimat platformlarını tek arayüzde birleştirme
fikrini para harcamadan araştıran yerel prototiptir.

- Sorun: aynı adrese teslimat yapan restoranlar, aynı şubenin ürün fiyatları,
  kampanyaları ve zorunlu ücretleri platforma göre değişebilir.
- Kullanıcı: evine/işine yemek isteyen, alternatif restoranları birlikte görmek
  veya aynı sipariş için uygun platformu bulmak isteyen kişi.
- Uzun vadeli vizyon: restoran/fast food/market keşfi, adres uygunluğu, nihai sepet
  karşılaştırması ve izinli olduğunda uygulama içinden sipariş. Bunlar tamamlanmış
  özellik veya ticari uygulanabilirlik kanıtı değildir.
- İlk platform: yerel çalışan responsive web; Türkiye restoran ve fast food.

## Faz 1 kapsamı ve kabul sınırları

- İki hedef kaynak: Yemeksepeti ve Türkiye'deki Uber Eats Trendyol Go.
  `trendyol-go` tek sağlayıcıdır; Uber Eats ayrı üçüncü kaynak sayılmaz.
- Önce resmî veri erişimi araştırması; erişim yoksa engelleri kaydederek manuel
  gözlemlerle kullanılabilir uygulama. [Erişim değerlendirmesi](docs/FEASIBILITY.md).
- Birleşik liste yalnız ortak şubelerden oluşmaz; tek kaynakta gözlenenler de
  gösterilir. Şüpheli şubeler ayrı kalır, manuel eşleştirme geri alınabilir.
- Aynı şube, adres bağlamı, ürün/porsiyon/seçenek/adet üzerinden karşılaştırma.
  Bilinmeyen ücret sıfır sayılmaz; tek geçerli tekliften kazanan çıkarılmaz.
- Resmî bağlantı açılır; desteklenmeyen sepet aktarımı varmış gibi gösterilmez.
- LIVE, MANUAL, DEMO açıkça ayrılır. İlk açılış boş; demo isteğe bağlıdır.
  Manuel veya demo testler LIVE_DISCOVERY/LIVE_COMPARISON için PASS sayılmaz.
- Faz 1C: restoran keşfi ile sepet fiyatı bağımsız tutulur. Kullanıcı yemek
  seçmeden, fiyat/ücret bilmeden bir adreste gördüğü restoranı MANUAL kaydedebilir.
  Aynı şubenin iki kayıt türü aynı kartta görünür; keşif hiçbir fiyat hesabına
  girmez. Diğer platformda kayıt yoksa sonuç “Doğrulanmadı”dır, yokluk iddiası değildir.

## Maliyet, veri ve güvenlik sınırları

- Ek ücret, ücretli API/proxy/scraping/CAPTCHA hizmeti, kiralık sunucu/bulut veya
  kart isteyen deneme hesabı yok. Ücretsiz yerel geliştirme bağımlılıkları serbest.
- Hesap açma, sözleşme kabul etme, gerçek ödeme/sipariş ve internet yayını yok.
- Başka uygulamaların parolaları/oturum çerezleri okunmaz; giriş, CAPTCHA ve hız
  sınırı aşılmaz. Yetkisiz özel API taklit edilmez, şartlara aykırı veri toplanmaz.
- Sunucular varsayılan olarak localhost'ta çalışır. Kişisel adres/gözlem dosyaları
  Git'e girmez. Tarayıcı konumu yalnız açık kullanıcı eylemi ve izniyle alınır.
- İzin eksikliği teknik imkânsızlık gibi raporlanmaz; izinli gerçek erişim olmadan
  başarılı entegrasyon veya tüketici teslimat uygunluğu iddiası kurulmaz.

## Onaylanan çalışma kararları ve gerekçeleri

Kullanıcının uygulanmasını istediği “Tek seferlik kurulum promptu — Geliştirici
Agent.txt” belgesi aşağıdaki süreç kararlarının kaynağıdır:

- Codex ve Claude Code aynı depoda farklı zamanlarda çalışabilir. Devamlılık
  sohbet hafızası yerine Git, kaynak dosyalar ve kalıcı belgelerle sağlanır.
- Ortak kurallar `AGENTS.md` içinde tutulur; `CLAUDE.md` bu dosyayı import eder.
  Böylece iki ayrı ve zamanla çelişebilecek ortak kural kopyası oluşmaz.
- Gerçek durum `PROJECT_STATE.md`, karar gerekçeleri ve gelecek planları
  `PROJECT_CONTEXT.md` içinde tutulur; plan ile doğrulanmış iş birbirine karışmaz.
- Agent A uygulayıcıdır; Agent B dış değerlendiricidir. Kullanıcı Türkçe tek
  blok raporu ve sonraki tam uygulama promptunu aralarında taşır. Değerlendiricinin
  depo erişimi veya otomatik kontrolü varsayılmaz.
- Anlamlı doğrulanmış işler otomatik commit edilir; başarılı görev sonunda
  yapılandırılmış upstream'e koşulları sağlayan normal push yetkilidir.
  Ayrıntılar ve güvenlik sınırları `AGENTS.md` içindedir.
- İlk kurulum görevi yalnızca protokolü oluşturdu; `/init` çalıştırılmadı.
  Faz 1 kullanıcı tarafından ayrıca yetkilendirildi. Mevcut Git remote'u korunur.

## Ürüne ilişkin teknik kararlar ve gerekçeler

Kullanıcının tercih ettiği React + TypeScript + Vite başlangıcı benimsendi.
LocalStorage ve JSON taşınabilirliği backend ihtiyacını kaldırır; izinli canlı
entegrasyon olmadığı için backend, veritabanı veya kimlik doğrulama eklenmez.
Bağımlılıklar lockfile ile sabitlenir. Vitest saf hesaplama/şema modüllerini,
Playwright geçici Chrome profillerinde temel kullanıcı akışlarını doğrular.

Uygulama tercihleri (ürün gereksinimi değil, Faz 1 uygulama politikası):

- Para kuruş tam sayısıdır. Türkçe virgül/nokta ondalık kabul edilir; binlik
  ayırıcı, negatif ve kesirli kuruş reddedilir.
- Faz 1B kararı: hedef adres/sepet yalnız anlamlı değişimde yeni kimlik alır.
  Adreste etiketin NFC/büyük-küçük harf/boşluk biçimi farkları yok sayılır;
  koordinatlar tam değerleriyle karşılaştırılır (yuvarlama/tolerans yok).
  Koordinat ekleme/kaldırma da değişimdir. Sepette mevcut kanonik ürün,
  porsiyon, seçenek ve toplam adet karşılaştırması kullanılır; satır sırası ve
  eşdeğer ürünlerin ayrı/birleşik satırlara yazılması kimliği değiştirmez.
- Kimlik yalnız mevcut bağlamla karşılaştırılarak korunur. Adres/sepet A → B → A
  değişiminde eski kimlik geri getirilmez. Gözlem adresi hem kimlik hem içerikle
  denetlenir; içe aktarımda aynı kimlikle farklı içerik de güncel sayılmaz.
- Keşif ve seçilebilir karşılaştırma yalnız mevcut adres bağlamının kayıtlarını
  kullanır. Diğer adres gözlemleri aynı JSON/LocalStorage içinde silinmeden
  tutulur; ayrı, salt okunur “Geçmiş adres gözlemleri” bölümünden incelenir.
  Kaynak izolasyonu ve kullanıcı şube eşleştirmeleri korunur. Şube onayı fiziksel
  şube içindir; başka adreste teslimat veya fiyat geçerliliği onayı değildir.
- Adres geçmişi fiyat eskimesinden ayrıdır: aynı adresin 30 dakikayı geçen veya
  eski sepeti kullanan gözlemi keşifte kalır, karşılaştırma nedenini gösterir ve
  kazanan olamaz. Değişikliksiz kaydetmek gözlem zamanını yenilemez. 30 dakika
  sağlayıcı garantisi değil muhafazakâr laboratuvar eşiğidir.
- Şube kimliği kaynak/platform/restoran/şube bileşimidir. Platformlar arası
  isimden otomatik eşleştirme yok; açık kullanıcı onayı gerekir.
- Keşif kaydı yalnız MANUAL; platform/restoran/fiziksel şube/adres/bağlantı/zaman
  taşır. Listelenme ile ayrıca teslimat doğrulaması ayrıdır. İkincisi ek teslimat
  gözleminin kısa açıklamasını gerektirir; bu yine kullanıcı beyanıdır. Fiyat veya
  sepet kimliği içermez; sepet değişimi keşfi etkilemez. Her iki kayıt türünde
  adres revizyonu ve 30 dakika eskime uygulanır. Fiyat ve keşif için ayrı, basit
  geçmiş bölümleri kullanılır; eski kayıtlar otomatik canlandırılmaz.
- Fiyatsız şube eşleştirmesi de açık onay ve geri alma ister. Eşleştirme iki
  kayıt türünün ortak şube kimliğine bağlıdır; bir türde kayıt silinip diğerinde
  aynı şube kalırsa onay korunur. Onay, başka adrese teslimat kanıtı değildir.
- Minimum koşulun indirim öncesi/sonrası temeli ayrı tutulur. İndirim uygunluğu
  belirsizse karşılaştırma engellenir; ürün toplamını aşan indirim desteklenmez.
- İçe aktarılan LIVE/DEMO iddiası kabul edilmez; yalnız MANUAL kayıt taşınabilir.
  Faz 1C ile JSON v2 ve `deliverylab.workspace.v2` kullanılır. Geçerli v1 içeriği
  bütün fiyatları/bağlamları/onayları koruyarak ve boş keşif listesiyle okunur.
  İlk başarılı kayıtta v2 yazılır; v1 anahtarı silinmez. v2 varken bozulursa eski
  v1'e sessiz geri dönüş yapılmaz. İçe aktarma v1/v2, dışa aktarma yalnız v2;
  katı şema, toplam 1 MB/500 kayıt sınırı ve değiştirmeden önce onay korunur.
- Çalışan LIVE adapter yok; iki platformun mevcut kayıtları için gerçek yerel
  adapterler ve hata izolasyonu vardır. Üçüncü sağlayıcı araştırılmadı/eklenmedi.

## Faz 1D otomatik test kararı ve gerekçeleri

Faz 1D ile kullanıcı bilgisayarından bağımsız sentetik testler için GitHub
Actions onaylandı ve `.github/workflows/ci.yml` eklendi. Bu, uygulama hosting'i
veya canlı sağlayıcı erişimi kararı değildir. Doğrulanmış koşumlar ve eksikler
`PROJECT_STATE.md` içinde tutulur.

- Her `main` push'u ve elle `workflow_dispatch` aynı tam test dizisini çalıştırır.
  Standart GitHub-hosted `ubuntu-24.04` kullanılır; herkese açık depoda ücretsizdir.
  Ücretli/büyük/self-hosted runner, üçüncü taraf test servisi veya deploy yoktur.
- Node.js 24 LTS, mevcut `engines` aralığını karşılar. `npm ci` lockfile'ı kullanır;
  ardından birim testleri, TypeScript/build ve iki viewport'ta Chrome E2E koşar.
  Chrome ile sistem bağımlılıkları Playwright CLI üzerinden kurulur.
- Testler ve 2 worker davranışı korunur. CI'da `.only` yasaktır ve önceden açık
  sunucu tekrar kullanılmaz; yanlış uygulamanın test edilmesi engellenir.
  HTML raporu yalnız CI'da üretilir; retry eklenmez veya hata maskelenmez.
- GitHub action sürümleri commit SHA'sına sabitlenir; token izni `contents: read`,
  checkout kimlik bilgisini kalıcı bırakmaz. Özel secret veya kullanıcı verisi
  enjekte edilmez. Testler yalnız sentetik veri ve geçici profiller kullanır;
  mevcut localhost dışı sayfa HTTP engeli korunur.
- Yalnız E2E hatasında HTML raporu ve içindeki hata screenshot/trace ekleri
  7 gün saklanır. Başarılı ekran görüntüleri, JSON dışa aktarımları, çalışma alanı
  ve build artifact olarak yüklenmez. Cache kapalıdır; gereksiz saklama önlenir.
  İş 15 dakika ile sınırlıdır; aynı dalın yeni koşumu eskisini iptal eder.
- CI PASS yalnız GitHub'da ilgili commit'in tamamlanmış başarılı koşumuyla
  verilir. Bu sonuç gerçek cihaz, saha, canlı API veya sipariş kanıtı değildir.

## Planlanan ve kararlaştırılmış ama uygulanmamış işler

- Canlı keşif ve canlı fiyat karşılaştırması hedefi izin ve Türkiye API kapsamı
  doğrulaması gerektirir; tamamlanmış entegrasyon değildir.
- Gerçek iki platform gözlemiyle saha doğrulaması önerilen sonraki iştir.
  [Pilot talimatı ve boş şablon](docs/PILOT_TEST.md) kullanılacak; MANUAL FIELD
  CHECK başarısı AUTOMATED ACCESS FEASIBILITY sonucunu değiştirmeyecek.
- Ürünleştirme, ticari model, bütçe ve takvim henüz onaylanmış değildir.

## Ertelenen fikirler ve reddedilen seçenekler

Ertelenenler: native iOS/Android, uygulama mağazaları, üyelik, gerçek sipariş/ödeme,
kupon hesabı senkronizasyonu, otomatik platform girişi, market karşılaştırması,
birden fazla restorandan birleşik sepet, çoklu ödeme, bildirimler, abonelik/reklam
ve kapsamlı animasyon/görsel süsleme. Bu liste geliştirme yetkisi vermez.

Bu fazda backend, mikroservis, büyük veritabanı, Kubernetes, bulut ve AI API'si
gereksiz karmaşıklık/maliyet nedeniyle kullanılmaz. Yetkisiz scraping/API kullanımı
ise kullanıcının açık sınırlarına aykırıdır.
Süreçte yalnızca özel sohbet geçmişine dayanmak ve ortak politikayı iki ayrı
dosyada çoğaltmak, agentler arası devamlılık ve tutarlılık gereği tercih edilmiyor.

## Açık sorular, kısıtlar ve öncelikler

- Uber Consumer Delivery API Türkiye'deki aynı tüketici kataloğunu kapsıyor mu?
- Her iki sağlayıcı tüketici keşfi, sepet ücretleri ve rakiple karşılaştırmaya
  hangi yazılı izinler ve ücretsiz erişim koşullarıyla izin verebilir?
- Gerçek gözlemlerde minimum sepet/indirim temeli ve ürün eşdeğerliği ne kadar açık?

Öncelik doğrulanabilir küçük deneylerdir. Faz 2 kendiliğinden başlatılmaz. Gelecek
kararların onayı ve gerekçesi burada, doğrulanmış sonuçlar durum belgesinde tutulur.
