# Faz 1C — Manuel keşif ve fiyat saha denemesi

Amaç, iki platformda **kullanıcının kendisinin gördüğü** bilgileri DeliveryLab'e
girerek sepet hesabını ve kullanım akışını kontrol etmektir. Bu belge sonuç
üretmez; gerçek kullanıcı gözlemi sağlanmadığından **MANUAL FIELD CHECK: NOT RUN**.
Uygulamada canlı entegrasyon yoktur. DEMO ve otomatik testler sentetik veridir.

## İki ayrı değerlendirme

| Değerlendirme | Neyi kanıtlayabilir? | Şimdiki durum |
| --- | --- | --- |
| A. MANUAL FIELD CHECK | Gerçek gözlemlerle tutar hesabı ve manuel kullanımın doğruluğu | NOT RUN — kullanıcı tarafından doldurulacak |
| B. AUTOMATED ACCESS FEASIBILITY | Sağlayıcının izin verdiği otomatik tüketici keşfi ve sepet erişimi | BLOCKED — izin ve kapsam engelleri sürüyor; [FEASIBILITY.md](FEASIBILITY.md) |

**A'nın PASS olması B'yi PASS yapmaz.** Manuel kayıt bir sağlayıcı doğrulaması,
otomatik erişim kanıtı veya gelecekte aynı adrese teslimat garantisi değildir.

## Sepetsiz restoran keşfi senaryosu

Bu kontrol fiyat karşılaştırmasından bağımsızdır; gerçek gözlemle henüz
yapılmadı (**NOT RUN**). Önce yerel uygulamayı README'deki komutlarla açın.

1. MANUAL modunda tek adresi kaydedin; hedef sepeti boş bırakın. Önceden dolu
   çalışma alanınız varsa özel JSON yedeği alın ve ayrı tarayıcı profilini kullanın.
2. İki hedef platformdan birinde bu adres seçiliyken gördüğünüz restoranın
   fiziksel şubesini “Restoran gözlemi ekle” ile kaydedin. Gerçek gözlem zamanını
   girin; ürün, fiyat ve ücret girmeyin.
3. Yalnız listede gördüyseniz “Yalnız listelenme gözlendi” seçin. Teslimatı ayrıca
   kontrol ettiyseniz ikinci seçeneği kullanıp platformda gördüğünüz ek bilgiyi
   açıklayın. Listelenmeyi teslimat kanıtı saymayın; sipariş vermeyin.
4. Kartta “Sepet fiyatı bulunmuyor” ve “Diğer platform: Doğrulanmadı” görünmeli.
   Diğer platforma ilişkin kayıt oluşturmak zorunda değilsiniz; bu durum yokluk
   kanıtı değildir. Fiyat kazananı çıkmamalıdır.
5. İkinci platformda aynı fiziksel şubeyi kendiniz görürseniz ayrı kayıt ekleyin.
   Kartlar otomatik birleşmemeli. Şube eşleştirme alanında iki şubeyi seçip açık
   onay verin; birleşmeyi ve onayı geri alınca yeniden ayrılmayı kontrol edin.
6. Deneme kopyasında sepet ekleyip değiştirin: restoran keşfi korunmalı. Adresi
   değiştirin: kayıt “Geçmiş restoran keşifleri” alanına ayrılmalı. Eski adres
   etiketine dönmek kaydı güncel yapmamalı. 30 dakikadan eski keşif kaydı yeniden
   kontrol uyarısı taşımalı; teslimat garantisi gibi sunulmamalı.
7. Özel JSON yedeğinde keşif ve varsa fiyat kayıtlarının birlikte korunduğunu
   kontrol edin. Bu sonuç otomatik platform erişimi için PASS değildir.

Boş keşif kontrolü (depo dışındaki özel notta doldurun):

| Alan | Kullanıcının kaydı |
| --- | --- |
| Tarih / saat / saat dilimi | |
| Özel adres referansı (tam adres yazmayın) | |
| Platform / restoran / fiziksel şube | |
| Listelenme mi, ayrıca teslimat doğrulaması mı? | |
| Varsa ek teslimat gözleminin açıklaması | |
| Diğer platform için gözlem var mı? Yoksa doğrulanmadı mı? | |
| Sepetsiz kayıt / fiyat yokluğu / kazanan çıkmaması | |
| Şube onayı / geri alma | |
| Sepet değişimi / adres geçmişi / JSON kontrolü | |
| MANUAL FIELD CHECK — keşif sonucu ve gerekçesi | |

