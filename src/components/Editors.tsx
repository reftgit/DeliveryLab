import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { BasketItem, DeliveryContext, Workspace } from "../domain/model";
import { validateContext, validateItem } from "../domain/storage";
import { saveAddressContext, saveBasketContext } from "../domain/context";

export const blankItem = (): BasketItem => ({
  name: "",
  portion: "",
  options: "",
  quantity: 1,
});
export function ItemFields({
  items,
  onChange,
  prices,
  onPrices,
}: {
  items: BasketItem[];
  onChange: (items: BasketItem[]) => void;
  prices?: string[];
  onPrices?: (prices: string[]) => void;
}) {
  const change = (
    index: number,
    field: keyof BasketItem,
    value: string | number,
  ) =>
    onChange(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  return (
    <div className="item-editor">
      {items.map((item, i) => (
        <fieldset className="item-row" key={i}>
          <legend>Ürün {i + 1}</legend>
          <label>
            Ürün adı
            <input
              required
              maxLength={200}
              value={item.name}
              onChange={(e) => change(i, "name", e.target.value)}
              placeholder="Örn. klasik burger"
            />
          </label>
          <label>
            Porsiyon / boy
            <input
              required
              maxLength={200}
              value={item.portion}
              onChange={(e) => change(i, "portion", e.target.value)}
              placeholder="Örn. 150 g"
            />
          </label>
          <label>
            Seçenekler
            <input
              maxLength={300}
              value={item.options}
              onChange={(e) => change(i, "options", e.target.value)}
              placeholder="Örn. ilave yok"
            />
          </label>
          <label>
            Adet
            <input
              required
              type="number"
              min="1"
              max="99"
              step="1"
              value={item.quantity}
              onChange={(e) => change(i, "quantity", Number(e.target.value))}
            />
          </label>
          {prices && (
            <label>
              Birim fiyat (TL)
              <input
                required
                inputMode="decimal"
                value={prices[i] ?? ""}
                onChange={(e) =>
                  onPrices?.(
                    prices.map((p, n) => (n === i ? e.target.value : p)),
                  )
                }
                placeholder="0,00"
              />
            </label>
          )}
          <button
            className="icon-button"
            type="button"
            aria-label={"Ürün " + (i + 1) + " sil"}
            onClick={() => {
              onChange(items.filter((_, n) => n !== i));
              onPrices?.(prices?.filter((_, n) => n !== i) ?? []);
            }}
          >
            ×
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="text-button"
        disabled={items.length >= 20}
        onClick={() => {
          onChange([...items, blankItem()]);
          onPrices?.([...(prices ?? []), ""]);
        }}
      >
        ＋ Ürün ekle
      </button>
    </div>
  );
}

export function ContextEditor({
  workspace,
  onSave,
}: {
  workspace: Workspace;
  onSave: (value: Workspace) => boolean;
}) {
  const [context, setContext] = useState(workspace.context);
  const [latitude, setLatitude] = useState(
    workspace.context.latitude?.toString() ?? "",
  );
  const [longitude, setLongitude] = useState(
    workspace.context.longitude?.toString() ?? "",
  );
  const [items, setItems] = useState<BasketItem[]>(
    workspace.basket.items.length ? workspace.basket.items : [blankItem()],
  );
  const [message, setMessage] = useState("");
  const locationRequest = useRef(0);
  function saveAddress(e: FormEvent) {
    e.preventDefault();
    try {
      const checked: DeliveryContext = validateContext({
        ...context,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
      });
      if (!checked.label.trim()) throw new Error("Adres etiketi gerekli.");
      const next = saveAddressContext(workspace.context, checked);
      if (!onSave({ ...workspace, context: next }))
        throw new Error("Adres kaydedilemedi; üstteki uyarıyı kontrol edin.");
      setContext(next);
      setMessage(
        next.id === workspace.context.id
          ? "Adres değişmedi; mevcut gözlemler korundu."
          : "Adres kaydedildi. Önceki adres gözlemleri geçmiş alanında korundu.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Adres kaydedilemedi.");
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      setMessage(
        "Tarayıcı konum özelliğini desteklemiyor. Koordinatı elle girebilirsiniz.",
      );
      return;
    }
    setMessage("Tarayıcı konum izni bekleniyor…");
    const request = ++locationRequest.current;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (request !== locationRequest.current) return;
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setMessage("Koordinat alındı; kullanmak için adresi kaydedin.");
      },
      () =>
        setMessage(
          "Konum alınamadı veya izin verilmedi. Elle devam edebilirsiniz.",
        ),
      { timeout: 10_000, maximumAge: 0 },
    );
  }
  return (
    <details
      className="setup panel"
      open={!workspace.context.label || !workspace.basket.items.length}
    >
      <summary>
        <span>
          <span className="step-dot">1</span>Adres & karşılaştırılacak sepet
        </span>
        <span className="summary-context">
          {workspace.context.label || "Henüz belirlenmedi"} ·{" "}
          {workspace.basket.items.length} ürün
        </span>
      </summary>
      <div className="setup-body">
        <form onSubmit={saveAddress} className="address-form">
          <h3>Teslimat bağlamı</h3>
          <p className="muted">
            Etiket ve koordinat, teslimat yapılabildiğini kanıtlamaz.
          </p>
          <label>
            Adres etiketi
            <input
              required
              maxLength={200}
              placeholder="Ev · Kadıköy"
              value={context.label}
              onChange={(e) =>
                setContext({ ...context, label: e.target.value })
              }
            />
          </label>
          <div className="form-grid">
            <label>
              Enlem (isteğe bağlı)
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </label>
            <label>
              Boylam (isteğe bağlı)
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button type="button" className="secondary" onClick={locate}>
              Konumumu kullan
            </button>
            <button type="submit">Adresi kaydet</button>
          </div>
          <small>
            Konum yalnızca bu düğmeye bastığınızda istenir; sağlayıcıya
            gönderilmez.
          </small>
        </form>
        <form
          className="basket-form"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              if (!items.length) throw new Error("En az bir ürün ekleyin.");
              const checked = items.map((i) => validateItem(i));
              const basket = saveBasketContext(workspace.basket, checked);
              const saved = onSave({
                ...workspace,
                basket,
              });
              if (!saved)
                throw new Error(
                  "Sepet kaydedilemedi; üstteki uyarıyı kontrol edin.",
                );
              setMessage(
                basket.id === workspace.basket.id
                  ? "Sepet değişmedi; mevcut gözlemler korundu."
                  : "Sepet kaydedildi. Önceki sepet gözlemleri geçersizleşti.",
              );
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "Sepet kaydedilemedi.",
              );
            }
          }}
        >
          <h3>Aynı ürün, aynı seçenek</h3>
          <p className="muted">
            Karşılaştırma bu sepetle birebir eşleşen gözlemleri kullanır.
          </p>
          <ItemFields items={items} onChange={setItems} />
          <button type="submit">Sepeti kaydet</button>
        </form>
      </div>
      {message && (
        <p className="inline-status" role="status">
          {message}
        </p>
      )}
    </details>
  );
}
