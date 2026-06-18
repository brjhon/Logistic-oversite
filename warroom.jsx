/* EIXO — Sala de Guerra (painel ao vivo) + Toasts (pop-ups) */
const { useState: useStateW, useEffect: useEffectW, useMemo: useMemoW, useRef: useRefW } = React;

/* ===================== TOASTS ===================== */
const TOAST_META = {
  pedido:  { ico: "box",    cor: "#2F6FCF", titulo: "Novo pedido" },
  chamado: { ico: "ticket", cor: "#B66A12", titulo: "Chamado aberto" },
  glpi:    { ico: "send",   cor: "#2C3E66", titulo: "Enviado ao GLPI" },
  entrega: { ico: "pen",    cor: "#1F7A45", titulo: "Entrega assinada" },
  alerta:  { ico: "alert",  cor: "#B42318", titulo: "Atenção" },
  ok:      { ico: "check",  cor: "#1F7A45", titulo: "Concluído" },
};

function ToastStack({ toasts, onClose }) {
  return (
    <div className="ex-toasts">
      {toasts.map((t) => {
        const m = TOAST_META[t.type] || TOAST_META.ok;
        const I = Icons[m.ico] || Icons.bell;
        return (
          <div className="ex-toast" key={t.id} style={{ "--tc": m.cor }} onClick={() => onClose(t.id)}>
            <span className="ex-toast-ico"><I size={18} /></span>
            <div className="ex-toast-tx">
              <strong>{t.title || m.titulo}</strong>
              <span>{t.msg}</span>
            </div>
            <button className="ex-toast-x" onClick={(e) => { e.stopPropagation(); onClose(t.id); }} aria-label="Fechar"><Icons.x size={13} /></button>
            <span className="ex-toast-bar" />
          </div>
        );
      })}
    </div>
  );
}

