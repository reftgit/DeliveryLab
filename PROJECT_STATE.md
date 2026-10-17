# DeliveryLab — Doğrulanmış proje durumu

Son kayıt tarihi: 2026-10-17 (Europe/Istanbul).

## Aşama ve mevcut hedef

- Aşama: geliştirme protokolü kuruldu ve belge kontrolleri geçti; uygulama öncesi.
- Mevcut hedef: ürün tanımını alarak sonraki uygulama görevini netleştirmek.
- Henüz hiçbir uygulama implementasyonu yok. Kaynak kod, bağımlılık manifesti,
  test paketi, build komutu veya CI/deploy yapılandırması bulunmuyor.

## Başlangıç ve ilgili Git kayıtları

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

## Mevcut içerik

- `AGENTS.md`: başlangıç okuma sırası, kapsam ve doğrulama disiplini, kalıcı bilgi,
  otomatik commit, koşullu otomatik push, yasak işlemler ve Türkçe tek blok rapor.
- `CLAUDE.md`: bağımsız `@AGENTS.md` importu ve asgari Claude Code giriş yönergesi.
- `PROJECT_STATE.md`: gerçek durum, kanıtlar, eksikler ve sonraki iş.
- `PROJECT_CONTEXT.md`: onaylanan süreç kararları ve henüz verilmemiş ürün kararları.

## Doğrulama kanıtları

- PASS — `git rev-parse --show-toplevel`, `git status --short --branch`,
  `git ls-files` ve gizli dosyalar dahil dosya listesi: depo ve boş başlangıç
  durumu incelendi; uygulama dosyası yoktu.
- BEKLENEN BAŞARISIZLIK — başlangıçta `git rev-parse --verify HEAD` ve `git log`
  mevcut commit olmadığı için sonuç veremedi; bozuk geçmiş kanıtı değil.
- ORTAM SINIRI — ilk sandbox içi `git ls-remote` denemesinde
  `Could not resolve host: github.com`; yetkili tekrar denemesi PASS.
- PASS — dört dosyanın içerikleri okundu: Claude importu kod bloğu dışında,
  iki proje belgesini okuma zorunluluğu mevcut, otomatik commit/koşullu push ve
  yıkıcı işlem sınırları tanımlı; rapor şablonunun 14 bölümü eksiksiz.
- PASS — durum ve gelecek planları ayrı; mevcut yararlı belge bulunmadığından
  üzerine yazılan yönerge yok. Uygulama kodu oluşturulmadı/değiştirilmedi.
- PASS — `git diff --cached --check`, `git diff --cached --name-status` ve
  `git ls-files --unmerged`: whitespace hatası/çatışma yok; stage edilenler
  yalnızca istenen dört Markdown belgesi. İçerik incelemesinde sır veya istemeden
  eklenmiş özel dosya görülmedi; `.vscode/settings.json` stage edilmedi.

## Doğrulanmayan davranışlar

- NOT RUN — uygulama testleri, build, lint, cihaz ve entegrasyon testleri:
  uygulama ve çalıştırılacak araç yapılandırması henüz yok.
- NOT RUN — yeni Codex/Claude Code oturumunun bu dosyaları otomatik yüklemesi.
  Dosya/import incelemesi, gerçek agent yüklemesinin kanıtı değildir.
- Ortamda `codex` ve `claude` çalıştırılabilir dosyaları bulundu; bu bulgu oturum
  açıldığını veya yönergelerin yüklendiğini göstermez.

## Hatalar, riskler ve dış engeller

- Uygulama olmadığı için raporlanabilecek doğrulanmış uygulama hatası veya
  regresyon yok; bu ifade uygulama testlerinin geçtiği anlamına gelmez.
- Ürün kapsamı, kullanıcı kitlesi, hedef platform ve teknik mimari belirlenmedi.
  Bunları depo adından çıkarmak yanlış uygulamaya yol açabilir.
- Git ağ işlemleri bu ortamda ek izin gerektirebilir; yerel kurallar ortam
  kısıtlarını aşmaz. Remote/upstream ayarı eksik değil.
- Bağımsız agent yükleme doğrulaması açık; diğer agentin talimatları okuduğu
  varsayılmamalı.

## Manuel işler, öncelik ve önerilen sonraki görev

1. Kullanıcı ürün tanımını ve ilk sürüm kapsamını sağlamalı.
2. Bir sonraki Codex/Claude Code oturumunda kullanılan yönerge kaynakları
   doğrulanmalı; mevcut görevde bu doğrulama yapılmış sayılmamalı.

Önerilen tek sonraki görev: ürün gereksinimlerini ve ilk geliştirme dilimini
netleştirip `PROJECT_CONTEXT.md` içine kaydetmek. Kabul ölçütleri: hedef kullanıcı,
platform, temel kullanıcı akışları, ilk sürüm kapsamı, kapsam dışı işler ve ilk
uygulama görevinin ölçülebilir kabul kriterleri belli; açık kararlar açıkça işaretli.
