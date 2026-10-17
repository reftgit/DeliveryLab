# DeliveryLab — Doğrulanmış proje durumu

Son kayıt tarihi: 2026-10-17 (Europe/Istanbul).

## Aşama ve mevcut hedef

- Aşama: Faz 1B adres/sepet doğruluğu düzeltmeleri ve saha denemesi hazırlığı
  uygulandı; yerel kontroller geçti. Gerçek saha denemesi henüz yapılmadı.
- Mevcut hedef: iki gerçek kullanıcı gözlemiyle manuel saha doğrulamasına hazır
  olmak. Canlı entegrasyon izin/kapsam engelleri nedeniyle kurulmadı.
- React/TypeScript/Vite uygulaması, LocalStorage, JSON aktarımı ve otomatik
  testler mevcut. Backend, CI/deploy, hesap bağlama veya sipariş/ödeme yok.

| Kabul alanı | Durum | Kanıt / sınır |
| --- | --- | --- |
| LOCAL_APP | PASS | Temiz kurulum, build, localhost HTTP 200, masaüstü/dar ekran akışları |
| LIVE_DISCOVERY | BLOCKED | İki sağlayıcıdan aynı adres için yetkili gerçek keşif yapılmadı |
| LIVE_COMPARISON | BLOCKED | İki sağlayıcıdan karşılaştırılabilir canlı sepet alınmadı |
| MANUAL_COMPARISON | PASS | Manuel giriş ve matematiksel akış sentetik QA girdileriyle geçti; iki gerçek gözlemle saha kontrolü NOT RUN |
| ORDERING | NOT RUN | Kullanıcı talebiyle gerçek sipariş ve ödeme kapsam dışı |
| MANUAL FIELD CHECK | NOT RUN | Gerçek kullanıcı gözlemi sunulmadı; pilot şablonu boş |
| AUTOMATED ACCESS FEASIBILITY | BLOCKED | Faz 1 izin/kapsam engelleri çözülmedi; manuel testler bunu değiştirmez |

## Kurulum geçmişi ve ilgili Git kayıtları

- Depo kökü: `DeliveryLab`; Git kurulumdan önce zaten başlatılmıştı.
- Başlangıç dalı: `main`; başlangıç HEAD'i/commit'i yoktu (unborn branch).
- İlk çalışma ağacı boştu; önceki kullanıcı değişikliği, proje belgesi veya
  korunacak mevcut agent yönergesi bulunmadı.
- Çalışma sırasında `.vscode/settings.json` izlenmeyen dosya olarak belirdi.
  Kurulumun parçası değildir; değiştirilmez ve kurulum commit'ine alınmaz.
- Mevcut remote: `origin` → `https://github.com/reftgit/DeliveryLab.git`.
- Mevcut takip ayarları: `branch.main.remote=origin`,
  `branch.main.merge=refs/heads/main`.
- Kurulum öncesi yetkili ağ erişimiyle `git ls-remote --symref origin` başarılı
  oldu ve hiç ref döndürmedi. `origin/main` henüz oluşmamıştı.
- Kurulum commit'i: `42a88c9222bd84b03a0a1e58ccf90d2bdbdcd1f2`
  (`docs: bootstrap shared agent development workflow`); yalnızca dört belgeyi ekler.
- Bu commit sonrasındaki durum kaydı, kurulum hash'ini ve tamamlanmış yerel
  doğrulamayı saklar. Bu dosyanın en son commit'i için
  `git log -1 --format='%H %s' -- PROJECT_STATE.md` kullanılabilir.
- Bu bölümdeki başlangıç bilgileri tarihsel kayıttır. Güncel commit ve teslim
  durumunu `git log --oneline`, `git status --short --branch` ve upstream ile
  karşılaştır; henüz yapılmamış commit/push'u gerçekleşmiş sayma.

