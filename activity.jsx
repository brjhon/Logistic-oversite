/* EIXO — Histórico geral (feed unificado de toda a operação) */
const { useState: useStateH, useMemo: useMemoH } = React;

function GlobalHistory({ orders, chamados, query, onOpenPedido, onOpenChamado }) {
  const H = window.HIST;
  const [tipo, setTipo] = useStateH("tudo"); // tudo | pedidos | chamados

  const eventos = useMemoH(() => {
    const all = [];
    orders.forEach((o) => (o.historico || []).forEach((e) =>
      all.push({ ...e, src: { kind: "pedido", num: o.numero, id: o.id, titulo: o.cliente } })));
    chamados.forEach((c) => (c.historico || []).forEach((e) =>
      all.push({ ...e, src: { kind: "chamado", num: c.numero, id: c.id, titulo: c.titulo } })));
    return all.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  }, [orders, chamados]);

  const filtrados = useMemoH(() => {
    const q = (query || "").trim().toLowerCase();
    return eventos.filter((e) => {
      if (tipo === "pedidos" && e.src.kind !== "pedido") return false;
      if (tipo === "chamados" && e.src.kind !== "chamado") return false;
      if (!q) return true;
      return e.texto.toLowerCase().includes(q) || e.src.num.toLowerCase().includes(q) ||
        (e.src.titulo || "").toLowerCase().includes(q) || (e.user && e.user.nome.toLowerCase().includes(q));
    });
  }, [eventos, tipo, query]);

  // agrupar por dia
  const grupos = useMemoH(() => {
    const g = {};
    filtrados.forEach((e) => {
      const d = new Date(e.ts);
      const key = isNaN(d) ? "—" : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      (g[key] = g[key] || []).push(e);
    });
    return Object.entries(g);
  }, [filtrados]);

  const segs = [
    { k: "tudo", label: "Tudo", n: eventos.length },
    { k: "pedidos", label: "Pedidos", n: eventos.filter((e) => e.src.kind === "pedido").length },
    { k: "chamados", label: "Chamados", n: eventos.filter((e) => e.src.kind === "chamado").length },
  ];

  return (
    <div className="ex-hist">
      <div className="ex-hist-toolbar">
        <div className="ex-seg ex-seg--hist">
          {segs.map((s) => (
            <button key={s.k} className={tipo === s.k ? "is-on" : ""} onClick={() => setTipo(s.k)}>
              {s.label} <span className="ex-seg-ct">{s.n}</span>
            </button>
          ))}
        </div>
        <div className="ex-hist-count">{filtrados.length} registro(s)</div>
      </div>

      {grupos.length === 0 ? (
        <div className="ex-empty">Nenhum registro encontrado.</div>
      ) : (
        <div className="ex-hist-feed">
          {grupos.map(([dia, evs]) => (
            <div className="ex-hist-day" key={dia}>
              <div className="ex-hist-daylbl"><span>{dia}</span></div>
              <div className="ex-tl">
                {evs.map((e) => {
                  const meta = H.EVENTS[e.tipo] || H.EVENTS.comentou;
                  const I = Icons[meta.ico] || Icons.doc;
                  const isPed = e.src.kind === "pedido";
                  return (
                    <div className="ex-tl-row" key={e.id + e.src.id}>
                      <span className="ex-tl-ico" style={{ color: meta.cor, background: meta.cor + "16", borderColor: meta.cor + "33" }}><I size={13} /></span>
                      <div className="ex-tl-body">
                        <div className="ex-tl-text">{e.texto}</div>
                        <div className="ex-tl-meta">
                          <button className={"ex-hist-src " + (isPed ? "is-ped" : "is-cham")}
                            onClick={() => isPed ? onOpenPedido(e.src.num) : onOpenChamado(e.src.id)}>
                            {isPed ? <Icons.box size={11} /> : <Icons.ticket size={11} />} {e.src.num}
                          </button>
                          <Avatar user={e.user} size={17} /> {e.user ? e.user.nome : "Sistema"} · {H.fmtDateTime(e.ts)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { GlobalHistory });
