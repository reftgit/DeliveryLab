# Faz 1B — Manuel saha denemesi

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

## Deneme adımları

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
5. Her platform için “Gözlem ekle”yi kullanın. Birim ürün fiyatlarını, teslimatı,
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

A için PASS, iki gerçek gözlemin aynı adres/şube/sepet/zaman koşullarını sağlaması,
iki görülen nihai toplamın hesapla eşleşmesi ve eksik/farklı girdilerin kazanan
üretmemesiyle verilebilir. Kontrol tamamlanmadıysa NOT RUN ve eksik adımı yazın;
beklenen davranışla çelişki varsa FAIL ve kişisel veri içermeyen hata açıklaması
yazın. Başka cihaz veya tarayıcıda denenmediyse denendiğini iddia etmeyin.

B ayrı izin ve teknik erişim kanıtı gerektirir. Bu pilot otomatik platform
erişimi, scraping, hesap bağlama, sipariş veya ödeme denemesi içermez.