Kişisel adres, koordinat, hesap bilgisi, kupon kodu veya ekran görüntüsünü
depoya eklemeyin. Şablon boş kalmalıdır.

## Sepet fiyatı deneme adımları

1. `npm ci`, ardından `npm run dev` çalıştırın; `http://127.0.0.1:5173` adresini
   açın. DEMO açıksa çıkın. Önceden kayıt varsa JSON dışa aktararak özel bir
   yerde yedekleyin; içe aktarmanın mevcut çalışma alanını değiştirdiğini unutmayın.
2. Tek bir teslimat adresi seçin. DeliveryLab'de bu adresi ayırt eden bir etiket
   kaydedin; koordinat zorunlu değildir. İki platformda da **aynı gerçek teslimat
   adresini** kendiniz seçin. Etiket tek başına adresi veya teslimatı doğrulamaz.
3. Yemeksepeti ve Uber Eats Trendyol Go'yu ayrı ayrı kontrol edin. İkisinde de
   bulunan **aynı fiziksel restoran şubesini** şube adresi/bilgisiyle doğrulayın.
   Marka adının aynı olması yeterli değildir. Ortak şube yoksa bunu eksik olarak
   kaydedin; tek platform kaydı saklanabilir ama fiyat kazananı çıkarılamaz.
4. Aynı ürün, porsiyon/boy, seçenekler ve adetlerle tek bir hedef sepet kaydedin.
   Ürün eşdeğerliği belirsizse eşitmiş gibi adlandırmayın. İki platformda aynı
   sepetin sunulduğunu ayrıca kontrol edin.
5. Her platform için “Sepet fiyatı gözlemi ekle”yi kullanın. Birim ürün fiyatlarını, teslimatı,
   hizmet ve diğer zorunlu ücretlerin toplamını, indirim tutarı/uygunluğunu ve
   minimum sepet koşulunu kaydedin. Minimumun indirim öncesi mi sonrası mı
   uygulandığını belirtin. **Bilinmeyen ücret/minimumu boş bırakın; 0 yalnız
   gerçekten sıfırsa girilir.** İndirim yokluğu ile uygunluğu bilinmeyen indirimi
   karıştırmayın. Kupon için gerçek kod yerine yerel bir takma etiket kullanın.
6. Bilgiyi gerçekten gördüğünüz zamanı “Gözlem tarihi” alanına girin. Teslimat
   uygunluğu kutusunu yalnız o şubenin seçilen adrese teslimatını gördüyseniz
   işaretleyin. Mümkünse sipariş vermeden sepet/ödeme öncesi özetindeki nihai
   toplamı kontrol edip “Görülen nihai toplam (TL)” alanına yazın.
   Sipariş onayına veya ödeme düğmesine basmayın. Toplamı görmek hesap bağlama,
   ödeme ya da erişim engelini aşmayı gerektiriyorsa bu adımı yapmayın; eksik yazın.
7. İki kaydı seçin, aynı fiziksel şube onayını verin. Hesaplanan toplamı her
   platformun görülen toplamıyla **kuruşu kuruşuna** karşılaştırın:
   ürün fiyatı × adet toplamı + teslimat + hizmet/diğer − uygun indirimler.
   Fark varsa tutarları yeniden kontrol edin; farkı kapatmak için bilinmeyen
   ücreti tahmin etmeyin. Ürün toplamını aşan karmaşık indirimler desteklenmez.
8. İki gözlem de 30 dakika içinde olmalı. Süre aşılırsa platformu yeniden
   kontrol edip yeni gözlem ekleyin; sırf güncel görünsün diye zaman değiştirmeyin.
   Aynı adres/sepeti değişikliksiz kaydetmek gözlemleri veya zamanını yenilemez.