Faz 1 başlangıcı: `78cf046f7b2f01e7d75a529be4e55c854acd833b`, `main`,
`origin/main` ile 0/0 ayrışma; yalnız `.vscode/` izlenmiyordu. Önceki agentin
devir hash'i gerçek Git ile eşleşti. `AGENTS.md` ve `CLAUDE.md` değişmedi.
`.vscode/settings.json` başlangıç ve doğrulama SHA-256 değeri aynı:
`3f3e7a04f09d43381ca8b655d8c5930ba900ee7d9fd82f4801f8bb007e9bdf54`.

Faz 1 uygulama commit'i: `63ac8ea856e7e114423d8eb68667fa06b3122fcf`
(`feat: add local manual delivery comparison prototype`). Uygulama, testler,
erişim raporu ve ilgili proje belgeleri aynı doğrulanmış birimde yer alır.
Sonraki belge commit'i bu referansı kaydeder; güncel HEAD/push durumunu Git'ten
kontrol edin. `.vscode/`, test çıktıları ve kişisel kayıtlar commit'e alınmadı.

Faz 1B başlangıcı: `d88a0feaa77a4e3c4e6483acb8c24849ff6bf410`, `main`.
`git fetch origin` sonrası HEAD, `origin/main` ve upstream aynıydı (0/0).
Yalnız `.vscode/` izlenmiyordu; başlangıç SHA-256 değeri yukarıdakiyle aynıydı.
Bu görevde `AGENTS.md`, `CLAUDE.md`, bağımlılıklar ve canlı erişim raporu korunur.

## Mevcut içerik

- `AGENTS.md`: başlangıç okuma sırası, kapsam ve doğrulama disiplini, kalıcı bilgi,
  otomatik commit, koşullu otomatik push, yasak işlemler ve Türkçe tek blok rapor.
- `CLAUDE.md`: bağımsız `@AGENTS.md` importu ve asgari Claude Code giriş yönergesi.
- `PROJECT_STATE.md`: gerçek durum, kanıtlar, eksikler ve sonraki iş.
- `PROJECT_CONTEXT.md`: onaylanan süreç, ürün kapsamı, teknik gerekçeler ve ertelemeler.
- `src/App.tsx`, `src/components/`, `src/styles.css`: Türkçe responsive arayüz;
  adres/isteğe bağlı konum, hedef sepet, manuel gözlem formu, arama/platform
  filtresi, birleşik şube listesi, karşılaştırma ve resmî platform bağlantıları.
- `src/domain/`: kuruş hesabı, indirim/minimum/eksik ücret/toplam kontrolü,
  şube onayı ve geri alma, adres/sepet revizyonları, 30 dakika eskime,
  kaynak ayrımı, yerel adapterler ve bir sağlayıcı hatasında diğerini koruma.
- Başlangıç boş; DEMO yalnız açık eylemle açılır, sentetiktir, bellekte ayrı
  tutulur ve manuel JSON'a girmez. Çalışan LIVE adapter yok.
- Sürümlü katı JSON doğrulaması; 1 MB/500 gözlem sınırı; değiştirmeden önce
  kullanıcı kontrolü; hatalı dosyada eski kayıtların korunması. Bozuk/dolu
  LocalStorage görünür uyarı verir, bozuk içerik sessizce ezilmez.
- `package.json`, lockfile ve Vite/TypeScript/Playwright ayarları: yerel çalıştırma,
  build ve testler. `.gitignore` runtime çıktıları ve özel dışa aktarımı dışlar.
- `README.md`: kurulum/kullanım/test komutları ve kayıt sınırlamaları.
- `docs/FEASIBILITY.md`: tarihli, kaynaklı platform erişim değerlendirmesi.
- `docs/PILOT_TEST.md`: gerçek gözlemler için uygulanabilir adımlar, boş kontrol
  şablonu; manuel saha kontrolü ile otomatik erişim fizibilitesinin ayrı sonuçları.

## Faz 1B düzeltmeleri ve doğrulama kanıtları

Başlangıç kodunda keşif tüm adres kayıtlarını grupluyor, adres/sepet her kayıtta
yeni UUID alıyordu. Bu iki davranış düzeltildi:

