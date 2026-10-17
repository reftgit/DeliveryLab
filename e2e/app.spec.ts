import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { Workspace } from "../src/domain/model";

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
    .getByRole("button", { name: "＋ Gözlem ekle", exact: true })
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
    JSON.parse(localStorage.getItem("deliverylab.workspace.v1")!),
  );
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
  if (test.info().title.startsWith("açık ekranda")) await page.clock.install();
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
    localStorage.removeItem("deliverylab.workspace.v1"),
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
    localStorage.setItem("deliverylab.workspace.v1", "{bad"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("üzerine yazılmadı");
  await setupWorkspace(page);
  expect(
    await page.evaluate(() => localStorage.getItem("deliverylab.workspace.v1")),
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
    page.getByRole("button", { name: "＋ Gözlem ekle" }),
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
    "Diğer platform doğrulanamadı",
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
