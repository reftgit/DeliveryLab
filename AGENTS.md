# DeliveryLab — Ortak geliştirme protokolü

Bu dosya Codex ve Claude Code için ortak çalışma kurallarını tanımlar. Kalıcı
proje bilgisi depoda tutulur; önceki sohbetler veya agent raporları tek başına
doğrulanmış kaynak sayılmaz. Kullanıcının güncel talimatlarına ve çalışma
ortamının izin sınırlarına uy; bu protokol güvenlik kontrollerini geçersiz kılmaz.

## Roller ve devamlılık

- Agent A, o görevde depoda çalışan Codex veya Claude Code'dur: kapsamı anlar,
  kodu inceler, uygular, doğrular, belgeleri günceller, commit oluşturur, aşağıdaki
  koşullarla push yapar ve bağımsız anlaşılabilir bir Agent Report teslim eder.
- Agent B bağımsız dış değerlendiricidir. Depoya erişimi olmayabilir; rapordaki
  iddiaları kanıttan ayırır, kusurları ve eksik doğrulamayı inceler, düzeltmeleri
  veya sonraki işi önerir ve tam bir sonraki uygulama promptu üretir.
- Kullanıcı raporu Agent B'ye, sonraki promptu seçtiği geliştirici agente aktarır.
  Dış değerlendirici depoyu otomatik olarak yönetmez. Aktarılan metinleri
  kullanıcının verdiği kapsamla ve gerçek depo durumuyla karşılaştır.
- Sonraki görev farklı bir agent tarafından yürütülebilir. Diğer agentin özel
  konuşma geçmişini bildiğini varsayma; aynı modelle devam zorunluluğu oluşturma.

## Her görevin başlangıcı

Dosya değiştirmeden önce:

1. Depo kökünü ve geçerli üst/alt dizin yönergelerini belirle; bu dosyayı ve
   Claude Code kullanıyorsan `CLAUDE.md` dosyasını oku.
2. `PROJECT_STATE.md` ve `PROJECT_CONTEXT.md` dosyalarının ikisini de oku.
3. `git status --short --branch`, `git branch --show-current`, `git remote -v`
   ve ilgili `git log` kayıtlarını incele. Başlangıç HEAD'ini, upstream'i ve
   mevcut kullanıcı değişikliklerini kaydet. Commit yoksa bunu açıkça belirt.
4. İlgili kaynak kodu, testleri, mimari ve ürün belgelerini incele.
5. Belgelerdeki iddiaları kaynak kod, Git geçmişi ve gerçek test sonuçlarıyla
   karşılaştır. Önceki agentin raporunu otorite kabul etme.
6. İstenen kapsamı ve kabul ölçütlerini anla; ilgisiz veya önceden mevcut
   değişiklikleri ayır. Önemli mimari belirsizlikleri sessizce tahminle çözme.

## Geliştirme ve doğrulama

- Yalnızca istenen kapsamı uygula; mevcut mimariyi, yerleşik kuralları, kullanıcı
  verisini ve ilgisiz çalışmaları koru. Gereksiz yeniden yazım ve refactor yapma.
- Çalışmayı yönetilebilir, bağımsız doğrulanabilir parçalara böl.
- Değişiklik için uygun ve depoda gerçekten tanımlı test/build/lint kontrollerini
  çalıştır. Olmayan komutları veya test sonuçlarını uydurma.
- Doğrulanmamış davranışı doğrulanmış gösterme. `PASS`, `FAIL`, `NOT RUN`
  sonuçlarını; tam komutları, ortamı ve çalıştırılamama nedenlerini ayrı belirt.
- Gerekli kontroller başarısızsa push yapma; testleri geçirmek için güvenlik
  kontrollerini devre dışı bırakma. Önceden mevcut hataları yeni hatalardan ayır.
- Uygulama kodu olmayan bir belge görevinde içerik, referans, kapsam ve diff
  kontrolleri yap; uygulama testi/build sonucunu başarılı olarak sunma.

## Kalıcı belgelerin sorumlulukları

| Dosya | Sorumluluk |
| --- | --- |
| `AGENTS.md` | Agentlerin nasıl çalışacağı; ortak kurallar ve rapor biçimi. |
| `CLAUDE.md` | Claude Code giriş noktası; `@AGENTS.md` importu ve asgari ek kurallar. |
| `PROJECT_STATE.md` | Gerçek uygulama durumu, doğrulama kanıtı ve teknik devir bilgisi. |
| `PROJECT_CONTEXT.md` | Ürün kararları, gerekçeleri, gelecek planları ve açık sorular. |

