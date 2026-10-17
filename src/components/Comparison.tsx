import { useState } from "react";
import { compareQuotes, money, sameBranch } from "../domain/comparison";
import { branchKey, PROVIDERS } from "../domain/model";
import type { Observation, Workspace } from "../domain/model";

export function Comparison({
  observations,
  workspace,
  now,
  onMatch,
}: {
  observations: Observation[];
  workspace: Workspace;
  now: number;
  onMatch: (left: string, right: string) => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const result = compareQuotes(
    observations,
    workspace.context,
    workspace.basket,
    workspace.matches,
    now,
  );
  const canMatch =
    observations.length === 2 &&
    observations[0].platform !== observations[1].platform &&
    observations[0].source === observations[1].source &&
    !sameBranch(observations[0], observations[1], workspace.matches);
  return (
    <section
      className="comparison panel"
      aria-labelledby="compare-heading"
      id="comparison"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">AYNI ŞUBE · AYNI SEPET</span>
          <h2 id="compare-heading">Sepet karşılaştırması</h2>
        </div>
        <span className="count">{observations.length}/2</span>
      </div>
      {!observations.length && (
        <div className="comparison-empty">
          <span aria-hidden="true">⇄</span>
          <h3>İki gözlemi yan yana getirin</h3>
          <p>
            Listedeki farklı platformlardan iki kayıt seçin. Ücretleri ve
            koşulları burada birlikte görün.
          </p>
        </div>
      )}
      {result.evaluations.length > 0 && (
        <div className="quote-grid">
          {result.evaluations.map((e) => (
            <article
              className={
                "quote " +
                (result.winnerIds.includes(e.observation.id) ? "winner" : "")
              }
              key={e.observation.id}
            >
              <span className={"provider-label " + e.observation.platform}>
                {PROVIDERS[e.observation.platform].name}
              </span>
              <h3>{e.observation.restaurant}</h3>
              <p className="muted">{e.observation.branch}</p>
              <span className="source-badge">
                {e.observation.source} ·{" "}
                {e.observation.source === "DEMO"
                  ? "Sentetik örnek"
                  : "Kullanıcı beyanı"}
              </span>
              <dl className="costs">
                <div>
                  <dt>Ürün toplamı</dt>
                  <dd>{money(e.subtotal)}</dd>
                </div>
                <div>
                  <dt>Teslimat</dt>
                  <dd>{money(e.observation.deliveryFee)}</dd>
                </div>
                <div>
                  <dt>Hizmet / diğer</dt>
                  <dd>{money(e.observation.serviceFee)}</dd>
                </div>
                <div>
                  <dt>Uygun indirim</dt>
                  <dd>−{money(e.discount)}</dd>
                </div>
                <div className="total">
                  <dt>Hesaplanan</dt>
                  <dd>{e.total === null ? "Eksik tutar" : money(e.total)}</dd>
                </div>
                <div>
                  <dt>Kaynakta görülen</dt>
                  <dd>
                    {e.observation.observedTotal === null
                      ? "Girilmedi"
                      : money(e.observation.observedTotal)}
                  </dd>
                </div>
                <div>
                  <dt>Minimum sepet</dt>
                  <dd>{money(e.observation.minimumOrder)}</dd>
                </div>
                <div>
                  <dt>Teslimat tahmini</dt>
                  <dd>{e.observation.eta || "Bilinmiyor"}</dd>
                </div>
              </dl>
              <details>
                <summary>Ürünleri ve bağlamı gör</summary>
                <ul>
                  {e.observation.items.map((i, n) => (
                    <li key={n}>
                      {i.quantity} × {i.name} · {i.portion} ·{" "}
                      {i.options || "Seçenek yok"} · {money(i.unitPrice)}/adet
                    </li>
                  ))}
                </ul>
                <p>{e.observation.context.label}</p>
                <p>
                  {new Date(e.observation.observedAt).toLocaleString("tr-TR")}
                </p>
              </details>
              {e.issues.length > 0 ? (
                <ul className="issues">
                  {e.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              ) : (
                <p className="valid-note">
                  Girdiler eksiksiz · sağlayıcı doğrulaması değil
                </p>
              )}
              {result.winnerIds.includes(e.observation.id) && (
                <strong className="winner-label">
                  {result.winnerIds.length === 2
                    ? "Toplamlar eşit"
                    : "Bu iki gözlemde en ucuz"}
                  {e.observation.source === "DEMO" ? " · DEMO" : ""}
                </strong>
              )}
              <a
                className="platform-link"
                href={e.observation.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                Platformda aç <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      )}
      {result.reason && (
        <p className="comparison-status" role="status">
          {result.reason}
        </p>
      )}
      {canMatch && (
        <div className="match-box">
          <h3>Şube eşleşmesi sizin kontrolünüzde</h3>
          <p>
            İsim benzerliği yeterli değildir. Fiziksel adresi ve şubeyi iki
            platformda kontrol edin.
          </p>
          <label className="check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            İki kaydın aynı fiziksel şubeye ait olduğunu kontrol ettim.
          </label>
          <button
            disabled={!confirmed}
            onClick={() => {
              onMatch(branchKey(observations[0]), branchKey(observations[1]));
              setConfirmed(false);
            }}
          >
            Şubeleri eşleştir
          </button>
        </div>
      )}
      <p className="footnote">
        Bağlantı yalnızca platformu açar. Sepet aktarılmaz; DeliveryLab sipariş
        veya ödeme işlemi yapmaz. Son tutarı platformda yeniden kontrol edin.
      </p>
    </section>
  );
}
