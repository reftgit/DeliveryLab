import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { ContextEditor } from "./components/Editors";
import { ObservationForm } from "./components/ObservationForm";
import { Comparison } from "./components/Comparison";
import { ObservationHistory } from "./components/ObservationHistory";
import { collectObservations, localAdapters } from "./domain/adapters";
import { evaluateQuote, groupRestaurants, money } from "./domain/comparison";
import { demoWorkspace } from "./domain/demo";
import { partitionObservations } from "./domain/context";
import {
  branchKey,
  emptyWorkspace,
  normalize,
  PLATFORMS,
  PROVIDERS,
  sameDeliveryContext,
} from "./domain/model";
import type { Observation, Platform, Workspace } from "./domain/model";
import {
  exportWorkspace,
  MAX_IMPORT_BYTES,
  parseImport,
  STORAGE_KEY,
  validateWorkspace,
} from "./domain/storage";

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { workspace: raw ? parseImport(raw) : emptyWorkspace(), error: "" };
  } catch {
    return {
      workspace: emptyWorkspace(),
      error:
        "Yerel kayıt okunamadı. Mevcut depolamanın üzerine yazılmadı; yeni değişiklikler yalnızca bu oturumda tutulacak.",
    };
  }
}
export default function App() {
  const [initial] = useState(loadLocal);
  const [manual, setManual] = useState(initial.workspace);
  const [storageError, setStorageError] = useState(initial.error);
  const [demo, setDemo] = useState<Workspace | null>(null);
  const workspace = demo ?? manual;
  const [loaded, setLoaded] = useState<{
    observations: Observation[];
    errors: { platform: Platform; message: string }[];
  }>({ observations: [], errors: [] });
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Platform | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [pendingImport, setPendingImport] = useState<Workspace | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    let active = true;
    void collectObservations(
      localAdapters(workspace.observations, demo ? "DEMO" : "MANUAL"),
    ).then((result) => {
      if (active) setLoaded(result);
    });
    return () => {
      active = false;
    };
  }, [workspace.observations, Boolean(demo)]);
  const observations = loaded.observations.filter(
    (o) => o.source === (demo ? "DEMO" : "MANUAL"),
  );
  const { current, history } = partitionObservations(
    observations,
    workspace.context,
  );
  const groups = useMemo(
    () => groupRestaurants(current, workspace.matches),
    [current, workspace.matches],
  );
  const visible = groups.filter((group) =>
    group.some(
      (o) =>
        (filter === "all" || o.platform === filter) &&
        normalize(o.restaurant + " " + o.branch).includes(normalize(query)),
    ),
  );
  const selectedObservations = selected.flatMap((id) =>
    current.filter((o) => o.id === id),
  );
  function save(value: Workspace) {
    try {
      const valid = validateWorkspace(value, demo ? ["DEMO"] : ["MANUAL"]);
      if (!sameDeliveryContext(valid.context, workspace.context))
        setSelected([]);
      if (demo) setDemo(valid);
      else {
        const encoded = exportWorkspace(valid);
        setManual(valid);
        if (!storageError) {
          try {
            localStorage.setItem(STORAGE_KEY, encoded);
          } catch {
            setStorageError(
              "Depolama dolu veya kullanılamıyor. Veriler bu oturumda tutuluyor; JSON olarak dışa aktarın.",
            );
          }
        }
      }
      setNow(Date.now());
      return true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Değişiklik kaydedilemedi.");
      return false;
    }
  }
  function toggleSelection(id: string) {
    if (selected.includes(id)) setSelected(selected.filter((v) => v !== id));
    else if (selected.length < 2) setSelected([...selected, id]);
    else
      setNotice(
        "Yeni bir gözlem seçmeden önce seçili gözlemlerden birini çıkarın.",
      );
  }
  function exportData() {
    try {
      const blob = new Blob([exportWorkspace(manual)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob),
        anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        "deliverylab-export-" + new Date().toISOString().slice(0, 10) + ".json";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Dışa aktarılamadı.");
    }
  }
  async function importData(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES)
        throw new Error("Dosya en fazla 1 MB olabilir.");
      setPendingImport(parseImport(await file.text()));
      setNotice("");
    } catch (e) {
      setNotice(
        (e instanceof Error ? e.message : "Dosya okunamadı.") +
          " Mevcut kayıtlar korundu.",
      );
    }
  }
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark" aria-hidden="true">
            d.
          </span>
          Delivery<span>Lab</span>
        </a>
        <div className="topbar-right">
          <span className="local-status">
            <span />
            Yalnızca cihazınızda
          </span>
          <button
            className={"mode-button " + (demo ? "active" : "")}
            aria-pressed={Boolean(demo)}
            onClick={() => {
              setDemo(demo ? null : demoWorkspace());
              setSelected([]);
              setQuery("");
              setFilter("all");
              setNotice("");
            }}
          >
            {demo ? "Demodan çık" : "Demoyu keşfet"}
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">TÜRKİYE · RESTORAN & FAST FOOD</p>
            <h1>
              Aynı sepet.
              <br />
              <span>Daha net bir seçim.</span>
            </h1>
            <p className="hero-copy">
              Platformlarda gördüğünüz fiyatları bir araya getirin.
              <br className="desktop-only" /> Ürünleri, ücretleri ve koşulları
              birlikte karşılaştırın.
            </p>
          </div>
          <div className="hero-note">
            <span className="note-icon" aria-hidden="true">
              ↗
            </span>
            <span>FİZİBİLİTE PROTOTİPİ · FAZ 1</span>
            <strong>
              Karar vermek için
              <br />
              önce veriyi görün.
            </strong>
            <p>
              İki platform. Şeffaf hesaplama.
              <br />
              Hesap bağlamadan, yerel kayıtlarla.
            </p>
          </div>
        </section>
        <div className={"data-banner " + (demo ? "demo" : "")}>
          <span className="source-badge">{demo ? "DEMO" : "MANUAL"}</span>
          <div>
            <strong>
              {demo
                ? "Tamamen sentetik örnekleri inceliyorsunuz."
                : "Canlı bağlantı yok. Kontrol sizde."}
            </strong>
            <p>
              {demo
                ? "Restoranlar ve fiyatlar uydurmadır. Manuel kayıtlarınızdan ayrı tutulur ve kaydedilmez."
                : "Yemeksepeti ve Uber Eats Trendyol Go için kendi gözlemlerinizi ekleyin. Canlı keşif ve canlı fiyat doğrulaması mevcut değil."}
            </p>
          </div>
          <span className="banner-dot" aria-hidden="true" />
        </div>
        {storageError && (
          <div className="error-message" role="alert">
            {storageError}
            <button
              className="text-button"
              onClick={() => {
                if (
                  window.confirm(
                    "Okunamayan yerel kaydı silip bu oturumdaki kayıtlarla değiştirmek istiyor musunuz?",
                  )
                ) {
                  try {
                    localStorage.setItem(STORAGE_KEY, exportWorkspace(manual));
                    setStorageError("");
                  } catch {
                    setNotice(
                      "Yerel depolama hâlâ kullanılamıyor. JSON dışa aktarmayı kullanın.",
                    );
                  }
                }
              }}
            >
              Yerel depolamayı bu oturumla değiştir
            </button>
          </div>
        )}
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button
              className="icon-button"
              aria-label="Bildirimi kapat"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}
        {pendingImport && (
          <section className="panel import-review">
            <h2>İçe aktarımı kontrol edin</h2>
            <p>
              {pendingImport.observations.length} MANUAL gözlem, adres ve sepet
              bilgileri mevcut manuel çalışma alanınızın yerini alacak. Mevcut
              kayıtlarınızı önce dışa aktarabilirsiniz.
            </p>
            <div className="actions">
              <button
                onClick={() => {
                  if (save(pendingImport)) {
                    setPendingImport(null);
                    setSelected([]);
                    setEditorVersion((v) => v + 1);
                    setNotice("Manuel kayıtlar içe aktarıldı.");
                  }
                }}
              >
                Kayıtları değiştir ve içe aktar
              </button>
              <button
                className="secondary"
                onClick={() => setPendingImport(null)}
              >
                Vazgeç
              </button>
            </div>
          </section>
        )}
        <ContextEditor
          key={(demo ? "demo" : "manual") + editorVersion}
          workspace={workspace}
          onSave={save}
        />
        <section className="discovery" aria-labelledby="discovery-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MEVCUT ADRESTE GÖZLENEN ŞUBELER</p>
              <h2 id="discovery-heading">
                Restoran keşfi <span className="count">{groups.length}</span>
              </h2>
            </div>
            <button
              disabled={
                Boolean(demo) ||
                !workspace.context.label ||
                !workspace.basket.items.length
              }
              onClick={() => setShowForm(true)}
            >
              ＋ Gözlem ekle
            </button>
          </div>
          <p className="muted">
            {workspace.context.label || "Henüz adres belirlenmedi"} · Yalnızca
            bu adres bağlamındaki kayıtlar. Teslimat uygunluğu kullanıcı
            beyanıdır.
          </p>
          <div className="filterbar">
            <label className="search">
              <span aria-hidden="true">⌕</span>
              <input
                aria-label="Restoran veya şube ara"
                type="search"
                placeholder="Restoran veya şube ara…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div
              className="platform-filters"
              role="group"
              aria-label="Platform filtresi"
            >
              <button
                className={filter === "all" ? "selected" : ""}
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
              >
                Tümü
              </button>
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  className={filter === p ? "selected" : ""}
                  aria-pressed={filter === p}
                  onClick={() => setFilter(p)}
                >
                  {PROVIDERS[p].name}
                </button>
              ))}
            </div>
          </div>
          {loaded.errors.map((e) => (
            <p className="error-message" key={e.platform}>
              {PROVIDERS[e.platform].name}: {e.message}
            </p>
          ))}
          {visible.length === 0 ? (
            <div className="empty-state panel">
              <div className="empty-icon" aria-hidden="true">
                ＋
              </div>
              <h3>
                {current.length
                  ? "Aramanıza uyan kayıt bulunamadı."
                  : history.length
                    ? "Bu adres için henüz gözlem yok."
                    : "İlk gözleminizle başlayın."}
              </h3>
              <p>
                {current.length
                  ? "Aramayı veya platform filtresini değiştirin."
                  : history.length
                    ? "Önceki adres kayıtları geçmiş alanında korunuyor. Bu adres için platformları yeniden kontrol edip gözlem ekleyin."
                    : "Önce adresinizi ve karşılaştıracağınız sepeti kaydedin. Ardından platformlarda gördüğünüz bilgileri ekleyin."}
              </p>
              {!observations.length && (
                <button
                  className="secondary"
                  onClick={() => {
                    setDemo(demoWorkspace());
                    setSelected([]);
                  }}
                >
                  Örnek verilerle deneyin
                </button>
              )}
            </div>
          ) : (
            <div className="restaurant-grid">
              {visible.map((group) => {
                const first = group[0],
                  platforms = new Set(group.map((o) => o.platform));
                return (
                  <article
                    className="restaurant-card panel"
                    key={branchKey(first)}
                  >
                    <div className="restaurant-heading">
                      <span className="restaurant-avatar" aria-hidden="true">
                        {first.restaurant.slice(0, 1)}
                      </span>
                      <div>
                        <h3>{first.restaurant}</h3>
                        <p>{first.branch}</p>
                      </div>
                      <span className="source-badge">{first.source}</span>
                    </div>
                    <p
                      className={
                        "branch-status " +
                        (platforms.size === 2 ? "matched" : "")
                      }
                    >
                      {platforms.size === 2
                        ? "✓ Şube eşleşmesi kullanıcı tarafından onaylandı"
                        : "Diğer platform doğrulanamadı"}
                    </p>
                    {group
                      .filter((o) => filter === "all" || o.platform === filter)
                      .map((o) => {
                        const evaluation = evaluateQuote(
                          o,
                          workspace.context,
                          workspace.basket,
                          now,
                        );
                        return (
                          <div
                            className={
                              "observation-row " +
                              (selected.includes(o.id) ? "is-selected" : "")
                            }
                            key={o.id}
                          >
                            <div className="observation-top">
                              <span className={"provider-label " + o.platform}>
                                {PROVIDERS[o.platform].name}
                              </span>
                              <strong>
                                {evaluation.total === null
                                  ? "Toplam eksik"
                                  : money(evaluation.total)}
                              </strong>
                            </div>
                            <div className="observation-meta">
                              <span>
                                {new Date(o.observedAt).toLocaleTimeString(
                                  "tr-TR",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}{" "}
                                ·{" "}
                                {evaluation.issues.length
                                  ? "Kontrol gerekli"
                                  : "Girdiler eksiksiz"}
                              </span>
                              <button
                                className={
                                  selected.includes(o.id)
                                    ? "small-button chosen"
                                    : "small-button"
                                }
                                aria-pressed={selected.includes(o.id)}
                                onClick={() => toggleSelection(o.id)}
                              >
                                {selected.includes(o.id)
                                  ? "Seçimi kaldır"
                                  : "Karşılaştır"}
                              </button>
                            </div>
                            <details>
                              <summary>Gözlem ayrıntıları</summary>
                              <p>
                                {o.context.label} ·{" "}
                                {new Date(o.observedAt).toLocaleString("tr-TR")}
                              </p>
                              <ul>
                                {o.items.map((i, n) => (
                                  <li key={n}>
                                    {i.quantity} × {i.name} · {i.portion} ·{" "}
                                    {i.options || "Seçenek yok"}
                                  </li>
                                ))}
                              </ul>
                              {evaluation.issues.map((issue) => (
                                <p className="issue-text" key={issue}>
                                  {issue}
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
                              <button
                                className="text-button danger"
                                onClick={() => {
                                  if (
                                    window.confirm("Bu gözlem silinsin mi?")
                                  ) {
                                    const rest = workspace.observations.filter(
                                      (r) => r.id !== o.id,
                                    );
                                    const remaining = new Set(
                                      rest.map(branchKey),
                                    );
                                    if (
                                      save({
                                        ...workspace,
                                        observations: rest,
                                        matches: workspace.matches.filter(
                                          (m) =>
                                            remaining.has(m.left) &&
                                            remaining.has(m.right),
                                        ),
                                      })
                                    )
                                      setSelected(
                                        selected.filter((id) => id !== o.id),
                                      );
                                  }
                                }}
                              >
                                Gözlemi sil
                              </button>
                            </details>
                          </div>
                        );
                      })}
                    {platforms.size === 2 && (
                      <button
                        className="text-button"
                        onClick={() =>
                          save({
                            ...workspace,
                            matches: workspace.matches.filter(
                              (m) =>
                                m.left !== branchKey(first) &&
                                m.right !== branchKey(first),
                            ),
                          })
                        }
                      >
                        Şube eşleştirmesini geri al
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <Comparison
          key={selected.join("|")}
          observations={selectedObservations}
          workspace={workspace}
          now={now}
          onMatch={(left, right) =>
            save({
              ...workspace,
              matches: [...workspace.matches, { left, right }],
            })
          }
        />
        <ObservationHistory observations={history} />
        <section className="data-tools panel">
          <div>
            <h2>Kayıtlarınız, sizin cihazınızda.</h2>
            <p>
              JSON dosyası adres ve gözlem bilgilerinizi içerir. Özel
              dosyalarınızı depoya yüklemeyin. İçe aktarım yalnızca MANUAL
              kayıtları kabul eder.
            </p>
          </div>
          <div className="actions">
            <button
              className="secondary"
              disabled={Boolean(demo)}
              onClick={exportData}
            >
              JSON dışa aktar ↓
            </button>
            <label className={"file-button " + (demo ? "disabled" : "")}>
              JSON içe aktar ↑
              <input
                aria-label="JSON içe aktar"
                type="file"
                accept="application/json,.json"
                disabled={Boolean(demo)}
                onChange={importData}
              />
            </label>
          </div>
        </section>
        <footer>
          <span>
            DeliveryLab <span className="muted">/ Faz 1</span>
          </span>
          <span>Canlı veri yok · Gerçek sipariş yok · Yerel çalışma</span>
        </footer>
      </main>
      {showForm && (
        <ObservationForm
          workspace={workspace}
          onClose={() => setShowForm(false)}
          onSave={(o) => {
            if (
              save({
                ...workspace,
                observations: [...workspace.observations, o],
              })
            ) {
              setShowForm(false);
              setNotice(
                "MANUAL gözlem eklendi. Kaynak doğrulaması kullanıcı beyanına dayanır.",
              );
            }
          }}
        />
      )}
    </>
  );
}