- `model.ts` içindeki ortak adres/bağlam eşitliği hem `evaluateQuote` hem
  `context.ts` adres ayrımında kullanılır: kimlik ve anlamlı alanlar birlikte
  eşleşir. Adres etiketi biçim farkları normalize edilir; koordinat farkı için
  tolerans uygulanmaz. Gerçek değişimde yeni kimlik, değişiklik yoksa eski kimlik.
- Sepet kimliği mevcut `basketSignature` ile korunur: ürün/porsiyon/seçenek/adet
  aynıysa satır sırası ve eşdeğer adet gruplaması geçersizleşme yaratmaz. Gerçek
  değişim ve A → B → A dönüşü yeni kimlik oluşturur, eski teklif canlanmaz.
- Ana keşif ve karşılaştırma seçimi yalnız mevcut adresin gözlemlerini alır.
  Adres değişince seçim temizlenir; eski kayıtlar ayrı, salt okunur geçmişte
  kaynak/adres/koordinat/zaman/ürün/ücret/indirim ayrıntılarıyla görünür. Geçmişten
  kazanan üretilemez. Tek platformlu şube ve şube onayı/geri alma korunur.
- Aynı adresin süresi geçen veya eski sepete ait gözlemi keşifte kalır; geçersizlik
  nedenleri ve kazanan engeli korunur. 30 dakika sınırı ve gözlem zamanı değişmedi.
- JSON sürüm 1 ve LocalStorage anahtarı değişmedi; veri göçü veya kayıt silme yok.
  MANUAL geçmişi dışa aktarılır; DEMO yalnız ayrı bellekte kalır.

Ortam: macOS, Node.js 26.8.1, npm 11.19.0; Vitest 5.0.5,
Playwright 1.64.1, kurulu Google Chrome'un ayrı geçici test profilleri.

- PASS — `npm ci`: lockfile ile temiz kurulum; 0 güvenlik açığı. Opsiyonel
  `fsevents` install-script onayı uyarısı görüldü; güvenlik ayarı değiştirilmedi.
- PASS — `npm test`: **83/83** (önceki 66 + 17 yeni bağlam/geçmiş testi).
  Aynı kaydı koruma, etiket/iki koordinat değişimi ve ekleme/kaldırma, A → B → A,
  aynı kimlikle farklı içerik, adres geçmişi/eskime ayrımı, şube gruplama,
  kayıpsız JSON, sepet sırası/adet gruplama ve dört ürün alanı değişimi doğrulandı.
- PASS — `npm run build`: TypeScript + Vite; JS 260.32 kB (gzip 80.65 kB),
  CSS 17.31 kB (gzip 4.56 kB).
- PASS — `npm run test:e2e`: **32/32**, 23.8 saniye; 16 senaryo × masaüstü
  1365×1000 ve dar ekran 375×812. Önceki dokuz akış korunup yeni davranışlara
  göre genişletildi; yedi akış eklendi. Aktif/geçmiş ayrımı, kalıcılık, A → B → A,
  aynı kaydın kimliği/kazananı koruması, koordinat ve dört sepet alanı değişimi,
  iki ürün sırası, MANUAL/DEMO geçmiş izolasyonu, tek platformlu kayıt doğrulandı.
- PASS — E2E JSON turunda 2 geçmiş + 1 mevcut gözlem ve şube eşleştirmesi,
  tarayıcıdaki test alanı boşaltıldıktan sonra dışa aktarılan dosyadan eksiksiz
  geri alındı; tüm nesne eşitliği kontrol edildi. Bozuk dosya mevcut veriyi korudu.
- PASS — E2E masaüstü ve dar ekran geçmiş ekran görüntüleri incelendi; yerleşim
  okunabilir, genişlik taşması yok. Görüntüler `test-results/` altında, Git dışında.
  Bu gerçek mobil cihaz testi değildir. Tüm girdiler sentetik QA verisidir.
