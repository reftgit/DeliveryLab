import { useState } from "react";
import { branchKey, PROVIDERS } from "../domain/model";
import type { BranchMatch, RestaurantRecord } from "../domain/model";

export function BranchMatcher({
  records,
  matches,
  onMatch,
}: {
  records: RestaurantRecord[];
  matches: BranchMatch[];
  onMatch: (left: string, right: string) => boolean;
}) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const used = new Set(matches.flatMap((m) => [m.left, m.right]));
  const branches = [
    ...new Map(records.map((o) => [branchKey(o), o])).entries(),
  ].filter(([key]) => !used.has(key));
  const a = branches.find(([key]) => key === left)?.[1],
    b = branches.find(([key]) => key === right)?.[1];
  const valid = a && b && a.platform !== b.platform && a.source === b.source;
  if (branches.length < 2) return null;
  return (
    <details className="branch-matcher panel">
      <summary>Fiyat olmadan da şube eşleştirin</summary>
      <p>
        İsim benzerliği yeterli değildir. Fiziksel şubeyi iki platformda kontrol
        edin. Bu onay teslimat veya fiyat doğrulaması değildir.
      </p>
      <div className="form-grid">
        {(["Birinci şube", "İkinci şube"] as const).map((label, i) => (
          <label key={label}>
            {label}
            <select
              value={i === 0 ? left : right}
              onChange={(e) => {
                (i === 0 ? setLeft : setRight)(e.target.value);
                setConfirmed(false);
              }}
            >
              <option value="">Şube seçin</option>
              {branches.map(([key, o]) => (
                <option key={key} value={key}>
                  {PROVIDERS[o.platform].name} · {o.restaurant} · {o.branch}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        Seçtiğim iki kaydın aynı fiziksel şube olduğunu ayrıca kontrol ettim.
      </label>
      <button
        disabled={!valid || !confirmed}
        onClick={() => {
          if (onMatch(left, right)) {
            setLeft("");
            setRight("");
            setConfirmed(false);
          }
        }}
      >
        Şube onayını kaydet
      </button>
      {!valid && left && right && (
        <p className="issue-text">
          Aynı veri türünden iki farklı platform seçin.
        </p>
      )}
    </details>
  );
}