9. Kayıtları özel JSON yedeğine alın. Eksik/farklı sepet davranışını ayrıca
   denemek için bu yedeği ayrı geçici tarayıcı profiline aktarın. Bu kopyada
   bir ürünün porsiyon/seçenek/adetini değiştirin veya yeni gözlemde bir ücreti
   boş bırakın: kazanan çıkmamalı, neden karşılaştırmada görünmelidir. Şube
   eşleştirmesini geri alınca da kazanan kalkmalıdır. Asıl gözlemleri değiştirmeyin.
10. Aynı test kopyasında adresi B olarak değiştirin: A kayıtları aktif listeden
    ayrılıp “Geçmiş adres gözlemleri” içinde kalmalıdır. B için yeni gözlem gerekir.
    A etiketine geri dönmek eski revizyonu canlandırmaz. Aynı adreste süresi geçen
    kayıt ise keşifte kalır, fiyat kazananı olamaz; bu adres geçmişinden ayrıdır.

## Boş kontrol şablonu

Aşağıdakini **depo dışında** özel bir not veya `local-data/` altında yerel dosya
olarak kopyalayıp doldurun. Bu depodaki şablon boş kalmalıdır. Gerçek adres,
koordinat, ekran görüntüsü, kupon kodu ve hesap bilgisi Git'e, agent raporuna veya
otomatik test fikstürüne eklenmez. DeliveryLab şifre istemez; hesap bağlamaz.

- Deneme tarihi / saati / saat dilimi:
- Özel yerel adres referansı (tam adres yazmayın):
- Fiziksel şube eşitliğini nasıl kontrol ettim:
- Hedef ürün / porsiyon / seçenek / adet (her ürün için tekrarlayın):

| Alan | Yemeksepeti | Uber Eats Trendyol Go |
| --- | --- | --- |
| Aynı teslimat adresi seçildi mi? | | |
| Restoran ve fiziksel şube | | |
| Teslimat uygunluğu görüldü mü? | | |
| Ürün / porsiyon / seçenek / adet | | |
| Birim fiyatlar / ürün toplamı (TL) | | |
| Teslimat ücreti (TL veya bilinmiyor) | | |
| Hizmet ve diğer zorunlu ücretler (TL veya bilinmiyor) | | |
| İndirim takma etiketi / tutarı / uygunluğu | | |
| Minimum sepet / indirim öncesi-sonrası temeli | | |
| Gözlem zamanı ve saat dilimi | | |
| Sipariş vermeden görülen nihai toplam (TL) | | |
| DeliveryLab hesaplanan toplamı (TL) | | |
| Fark (TL) / varsa nedeni | | |
| Eksik veya doğrulanamayan bilgi | | |

- Farklı sepet için beklenen engel / gözlenen davranış:
- Bilinmeyen ücret için beklenen engel / gözlenen davranış:
- Şube eşleştirme / geri alma sonucu:
- Adres değişimi / geçmişin korunması sonucu:
- JSON aktarımında kayıtların korunması:
- A. MANUAL FIELD CHECK sonucu (PASS / FAIL / NOT RUN) ve gerekçesi:
- B. AUTOMATED ACCESS FEASIBILITY için yeni izin/erişim kanıtı var mı?:
- Özel yedek alındı mı? (dosyayı veya tam yolunu paylaşmayın):

## Sonucun değerlendirilmesi

A'nın fiyat senaryosu için PASS, iki gerçek gözlemin aynı adres/şube/sepet/zaman koşullarını sağlaması,
iki görülen nihai toplamın hesapla eşleşmesi ve eksik/farklı girdilerin kazanan
üretmemesiyle verilebilir. Kontrol tamamlanmadıysa NOT RUN ve eksik adımı yazın;
beklenen davranışla çelişki varsa FAIL ve kişisel veri içermeyen hata açıklaması
yazın. Keşif senaryosunu ayrı değerlendirin: sepetsiz kayıt, kanıt düzeyleri,
doğrulanmamış diğer platform, onay/geri alma ve veri koruma kontrol edilmeli.
Keşif PASS, fiyat senaryosunu PASS yapmaz. Başka cihaz veya tarayıcıda
denenmediyse denendiğini iddia etmeyin.

B ayrı izin ve teknik erişim kanıtı gerektirir. Bu pilot otomatik platform
erişimi, scraping, hesap bağlama, sipariş veya ödeme denemesi içermez.