- PASS — `git diff --check`, 10 yerel belge bağlantısının hedef kontrolü;
  `.vscode/settings.json` SHA-256 değeri başlangıçla aynı. Agent protokolü,
  `docs/FEASIBILITY.md`, `package.json` ve lockfile değişmedi. Test sunucuları
  kapandı; 5173 ve 4173 portlarında dinleyici kalmadı.

Faz 1B testlerinde başarısız sonuç oluşmadı. Canlı API veya yeni platform
araştırması/çağrısı yapılmadı; aşağıdaki Faz 1 erişim bulguları yeniden
doğrulanmış yeni araştırma olarak sunulmuyor.

## Faz 1 doğrulama kanıtları

Ortam: macOS, Node.js 26.8.1, npm 11.19.0; Vitest 5.0.5,
Playwright 1.64.1 ve kurulu Google Chrome'un geçici test profilleri.

- PASS — `npm install --no-fund`, ardından `npm ci --no-fund`: lockfile ile temiz
  kurulum tamamlandı; npm denetimi 0 güvenlik açığı bildirdi. Opsiyonel `fsevents`
  install-script onayı uyarısı görüldü; güvenlik ayarı değiştirilmedi.
- PASS — `npm test`: **66/66**. Para, indirim/minimum, eksik ücret, şube kimliği,
  kaynak ayrımı, eski/gelecek teklif, adres/sepet revizyonu, sağlayıcı hata
  izolasyonu, URL ve JSON/tarih/boyut doğrulaması.
- PASS — `npm run build`: TypeScript kontrolü ve Vite build. Son ölçüm:
  JS 256.61 kB (gzip 79.95 kB), CSS 17.08 kB (gzip 4.51 kB).
- PASS — `npm run test:e2e`: **18/18**, 12.1 saniye. 9 akış × masaüstü
  1365×1000 ve dar ekran 375×812. Boş başlangıç/demo, arama/filtre, manuel
  karşılaştırma, eşleştirme/geri alma, yeniden açmada kalıcılık, adres değişimi,
  eksik ücret, JSON aktarımı, bozuk depolama, konum reddi, otomatik dış HTTP
  isteği olmaması, açık ekranda eskime ve adres kaydında kaydedilmemiş sepet
  taslağının korunması doğrulandı.
- PASS — `npm run preview`: `http://127.0.0.1:4173/` HTTP 200. Derlenmiş uygulama
  ayrı Chrome oturumunda açıldı; boş başlangıç ve demo karşılaştırması çalıştı;
  iki ekran boyutunda screenshot incelendi, yatay taşma ve pageerror görülmedi.
- PASS — `git diff --check`; kullanıcı `.vscode/settings.json` hash'i korundu.
- İlk build CSS modül tip bildirimi eksikliğinden başarısızdı; `vite/client`
  bildirimi eklendi. İlk E2E turunda select/status seçicileri, sonraki turda saat
  simülasyonunun kurulum sırası düzeltildi. İncelemede adres kaydının sepet
  taslağını sıfırlayabilmesi giderildi ve regresyon testi eklendi. Son tam test
  turunda hata kalmadı.

Kurulumun tarihsel belge doğrulamaları `42a88c9` / `78cf046` commitlerindedir;
uygulamanın olmadığına ilişkin eski kayıtlar yalnız o aşama için geçerlidir.

## Canlı erişim bulguları

İnternet üzerinden resmî belgeler okunabildi. Yemeksepeti'nin verilen API'si
işletme katalog/gelen sipariş yönetimi için; genel tüketici keşfi kanıtı değil.
Uber Consumer Delivery erişimi başvuru/izin gerektiriyor; rakip verileriyle
birleştirme için yazılı izin ve Türkiye API kapsamı doğrulanmadı. Yetki veya test
kimliği bulunmadığından tüketici sorgusu yapılmadı. Detaylar ve kaynaklar
[FEASIBILITY.md](docs/FEASIBILITY.md) içinde. Ücretli hizmet veya alternatif
sağlayıcı kullanılmadı.