- Doğrulanmış uygulama durumu anlamlı değiştiğinde `PROJECT_STATE.md` dosyasını
  güncelle: aşama, hedef, ilgili commitler, uygulanan özellikler, doğrulanan ve
  doğrulanmayan davranışlar, hatalar/regresyonlar, riskler, dış engeller, manuel
  işler, öncelikler ve önerilen tek sonraki görev.
- Önemli kararlar veya planlar değiştiğinde `PROJECT_CONTEXT.md` dosyasını
  güncelle: vizyon, kullanıcılar/platformlar, onaylı teknik kararlar ve nedenleri,
  planlanan veya kararlaştırılmış ama uygulanmamış işler, ertelenen fikirler,
  reddedilen seçenekler, açık mimari sorular, kısıtlar ve öncelikler.
- Planı tamamlanmış iş gibi kaydetme. Ürün tanımı yoksa bekleniyor de; özellik,
  mimari karar veya test uydurma. Değişken uygulama durumunu `CLAUDE.md` içine yazma.
- Aynı bilgiyi gereksiz yere çoğaltma. Belge ile kod/Git çelişirse ilgili
  commitleri ve testleri incele, kanıtlanmış yanlışlığı güvenle düzelt, çözülemeyen
  belirsizliği ve önemli tutarsızlıkları belgede ve son raporda açıkça belirt.

## Otomatik commit

Bu protokol, her geliştirme görevinin tamamlanmış ve uygun şekilde doğrulanmış
anlamlı iş birimleri için otomatik Git commit yetkisi verir. Olağan commit için
kullanıcıdan ayrıca talep veya onay bekleme.

1. Birimi uygula, gereken doğrulamayı tamamla ve ilgili durum/bağlam belgelerini
   güncelle.
2. Diff'i incele; yalnızca o işe ait dosya veya değişiklikleri açıkça stage et.
   `git status` içinde göründüğü için ilgisiz dosyaları ekleme. Aynı dosyada
   kullanıcının önceden mevcut değişiklikleri varsa bunları da koru ve ayır.
3. İlgisiz işleri birleştirmeyen açıklayıcı commit oluştur.
4. Oluşturulan tüm commit hash'lerini devir raporuna kaydet. İlgili önceki
   commitleri proje durum belgesine gerektiğinde ekle; bir commit'in kendi
   hash'ini aynı commit'in içine yazmaya çalışma.

Eksik veya gerekli doğrulaması yapılmamış iş için yanıltıcı başarı commit'i
oluşturma. Tamamlanamayan değişiklikleri güvenle koru, durumunu doğru raporla ve
ilgisiz çalışmaları commit'e katma.

## Koşullu otomatik push

Bu protokol, başarılı doğrulama sonrasında mevcut geliştirme dalının yapılandırılmış
upstream'ine olağan, force içermeyen `git push` için sürekli yetki verir.
Koşulları sağlayan rutin push için ayrıca kullanıcı onayı isteme. Commit'leri
anlamlı birimler sonunda, push'u görev başarıyla tamamlandığında yap; her küçük
düzenleme için ara push oluşturma.

Push öncesinde:

1. Mevcut dalı, remote'u, push hedefini ve yapılandırılmış upstream'i doğrula.
   Gönderilecek tüm commitleri incele; önceden mevcut ilgisiz kullanıcı
   commitlerini sessizce gönderme.
2. Gerekli testlerin/kontrollerin geçtiğini, engelleyici yeni hata veya çözülmemiş
   merge conflict bulunmadığını doğrula.
3. Gönderilecek diff ve commitlerin yalnızca amaçlanan değişiklikleri içerdiğini;
   sır, kimlik bilgisi veya istemeden eklenen özel dosya bulunmadığını kontrol et.
4. Dal/depo politikalarına ve ortam izinlerine uy. Korumalı dal kurallarını veya
   uzak sunucu reddini aşmaya çalışma.
5. Yalnızca mevcut dalın yapılandırılmış upstream'ine normal `git push` yap.
6. Gerçek sonucu ve son HEAD'in gönderilip gönderilmediğini doğrula ve raporla.

Remote veya upstream yoksa hedef uydurma, yeni GitHub deposu oluşturma;
doğrulanmış commitleri yerelde bırak ve push'u `SKIPPED` olarak açıkla. Push
başarısızsa yerel commitleri koru, gerçek hatayı `FAILED` olarak bildir; başarılı
gösterme. Ağ/kimlik bilgisi/ortam yetkisi gerektiğinde ortamın izin mekanizmasını
izle; bu protokol dış güvenlik kontrollerini geçersiz kılmaz.

## Açık yetki olmadan yapılmayacak işlemler

