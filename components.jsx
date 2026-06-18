/* EIXO — componentes visuais compartilhados */
const { useState, useMemo, useEffect, useRef } = React;
const EX = window.EIXO;

/* ---------------- Ícones (linha, 1.6px) ---------------- */
function Icon({ d, size = 18, sw = 1.6, fill = "none", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
      strokeLinejoin="round" style={style} aria-hidden="true">
      {d}
    </svg>
  );
}
const Icons = {
  plus:   (p) => <Icon {...p} d={<><path d="M12 5v14M5 12h14" /></>} />,
  search: (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></>} />,
  truck:  (p) => <Icon {...p} d={<><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>} />,
  box:    (p) => <Icon {...p} d={<><path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5z" /><path d="M3 8.5 12 14l9-5.5M12 14v7" /></>} />,
  check:  (p) => <Icon {...p} d={<><path d="m4 12 5 5L20 6" /></>} />,
  clock:  (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />,
  alert:  (p) => <Icon {...p} d={<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>} />,
  chevR:  (p) => <Icon {...p} d={<><path d="m9 6 6 6-6 6" /></>} />,
  chevL:  (p) => <Icon {...p} d={<><path d="m15 6-6 6 6 6" /></>} />,
  x:      (p) => <Icon {...p} d={<><path d="M6 6l12 12M18 6 6 18" /></>} />,
  grid:   (p) => <Icon {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>} />,
  list:   (p) => <Icon {...p} d={<><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>} />,
  pin:    (p) => <Icon {...p} d={<><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></>} />,
  user:   (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>} />,
  doc:    (p) => <Icon {...p} d={<><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4M9 13h6M9 17h6" /></>} />,
  trash:  (p) => <Icon {...p} d={<><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>} />,
  bolt:   (p) => <Icon {...p} fill="currentColor" sw={0} d={<><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></>} />,
  ticket: (p) => <Icon {...p} d={<><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 6 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-6z" /><path d="M14 7v10" /></>} />,
  send:   (p) => <Icon {...p} d={<><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></>} />,
  link:   (p) => <Icon {...p} d={<><path d="M9 15l6-6M11 6l1-1a4 4 0 0 1 6 6l-1 1M13 18l-1 1a4 4 0 0 1-6-6l1-1" /></>} />,
  flag:   (p) => <Icon {...p} d={<><path d="M5 21V4M5 4h12l-2 4 2 4H5" /></>} />,
  tag:    (p) => <Icon {...p} d={<><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z" /><circle cx="8" cy="8" r="1.4" /></>} />,
  edit:   (p) => <Icon {...p} d={<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>} />,
  clipboard: (p) => <Icon {...p} d={<><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="m9 13 2 2 4-4" /></>} />,
  bell:   (p) => <Icon {...p} d={<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 19a2 2 0 0 0 4 0" /></>} />,
  download: (p) => <Icon {...p} d={<><path d="M12 3v12M7 11l5 5 5-5" /><path d="M4 21h16" /></>} />,
  logout: (p) => <Icon {...p} d={<><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="M10 17l-5-5 5-5M5 12h12" /></>} />,
  eye:    (p) => <Icon {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>} />,
  shield: (p) => <Icon {...p} d={<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></>} />,
  chart:  (p) => <Icon {...p} d={<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>} />,
  print:  (p) => <Icon {...p} d={<><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" rx="1" /></>} />,
  pen:    (p) => <Icon {...p} d={<><path d="M12 19l7-7a2.8 2.8 0 0 0-4-4l-7 7-1 5z" /><path d="M3 21h18" /></>} />,
  hub:    (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.6" /><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" /></>} />,
  arrowDown: (p) => <Icon {...p} d={<><path d="M12 5v14M6 13l6 6 6-6" /></>} />,
  arrowUp:   (p) => <Icon {...p} d={<><path d="M12 19V5M6 11l6-6 6 6" /></>} />,
  layers: (p) => <Icon {...p} d={<><path d="M12 3 3 8l9 5 9-5z" /><path d="M3 13l9 5 9-5" /></>} />,
  warehouse: (p) => <Icon {...p} d={<><path d="M3 21V8l9-4 9 4v13" /><path d="M7 21v-7h10v7" /><path d="M7 17h10" /></>} />,
  swap:   (p) => <Icon {...p} d={<><path d="M7 4 4 7l3 3" /><path d="M4 7h11a4 4 0 0 1 4 4" /><path d="m17 20 3-3-3-3" /><path d="M20 17H9a4 4 0 0 1-4-4" /></>} />,
  barcode: (p) => <Icon {...p} d={<><path d="M4 5v14M7 5v14M10 5v10M13 5v14M17 5v14M20 5v14" /></>} />,
  cart:   (p) => <Icon {...p} d={<><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.4 12.5a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L22 7H6" /></>} />,
};

/* ---------------- Status ---------------- */
function StatusBadge({ status, size = "md" }) {
  const s = EX.STATUS_MAP[status];
  if (!s) return null;
  const pad = size === "sm" ? "3px 9px" : "5px 11px";
  const fs = size === "sm" ? 11.5 : 12.5;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: pad,
      borderRadius: 999, fontSize: fs, fontWeight: 600, letterSpacing: ".02em",
      color: s.color, background: s.tint, border: `1px solid ${s.color}38`,
      whiteSpace: "nowrap", lineHeight: 1,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.color }} />
      {s.label}
    </span>
  );
}

/* ---------------- KPI ---------------- */
function KPI({ icon: I, label, value, sub, accent, alert }) {
  return (
    <div className="ex-kpi">
      <div className="ex-kpi-top">
        <span className="ex-kpi-ico" style={{ color: accent, background: accent + "1a", borderColor: accent + "33" }}>
          <I size={18} />
        </span>
        <span className="ex-kpi-label">{label}</span>
      </div>
      <div className="ex-kpi-val" style={alert ? { color: "var(--danger)" } : null}>{value}</div>
      {sub ? <div className="ex-kpi-sub">{sub}</div> : null}
    </div>
  );
}

/* ---------------- Card de pedido ---------------- */
function OrderCard({ order, onClick, onAdvance, compact }) {
  const total = EX.orderTotal(order);
  const qty = EX.orderQty(order);
  const late = EX.isLate(order);
  const next = EX.nextStatus(order.status);
  const s = EX.STATUS_MAP[order.status];
  const dleft = order.previsao ? EX.daysBetween(EX.TODAY, order.previsao) : null;

  const advLabel = {
    aguardando: "Despachar",
    transito: "Marcar chegada",
    chegou: "Concluir",
  }[order.status];

  return (
    <article className={"ex-card" + (compact ? " ex-card--c" : "")} onClick={onClick}
      style={{ "--st": s.color }}>
      <div className="ex-card-head">
        <span className="ex-card-num">{order.numero}</span>
        {late ? (
          <span className="ex-late"><Icons.alert size={12} /> {dleft === 0 ? "vence hoje" : `${Math.abs(dleft)}d atraso`}</span>
        ) : (
          <span className="ex-card-date"><Icons.clock size={12} /> {EX.fmtDate(order.previsao)}</span>
        )}
      </div>
      <div className="ex-card-client">{order.cliente}</div>
      <div className="ex-card-meta">
        <span><Icons.box size={13} /> {qty} itens · {order.itens.length} ref.</span>
        <span className="ex-card-supp">{order.fornecedor}</span>
      </div>
      {!compact && (
        <div className="ex-card-foot">
          <span className="ex-card-total">{EX.BRL(total)}</span>
          {next && advLabel ? (
            <button className="ex-adv" onClick={(e) => { e.stopPropagation(); onAdvance(order.id); }}>
              {advLabel} <Icons.chevR size={13} />
            </button>
          ) : (
            <span className="ex-done-tag"><Icons.check size={13} /> ok</span>
          )}
        </div>
      )}
    </article>
  );
}

/* ---------------- Avatar de usuário ---------------- */
function Avatar({ user, size = 28 }) {
  const u = user || { iniciais: "EX", cor: "#8A94A4" };
  return (
    <span className="ex-avatar" title={u.nome} style={{
      width: size, height: size, background: u.cor,
      fontSize: Math.round(size * 0.4),
    }}>{u.iniciais}</span>
  );
}

/* ---------------- Linha do tempo (histórico) ---------------- */
function Timeline({ events }) {
  const H = window.HIST;
  if (!events || !events.length)
    return <div className="ex-tl-empty">Sem registros ainda.</div>;
  const ordered = [...events].sort((a, b) => new Date(b.ts) - new Date(a.ts));
  return (
    <div className="ex-tl">
      {ordered.map((ev) => {
        const meta = H.EVENTS[ev.tipo] || H.EVENTS.comentou;
        const I = Icons[meta.ico] || Icons.doc;
        return (
          <div className="ex-tl-row" key={ev.id}>
            <span className="ex-tl-ico" style={{ color: meta.cor, background: meta.cor + "16", borderColor: meta.cor + "33" }}>
              <I size={13} />
            </span>
            <div className="ex-tl-body">
              <div className="ex-tl-text">{ev.texto}</div>
              <div className="ex-tl-meta">
                <Avatar user={ev.user} size={18} /> {ev.user ? ev.user.nome : "Sistema"} · {H.fmtDateTime(ev.ts)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Logo EIXO ---------------- */
function LogoGlyph({ size = 28, stroke = 2.3 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* eixo central + rotas de distribuição */}
      <g stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16 V5.5" />
        <path d="M16 16 L6.8 21.2" />
        <path d="M16 16 L25.2 21.2" />
        <circle cx="16" cy="4.6" r="2.1" fill="currentColor" stroke="none" />
        <circle cx="5.9" cy="22.6" r="2.1" fill="currentColor" stroke="none" />
        <circle cx="26.1" cy="22.6" r="2.1" fill="currentColor" stroke="none" />
      </g>
      <circle cx="16" cy="16" r="3.4" fill="currentColor" />
      <circle cx="16" cy="16" r="6.4" stroke="currentColor" strokeWidth={stroke * 0.7} opacity="0.34" />
    </svg>
  );
}
/* tile = mark dentro do quadrado da marca */
function LogoTile({ size = 38, radius = 10 }) {
  return (
    <span className="ex-logo" style={{ width: size, height: size, borderRadius: radius }}>
      <LogoGlyph size={Math.round(size * 0.62)} />
    </span>
  );
}

Object.assign(window, { Icon, Icons, StatusBadge, KPI, OrderCard, Avatar, Timeline, LogoGlyph, LogoTile });
