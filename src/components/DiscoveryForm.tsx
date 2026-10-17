import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { PLATFORMS, PROVIDERS } from "../domain/model";
import type {
  DeliveryContext,
  DiscoveryObservation,
  Platform,
} from "../domain/model";
import { validateDiscovery } from "../domain/storage";

export function DiscoveryForm({
  context,
  onSave,
  onClose,
}: {
  context: DeliveryContext;
  onSave: (record: DiscoveryObservation) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [platform, setPlatform] = useState<Platform>("yemeksepeti");
  const [sourceUrl, setSourceUrl] = useState(PROVIDERS.yemeksepeti.url);
  const [status, setStatus] =
    useState<DiscoveryObservation["deliveryStatus"]>("listed");
  const [error, setError] = useState("");
  const [time] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
  });
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const str = (key: string) => String(data.get(key) ?? "").trim();
    try {
      if (!data.get("listed"))
        throw new Error("Bu adres için listelendiğini gözlemlemeniz gerekli.");
      const observedAt = new Date(str("observedAt"));
      if (
        !Number.isFinite(observedAt.getTime()) ||
        observedAt.getTime() > Date.now() + 60_000
      )
        throw new Error("Gözlem zamanı geçersiz veya gelecekte.");
      onSave(
        validateDiscovery({
          id: crypto.randomUUID(),
          source: "MANUAL",
          platform,
          restaurant: str("restaurant"),
          branch: str("branch"),
          context: { ...context },
          sourceUrl,
          observedAt: observedAt.toISOString(),
          deliveryStatus: status,
          deliveryEvidence:
            status === "confirmed" ? str("deliveryEvidence") : "",
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt eklenemedi.");
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="discovery-form-title"
    >
      <form onSubmit={submit} className="observation-form">
        <div className="dialog-title">
          <div>
            <span className="eyebrow">MANUAL · RESTORAN KEŞFİ</span>
            <h2 id="discovery-form-title">Restoran gözlemi ekle</h2>
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
          Adres: <strong>{context.label}</strong>. Sepet veya fiyat gerekmez. Bu
          kayıt sizin beyanınızdır; sağlayıcı doğrulaması değildir.
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
              defaultValue={time}
            />
          </label>
          <label>
            Restoran adı
            <input name="restaurant" required maxLength={200} />
          </label>
          <label>
            Fiziksel şube
            <input name="branch" required maxLength={200} />
          </label>
        </div>
        <label>
          Resmî kaynak bağlantısı
          <input
            type="url"
            required
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </label>
        <label className="check">
          <input type="checkbox" name="listed" required />
          Bu adres seçiliyken restoranın platformda listelendiğini gördüm.
        </label>
        <label>
          Teslimat bilgisi
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="listed">Yalnız listelenme gözlendi</option>
            <option value="confirmed">Teslimat ayrıca doğrulandı</option>
          </select>
        </label>
        {status === "confirmed" && (
          <label>
            Teslimatı nasıl doğruladınız?
            <input
              name="deliveryEvidence"
              required
              maxLength={300}
              placeholder="Örn. seçili adrese teslimatın açıkça sunulduğu ekran"
            />
            <small>
              Yalnız listede görünmesi yeterli değildir. Gördüğünüz ek teslimat
              bilgisini yazın; özel adres veya hesap bilgisi yazmayın.
            </small>
          </label>
        )}
        <p className="footnote">
          Diğer platformdaki durum bu kayıtla belirlenmez. DeliveryLab sipariş
          vermez veya hesap bağlamaz.
        </p>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="submit">Restoran gözlemini kaydet</button>
          <button type="button" className="secondary" onClick={onClose}>
            Vazgeç
          </button>
        </div>
      </form>
    </dialog>
  );
}
