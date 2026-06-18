/* EIXO — aplicação principal (orquestrador) */
const EXA = window.EIXO;
const CHM = window.CHAM;
const AU = window.AUTH;
const HI = window.HIST;
const LS_KEY = "eixo.orders.v1";
const LS_KEY_CH = "eixo.chamados.v1";

function loadStoredArray(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}

/* ---------- persistência (normaliza histórico) ---------- */
function loadOrders() {
  const arr = loadStoredArray(LS_KEY, EXA.SEED);
  return arr.map((o) => ({ ...o, historico: o.historico || HI.seedHistoryOrder(o) }));
}
function saveOrders(o) { try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) {} }
function loadChamados() {
  const arr = loadStoredArray(LS_KEY_CH, CHM.SEED);
  return arr.map((c) => ({ ...c, historico: c.historico || HI.seedHistoryChamado(c) }));
}
function saveChamados(c) { try { localStorage.setItem(LS_KEY_CH, JSON.stringify(c)); } catch (e) {} }

/* ---------- sino de notificações ---------- */
function NotificationsBell({ orders, chamados, onOpenPedido, onOpenChamado }) {
  const [open, setOpen] = useState(false);
  const alerts = useMemo(() => {
    const a = [];
    orders.filter(EXA.isLate).forEach((o) => a.push({ id: "la-" + o.id, sev: "alta", ico: "alert", texto: `Pedido ${o.numero} atrasado — ${o.cliente}`, go: () => onOpenPedido(o.numero) }));
    orders.filter((o) => o.status === "chegou" && !o.conferencia).forEach((o) => a.push({ id: "cf-" + o.id, sev: "media", ico: "clipboard", texto: `${o.numero} chegou — aguardando conferência`, go: () => onOpenPedido(o.numero) }));
    chamados.filter((c) => CHM.isOpen(c) && (c.prioridade === "urgente" || c.prioridade === "alta")).forEach((c) => a.push({ id: "ch-" + c.id, sev: c.prioridade === "urgente" ? "alta" : "media", ico: "ticket", texto: `Chamado ${c.numero} (${CHM.PR_MAP[c.prioridade].label}) em aberto`, go: () => onOpenChamado(c.id) }));
    chamados.filter((c) => !c.glpi.sent).forEach((c) => a.push({ id: "gl-" + c.id, sev: "baixa", ico: "send", texto: `${c.numero} ainda não enviado ao GLPI`, go: () => onOpenChamado(c.id) }));
    const ord = { alta: 0, media: 1, baixa: 2 };
    return a.sort((x, y) => ord[x.sev] - ord[y.sev]);
  }, [orders, chamados]);

  return (
    <div className="ex-bellwrap">
      <button className={"ex-icobtn ex-bell" + (alerts.length ? " has" : "")} onClick={() => setOpen((v) => !v)} aria-label="Alertas">
        <Icons.bell size={18} />
        {alerts.length > 0 && <span className="ex-bell-dot">{alerts.length}</span>}
      </button>
      {open && (
        <>
          <div className="ex-bell-backdrop" onClick={() => setOpen(false)} />
          <div className="ex-bell-pop">
            <div className="ex-bell-head"><strong>Alertas</strong><span>{alerts.length} item(s)</span></div>
            <div className="ex-bell-list">
              {alerts.length === 0 ? <div className="ex-tl-empty">Nada pendente. Tudo em ordem. 👌</div> :
                alerts.map((al) => {
                  const I = Icons[al.ico] || Icons.bell;
                  return (
                    <button className="ex-bell-row" key={al.id} onClick={() => { al.go(); setOpen(false); }}>
                      <span className={"ex-bell-sev sev-" + al.sev}><I size={14} /></span>
                      <span>{al.texto}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* =====================================================================
   App
   ===================================================================== */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#234A78",
  "view": "board",
  "density": "regular",
  "showValues": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [me, setMe] = useState(AU.loadUser);
  const [section, setSection] = useState("pedidos");
  const [orders, setOrders] = useState(loadOrders);
  const [chamados, setChamados] = useState(loadChamados);
  const [view, setView] = useState(t.view);
  const [filterPed, setFilterPed] = useState("todos");
  const [filterCh, setFilterCh] = useState("todos");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [confOrder, setConfOrder] = useState(null);
  const [comprovOrder, setComprovOrder] = useState(null);
  const [showNewCh, setShowNewCh] = useState(false);
  const [editCh, setEditCh] = useState(null);
  const [chPrefill, setChPrefill] = useState(null);
  const [selId, setSelId] = useState(null);
  const [selCh, setSelCh] = useState(null);
  const [glpiFor, setGlpiFor] = useState(null);

  useEffect(() => saveOrders(orders), [orders]);
  useEffect(() => saveChamados(chamados), [chamados]);
  useEffect(() => setView(t.view), [t.view]);
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--accent", t.accent);
    r.setProperty("--accent-d", `color-mix(in srgb, ${t.accent} 80%, #000)`);
    r.setProperty("--accent-tint", `color-mix(in srgb, ${t.accent} 11%, #fff)`);
    document.documentElement.dataset.density = t.density;
  }, [t.accent, t.density]);

  const login = (id) => { AU.saveUser(id); setMe(AU.byId(id)); };
  const logout = () => { AU.saveUser(null); setMe(null); };

  useEffect(() => {
    if (!me) return;
    const msLeft = AU.sessionMsLeft();
    if (msLeft <= 0) {
      logout();
      return;
    }
    const timer = setTimeout(logout, msLeft);
    return () => clearTimeout(timer);
  }, [me]);

  const stamp = AU.stamp(me);
  const ev = (tipo, texto) => HI.makeEvent(stamp, tipo, texto);
  const isPed = section === "pedidos";
  const isRel = section === "relatorios";
  const isHist = section === "historico";
  const semChrome = isRel; // só relatórios esconde a busca
  const switchSection = (s) => { setSection(s); setQuery(""); setSelId(null); setSelCh(null); };

  const sel = orders.find((o) => o.id === selId) || null;
  const selChamado = chamados.find((c) => c.id === selCh) || null;
  const linkedFor = (numero) => chamados.filter((c) => c.pedido === numero);

  /* navegação cruzada */
  const openPedidoByNum = (num) => { const o = orders.find((x) => x.numero === num); if (o) { setSection("pedidos"); setSelCh(null); setSelId(o.id); } };
  const openChamado = (id) => { setSection("chamados"); setSelId(null); setSelCh(id); };

  /* derivados — pedidos */
  const kpis = useMemo(() => {
    const byStatus = (k) => orders.filter((o) => o.status === k).length;
    const late = orders.filter(EXA.isLate).length;
    const valorAberto = orders.filter((o) => o.status !== "concluido").reduce((s, o) => s + EXA.orderTotal(o), 0);
    return { total: orders.length, transito: byStatus("transito"), chegou: byStatus("chegou"), late, valorAberto };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filterPed !== "todos" && o.status !== filterPed) return false;
      if (!q) return true;
      return o.numero.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q) ||
        o.fornecedor.toLowerCase().includes(q) || (o.itens || []).some((it) => it.nome.toLowerCase().includes(q));
    });
  }, [orders, filterPed, query]);

  const chamadosFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chamados.filter((c) => {
      if (filterCh !== "todos" && c.status !== filterCh) return false;
      if (!q) return true;
      return c.numero.toLowerCase().includes(q) || c.titulo.toLowerCase().includes(q) ||
        c.categoria.toLowerCase().includes(q) || (c.pedido || "").toLowerCase().includes(q) || c.solicitante.toLowerCase().includes(q);
    });
  }, [chamados, filterCh, query]);

  /* ações — pedidos (com histórico) */
  const updOrder = (id, patch, events) => setOrders((p) => p.map((o) =>
    o.id === id ? { ...o, ...patch, historico: [...(o.historico || []), ...(events || [])] } : o));
  const advance = (id) => { const o = orders.find((x) => x.id === id); const nx = EXA.nextStatus(o.status); if (nx) updOrder(id, { status: nx }, [ev("status", `Status → ${EXA.STATUS_MAP[nx].label}.`)]); };
  const setStatus = (id, st) => { const o = orders.find((x) => x.id === id); if (o && o.status !== st) updOrder(id, { status: st }, [ev("status", `Status → ${EXA.STATUS_MAP[st].label}.`)]); };
  const addOrder = (o) => { setOrders((p) => [{ ...o, historico: [ev("criou", `Pedido ${o.numero} registrado para ${o.cliente}.`)] }, ...p]); setShowAdd(false); setSelId(o.id); };
  const saveEditOrder = (u) => { setOrders((p) => p.map((o) => o.id === u.id ? { ...u, historico: [...(o.historico || []), ev("editou", "Dados do pedido atualizados.")] } : o)); setEditOrder(null); };
  const delOrder = (id) => {
    const o = orders.find((x) => x.id === id);
    const label = o ? `${o.numero} - ${o.cliente}` : "este pedido";
    if (!window.confirm(`Excluir ${label}? Esta acao nao pode ser desfeita.`)) return;
    setOrders((p) => p.filter((order) => order.id !== id));
    setSelId(null);
  };
  const addAnexoOrder = (id, novos) => updOrder(id, { anexos: [...(orders.find((o) => o.id === id).anexos || []), ...novos] }, [ev("comentou", `${novos.length} anexo(s) adicionado(s): ${novos.map((n) => n.nome).join(", ")}.`)]);
  const rmAnexoOrder = (id, axId) => { const o = orders.find((x) => x.id === id); const a = (o.anexos || []).find((x) => x.id === axId); updOrder(id, { anexos: (o.anexos || []).filter((x) => x.id !== axId) }, [ev("comentou", `Anexo removido${a ? ": " + a.nome : ""}.`)]); };
  const saveEntrega = (id, entrega) => updOrder(id, { entrega }, [ev("conferiu", `Entrega assinada por ${entrega.por}.`)]);

  /* conferência -> conclui + (se divergência) abre chamado automático */
  const confirmConf = (payload) => {
    const o = confOrder;
    const events = [ev("conferiu", `Recebimento conferido${payload.obs ? " — " + payload.obs : ""}.`)];
    if (payload.temDivergencia) events.push(ev("divergencia", `Divergência detectada: ${payload.divergencias.join("; ")}.`));
    updOrder(o.id, { status: "concluido", conferencia: { em: HI.NOW(), por: me.nome, itens: payload.itens, temDivergencia: payload.temDivergencia, obs: payload.obs } }, events);
    if (payload.temDivergencia) {
      const num = "CH-" + (Math.max(1199, ...chamados.map((c) => parseInt((c.numero.match(/\d+/) || [0])[0], 10))) + 1);
      const ch = {
        id: "c-" + Date.now(), numero: num, tipo: "ocorrencia",
        titulo: `Divergência no recebimento de ${o.numero}`, categoria: "Divergência de carga",
        prioridade: "alta", pedido: o.numero, solicitante: o.cliente, tecnico: me.nome,
        status: "novo", aberto: EXA.TODAY, descricao: `Conferência de ${o.numero} apontou divergência:\n` + payload.divergencias.join("\n"),
        glpi: { sent: false, id: null, sentAt: null },
        historico: [ev("criou", `Chamado aberto automaticamente pela conferência de ${o.numero}.`)],
      };
      setChamados((p) => [ch, ...p]);
    }
    setConfOrder(null);
  };

  /* ações — chamados */
  const updCh = (id, patch, events) => setChamados((p) => p.map((c) =>
    c.id === id ? { ...c, ...patch, historico: [...(c.historico || []), ...(events || [])] } : c));
  const advanceCh = (id) => { const c = chamados.find((x) => x.id === id); const nx = CHM.nextCh(c.status); if (nx) updCh(id, { status: nx }, [ev("status", `Status → ${CHM.CH_MAP[nx].label}.`)]); };
  const setChStatus = (id, st) => { const c = chamados.find((x) => x.id === id); if (c && c.status !== st) updCh(id, { status: st }, [ev("status", `Status → ${CHM.CH_MAP[st].label}.`)]); };
  const addChamado = (c) => { const full = { ...c, historico: [ev("criou", `Chamado ${c.numero} aberto.`)] }; setChamados((p) => [full, ...p]); setShowNewCh(false); setChPrefill(null); setSelCh(c.id); setGlpiFor(full); };
  const saveEditCh = (u) => { setChamados((p) => p.map((c) => c.id === u.id ? { ...u, historico: [...(c.historico || []), ev("editou", "Dados do chamado atualizados.")] } : c)); setEditCh(null); };
  const delChamado = (id) => {
    const c = chamados.find((x) => x.id === id);
    const label = c ? `${c.numero} - ${c.titulo}` : "este chamado";
    if (!window.confirm(`Excluir ${label}? Esta acao nao pode ser desfeita.`)) return;
    setChamados((p) => p.filter((chamado) => chamado.id !== id));
    setSelCh(null);
  };
  const sendGlpi = (id, glpiId) => updCh(id, { glpi: { sent: true, id: glpiId, sentAt: EXA.TODAY } }, [ev("glpi", `Enviado ao GLPI — ticket #${glpiId}.`)]);
  const addAnexoCh = (id, novos) => updCh(id, { anexos: [...(chamados.find((c) => c.id === id).anexos || []), ...novos] }, [ev("comentou", `${novos.length} anexo(s) adicionado(s): ${novos.map((n) => n.nome).join(", ")}.`)]);
  const rmAnexoCh = (id, axId) => { const c = chamados.find((x) => x.id === id); const a = (c.anexos || []).find((x) => x.id === axId); updCh(id, { anexos: (c.anexos || []).filter((x) => x.id !== axId) }, [ev("comentou", `Anexo removido${a ? ": " + a.nome : ""}.`)]); };

  /* abrir chamado a partir de um pedido */
  const abrirChamadoDoPedido = (o) => { setSelId(null); setChPrefill(o.numero); setSection("chamados"); setShowNewCh(true); };

  const nextNum = useMemo(() => "PD-" + (Math.max(1000, ...orders.map((o) => parseInt((o.numero.match(/\d+/) || [0])[0], 10))) + 1), [orders]);
  const nextChNum = useMemo(() => "CH-" + (Math.max(1199, ...chamados.map((c) => parseInt((c.numero.match(/\d+/) || [0])[0], 10))) + 1), [chamados]);

  const filter = isPed ? filterPed : filterCh;
  const setFilter = isPed ? setFilterPed : setFilterCh;
  const filterChips = isPed
    ? [{ key: "todos", label: "Todos", count: orders.length }, ...EXA.STATUS.map((s) => ({ key: s.key, label: s.label, count: orders.filter((o) => o.status === s.key).length, color: s.color }))]
    : [{ key: "todos", label: "Todos", count: chamados.length }, ...CHM.CH_STATUS.map((s) => ({ key: s.key, label: s.label, count: chamados.filter((c) => c.status === s.key).length, color: s.color }))];

  const podeCriar = AU.can(me, "criar");
  const newAction = () => { if (isPed) setShowAdd(true); else { setChPrefill(null); setShowNewCh(true); } };

  if (!me) return <LoginScreen onLogin={login} />;

  return (
    <div className="ex-app">
      {/* RAIL */}
      <nav className="ex-rail">
        <div className="ex-brand">
          <span className="ex-logo"><Icons.hub size={21} /></span>
          <div className="ex-brand-tx"><strong>EIXO</strong><span>Controle logístico</span></div>
        </div>
        <div className="ex-nav">
          <button className={"ex-navbtn" + (isPed ? " is-on" : "")} onClick={() => switchSection("pedidos")}>
            <Icons.box size={17} /> <span className="ex-nav-lbl">Pedidos</span><span className="ex-navct">{orders.length}</span>
          </button>
          <button className={"ex-navbtn" + (section === "chamados" ? " is-on" : "")} onClick={() => switchSection("chamados")}>
            <Icons.ticket size={17} /> <span className="ex-nav-lbl">Chamados</span><span className="ex-navct">{chamados.filter(CHM.isOpen).length}</span>
          </button>
          <button className={"ex-navbtn" + (isHist ? " is-on" : "")} onClick={() => switchSection("historico")}>
            <Icons.clock size={17} /> <span className="ex-nav-lbl">Histórico</span>
          </button>
          <button className={"ex-navbtn" + (isRel ? " is-on" : "")} onClick={() => switchSection("relatorios")}>
            <Icons.chart size={17} /> <span className="ex-nav-lbl">Relatórios</span>
          </button>
        </div>
        {!isRel && !isHist && (
          <>
            <div className="ex-rail-cap">Filtrar por status</div>
            <div className="ex-rail-chips">
              {filterChips.map((c) => (
                <button key={c.key} className={"ex-chip" + (filter === c.key ? " is-on" : "")} onClick={() => setFilter(c.key)}>
                  {c.color && <span className="ex-chip-dot" style={{ background: c.color }} />}
                  <span className="ex-chip-lbl">{c.label}</span><span className="ex-chip-ct">{c.count}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {(isRel || isHist) && <div className="ex-rail-chips" style={{ flex: 1 }} />}
        <div className="ex-rail-foot">
          <UserMenu me={me} onLogout={logout} />
        </div>
      </nav>

      {/* MAIN */}
      <main className="ex-main">
        <header className="ex-top">
          <div className="ex-top-l">
            <h1>{isPed ? "Painel de operações" : isRel ? "Relatórios" : isHist ? "Histórico geral" : "Central de chamados"}</h1>
            <span className="ex-top-date">{EXA.fmtLongDate(EXA.TODAY)}</span>
          </div>
          <div className="ex-top-r">
            {!semChrome && (
              <label className="ex-search">
                <Icons.search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isPed ? "Buscar pedido, cliente, peça…" : isHist ? "Buscar no histórico…" : "Buscar chamado, título…"} />
              </label>
            )}
            <NotificationsBell orders={orders} chamados={chamados} onOpenPedido={openPedidoByNum} onOpenChamado={openChamado} />
            {!isRel && !isHist && (
              <div className="ex-viewtog">
                <button className={view === "board" ? "is-on" : ""} onClick={() => setView("board")} aria-label="Quadro"><Icons.grid size={16} /></button>
                <button className={view === "list" ? "is-on" : ""} onClick={() => setView("list")} aria-label="Lista"><Icons.list size={16} /></button>
              </div>
            )}
            {!isRel && !isHist && podeCriar && (
              <button className="ex-btn ex-btn--primary ex-new" onClick={newAction}>
                <Icons.plus size={16} /> <span>{isPed ? "Novo pedido" : "Novo chamado"}</span>
              </button>
            )}
          </div>
        </header>

        {isPed && (
          <>
            <section className="ex-kpis">
              <KPI icon={Icons.box} label="Pedidos ativos" value={kpis.total} sub={`${orders.filter(o=>o.status==="concluido").length} concluídos`} accent="var(--accent)" />
              <KPI icon={Icons.truck} label="Em trânsito" value={kpis.transito} sub="a caminho do destino" accent="#2F6FCF" />
              <KPI icon={Icons.box} label="Aguardando conferência" value={kpis.chegou} sub="chegaram, pendentes" accent="#B66A12" />
              <KPI icon={Icons.alert} label="Atrasados" value={kpis.late} sub={kpis.late ? "exigem atenção" : "tudo no prazo"} accent="#B42318" alert={kpis.late > 0} />
              {t.showValues && <KPI icon={Icons.doc} label="Valor em aberto" value={EXA.BRL(kpis.valorAberto)} sub="pedidos não concluídos" accent="#1F7A45" />}
            </section>
            {view === "board"
              ? <BoardView orders={filtered} onSelect={setSelId} onAdvance={advance} compact={t.density === "compact"} />
              : <ListView orders={filtered} onSelect={setSelId} showValues={t.showValues} />}
          </>
        )}
        {section === "chamados" && (
          <ChamadosContent chamados={chamadosFiltered} view={view} onSelect={setSelCh} onAdvance={advanceCh} compact={t.density === "compact"} />
        )}
        {isRel && <ReportsView orders={orders} chamados={chamados} />}
        {isHist && <GlobalHistory orders={orders} chamados={chamados} query={query} onOpenPedido={openPedidoByNum} onOpenChamado={openChamado} />}
      </main>

      {/* FAB mobile */}
      {!isRel && !isHist && podeCriar && <button className="ex-fab" onClick={newAction} aria-label="Novo"><Icons.plus size={22} /></button>}

      {showAdd && <OrderModal onClose={() => setShowAdd(false)} onSave={addOrder} nextNum={nextNum} />}
      {editOrder && <OrderModal onClose={() => setEditOrder(null)} onSave={saveEditOrder} edit={editOrder} />}
      {confOrder && <ConferenciaModal order={confOrder} onClose={() => setConfOrder(null)} onConfirm={confirmConf} />}
      {sel && <DetailDrawer order={sel} me={me} linked={linkedFor(sel.numero)} onClose={() => setSelId(null)}
        onStatus={setStatus} onDelete={delOrder} onEdit={(o) => { setSelId(null); setEditOrder(o); }}
        onConferir={(o) => { setSelId(null); setConfOrder(o); }} onAbrirChamado={abrirChamadoDoPedido} onOpenChamado={openChamado}
        onAddAnexo={addAnexoOrder} onRemoveAnexo={rmAnexoOrder} onComprovante={(o) => setComprovOrder(o)} />}
      {comprovOrder && <ComprovanteModal order={orders.find((o) => o.id === comprovOrder.id) || comprovOrder} me={me} onClose={() => setComprovOrder(null)} onSaveEntrega={saveEntrega} />}

      {showNewCh && <NewChamadoModal onClose={() => { setShowNewCh(false); setChPrefill(null); }} onSave={addChamado} nextNum={nextChNum} pedidos={orders} pedidoPrefill={chPrefill} />}
      {editCh && <NewChamadoModal onClose={() => setEditCh(null)} onSave={saveEditCh} pedidos={orders} edit={editCh} />}
      {selChamado && <ChamadoDrawer chamado={selChamado} me={me} onClose={() => setSelCh(null)} onStatus={setChStatus}
        onDelete={delChamado} onSendGlpi={(c) => setGlpiFor(c)} onEdit={(c) => { setSelCh(null); setEditCh(c); }} onOpenPedido={openPedidoByNum}
        onAddAnexo={addAnexoCh} onRemoveAnexo={rmAnexoCh} />}
      {glpiFor && <GlpiPrompt chamado={glpiFor} onSend={sendGlpi} onSkip={() => setGlpiFor(null)} />}

      {/* TWEAKS */}
      <TweaksPanel>
        <TweakSection label="Aparência" />
        <TweakColor label="Cor de acento" value={t.accent} options={["#234A78", "#1F3B5C", "#2C5E4F", "#5B4B8A", "#7A2E3A"]} onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label="Densidade" value={t.density} options={["compact", "regular"]} onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Visualização" />
        <TweakRadio label="Padrão" value={t.view} options={["board", "list"]} onChange={(v) => setTweak("view", v)} />
        <TweakToggle label="Mostrar valores (R$)" value={t.showValues} onChange={(v) => setTweak("showValues", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
