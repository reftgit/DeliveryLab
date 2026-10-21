import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { Workspace } from "../src/domain/model";
import { branchKey } from "../src/domain/model";

// All values below are synthetic QA inputs, never real platform observations.
async function setupWorkspace(page: Page) {
  await page.getByLabel("Adres etiketi").fill("Test adresi · sentetik");
  await page
    .getByRole("button", { name: "Adresi kaydet", exact: true })
    .click();
  await page.getByLabel("Ürün adı", { exact: true }).fill("Test burger");
  await page.getByLabel("Porsiyon / boy", { exact: true }).fill("150 g");
  await page.getByLabel("Seçenekler", { exact: true }).fill("İlave yok");
  await page
    .getByRole("button", { name: "Sepeti kaydet", exact: true })
    .click();
}
async function addObservation(
  page: Page,
  platform: string,
  price: string,
  fee = "20",
) {
  await page
    .getByRole("button", { name: "Sepet fiyatı gözlemi ekle", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "Platform", exact: true })
    .selectOption(platform);
  await dialog.getByLabel("Restoran adı", { exact: true }).fill("Test Mutfak");
  await dialog.getByLabel("Fiziksel şube").fill("Merkez · sentetik şube");
  for (const input of await dialog.getByLabel("Birim fiyat (TL)").all()) {
    await input.fill(price);
  }
  await dialog.getByLabel("Teslimat ücreti (TL)").fill(fee);
  await dialog
    .getByLabel("Hizmet + diğer zorunlu ücretler (TL)", { exact: true })
    .fill("5");
  await dialog.getByLabel("Minimum sepet (TL)").fill("0");
  await dialog
    .getByLabel(
      "Bu şubenin kaydedilen adrese teslimat yaptığını platformda gördüm.",
    )
    .check();
  await dialog
    .getByRole("button", { name: "Gözlemi kaydet", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
}
async function selectPairAndMatch(page: Page) {
  await page
    .getByRole("button", { name: "Karşılaştır", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Karşılaştır", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Aynı fiziksel şube olduğu henüz onaylanmadı.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("İki kaydın aynı fiziksel şubeye ait olduğunu kontrol ettim.")
    .check();
  await page
    .getByRole("button", { name: "Şubeleri eşleştir", exact: true })
    .click();
}
async function readWorkspace(page: Page): Promise<Workspace> {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("deliverylab.workspace.v2")!),
  );
}
async function addDiscovery(
  page: Page,
  platform = "yemeksepeti",
  confirmed = false,
) {
  await page
    .getByRole("button", { name: "Restoran gözlemi ekle", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "Platform", exact: true })
    .selectOption(platform);
  await dialog.getByLabel("Restoran adı", { exact: true }).fill("Test Mutfak");
  await dialog
    .getByLabel("Fiziksel şube", { exact: true })
    .fill("Merkez · sentetik şube");
  await dialog
    .getByLabel(
      "Bu adres seçiliyken restoranın platformda listelendiğini gördüm.",
    )
    .check();
  if (confirmed) {
    await dialog
      .getByRole("combobox", { name: "Teslimat bilgisi", exact: true })
      .selectOption("confirmed");
    await dialog
      .getByRole("button", { name: "Restoran gözlemini kaydet", exact: true })
      .click();
    await expect(dialog).toBeVisible();
    expect(
      await dialog
        .getByLabel("Teslimatı nasıl doğruladınız?")
        .evaluate((el) => (el as HTMLInputElement).validity.valueMissing),
    ).toBe(true);
    await dialog
      .getByLabel("Teslimatı nasıl doğruladınız?")
      .fill("Sentetik ek teslimat bilgisi gözlendi");
  }
  await expect(dialog.getByLabel("Birim fiyat (TL)")).toHaveCount(0);
  await expect(dialog.getByLabel("Teslimat ücreti (TL)")).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "Restoran gözlemini kaydet", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
}
async function matchDiscoveries(page: Page) {
  const records = (await readWorkspace(page)).discoveries;
  await page
    .getByText("Fiyat olmadan da şube eşleştirin", { exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Birinci şube", exact: true })
    .selectOption(branchKey(records[0]));
  await page
    .getByRole("combobox", { name: "İkinci şube", exact: true })
    .selectOption(branchKey(records[1]));
  await expect(
    page.getByRole("button", { name: "Şube onayını kaydet", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel(
      "Seçtiğim iki kaydın aynı fiziksel şube olduğunu ayrıca kontrol ettim.",
    )
    .check();
  await page
    .getByRole("button", { name: "Şube onayını kaydet", exact: true })
    .click();
}
async function openSetup(page: Page) {
  if (
    !(await page.locator(".setup").evaluate((el) => el.hasAttribute("open")))
  ) {
    await page.locator(".setup > summary").click();
  }
}
async function changeAddress(page: Page, label: string) {
  await openSetup(page);
  await page.getByLabel("Adres etiketi").fill(label);
  await page
    .getByRole("button", { name: "Adresi kaydet", exact: true })
    .click();
}
test.beforeEach(async ({ page }) => {
  // A fresh, disposable Chrome context; never the user's browser profile.
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return ["127.0.0.1", "localhost"].includes(url.hostname)
      ? route.continue()
      : route.abort();
  });
  // Timer interception must precede application startup.
  if (/^(açık ekranda|keşif eskimesi)/.test(test.info().title))
    await page.clock.install();
  await page.goto("/");
});
test("dürüst ilk açılış, isteğe bağlı demo, arama, filtre ve dar ekran", async ({
  page,
}) => {
  await expect(
    page.getByText("İlk gözleminizle başlayın.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Örnek Burger", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Demoyu keşfet" }).click();
  await expect(
    page.getByText("Tamamen sentetik örnekleri inceliyorsunuz."),
  ).toBeVisible();
  await expect(page.locator(".restaurant-card")).toHaveCount(3);
  await page.getByRole("searchbox").fill("sahil");
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  await page.getByRole("searchbox").fill("");
  await page
    .getByRole("group", { name: "Platform filtresi" })
    .getByRole("button", { name: "Yemeksepeti", exact: true })
    .click();
  await expect(page.locator(".restaurant-card")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("demo.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Demodan çık" }).click();
  await expect(
    page.getByText("İlk gözleminizle başlayın.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("İlk gözleminizle başlayın.", { exact: true }),
  ).toBeVisible();
});
test("manuel iki gözlem, şube onayı/geri alma, kalıcılık ve adres geçersizleşmesi", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addObservation(page, "yemeksepeti", "200");
  await addObservation(page, "trendyol-go", "180");
  await selectPairAndMatch(page);
  await expect(
    page.getByText("Bu iki gözlemde en ucuz", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".winner .total")).toContainText("205,00");
  await expect(page.locator(".winner .platform-link")).toHaveAttribute(
    "href",
    "https://tgoyemek.com/",
  );
  await expect(page.locator(".winner .platform-link")).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Şube eşleştirmesini geri al" })
    .click();
  await expect(page.locator(".restaurant-card")).toHaveCount(2);
  await expect(
    page.getByText("Bu iki gözlemde en ucuz", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("İki kaydın aynı fiziksel şubeye ait olduğunu kontrol ettim.")
    .check();
  await page
    .getByRole("button", { name: "Şubeleri eşleştir", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Karşılaştır", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Karşılaştır", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Bu iki gözlemde en ucuz", { exact: true }),
  ).toBeVisible();
  await page.locator(".setup > summary").click();
  await page.getByLabel("Adres etiketi").fill("Yeni test adresi");
  await page
    .getByRole("button", { name: "Adresi kaydet", exact: true })
    .click();
  await expect(
    page.getByText("Bu iki gözlemde en ucuz", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(0);
  await expect(
    page.getByText("Bu adres için henüz gözlem yok.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".comparison .quote")).toHaveCount(0);
  await expect(page.locator(".observation-history")).toContainText(
    "Geçmiş adres gözlemleri 2",
  );
  await expect(
    page
      .locator(".observation-history")
      .getByRole("button", { name: "Karşılaştır", exact: true }),
  ).toHaveCount(0);
  const historyBefore = (await readWorkspace(page)).observations;
  await page.getByText("Geçmiş kayıtları göster (2)", { exact: true }).click();
  await page.locator(".history-record > summary").first().click();
  await expect(page.locator(".history-record").first()).toContainText(
    "Önceki adres: Test adresi · sentetik",
  );
  await page.screenshot({
    path: test.info().outputPath("address-history.png"),
    fullPage: true,
  });
  await page.reload();
  expect((await readWorkspace(page)).observations).toEqual(historyBefore);
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(0);
  await changeAddress(page, "Test adresi · sentetik");
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(0);
  expect((await readWorkspace(page)).observations).toEqual(historyBefore);
  await expect(page.locator(".winner")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("bilinmeyen ücret sıfıra dönüşmez ve tek geçerli teklife kazanan denmez", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addObservation(page, "yemeksepeti", "200", "");
  await addObservation(page, "trendyol-go", "180");
  await selectPairAndMatch(page);
  await expect(
    page.getByText("Bu iki gözlemde en ucuz", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".comparison")).toContainText("Eksik tutar");
  await expect(page.locator(".comparison")).toContainText(
    "zorunlu hizmet ücreti bilinmiyor",
  );
});
test("JSON dışa/içe aktarımı ve hatalı dosyada mevcut kayıtların korunması", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addObservation(page, "yemeksepeti", "200");
  await addObservation(page, "trendyol-go", "180");
  await selectPairAndMatch(page);
  await changeAddress(page, "Sentetik B adresi");
  await addObservation(page, "yemeksepeti", "190");
  const beforeExport = await readWorkspace(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON dışa aktar ↓" }).click();
  const download = await downloadPromise;
  const exportPath = test.info().outputPath("synthetic-export.json");
  await download.saveAs(exportPath);
  expect(JSON.parse(await readFile(exportPath, "utf8"))).toEqual(beforeExport);
  await page.getByLabel("JSON içe aktar", { exact: true }).setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{broken"),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Geçersiz JSON" }),
  ).toBeVisible();
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  expect(await readWorkspace(page)).toEqual(beforeExport);
  await page.evaluate(() =>
    localStorage.removeItem("deliverylab.workspace.v2"),
  );
  await page.reload();
  await expect(
    page.getByText("İlk gözleminizle başlayın.", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("JSON içe aktar", { exact: true })
    .setInputFiles(exportPath);
  await expect(
    page.getByText("İçe aktarımı kontrol edin", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Kayıtları değiştir ve içe aktar" })
    .click();
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  await expect(page.locator(".observation-history")).toContainText(
    "Geçmiş adres gözlemleri 2",
  );
  expect(await readWorkspace(page)).toEqual(beforeExport);
});
test("bozuk yerel kayıt sessizce ezilmez", async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem("deliverylab.workspace.v2", "{bad"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("üzerine yazılmadı");
  await setupWorkspace(page);
  expect(
    await page.evaluate(() => localStorage.getItem("deliverylab.workspace.v2")),
  ).toBe("{bad");
});
test("adres kaydı kaydedilmemiş sepet taslağını silmez", async ({ page }) => {
  await page.getByLabel("Ürün adı", { exact: true }).fill("Kaybolmayan taslak");
  await page.getByLabel("Porsiyon / boy", { exact: true }).fill("Standart");
  await page.getByLabel("Adres etiketi").fill("Test adresi");
  await page
    .getByRole("button", { name: "Adresi kaydet", exact: true })
    .click();
  await expect(page.getByLabel("Ürün adı", { exact: true })).toHaveValue(
    "Kaybolmayan taslak",
  );
  await page
    .getByRole("button", { name: "Sepeti kaydet", exact: true })
    .click();
  await page.reload();
  await page.locator(".setup > summary").click();
  await expect(page.getByLabel("Ürün adı", { exact: true })).toHaveValue(
    "Kaybolmayan taslak",
  );
});
test("konum izni yalnız açık eylemde istenir; reddedilince elle devam edilir", async ({
  page,
}) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(_ok: unknown, fail: (error: object) => void) {
          document.body.dataset.locationAsked = "yes";
          fail({ code: 1 });
        },
      },
    });
  });
  expect(
    await page.locator("body").getAttribute("data-location-asked"),
  ).toBeNull();
  await page.getByRole("button", { name: "Konumumu kullan" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Konum alınamadı" }),
  ).toBeVisible();
  await setupWorkspace(page);
  await expect(
    page.getByRole("button", { name: "Sepet fiyatı gözlemi ekle" }),
  ).toBeEnabled();
});
test("sayfa otomatik dış ağ isteği göndermez ve tarayıcı hatası üretmez", async ({
  page,
}) => {
  const external: string[] = [],
    errors: string[] = [];
  page.on("request", (request) => {
    if (!["127.0.0.1", "localhost"].includes(new URL(request.url()).hostname))
      external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.reload();
  await page.getByRole("button", { name: "Demoyu keşfet" }).click();
  await expect(page.locator(".restaurant-card")).toHaveCount(3);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
test("açık ekranda zaman geçince eski gözlem kazananlığı düşer", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Demoyu keşfet" }).click();
  await page
    .locator(".restaurant-card")
    .first()
    .getByRole("button", { name: "Karşılaştır", exact: true })
    .first()
    .click();
  await page
    .locator(".restaurant-card")
    .first()
    .getByRole("button", { name: "Karşılaştır", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Bu iki gözlemde en ucuz · DEMO", { exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(31 * 60 * 1000);
  await expect(
    page.getByText("Bu iki gözlemde en ucuz · DEMO", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".comparison")).toContainText(
    "Gözlem 30 dakikadan eski",
  );
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(3);
  await expect(page.locator(".observation-history")).toHaveCount(0);
});

test("aynı adres ve sepet kaydı kimlikleri ve geçerli kazananı korur; koordinat değişimi ayırır", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addObservation(page, "yemeksepeti", "200");
  await addObservation(page, "trendyol-go", "180");
  await selectPairAndMatch(page);
  const before = await readWorkspace(page);
  await openSetup(page);
  await page
    .getByRole("button", { name: "Adresi kaydet", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Adres değişmedi" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sepeti kaydet", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Sepet değişmedi" }),
  ).toBeVisible();
  expect(await readWorkspace(page)).toEqual(before);
  await expect(page.locator(".winner")).toHaveCount(1);
  await page.getByLabel("Enlem (isteğe bağlı)").fill("0");
  await page.getByLabel("Boylam (isteğe bağlı)").fill("0");
  await page
    .getByRole("button", { name: "Adresi kaydet", exact: true })
    .click();
  expect((await readWorkspace(page)).context.id).not.toBe(before.context.id);
  expect((await readWorkspace(page)).observations).toEqual(before.observations);
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(0);
  await expect(page.locator(".winner")).toHaveCount(0);
  await expect(page.locator(".observation-history")).toContainText(
    "Geçmiş adres gözlemleri 2",
  );
});

test("iki ürünün satır sırasını değiştirmek mevcut sepeti geçersizleştirmez", async ({
  page,
}) => {
  await setupWorkspace(page);
  await openSetup(page);
  await page.getByRole("button", { name: "＋ Ürün ekle", exact: true }).click();
  await page.getByLabel("Ürün adı", { exact: true }).nth(1).fill("Test ayran");
  await page
    .getByLabel("Porsiyon / boy", { exact: true })
    .nth(1)
    .fill("200 ml");
  await page
    .getByRole("button", { name: "Sepeti kaydet", exact: true })
    .click();
  await addObservation(page, "yemeksepeti", "200");
  await addObservation(page, "trendyol-go", "180");
  await selectPairAndMatch(page);
  const before = await readWorkspace(page);
  for (const [i, item] of [...before.basket.items].reverse().entries()) {
    await page.getByLabel("Ürün adı", { exact: true }).nth(i).fill(item.name);
    await page
      .getByLabel("Porsiyon / boy", { exact: true })
      .nth(i)
      .fill(item.portion);
    await page
      .getByLabel("Seçenekler", { exact: true })
      .nth(i)
      .fill(item.options);
  }
  await page
    .getByRole("button", { name: "Sepeti kaydet", exact: true })
    .click();
  expect((await readWorkspace(page)).basket.id).toBe(before.basket.id);
  expect((await readWorkspace(page)).basket.items).toEqual(
    [...before.basket.items].reverse(),
  );
  await expect(page.locator(".winner")).toHaveCount(1);
});

for (const [label, value] of [
  ["Ürün adı", "Test pizza"],
  ["Porsiyon / boy", "300 g"],
  ["Seçenekler", "Ek sos"],
  ["Adet", "2"],
]) {
  test(`${label} değişince eski sepet teklifleri kazanan olamaz`, async ({
    page,
  }) => {
    await setupWorkspace(page);
    await addObservation(page, "yemeksepeti", "200");
    await addObservation(page, "trendyol-go", "180");
    await selectPairAndMatch(page);
    const before = await readWorkspace(page);
    await openSetup(page);
    await page.getByLabel(label, { exact: true }).fill(value);
    await page
      .getByRole("button", { name: "Sepeti kaydet", exact: true })
      .click();
    expect((await readWorkspace(page)).basket.id).not.toBe(before.basket.id);
    expect((await readWorkspace(page)).observations).toEqual(
      before.observations,
    );
    await expect(page.locator(".winner")).toHaveCount(0);
    await expect(page.locator(".comparison .issues").first()).toContainText(
      "Sepet değişti",
    );
    await expect(page.locator(".discovery .restaurant-card")).toHaveCount(1);
    await expect(page.locator(".observation-history")).toHaveCount(0);
  });
}

test("MANUAL geçmişi DEMO ile karışmaz; mevcut adresin tek platform kaydı korunur", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addObservation(page, "yemeksepeti", "200");
  await changeAddress(page, "Sentetik B adresi");
  await addObservation(page, "trendyol-go", "180");
  const manual = await readWorkspace(page);
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(1);
  await expect(page.locator(".discovery")).toContainText(
    "Diğer platform: Doğrulanmadı",
  );
  await page.getByRole("button", { name: "Karşılaştır", exact: true }).click();
  await expect(page.locator(".winner")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Demoyu keşfet", exact: true })
    .click();
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(3);
  await expect(page.locator(".observation-history")).toHaveCount(0);
  await changeAddress(page, "Sentetik DEMO B");
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(0);
  await expect(page.locator(".observation-history")).toContainText(
    "Geçmiş adres gözlemleri 4",
  );
  await expect(
    page.getByRole("button", { name: "JSON dışa aktar ↓", exact: true }),
  ).toBeDisabled();
  expect(await readWorkspace(page)).toEqual(manual);
  await page.getByRole("button", { name: "Demodan çık", exact: true }).click();
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(1);
  await expect(page.locator(".observation-history")).toContainText(
    "Geçmiş adres gözlemleri 1",
  );
  expect(await readWorkspace(page)).toEqual(manual);
});

test("sepetsiz keşif, teslimat ayrımı, açık şube onayı/geri alma ve filtre", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Restoran gözlemi ekle", exact: true }),
  ).toBeDisabled();
  await changeAddress(page, "Test adresi · sentetik");
  await expect(
    page.getByRole("button", {
      name: "Sepet fiyatı gözlemi ekle",
      exact: true,
    }),
  ).toBeDisabled();
  await addDiscovery(page);
  expect((await readWorkspace(page)).basket.items).toEqual([]);
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  await expect(page.locator(".restaurant-card")).toContainText(
    "Sepet fiyatı bulunmuyor",
  );
  await expect(page.locator(".restaurant-card")).toContainText(
    "Diğer platform: Doğrulanmadı",
  );
  await expect(page.locator(".discovery-record")).toContainText(
    "Teslimat ayrıca doğrulanmadı",
  );
  await expect(
    page.getByRole("button", { name: "Karşılaştır", exact: true }),
  ).toHaveCount(0);
  await addDiscovery(page, "trendyol-go", true);
  await expect(page.locator(".restaurant-card")).toHaveCount(2);
  await expect(page.locator(".discovery-record").last()).toContainText(
    "Teslimat ayrıca doğrulandı · Kullanıcı beyanı",
  );
  await matchDiscoveries(page);
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  await expect(page.locator(".winner")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Şube eşleştirmesini geri al" })
    .click();
  await expect(page.locator(".restaurant-card")).toHaveCount(2);
  await page.getByRole("searchbox").fill("olmayan sentetik arama");
  await expect(page.locator(".restaurant-card")).toHaveCount(0);
  await page.getByRole("searchbox").fill("Merkez");
  await page
    .getByRole("group", { name: "Platform filtresi" })
    .getByRole("button", { name: "Yemeksepeti", exact: true })
    .click();
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  await page
    .getByRole("group", { name: "Platform filtresi" })
    .getByRole("button", { name: "Tümü", exact: true })
    .click();
  await page.screenshot({
    path: test.info().outputPath("basket-free-discovery.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("keşif sepetten bağımsız kalır; adres ve A → B → A geçmişi korunur", async ({
  page,
}) => {
  await changeAddress(page, "Test adresi · sentetik");
  await addDiscovery(page);
  const records = (await readWorkspace(page)).discoveries;
  await setupWorkspace(page);
  await openSetup(page);
  await page.getByLabel("Adet", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Sepeti kaydet", exact: true })
    .click();
  expect((await readWorkspace(page)).discoveries).toEqual(records);
  await expect(page.locator(".discovery .discovery-record")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Adresi kaydet", exact: true })
    .click();
  await expect(page.locator(".discovery .discovery-record")).toHaveCount(1);
  await changeAddress(page, "Sentetik B");
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(0);
  await expect(page.locator(".discovery-history")).toContainText(
    "Geçmiş restoran keşifleri 1",
  );
  await page.reload();
  await changeAddress(page, "Test adresi · sentetik");
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(0);
  expect((await readWorkspace(page)).discoveries).toEqual(records);
  await expect(page.locator(".winner")).toHaveCount(0);
});

test("keşif ve fiyat aynı kartta birleşir; fiyat hesabı ve karma kayıt silme korunur", async ({
  page,
}) => {
  await changeAddress(page, "Test adresi · sentetik");
  await addDiscovery(page);
  await addDiscovery(page, "trendyol-go");
  await matchDiscoveries(page);
  await setupWorkspace(page);
  await addObservation(page, "yemeksepeti", "200");
  await addObservation(page, "trendyol-go", "180");
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  await expect(page.locator(".discovery .discovery-record")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Karşılaştır", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Karşılaştır", exact: true })
    .first()
    .click();
  await expect(page.locator(".winner .total")).toContainText("205,00");
  await page.getByText("Gözlem ayrıntıları", { exact: true }).first().click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Gözlemi sil", exact: true })
    .first()
    .click();
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  expect((await readWorkspace(page)).matches).toHaveLength(1);
  await expect(page.locator(".winner")).toHaveCount(0);
});

test("keşif eskimesi 30 dakika sonra teslimat kanıtını düşürür; adres geçmişine taşımaz", async ({
  page,
}) => {
  await changeAddress(page, "Test adresi · sentetik");
  await addDiscovery(page, "yemeksepeti", true);
  await page.clock.fastForward(31 * 60 * 1000);
  await expect(page.locator(".discovery-record")).toContainText(
    "Keşif gözlemi 30 dakikadan eski",
  );
  await expect(page.locator(".discovery-record")).toContainText(
    "güncel teslimat kanıtı değildir",
  );
  await expect(page.locator(".discovery-history")).toHaveCount(0);
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  await expect(page.locator(".winner")).toHaveCount(0);
});

test("keşif MANUAL/DEMO izolasyonu ve dış ağ isteği olmaması", async ({
  page,
}) => {
  const external: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (!["127.0.0.1", "localhost"].includes(new URL(r.url()).hostname))
      external.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await changeAddress(page, "Test adresi · sentetik");
  await addDiscovery(page);
  const manual = await readWorkspace(page);
  await page
    .getByRole("button", { name: "Demoyu keşfet", exact: true })
    .click();
  await expect(page.locator(".discovery-record")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Restoran gözlemi ekle", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Demodan çık", exact: true }).click();
  await expect(page.locator(".discovery .discovery-record")).toHaveCount(1);
  expect(await readWorkspace(page)).toEqual(manual);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("v1 LocalStorage ve JSON kayıpsız okunur; eski veri yalnız okuma ve v2 kayıtta korunur", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addObservation(page, "yemeksepeti", "200");
  await addObservation(page, "trendyol-go", "180");
  await selectPairAndMatch(page);
  const current = await readWorkspace(page);
  const { discoveries: _discoveries, ...rest } = current;
  const legacy = {
    ...rest,
    version: 1,
    matches: rest.matches.map((m) => ({
      left: JSON.stringify(JSON.parse(m.left).slice(0, 4)),
      right: JSON.stringify(JSON.parse(m.right).slice(0, 4)),
    })),
  };
  const raw = JSON.stringify(legacy);
  await page.evaluate((data) => {
    localStorage.removeItem("deliverylab.workspace.v2");
    localStorage.setItem("deliverylab.workspace.v1", data);
  }, raw);
  await page.reload();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "v1 kayıtları kayıpsız açıldı" }),
  ).toBeVisible();
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  expect(
    await page.evaluate(() => localStorage.getItem("deliverylab.workspace.v2")),
  ).toBeNull();
  await addDiscovery(page);
  expect((await readWorkspace(page)).observations).toEqual(
    current.observations,
  );
  expect((await readWorkspace(page)).matches).toEqual(current.matches);
  expect(
    await page.evaluate(() => localStorage.getItem("deliverylab.workspace.v1")),
  ).toBe(raw);
  await page.getByLabel("JSON içe aktar", { exact: true }).setInputFiles({
    name: "synthetic-v1.json",
    mimeType: "application/json",
    buffer: Buffer.from(raw),
  });
  await page
    .getByRole("button", {
      name: "Kayıtları değiştir ve içe aktar",
      exact: true,
    })
    .click();
  expect(await readWorkspace(page)).toEqual(current);
  await page
    .getByRole("button", { name: "Karşılaştır", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Karşılaştır", exact: true })
    .first()
    .click();
  await expect(page.locator(".winner .total")).toContainText("205,00");
});

test("v2 karma JSON turu ve bozuk dönüşümde mevcut kayıtların korunması", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addObservation(page, "yemeksepeti", "200");
  await addDiscovery(page);
  await changeAddress(page, "Sentetik B");
  await addDiscovery(page, "trendyol-go");
  const before = await readWorkspace(page);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "JSON dışa aktar ↓", exact: true })
    .click();
  const download = await downloadPromise,
    path = test.info().outputPath("synthetic-v2.json");
  await download.saveAs(path);
  expect(JSON.parse(await readFile(path, "utf8"))).toEqual(before);
  const brokenV1 = { ...before, version: 1 };
  for (const invalid of [
    brokenV1,
    { ...before, discoveries: [{ ...before.discoveries[0], source: "LIVE" }] },
  ]) {
    await page.getByLabel("JSON içe aktar", { exact: true }).setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(invalid)),
    });
    await expect(
      page.getByRole("status").filter({ hasText: "Mevcut kayıtlar korundu" }),
    ).toBeVisible();
    expect(await readWorkspace(page)).toEqual(before);
  }
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByLabel("JSON içe aktar", { exact: true }).setInputFiles(path);
  await page
    .getByRole("button", {
      name: "Kayıtları değiştir ve içe aktar",
      exact: true,
    })
    .click();
  expect(await readWorkspace(page)).toEqual(before);
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(1);
  await expect(page.locator(".discovery-history")).toContainText(
    "Geçmiş restoran keşifleri 1",
  );
  await expect(
    page
      .locator(".observation-history")
      .filter({ hasText: "Geçmiş adres gözlemleri" }),
  ).toContainText("Geçmiş adres gözlemleri 1");
});

test("bozuk v2 eski v1 ile sessizce değiştirilmez", async ({ page }) => {
  await setupWorkspace(page);
  const { discoveries: _discoveries, ...rest } = await readWorkspace(page);
  const legacy = JSON.stringify({ ...rest, version: 1 });
  await page.evaluate((raw) => {
    localStorage.setItem("deliverylab.workspace.v1", raw);
    localStorage.setItem("deliverylab.workspace.v2", "{broken");
  }, legacy);
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("üzerine yazılmadı");
  await changeAddress(page, "Sentetik geçici adres");
  await addDiscovery(page);
  expect(
    await page.evaluate(() => localStorage.getItem("deliverylab.workspace.v2")),
  ).toBe("{broken");
  expect(
    await page.evaluate(() => localStorage.getItem("deliverylab.workspace.v1")),
  ).toBe(legacy);
  await expect(page.locator(".discovery-record")).toHaveCount(1);
});

test("diğer platformun kaydı geçmişte kaldığında onay yeni adrese taşınmaz ve geçmişte korunur", async ({
  page,
}) => {
  await changeAddress(page, "Test adresi · sentetik");
  await addDiscovery(page);
  await addDiscovery(page, "trendyol-go");
  await matchDiscoveries(page);
  const atA = await readWorkspace(page);
  await changeAddress(page, "Sentetik B");
  await addDiscovery(page);
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(1);
  await expect(page.locator(".discovery .restaurant-card")).toContainText(
    "Diğer platform: Doğrulanmadı",
  );
  await expect(
    page.getByRole("button", {
      name: "Şube eşleştirmesini geri al",
      exact: true,
    }),
  ).toHaveCount(0);
  expect((await readWorkspace(page)).matches).toEqual(atA.matches);
  expect((await readWorkspace(page)).discoveries).toHaveLength(3);
});

test("A adresinin şube onayı B adresindeki aynı adları birleştirmez; her onay ayrı geri alınır", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addObservation(page, "yemeksepeti", "200");
  await addObservation(page, "trendyol-go", "180");
  await selectPairAndMatch(page);
  const atA = await readWorkspace(page);
  await changeAddress(page, "Sentetik B");
  await addObservation(page, "yemeksepeti", "200");
  await addObservation(page, "trendyol-go", "180");
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(2);
  await expect(page.locator(".winner")).toHaveCount(0);
  expect((await readWorkspace(page)).matches).toEqual(atA.matches);
  await selectPairAndMatch(page);
  await expect(page.locator(".winner .total")).toContainText("205,00");
  expect((await readWorkspace(page)).matches).toHaveLength(2);
  await page
    .getByRole("button", { name: "Şube eşleştirmesini geri al", exact: true })
    .click();
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(2);
  await expect(page.locator(".winner")).toHaveCount(0);
  const after = await readWorkspace(page);
  expect(after.matches).toEqual(atA.matches);
  expect(after.observations.slice(0, 2)).toEqual(atA.observations);
  await page.reload();
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(2);
  expect(await readWorkspace(page)).toEqual(after);
});

test("geçerli dosyadan sonra hatalı JSON seçilirse eski içe aktarma onayı kalmaz", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addDiscovery(page);
  const before = await readWorkspace(page);
  await page.getByLabel("JSON içe aktar", { exact: true }).setInputFiles({
    name: "synthetic-valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(before)),
  });
  await expect(
    page.getByRole("heading", { name: "İçe aktarımı kontrol edin" }),
  ).toBeVisible();
  await page.getByLabel("JSON içe aktar", { exact: true }).setInputFiles({
    name: "synthetic-invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Mevcut kayıtlar korundu" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Kayıtları değiştir ve içe aktar",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(await readWorkspace(page)).toEqual(before);
});

test("eski sekmenin kaydı diğer sekmedeki yeni veriyi sessizce ezmez", async ({
  page,
  context,
}) => {
  await context.route("**/*", (route) =>
    ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  await setupWorkspace(page);
  await addDiscovery(page);
  const other = await context.newPage();
  await other.goto("/");
  await expect(other.locator(".discovery-record")).toHaveCount(1);
  await addDiscovery(page, "trendyol-go");
  const latest = await readWorkspace(page);
  await addDiscovery(other, "yemeksepeti", true);
  expect(await readWorkspace(page)).toEqual(latest);
  await expect(other.getByRole("alert")).toContainText("Başka sekmede");
  // The conflicting edit remains exportable in that tab; disk keeps the newer data.
  await expect(other.locator(".discovery-record")).toHaveCount(2);
  const downloadPromise = other.waitForEvent("download");
  await other
    .getByRole("button", { name: "JSON dışa aktar ↓", exact: true })
    .click();
  const download = await downloadPromise;
  const path = test.info().outputPath("synthetic-conflicting-tab.json");
  await download.saveAs(path);
  const session = JSON.parse(await readFile(path, "utf8")) as Workspace;
  expect(session.discoveries).toHaveLength(2);
  expect(session.discoveries[1].deliveryStatus).toBe("confirmed");
  expect(latest.discoveries[1].platform).toBe("trendyol-go");
  await other.close();
});

test("JSON boyut, kayıt sayısı ve kaynak hatalarında mevcut kayıtlar korunur", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addDiscovery(page);
  const before = await readWorkspace(page);
  const inputs = [
    Buffer.alloc(1_000_001, " "),
    Buffer.from(
      JSON.stringify({
        ...before,
        discoveries: Array.from({ length: 501 }, (_, i) => ({
          ...before.discoveries[0],
          id: `synthetic-${i}`,
        })),
      }),
    ),
    ...["LIVE", "DEMO"].map((source) =>
      Buffer.from(
        JSON.stringify({
          ...before,
          discoveries: [{ ...before.discoveries[0], source }],
        }),
      ),
    ),
    Buffer.from(JSON.stringify({ ...before, observations: "broken" })),
  ];
  for (const buffer of inputs) {
    await page
      .getByLabel("JSON içe aktar", { exact: true })
      .setInputFiles({
        name: "synthetic-invalid.json",
        mimeType: "application/json",
        buffer,
      });
    await expect(
      page.getByRole("status").filter({ hasText: "Mevcut kayıtlar korundu" }),
    ).toBeVisible();
    await expect(page.locator(".import-review")).toHaveCount(0);
    expect(await readWorkspace(page)).toEqual(before);
  }
});

test("depolama kotası hatasında disk korunur ve yeni oturum verisi dışa aktarılabilir", async ({
  page,
}) => {
  await setupWorkspace(page);
  await addDiscovery(page);
  const before = await readWorkspace(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "deliverylab.workspace.v2")
        throw new DOMException("Synthetic quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await addDiscovery(page, "trendyol-go");
  await expect(page.getByRole("alert")).toContainText("Depolama dolu");
  expect(await readWorkspace(page)).toEqual(before);
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "JSON dışa aktar ↓", exact: true })
    .click();
  const download = await pending,
    path = test.info().outputPath("synthetic-quota.json");
  await download.saveAs(path);
  const exported = JSON.parse(await readFile(path, "utf8")) as Workspace;
  expect(exported.discoveries).toHaveLength(2);
  expect(exported.discoveries[0]).toEqual(before.discoveries[0]);
  await page.reload();
  expect(await readWorkspace(page)).toEqual(before);
  await expect(page.locator(".discovery-record")).toHaveCount(1);
});

test("belirsiz eski v2 şube onayı saklanır ve yalnız yeni açık onay uygulanır", async ({
  page,
}) => {
  await changeAddress(page, "Sentetik A");
  await addDiscovery(page);
  await addDiscovery(page, "trendyol-go");
  await matchDiscoveries(page);
  await changeAddress(page, "Sentetik B");
  await addDiscovery(page);
  await addDiscovery(page, "trendyol-go");
  const before = await readWorkspace(page);
  const legacyMatches = before.matches.map((m) => ({
    left: JSON.stringify(JSON.parse(m.left).slice(0, 4)),
    right: JSON.stringify(JSON.parse(m.right).slice(0, 4)),
  }));
  const raw = JSON.stringify({ ...before, matches: legacyMatches });
  await page.evaluate(
    (raw) => localStorage.setItem("deliverylab.workspace.v2", raw),
    raw,
  );
  await page.reload();
  await expect(
    page.getByRole("status").filter({ hasText: "Adres kapsamı belirsiz" }),
  ).toBeVisible();
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(2);
  expect(
    await page.evaluate(() => localStorage.getItem("deliverylab.workspace.v2")),
  ).toBe(raw);
  await page
    .getByText("Fiyat olmadan da şube eşleştirin", { exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Birinci şube", exact: true })
    .selectOption(branchKey(before.discoveries[2]));
  await page
    .getByRole("combobox", { name: "İkinci şube", exact: true })
    .selectOption(branchKey(before.discoveries[3]));
  await page
    .getByLabel(
      "Seçtiğim iki kaydın aynı fiziksel şube olduğunu ayrıca kontrol ettim.",
    )
    .check();
  await page
    .getByRole("button", { name: "Şube onayını kaydet", exact: true })
    .click();
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(1);
  const after = await readWorkspace(page);
  expect(after.discoveries).toEqual(before.discoveries);
  expect(after.matches[0]).toEqual({ ...legacyMatches[0], unscoped: true });
  expect(after.matches).toHaveLength(2);
  await page.reload();
  expect(await readWorkspace(page)).toEqual(after);
  await expect(page.locator(".discovery .restaurant-card")).toHaveCount(1);
});

test("yavaş okunan önceki JSON son seçilen hatalı dosyanın önüne geçmez", async ({
  page,
}) => {
  await setupWorkspace(page);
  const before = await readWorkspace(page);
  await page.evaluate(() => {
    const original = File.prototype.text;
    File.prototype.text = function () {
      if (this.name !== "synthetic-slow.json") return original.call(this);
      return new Promise<string>((resolve) => {
        (
          window as typeof window & { releaseImport: () => void }
        ).releaseImport = () => {
          void original.call(this).then(resolve);
        };
      });
    };
  });
  await page
    .getByLabel("JSON içe aktar", { exact: true })
    .setInputFiles({
      name: "synthetic-slow.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(before)),
    });
  await page.waitForFunction(() => "releaseImport" in window);
  await page
    .getByLabel("JSON içe aktar", { exact: true })
    .setInputFiles({
      name: "synthetic-invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{"),
    });
  await expect(
    page.getByRole("status").filter({ hasText: "Mevcut kayıtlar korundu" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    (window as typeof window & { releaseImport: () => void }).releaseImport();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  await expect(page.locator(".import-review")).toHaveCount(0);
  expect(await readWorkspace(page)).toEqual(before);
});
