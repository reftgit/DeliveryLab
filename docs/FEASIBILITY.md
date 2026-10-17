# Faz 1 — Veri erişimi fizibilitesi

İnceleme: **2026-10-17, Europe/Istanbul**. Kapsam Türkiye'de restoran/fast food
ve iki sağlayıcıdır. Bulgular kamuya açık resmî belgelerin incelenmesine dayanır;
belgelerde anlatılan yetenekler bu projede başarılı API sorgusu anlamına gelmez.

## Sonuç

**İzinli canlı keşif ve canlı sepet karşılaştırması BLOCKED.** Kullanıcıya ait
API yetkisi, test kimlik bilgisi veya rakip karşılaştırmasına yazılı izin yok.
Bu koşullarda tüketici API çağrısı, hesap bağlama ve sipariş denemesi yapılmadı.
React prototipi kullanıcının elle girdiği gözlemleri yerelde karşılaştırır.
MANUAL ve DEMO kayıtları canlı entegrasyonun kanıtı değildir.

## Hizmet kimliği ve Türkiye kapsamı

İkinci sağlayıcı uygulamada tek kimliktir: `trendyol-go`, görünen adı **Uber Eats
Trendyol Go**. Resmî [trendyolgo.com](https://trendyolgo.com/) sayfası bu adı
kullanır ve web siparişi bağlantısını [tgoyemek.com](https://tgoyemek.com/)
adresine verir. Tüketici sayfası Türkiye'deki yemek hizmetini ve 81 il kapsamını
tanıtır; bu tanıtım herhangi bir adrese teslimat kanıtı sayılmaz. Uber Eats ve
Trendyol Go iki bağımsız sağlayıcı olarak sayılmadı. Market bu fazda kapsam dışı.

[Yemeksepeti tüketici sitesi](https://www.yemeksepeti.com/) açıldı; metin çıkarımı
restoran, adres uygunluğu veya fiyat verisi sağlamadı. Bu, platformda restoran
olmadığı veya entegrasyonun teknik olarak imkânsız olduğu anlamına gelmez.

## Erişim matrisi

| Konu | Yemeksepeti | Uber Eats Trendyol Go |
| --- | --- | --- |
| Resmî API | Verilen sayfa Partner API; işletme entegrasyonu | Consumer Delivery API kamuya açık tanıtımı var |
| Tüketici amacı | İncelenen API kendi katalog/sipariş yönetimi için | Keşif, menü, sepet ve sipariş akışı belgelenmiş |
| Türkiye API kapsamı | Türkiye markalı portal; tüketici keşfi kanıtlanmadı | Türkiye hizmeti var; Consumer Delivery API'nin yerel katalog kapsamı kanıtlanmadı |
| Restoran keşfi | Tüketici için gösterilmedi | Genel yetenek olarak açıklanıyor; erişim yok |
| Adres bazlı uygunluk | Kanıtlanmadı | Konuma göre keşif belgelenmiş; bu projede doğrulanmadı |
| Menü / ürün fiyatı | Yetkili chain/vendor kataloğu; tüm restoranlara genel erişim değil | Menü/fiyat/seçenek yeteneği açıklanmış; gerçek yanıt yok |
| Teslimat / zorunlu ücret | Tüketici teklifi elde edilmedi | Detaylı şema ve gerçek ücret yanıtı elde edilmedi |
| Sepet teklifi | Tüketici sepeti uç noktası gösterilmedi | Sepet yönetimi açıklanmış; teklif elde edilmedi |
| Hesap / yetki | Partner Portal client credentials | Ayrı erken erişim onayı; siparişten önce hesap bağlama |
| Rakiple yan yana karşılaştırma | İncelenen belgeler bu izni sağlamıyor | API şartları yazılı izin olmadan birleştirmeyi kısıtlıyor |
| Kullanıcı adına sipariş | Gelen işletme siparişini yönetmek bunun kanıtı değil | Genel yetenek; gerekli kapsam ve izinler yok, denenmedi |

Yemeksepeti sütunu [API tanımı ve kimlik doğrulama](https://developer.yemeksepeti.com/api-specifications)
ile [resmî portal](https://developer.yemeksepeti.com/) temelinde değerlendirilmiştir.
Uber yetenekleri [Consumer Delivery tanıtımına](https://developer.uber.com/docs/consumer-delivery/introduction)
dayanır. Boşluklar API yokluğu iddiası olarak yorumlanmamalıdır.

## Erişim koşulları ve karar gerekçesi

Yemeksepeti Partner API, Partner Portal'dan alınan `client_id` / `client_secret`
ile OAuth client credentials kullanır. Katalog çağrıları `chain_id` / `vendor_id`
bağlamındadır; sipariş bölümü gelen siparişleri ve fulfillment durumunu yönetir.
Sandbox da ayrı yetki gerektirir. Genel tüketici keşfi veya kullanıcı adına yeni
yemek siparişi oluşturma izni bu belgelerden çıkarılamaz.
[Kaynak](https://developer.yemeksepeti.com/api-specifications)

Uber Consumer Delivery erken erişimdedir; ayrıntılı spesifikasyon/test yetkisi
başvuru bazında verilir. Bu görevde başvuru yapılmadı. Türkiye'deki hizmetin varlığı,
bu API'nin aynı Türkiye kataloğunu sunduğunu kanıtlamaz. Bu ayrım çözülemediği için
hayalî endpoint veya çalışanmış gibi görünen LIVE adapter eklenmedi.
[Kaynak](https://developer.uber.com/docs/consumer-delivery/introduction)

Uber API şartlarının III.G bölümü rakiplerle birleşik görünümü, rakip verileriyle
birleştirmeyi ve scraping'i yazılı izin koşuluna bağlar. Verilen genel sayfa
Mart 2026 güncellemesi gösterir; Avrupa bağlantısı Şubat 2021 tarihli ayrı metne
gider ve orada da benzer kısıt vardır. Hangi ek sözleşmenin Türkiye entegrasyonuna
uygulanacağı doğrulanmadı. Mühendislik kararı: açık proje izni olmadan API
entegrasyonu yapılmaması. Bu kayıt bir hukuk görüşü veya sözleşme kabulü değildir.
[Genel şartlar](https://developer.uber.com/docs/riders/terms-of-use),
[Avrupa şartları](https://developer.uber.com/docs/riders/terms-of-use-eu)

## Deneme ve kaynak günlüğü

Tüm satırlar 2026-10-17 tarihinde incelendi. “Açıldı” yalnızca kamuya açık belge
okumasıdır; oturum, tüketici verisi veya API erişimi doğrulaması değildir.

| Kaynak URL | Denenen işlem | Erişim / sonuç |
| --- | --- | --- |
| https://developer.uber.com/docs/consumer-delivery/introduction | Kamuya açık sayfayı açma | PASS; erken erişim ve genel yetenekler okundu |
| https://developer.uber.com/docs/riders/terms-of-use | Kamuya açık şartları okuma | PASS; yazılı izin kısıtı tespit edildi |
| https://developer.uber.com/docs/riders/terms-of-use-eu | Genel sayfanın Avrupa bağlantısını takip | PASS; bölgesel metin ve kısıt okundu |
| https://developer.yemeksepeti.com/api-specifications | Kamuya açık API dokümanını okuma | PASS; partner kimlik doğrulaması ve işletme kapsamı |
| https://developer.yemeksepeti.com/ | Portal ana sayfasını okuma | PASS; Q-Commerce / ERP / POS işletme odağı |
| https://trendyolgo.com/ | Resmî marka ve tüketici bağlantısını okuma | PASS; Uber Eats Trendyol Go ve tgoyemek.com bağlantısı |
| https://tgoyemek.com/ | Resmî tüketici tanıtımını okuma | PASS; Türkiye yemek hizmeti, belirli adres teklifi yok |
| https://play.google.com/store/apps/details?id=com.trendyol.go&hl=tr | Yayıncının uygulama açıklamasını okuma | PASS; aynı birleşik hizmet adı ve resmî site bağlantısı |
| https://go.trendyol.com/ | Eski/aday alan adını açma | Kullanılabilir doğrulama elde edilmedi; hedef olarak seçilmedi |
| https://www.yemeksepeti.com/ | Kamuya açık tüketici girişini okuma | Sayfa açıldı; araç anlamlı restoran/fiyat metni çıkaramadı |
| Yetkili tüketici keşfi/sepet uç noktaları | Çağrı yapılmadı | BLOCKED; yetki ve karşılaştırma izni sağlanmadı |
| Sipariş / ödeme | Çağrı yapılmadı | NOT RUN; açıkça kapsam dışı |

İnternet araştırması yapılabildi; bulgular genel bir internet erişim engeline
dayanmıyor. CAPTCHA, giriş, özel API, kullanıcı çerezi veya hız sınırı aşılmadı.
Alternatif üçüncü sağlayıcı araştırılmadı; iki hedef sağlayıcı kapsamı korundu.

## Yerel prototipin kanıt sınırı

- LIVE: yalnızca izinli sağlayıcı erişimi için ayrılmış tip; çalışan adapter yok.
- MANUAL: kullanıcı beyanı; sağlayıcı doğrulaması veya teslimat garantisi değil.
- DEMO: tamamı sentetik ve isteğe bağlı; manuel depolamaya/dışa aktarıma girmez.
- Adres etiketi konum doğrulaması değildir; teslimat gözlemi ayrıca kullanıcı
  tarafından işaretlenir. Koordinat platforma gönderilmez.
- Fiyatların 30 dakikada eskimesi yerel ve muhafazakâr bir laboratuvar kuralıdır;
  sağlayıcının fiyat garantisi değildir. Sipariş öncesi toplam platformda kontrol edilir.
- Otomatik testlerdeki MANUAL girdiler de sentetik QA verisidir. Kullanıcıdan
  alınmış iki gerçek platform gözlemiyle saha doğrulaması henüz yapılmadı.

İleride canlı entegrasyon için ayrı ayrı Türkiye kataloğu kapsamı, tüketici API
yetkileri, ücret/sepet şeması ve rakip karşılaştırmasına açık yazılı izin gerekir.
Bu görev hiçbir hesap açmadı, sözleşme kabul etmedi, ücretli hizmet veya yayın
oluşturmadı. Gerçek sipariş erişimi elde edilse bile mevcut fazda kullanılmayacak.