## Doğrulanmayan davranışlar

- NOT RUN — kullanıcıdan sağlanan iki gerçek platform gözlemiyle saha kontrolü;
  testte MANUAL etiketli veriler de açıkça sentetik girdilerdir.
- BLOCKED — izinli canlı keşif, canlı fiyat/ücret teklifi, Türkiye tüketici API kapsamı.
- NOT RUN — gerçek mobil cihaz/Safari/Firefox, gerçek kullanıcı GPS'i ve OS izin
  diyaloğu. Konum reddi tarayıcı testi kontrollü bir mock kullanır.
- NOT RUN — gerçek sipariş/ödeme, hesap bağlama, internet yayını; kapsam dışı.
- Ayrı lint komutu eklenmedi; TypeScript kontrolü build içinde çalıştırıldı.
- NOT RUN — yeni Codex/Claude Code oturumunun bu dosyaları otomatik yüklemesi.
  Dosya/import incelemesi, gerçek agent yüklemesinin kanıtı değildir.
- Ortamda `codex` ve `claude` çalıştırılabilir dosyaları bulundu; bu bulgu oturum
  açıldığını veya yönergelerin yüklendiğini göstermez.

## Hatalar, riskler ve dış engeller

- Son kontrollerde bilinen engelleyici uygulama hatası yok; bu tüm cihazlarda
  hatasız çalışma garantisi değildir.
- Canlı veri/yan yana gösterim yetkisi yok. Manuel beyanlar sağlayıcı doğrulaması
  veya bir adrese teslimat garantisi değildir.
- Adres doğruluğu girilen etiket/koordinatlarla sınırlıdır; kullanıcı platformda
  gerçek adresi değiştirip yerel alanları değiştirmezse uygulama bunu bilemez.
  Önceki Faz 1'in ürettiği farklı revizyonlar otomatik birleştirilmez; eski
  teklifleri yeniden güncel saymak yerine geçmişte korumak bilinçli tercihtir.
- Farklı platform ürün adları otomatik eşdeğer sayılmaz; şube eşleştirmesi kullanıcı
  beyanıdır. Karmaşık kampanyalar ve ürün toplamını aşan indirimler desteklenmez.
- LocalStorage tarayıcıya/origin'e bağlıdır, şifreli kasa veya yedek değildir;
  çok sekmeli eşzamanlı düzenleme için çatışma çözümü yok. JSON kişisel bağlam içerebilir.
- Git ağ işlemleri bu ortamda ek izin gerektirebilir; yerel kurallar ortam
  kısıtlarını aşmaz. Remote/upstream ayarı eksik değil.
- Bağımsız agent yükleme doğrulaması açık; diğer agentin talimatları okuduğu
  varsayılmamalı.

## Manuel işler, öncelik ve önerilen sonraki görev

Önerilen tek sonraki görev: [PILOT_TEST.md](docs/PILOT_TEST.md) adımlarıyla aynı
adres, fiziksel şube ve aynı sepet için kullanıcının iki platformda gördüğü gerçek
bilgileri MANUAL olarak kaydedip kontrollü saha doğrulaması yapmak. Kabul ölçütleri:
fiyat/ücret/indirim/minimum koşulları ve zaman
kaydedilmiş; kaynak toplamları hesapla eşleşmiş; farklı veya eksik sepetler kazanan
üretmemiş; adres geçmişi ve JSON kayıtları korunmuş; kişisel kayıt Git'e girmemiş;
gerçek sipariş verilmemiş. Sonuç MANUAL FIELD CHECK olarak kaydedilir;
AUTOMATED ACCESS FEASIBILITY kendiliğinden PASS olmaz.

Canlı entegrasyon ayrıca sağlayıcı yetkileri ve açık karşılaştırma izni gerektirir.
Kurulum: `npm ci`, `npm run dev`, `http://127.0.0.1:5173/`. Görev sonrası QA
sunucuları kapatılır; sonraki oturum bu komutla başlatır. Faz 2'ye geçilmez.
