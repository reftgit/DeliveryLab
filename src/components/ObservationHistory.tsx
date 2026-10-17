import { money } from "../domain/comparison";
import { PROVIDERS } from "../domain/model";
import type { Observation } from "../domain/model";

export function ObservationHistory({
  observations,
}: {
  observations: Observation[];
}) {
  if (!observations.length) return null;
  return (
    <section
      className="observation-history panel"
      aria-labelledby="history-heading"
    >
      <h2 id="history-heading">
        Geçmiş adres gözlemleri{" "}
        <span className="count">{observations.length}</span>
      </h2>
      <p className="muted">
        Bu sepet fiyatı kayıtları önceki adres bağlamlarına aittir. Mevcut
        adrese teslimat veya güncel fiyat seçeneği değildir; karşılaştırmaya
        alınmaz. Gözlem zamanı ayrı tutulur: aynı adresin fiyatları da 30 dakika
        sonra eski sayılır.
      </p>
      <details>
        <summary>Geçmiş kayıtları göster ({observations.length})</summary>
        {observations.map((o) => (
          <details className="history-record" key={o.id}>
            <summary>
              {o.restaurant} · {o.branch} · {PROVIDERS[o.platform].name}
            </summary>
            <p>
              <span className="source-badge">{o.source}</span> · Önceki adres:{" "}
              {o.context.label}
            </p>
            <p>
              Koordinat:{" "}
              {o.context.latitude === null
                ? "Girilmedi"
                : `${o.context.latitude}, ${o.context.longitude}`}
            </p>
            <p>
              Gözlem zamanı: {new Date(o.observedAt).toLocaleString("tr-TR")}
            </p>
            <ul>
              {o.items.map((item, i) => (
                <li key={i}>
                  {item.quantity} × {item.name} · {item.portion} ·{" "}
                  {item.options || "Seçenek yok"} · {money(item.unitPrice)}/adet
                </li>
              ))}
            </ul>
            <dl className="costs">
              <div>
                <dt>Teslimat</dt>
                <dd>{money(o.deliveryFee)}</dd>
              </div>
              <div>
                <dt>Hizmet / diğer</dt>
                <dd>{money(o.serviceFee)}</dd>
              </div>
              <div>
                <dt>Minimum sepet</dt>
                <dd>{money(o.minimumOrder)}</dd>
              </div>
              <div>
                <dt>Minimum temeli</dt>
                <dd>
                  {o.minimumBasis === "unknown"
                    ? "Bilinmiyor"
                    : o.minimumBasis === "before-discount"
                      ? "İndirim öncesi"
                      : "İndirim sonrası"}
                </dd>
              </div>
              <div>
                <dt>Kaynakta görülen toplam</dt>
                <dd>
                  {o.observedTotal === null
                    ? "Girilmedi"
                    : money(o.observedTotal)}
                </dd>
              </div>
              <div>
                <dt>Teslimat tahmini</dt>
                <dd>{o.eta || "Bilinmiyor"}</dd>
              </div>
            </dl>
            <p>
              Önceki adrese teslimat beyanı:{" "}
              {o.deliveryConfirmed ? "Gözlendi" : "Doğrulanmadı"}
            </p>
            <p>İndirimler: {o.discounts.length ? "" : "Kaydedilmedi"}</p>
            {o.discounts.map((discount, i) => (
              <p key={i}>
                {discount.id} · {money(discount.amount)} ·{" "}
                {discount.eligible === null
                  ? "Uygunluk bilinmiyor"
                  : discount.eligible
                    ? "Uygun"
                    : "Uygun değil"}
              </p>
            ))}
            <a
              href={o.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
            >
              Resmî kaynak ↗
            </a>
          </details>
        ))}
      </details>
    </section>
  );
}
