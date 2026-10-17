# DeliveryLab — Kararlar ve gelecek planları

Son kayıt tarihi: 2026-10-17 (Europe/Istanbul).

Bu belge kararları ve planları saklar. Gerçek implementasyon ve doğrulama durumu
`PROJECT_STATE.md` içindedir; aşağıdaki planlar tamamlanmış özellikler değildir.

## Ürün vizyonu ve hedefler

Ürün tanımı henüz sağlanmadı; bekleniyor. `DeliveryLab` mevcut depo adıdır ve tek
başına bir ürün alanı, teslimat iş modeli veya özellik kararı oluşturmaz.

- Çözülecek sorun ve başarı ölçütleri: belirlenmedi.
- Hedef kullanıcılar: belirlenmedi.
- Hedef platformlar: belirlenmedi.

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
- Bu ilk görev yalnızca protokol kurulumudur; `/init` veya uygulama geliştirme
  içermez. Mevcut Git remote'u korunur; yeni hedef uydurulmaz.

## Ürüne ilişkin teknik kararlar ve gerekçeler

Henüz onaylanmış dil, framework, veri tabanı, mimari, barındırma veya test aracı
kararı yok. Ürün gereksinimleri bilinmeden teknoloji seçilmedi.

## Planlanan ve kararlaştırılmış ama uygulanmamış işler

- Ürün gereksinimlerini kullanıcıdan alıp ilk sürüm kapsamını netleştirmek,
  önerilen sonraki iştir; tamamlanmış ürün planı değildir.
- Onaylanmış ama uygulanmamış uygulama özelliği bulunmuyor.
- Özellik listesi, yol haritası ve takvim ürün tanımı geldikten sonra kararlaştırılacak.

## Ertelenen fikirler ve reddedilen seçenekler

Ürün için henüz belgelenmiş ertelenen fikir veya reddedilen teknik alternatif yok.
Süreçte yalnızca özel sohbet geçmişine dayanmak ve ortak politikayı iki ayrı
dosyada çoğaltmak, agentler arası devamlılık ve tutarlılık gereği tercih edilmiyor.

## Açık sorular, kısıtlar ve öncelikler

- Ürün hangi sorunu, kim için çözecek; ilk sürümün temel akışları neler?
- Web, mobil, masaüstü veya başka hangi platformlar hedefleniyor?
- Veri, kimlik doğrulama, entegrasyon ve işletim gereksinimleri neler?
- Takvim, bütçe, teknoloji veya barındırma kısıtları var mı?
- İlk uygulama görevinin kapsamı, kapsam dışı işler ve kabul ölçütleri neler?

İlk öncelik ürün tanımını netleştirmektir. Henüz bütçe, teslim tarihi veya teknik
kısıt sağlanmadı. Gelecek önemli kararları, onay durumunu ve gerekçesini burada
sakla; doğrulanmış uygulama sonucunu durum belgesine yaz.