/* ===================== SALA DE GUERRA ===================== */
function WarRoom({ orders, chamados, pushToast, onOpenPedido, onOpenChamado, showValues = true }) {
  const EX = window.EIXO, CH = window.CHAM, H = window.HIST;
  const [now, setNow] = useStateW(new Date());
  const [live, setLive] = useStateW(false);
  const [pulse, setPulse] = useStateW(null);
  const liveRef = useRefW(live); liveRef.current = live;

  useEffectW(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  // modo ao vivo (demo): dispara eventos de ambiente periodicamente
  useEffectW(() => {
    if (!live) return;
    const gen = () => {
      const o = orders[Math.floor(Math.random() * orders.length)];
      const c = chamados[Math.floor(Math.random() * chamados.length)];
      const opts = [
        { type: "pedido", title: "Pedido em movimento", msg: `${o.numero} · ${o.cliente}` },
        { type: "glpi", title: "Sincronizado ao GLPI", msg: `${c.numero} · ticket #${CH.genGlpiId()}` },
        { type: "chamado", title: "Chamado atualizado", msg: `${c.numero} · ${c.categoria}` },
        { type: "entrega", title: "Entrega confirmada", msg: `${o.numero} · ${o.cliente}` },
        { type: "ok", title: "Conferência concluída", msg: `${o.numero} sem divergências` },
      ];
      const e = opts[Math.floor(Math.random() * opts.length)];
      pushToast(e);
      setPulse({ k: e.type, t: Date.now() });
    };
    const t = setInterval(gen, 3800);
    return () => clearInterval(t);
  }, [live, orders, chamados]);

  const m = useMemoW(() => ({
    ativos: orders.filter((o) => o.status !== "concluido").length,
    transito: orders.filter((o) => o.status === "transito").length,
    chegando: orders.filter((o) => o.status === "chegou").length,
    atrasados: orders.filter(EX.isLate).length,
    chamados: chamados.filter(CH.isOpen).length,
    urgentes: chamados.filter((c) => CH.isOpen(c) && (c.prioridade === "urgente" || c.prioridade === "alta")).length,
    glpiPend: chamados.filter((c) => !c.glpi.sent).length,
    glpiOk: chamados.filter((c) => c.glpi.sent).length,
    valor: orders.filter((o) => o.status !== "concluido").reduce((s, o) => s + EX.orderTotal(o), 0),
  }), [orders, chamados]);

  const feed = useMemoW(() => {
    const all = [];
    orders.forEach((o) => (o.historico || []).forEach((e) => all.push({ ...e, src: { kind: "pedido", num: o.numero, id: o.id } })));
    chamados.forEach((c) => (c.historico || []).forEach((e) => all.push({ ...e, src: { kind: "chamado", num: c.numero, id: c.id } })));
    return all.sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 14);
  }, [orders, chamados]);

  const glpiPct = m.glpiOk + m.glpiPend ? Math.round((m.glpiOk / (m.glpiOk + m.glpiPend)) * 100) : 100;
  const hh = (n) => String(n).padStart(2, "0");
  const clock = `${hh(now.getHours())}:${hh(now.getMinutes())}:${hh(now.getSeconds())}`;

  // blips do radar a partir dos pedidos ativos
  const blips = useMemoW(() => orders.filter((o) => o.status !== "concluido").slice(0, 9).map((o, i) => {
    let h = 0; for (const ch of o.numero) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const ang = (h % 360) * Math.PI / 180;
    const rad = 26 + (h % 70);
    const late = EX.isLate(o);
    return { x: 110 + Math.cos(ang) * rad, y: 110 + Math.sin(ang) * rad, cor: late ? "#ff5c4d" : o.status === "transito" ? "#34e7d4" : "#7fd8ff", num: o.numero };
  }), [orders]);

  const Tile = ({ k, label, value, cor, sub }) => (
    <div className={"wr-tile" + (pulse && pulse.k === k ? " is-pulse" : "")} style={{ "--c": cor }}>
      <div className="wr-tile-v">{value}</div>
      <div className="wr-tile-l">{label}</div>
      {sub ? <div className="wr-tile-s">{sub}</div> : null}
    </div>
  );

  return (
    <div className="wr">
      <div className="wr-top">
        <div className="wr-status">
          <span className="wr-live"><span className="wr-live-dot" /> OPERAÇÃO AO VIVO</span>
          <span className="wr-sys">EIXO-OPS // NODE-01</span>
          <span className="wr-loc">Pátio Central · Pavilhão B</span>
        </div>
        <div className="wr-right">
          <button className={"wr-livebtn" + (live ? " is-on" : "")} onClick={() => setLive((v) => !v)}>
            <Icons.bolt size={14} /> {live ? "AO VIVO: LIGADO" : "ATIVAR MODO AO VIVO"}
          </button>
          <div className="wr-clock">{clock}</div>
        </div>
      </div>

      <div className="wr-ticker">
        <span className="wr-ticker-tag">SYS://</span>
        <div className="wr-ticker-track">
          {[0, 1].map((k) => (
            <React.Fragment key={k}>
              <span>ATIVOS <b>{m.ativos}</b></span><span>TRÂNSITO <b>{m.transito}</b></span>
              <span>CHEGANDO <b>{m.chegando}</b></span><span>ATRASADOS <b>{m.atrasados}</b></span>
              <span>CHAMADOS <b>{m.chamados}</b></span><span>URGENTES <b>{m.urgentes}</b></span>
              <span>GLPI_SYNC <b>{glpiPct}%</b></span><span>EM_ABERTO <b>{showValues ? EX.BRL(m.valor) : "RESTRITO"}</b></span>
              <span>UPLINK <b>OK</b></span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="wr-tiles">
        <Tile k="pedido" label="Pedidos ativos" value={m.ativos} cor="#3B9EFF" sub={showValues ? `${EX.BRL(m.valor)} em aberto` : "valores restritos"} />
        <Tile k="entrega" label="Em trânsito" value={m.transito} cor="#5a86c4" sub="a caminho" />
        <Tile k="ok" label="Chegando" value={m.chegando} cor="#E0A33E" sub="aguardando conferência" />
        <Tile k="alerta" label="Atrasados" value={m.atrasados} cor="#FF5C4D" sub="exigem ação" />
        <Tile k="chamado" label="Chamados abertos" value={m.chamados} cor="#E0A33E" sub={`${m.urgentes} urgentes`} />
        <Tile k="glpi" label="GLPI pendentes" value={m.glpiPend} cor="#7aa2e0" sub={`${m.glpiOk} sincronizados`} />
      </div>

      <div className="wr-grid">
        <div className="wr-panel wr-feed">
          <div className="wr-panel-h"><Icons.bolt size={15} /> Atividade em tempo real</div>
          <div className="wr-feed-list">
            {feed.map((e, i) => {
              const meta = H.EVENTS[e.tipo] || H.EVENTS.comentou;
              const I = Icons[meta.ico] || Icons.doc;
              const isPed = e.src.kind === "pedido";
              return (
                <button className={"wr-feed-row" + (i === 0 ? " is-new" : "")} key={e.id + e.src.id}
                  onClick={() => isPed ? onOpenPedido(e.src.num) : onOpenChamado(e.src.id)}>
                  <span className="wr-feed-ico" style={{ color: meta.cor }}><I size={13} /></span>
                  <span className="wr-feed-tx">{e.texto}</span>
                  <span className="wr-feed-src">{e.src.num}</span>
                  <span className="wr-feed-time">{H.fromNow(e.ts)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="wr-side">
          <div className="wr-panel wr-radarp">
            <div className="wr-panel-h"><Icons.truck size={15} /> Mapa de rotas</div>
            <div className="wr-radar-wrap">
              <div className="wr-radar">
                <svg viewBox="0 0 220 220" aria-hidden="true">
                  <circle className="wr-radar-ring" cx="110" cy="110" r="96" />
                  <circle className="wr-radar-ring" cx="110" cy="110" r="64" />
                  <circle className="wr-radar-ring" cx="110" cy="110" r="32" />
                  <line className="wr-radar-cross" x1="110" y1="8" x2="110" y2="212" />
                  <line className="wr-radar-cross" x1="8" y1="110" x2="212" y2="110" />
                  <g className="wr-sweep">
                    <defs><linearGradient id="wrsw" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#34e7d4" stopOpacity="0" /><stop offset="1" stopColor="#34e7d4" stopOpacity="0.55" />
                    </linearGradient></defs>
                    <path d="M110 110 L206 110 A96 96 0 0 0 150 22 Z" fill="url(#wrsw)" />
                  </g>
                  {blips.map((b, i) => (
                    <circle key={i} className="wr-blip" cx={b.x} cy={b.y} r="3.4" fill={b.cor} style={{ animationDelay: (i * 0.2) + "s" }}>
                      <title>{b.num}</title>
                    </circle>
                  ))}
                  <circle cx="110" cy="110" r="3" fill="#fff" />
                </svg>
                <div className="wr-radar-label">{blips.length} unidades rastreadas</div>
              </div>
            </div>
          </div>

          <div className="wr-panel wr-gauge">
            <div className="wr-panel-h"><Icons.send size={15} /> Sincronização GLPI</div>
            <div className="wr-gauge-ring" style={{ "--pct": glpiPct }}>
              <div className="wr-gauge-num">{glpiPct}<span>%</span></div>
            </div>
            <div className="wr-gauge-legend"><span>{m.glpiOk} enviados</span><span>{m.glpiPend} pendentes</span></div>
          </div>

          <div className="wr-panel wr-alerts">
            <div className="wr-panel-h"><Icons.alert size={15} /> Alertas críticos</div>
            <div className="wr-alerts-list">
              {orders.filter(EX.isLate).slice(0, 3).map((o) => (
                <button className="wr-alert sev-alta" key={o.id} onClick={() => onOpenPedido(o.numero)}>
                  <Icons.truck size={14} /> {o.numero} atrasado · {o.cliente}
                </button>
              ))}
              {chamados.filter((c) => CH.isOpen(c) && c.prioridade === "urgente").slice(0, 3).map((c) => (
                <button className="wr-alert sev-alta" key={c.id} onClick={() => onOpenChamado(c.id)}>
                  <Icons.ticket size={14} /> {c.numero} URGENTE · {c.titulo}
                </button>
              ))}
              {chamados.filter((c) => !c.glpi.sent).slice(0, 2).map((c) => (
                <button className="wr-alert sev-media" key={c.id} onClick={() => onOpenChamado(c.id)}>
                  <Icons.send size={14} /> {c.numero} não enviado ao GLPI
                </button>
              ))}
              {m.atrasados === 0 && m.urgentes === 0 && m.glpiPend === 0 && <div className="wr-empty">Tudo sob controle. 🟢</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ToastStack, WarRoom });