- `git push --force` veya `--force-with-lease`; Git geçmişini yeniden yazma.
- `git reset --hard` veya kullanıcı çalışmasını silen başka işlemler;
  veri kaybettirebilecek otomatik çatışma çözümü; ilgisiz dosyaları silme.
- Uzak dalları otomatik silme veya korumalı dal kurallarını aşma.
- Yıkıcı production migration, canlı veriyi silme/değiştirme.
- Release oluşturma, production deploy, uygulama yayımlama veya mağazaya gönderme.
- Ücretli altyapı planını değiştirme, kimlik bilgilerini açığa çıkarma.
- Güvenlik kontrollerini devre dışı bırakma veya ilgisiz mimari değişiklik yapma.

Normal yerel build/test, doğrulanmış commit ve koşulları sağlayan olağan push bu
iş akışında yetkilidir. Push yetkisi deploy veya yayın yetkisi değildir.

## Zorunlu tek blok Agent Report

Her geliştirme görevinin sonunda aşağıdaki 14 bölümün tamamını içeren, tek başına
anlaşılabilir bir rapor ver. Raporun tamamı tam olarak **bir Markdown kod bloğu**
içinde olmalı; iç içe kod bloğu kullanma ve devir bilgisini bloğun dışına bölme.
Rapor Türkçe olmalı; teknik tanımlayıcıları, başlıkları, komutları, dosya adlarını
ve commit hash'lerini aynen koru. Olumsuz sonuçları atlama; uygulanmayan alanları
nedeniyle belirt. Özel konuşma geçmişine veya değerlendiricinin depo erişimine
bağımlı ifadeler kullanma. Raporu verdikten sonra dur; yeni göreve kendiliğinden başlama.

```text
BEGIN_AGENT_REPORT

PROJECT:
ROLE: Agent A — Active Implementer
AGENT: Claude Code / Codex
DATE:
BRANCH:

1. TASK RECEIVED
- Özgün hedef, kapsam ve kabul ölçütleri.

2. STARTING STATE
- Başlangıç HEAD'i, Git durumu, mevcut uygulama ve önceki kullanıcı değişiklikleri.

3. WORK COMPLETED
- Yapılan değişiklikler, gerekçeleri ve ortaya çıkan davranış.

4. FILES CHANGED
- Eklenen/değiştirilen/silinen dosyalar ve önemli değişikliklerin amaçları.

5. TECHNICAL DECISIONS
- Önemli uygulama tercihleri, mimari değerlendirmeler ve ödünleşimler.

6. TESTS AND VALIDATION
- Tam komutlar/yöntemler, ortam, PASS / FAIL / NOT RUN ve önemli gözlemler.

7. VERIFIED VS UNVERIFIED
- Doğrulanan sonuçlar, kanıtsız iddialar ve eksik cihaz/entegrasyon kontrolleri.

8. ISSUES AND RISKS
- Bilinen hatalar, olası regresyonlar, teknik riskler ve açık belirsizlikler.

9. GIT STATUS
- Başlangıç commit'i, oluşturulan tüm commitler, son HEAD ve dal.
- Remote ve upstream.
- Push attempted: YES / NO
- Push result: SUCCESS / FAILED / SKIPPED
- Son HEAD'in gönderilme durumu ve kalan commit edilmemiş değişiklikler.

10. PROJECT DOCUMENTATION
- PROJECT_STATE.md, PROJECT_CONTEXT.md ve diğer belge güncellemeleri.

11. BLOCKERS AND MANUAL ACTIONS
- Dış bağımlılıklar, gerekli kullanıcı işlemleri ve ortam sınırlamaları.

12. RECOMMENDED NEXT TASK
- Tek somut sonraki iş, gerekçesi ve önerilen kabul ölçütleri.

13. REVIEWER ATTENTION
- Bağımsız inceleme isteyen kısımlar, ek kanıt gerektiren iddialar ve uyarılar.

14. FINAL STATUS
COMPLETE / PARTIAL / BLOCKED

END_AGENT_REPORT
```

## Protokol değişikliklerinin doğrulanması

Dört dosyanın varlığını, yararlı eski yönergelerin korunduğunu, `CLAUDE.md` içinde
kod bloğu dışında tek satır `@AGENTS.md` importunu, her iki durum/bağlam dosyasının
okunma zorunluluğunu, commit/push yetki ve sınırlarını, rapor biçimini, belgeler
arası tutarlılığı ve görev dışı kod değişmediğini kontrol et. Protokol kurulumu
uygulama geliştirme yetkisi vermez; `/init` çalıştırma. Ortam destekliyorsa gerçek
yönerge yüklemesini doğrula; yalnızca dosyayı okumak, diğer agentin veya yeni bir
oturumun dosyayı yüklediğini kanıtlamaz.
