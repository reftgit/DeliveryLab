import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { PLATFORMS, PROVIDERS } from "../domain/model";
import type {
  BasketItem,
  Observation,
  Platform,
  Workspace,
} from "../domain/model";
import { parseMoney } from "../domain/comparison";
import { validateObservation } from "../domain/storage";
import { ItemFields } from "./Editors";

function localDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
export function ObservationForm({
  workspace,
  onSave,
  onClose,
}: {
  workspace: Workspace;
  onSave: (o: Observation) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [platform, setPlatform] = useState<Platform>("yemeksepeti");
  const [items, setItems] = useState<BasketItem[]>(
    workspace.basket.items.map((i) => ({ ...i })),
  );
  const [prices, setPrices] = useState(workspace.basket.items.map(() => ""));
  const [sourceUrl, setSourceUrl] = useState(PROVIDERS.yemeksepeti.url);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const str = (name: string) => String(data.get(name) ?? "").trim();
    try {
      const discount = parseMoney(str("discount"));
      const time = new Date(str("observedAt"));
      if (
        !Number.isFinite(time.getTime()) ||
        time.getTime() > Date.now() + 60_000
      )
        throw new Error("Gözlem zamanı geçersiz veya gelecekte.");
      if (discount && !str("discountId"))
        throw new Error("İndirim için benzersiz ad veya kod girin.");
      const observation = validateObservation({
        id: crypto.randomUUID(),
        platform,
        source: "MANUAL",
        restaurant: str("restaurant"),
        branch: str("branch"),
        context: { ...workspace.context },
        basketId: workspace.basket.id,
        items: items.map((i, n) => {
          const unitPrice = parseMoney(prices[n]);
          if (unitPrice === null)
            throw new Error("Her ürünün birim fiyatını girin.");
          return { ...i, unitPrice };
        }),
        deliveryFee: parseMoney(str("deliveryFee")),
        serviceFee: parseMoney(str("serviceFee")),
        discounts:
          discount === null || discount === 0
            ? []
            : [
                {
                  id: str("discountId"),
                  amount: discount,
                  eligible:
                    str("eligible") === "unknown"
                      ? null
                      : str("eligible") === "yes",
                },
              ],
        minimumOrder: parseMoney(str("minimumOrder")),
        minimumBasis: str("minimumBasis"),
        observedTotal: parseMoney(str("observedTotal")),
        deliveryConfirmed: data.get("deliveryConfirmed") === "on",
        eta: str("eta"),
        sourceUrl,
        observedAt: time.toISOString(),
      });
      onSave(observation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt eklenemedi.");
    }
  }
  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="observation-title">
      <form onSubmit={submit} className="observation-form">
        <div className="dialog-title">
          <div>
            <span className="eyebrow">MANUAL · SİZİN GÖZLEMİNİZ</span>
            <h2 id="observation-title">Gözlem ekle</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Formu kapat"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p className="muted">
          Platformda gördüğünüz bilgileri girin. Teslimat bağlamı:{" "}
          <strong>{workspace.context.label}</strong>. Bu kayıt sağlayıcı
          tarafından doğrulanmaz.
        </p>
        <div className="form-grid">
          <label>
            Platform
            <select
              value={platform}
              onChange={(e) => {
                const p = e.target.value as Platform;
                setPlatform(p);
                setSourceUrl(PROVIDERS[p].url);
              }}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PROVIDERS[p].name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Gözlem tarihi
            <input
              name="observedAt"
              type="datetime-local"
              required
              defaultValue={localDate()}
            />
          </label>
          <label>
            Restoran adı
            <input
              name="restaurant"
              required
              maxLength={200}
              placeholder="Gördüğünüz restoran adı"
            />
          </label>
          <label>
            Fiziksel şube
            <input
              name="branch"
              required
              maxLength={200}
              placeholder="Mahalle / sokak / şube adı"
            />
          </label>
        </div>
        <h3>Gördüğünüz sepet</h3>
        <p className="muted">
          Hedef sepetten dolduruldu. Platformdaki ürün veya seçenek farklıysa
          düzeltin.
        </p>
        <ItemFields
          items={items}
          onChange={setItems}
          prices={prices}
          onPrices={setPrices}
        />
        <h3>Ücretler ve koşullar</h3>
        <p className="muted">
          Bilinmeyen ücretleri boş bırakın. Yalnızca ücretsiz olduğunu
          gördüğünüz alanlara 0 yazın. İndirim yoksa indirim alanı boş
          kalabilir.
        </p>
        <div className="form-grid three">
          <label>
            Teslimat ücreti (TL)
            <input
              name="deliveryFee"
              inputMode="decimal"
              placeholder="Bilinmiyor"
            />
          </label>
          <label>
            Hizmet + diğer zorunlu ücretler (TL)
            <input
              name="serviceFee"
              inputMode="decimal"
              placeholder="Bilinmiyor"
            />
          </label>
          <label>
            Minimum sepet (TL)
            <input
              name="minimumOrder"
              inputMode="decimal"
              placeholder="Bilinmiyor · koşul yoksa 0"
            />
          </label>
          <label>
            Minimum hesaplama temeli
            <select name="minimumBasis" defaultValue="unknown">
              <option value="unknown">Bilinmiyor</option>
              <option value="before-discount">
                İndirim öncesi ürün toplamı
              </option>
              <option value="after-discount">
                İndirim sonrası ürün toplamı
              </option>
            </select>
          </label>
          <label>
            İndirim (TL)
            <input
              name="discount"
              inputMode="decimal"
              placeholder="Uygulanabilir indirim yok"
            />
          </label>
          <label>
            İndirim adı / kodu
            <input
              name="discountId"
              maxLength={200}
              placeholder="Aynı indirimi tekrar girmeyin"
            />
          </label>
          <label>
            İndirim uygunluğu
            <select name="eligible" defaultValue="unknown">
              <option value="unknown">Doğrulanmadı</option>
              <option value="yes">Bu sepette uygulandığını gördüm</option>
              <option value="no">Bu sepet için geçerli değil</option>
            </select>
          </label>
          <label>
            Görülen nihai toplam (TL)
            <input
              name="observedTotal"
              inputMode="decimal"
              placeholder="İsteğe bağlı kontrol"
            />
          </label>
          <label>
            Tahmini teslimat
            <input name="eta" maxLength={100} placeholder="Örn. 30–45 dk" />
          </label>
        </div>
        <label>
          Resmî kaynak bağlantısı
          <input
            type="url"
            required
            value={sourceUrl}
            maxLength={2000}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </label>
        <label className="check">
          <input name="deliveryConfirmed" type="checkbox" />
          Bu şubenin kaydedilen adrese teslimat yaptığını platformda gördüm.
        </label>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <small>Gözlem 30 dakika sonra karşılaştırma için eski sayılır.</small>
          <button type="submit">Gözlemi kaydet</button>
        </div>
      </form>
    </dialog>
  );
}
