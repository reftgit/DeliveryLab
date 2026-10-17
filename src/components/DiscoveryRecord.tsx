import { evaluateDiscovery } from "../domain/discovery";
import { PROVIDERS } from "../domain/model";
import type { DeliveryContext, DiscoveryObservation } from "../domain/model";

export function DiscoveryRecord({
  record,
  context,
  now,
  onDelete,
}: {
  record: DiscoveryObservation;
  context: DeliveryContext;
  now: number;
  onDelete?: () => void;
}) {
  const evaluation = evaluateDiscovery(record, context, now);
  return (
    <div className="observation-row discovery-record">
      <div className="observation-top">
        <span className={"provider-label " + record.platform}>
          {PROVIDERS[record.platform].name}
        </span>
        <span className="source-badge">MANUAL · Restoran keşfi</span>
      </div>
      <p>
        {record.deliveryStatus === "listed"
          ? "Bu adres için listelenme gözlendi · Teslimat ayrıca doğrulanmadı"
          : "Teslimat ayrıca doğrulandı · Kullanıcı beyanı"}
      </p>
      <p className="muted">
        {evaluation.current
          ? "Son 30 dakika içinde gözlendi; teslimat garantisi değildir."
          : "Eski veya geçersiz kayıt; güncel teslimat kanıtı değildir."}
      </p>
      {evaluation.issues.map((issue) => (
        <p className="issue-text" key={issue}>
          {issue}
        </p>
      ))}
      <details>
        <summary>Restoran gözlemi ayrıntıları</summary>
        <p>
          {record.context.label} ·{" "}
          {new Date(record.observedAt).toLocaleString("tr-TR")}
        </p>
        {record.context.latitude !== null && (
          <p>
            Koordinat: {record.context.latitude}, {record.context.longitude}
          </p>
        )}
        {record.deliveryEvidence && (
          <p>Ek teslimat gözlemi: {record.deliveryEvidence}</p>
        )}
        <a
          href={record.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          Resmî kaynak ↗
        </a>
        {onDelete && (
          <button className="text-button danger" onClick={onDelete}>
            Restoran gözlemini sil
          </button>
        )}
      </details>
    </div>
  );
}

export function DiscoveryHistory({
  records,
  context,
  now,
}: {
  records: DiscoveryObservation[];
  context: DeliveryContext;
  now: number;
}) {
  if (!records.length) return null;
  return (
    <section
      className="discovery-history observation-history panel"
      aria-labelledby="discovery-history-heading"
    >
      <h2 id="discovery-history-heading">
        Geçmiş restoran keşifleri{" "}
        <span className="count">{records.length}</span>
      </h2>
      <p className="muted">
        Önceki adres bağlamlarının sepetsiz kayıtlarıdır. Mevcut adrese teslimat
        veya fiyat kanıtı sayılmaz.
      </p>
      <details>
        <summary>Geçmiş restoran kayıtlarını göster ({records.length})</summary>
        {records.map((record) => (
          <div className="history-record" key={record.id}>
            <h3>
              {record.restaurant} · {record.branch}
            </h3>
            <DiscoveryRecord record={record} context={context} now={now} />
          </div>
        ))}
      </details>
    </section>
  );
}
