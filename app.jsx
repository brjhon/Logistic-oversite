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
const LS_KEY_ST = "eixo.estoque.v1";
const ST_ = window.STOCK;
function loadEstoque() {
  const arr = loadStoredArray(LS_KEY_ST, ST_.SEED);
  return arr.map((p) => ({ ...p, movs: p.movs && p.movs.length ? p.movs : ST_.seedMovs(p) }));
}
function saveEstoque(p) { try { localStorage.setItem(LS_KEY_ST, JSON.stringify(p)); } catch (e) {} }

/* ---------- sino de notificações ---------- */
function NotificationsBell({ orders, chamados, estoque, onOpenPedido, onOpenChamado, onOpenEstoque }) {
  const [open, setOpen] = useState(false);
  const alerts = useMemo(() => {
    const a = [];
    orders.filter(EXA.isLate).forEach((o) => a.push({ id: "la-" + o.id, sev: "alta", ico: "alert", texto: `Pedido ${o.numero} atrasado — ${o.cliente}`, go: () => onOpenPedido(o.numero) }));
    (estoque || []).filter(window.STOCK.isOut).forEach((p) => a.push({ id: "so-" + p.id, sev: "alta", ico: "warehouse", texto: `${p.sku} sem estoque — ${p.nome}`, go: () => onOpenEstoque(p.id) }));
    (estoque || []).filter((p) => window.STOCK.isLow(p) && !window.STOCK.isOut(p)).forEach((p) => a.push({ id: "sl-" + p.id, sev: "media", ico: "warehouse", texto: `${p.sku} abaixo do mínimo (${p.qtd}/${p.minimo})`, go: () => onOpenEstoque(p.id) }));
    orders.filter((o) => o.status === "chegou" && !o.conferencia).forEach((o) => a.push({ id: "cf-" + o.id, sev: "media", ico: "clipboard", texto: `${o.numero} chegou — aguardando conferência`, go: () => onOpenPedido(o.numero) }));
    chamados.filter((c) => CHM.isOpen(c) && (c.prioridade === "urgente" || c.prioridade === "alta")).forEach((c) => a.push({ id: "ch-" + c.id, sev: c.prioridade === "urgente" ? "alta" : "media", ico: "ticket", texto: `Chamado ${c.numero} (${CHM.PR_MAP[c.prioridade].label}) em aberto`, go: () => onOpenChamado(c.id) }));
    chamados.filter((c) => !c.glpi.sent).forEach((c) => a.push({ id: "gl-" + c.id, sev: "baixa", ico: "send", texto: `${c.numero} ainda não enviado ao GLPI`, go: () => onOpenChamado(c.id) }));
    const ord = { alta: 0, media: 1, baixa: 2 };
    return a.sort((x, y) => ord[x.sev] - ord[y.sev]);
  }, [orders, chamados, estoque]);

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
  const [estoque, setEstoque] = useState(loadEstoque);
  const [catFilter, setCatFilter] = useState("todos");
  const [selPeca, setSelPeca] = useState(null);
  const [showAddPart, setShowAddPart] = useState(false);
  const [editPart, setEditPart] = useState(null);
  const [movPeca, setMovPeca] = useState(null);
  const [view, setView] = useState(t.view);
  const [filterPed, setFilterPed] = useState("todos");
  const [filterCh, setFilterCh] = useState("todos");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [orderPrefill, setOrderPrefill] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [confOrder, setConfOrder] = useState(null);
  const [comprovOrder, setComprovOrder] = useState(null);
  const [showNewCh, setShowNewCh] = useState(false);
  const [editCh, setEditCh] = useState(null);
  const [chPrefill, setChPrefill] = useState(null);
  const [selId, setSelId] = useState(null);
  const [selCh, setSelCh] = useState(null);
  const [glpiFor, setGlpiFor] = useState(null);
  const [toasts, setToasts] = useState([]);
  const pushToast = (t) => {
    const id = "t-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    setToasts((p) => [...p, { ...t, id }].slice(-4));
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 5200);
  };
  const closeToast = (id) => setToasts((p) => p.filter((x) => x.id !== id));

  useEffect(() => saveOrders(orders), [orders]);
  useEffect(() => saveChamados(chamados), [chamados]);
  useEffect(() => saveEstoque(estoque), [estoque]);
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
  const isSala = section === "sala";
  const isEst = section === "estoque";
  const canSeeValues = t.showValues && AU.can(me, "valoresVer");
  const canViewReports = AU.can(me, "relatorios");
  const semChrome = isRel || isSala; // escondem busca
  const switchSection = (s) => { setSection(s); setQuery(""); setSelId(null); setSelCh(null); setSelPeca(null); setOrderPrefill(null); setChPrefill(null); };
  useEffect(() => { if (isRel && !canViewReports) setSection("pedidos"); }, [isRel, canViewReports]);

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
  const addOrder = (o) => { setOrders((p) => [{ ...o, historico: [ev("criou", `Pedido ${o.numero} registrado para ${o.cliente}.`)] }, ...p]); setShowAdd(false); setSelId(o.id); pushToast({ type: "pedido", title: "Novo pedido criado", msg: `${o.numero} · ${o.cliente}` }); };
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
  const saveEntrega = (id, entrega) => { updOrder(id, { entrega }, [ev("conferiu", `Entrega assinada por ${entrega.por}.`)]); pushToast({ type: "entrega", title: "Entrega assinada", msg: `Recebido por ${entrega.por}` }); };

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
      pushToast({ type: "alerta", title: "Divergência → chamado aberto", msg: `${ch.numero} · ${o.numero}` });
    } else {
      pushToast({ type: "ok", title: "Recebimento conferido", msg: `${o.numero} sem divergências` });
    }
    // entrada automática no estoque das peças recebidas (casadas por nome ou SKU)
    const entradas = darEntradaEstoque(o);
    if (entradas.length) pushToast({ type: "ok", title: "Estoque atualizado", msg: `${entradas.length} peça(s) deram entrada` });
    setConfOrder(null);
  };

  /* casa itens do pedido com peças e dá entrada */
  const darEntradaEstoque = (o) => {
    const feitas = [];
    setEstoque((arr) => {
      let next = arr;
      (o.itens || []).forEach((it) => {
        const alvo = next.find((p) => (it.sku && p.sku === it.sku) || ST_.normNome(p.nome) === ST_.normNome(it.nome));
        if (alvo) {
          const mov = ST_.mkMov("entrada", it.qtd, `Recebimento do pedido ${o.numero}`, stamp, o.numero);
          next = next.map((p) => p.id === alvo.id ? { ...p, qtd: p.qtd + it.qtd, movs: [...(p.movs || []), mov] } : p);
          feitas.push(alvo.id);
        }
      });
      return next;
    });
    return feitas;
  };

  /* ações — chamados */
  const updCh = (id, patch, events) => setChamados((p) => p.map((c) =>
    c.id === id ? { ...c, ...patch, historico: [...(c.historico || []), ...(events || [])] } : c));
  const advanceCh = (id) => { const c = chamados.find((x) => x.id === id); const nx = CHM.nextCh(c.status); if (nx) updCh(id, { status: nx }, [ev("status", `Status → ${CHM.CH_MAP[nx].label}.`)]); };
  const setChStatus = (id, st) => { const c = chamados.find((x) => x.id === id); if (c && c.status !== st) updCh(id, { status: st }, [ev("status", `Status → ${CHM.CH_MAP[st].label}.`)]); };
  const addChamado = (c) => { const full = { ...c, historico: [ev("criou", `Chamado ${c.numero} aberto.`)] }; setChamados((p) => [full, ...p]); setShowNewCh(false); setChPrefill(null); setSelCh(c.id); setGlpiFor(full); pushToast({ type: "chamado", title: "Chamado aberto", msg: `${c.numero} · ${c.titulo}` }); };
  const saveEditCh = (u) => { setChamados((p) => p.map((c) => c.id === u.id ? { ...u, historico: [...(c.historico || []), ev("editou", "Dados do chamado atualizados.")] } : c)); setEditCh(null); };
  const delChamado = (id) => {
    const c = chamados.find((x) => x.id === id);
    const label = c ? `${c.numero} - ${c.titulo}` : "este chamado";
    if (!window.confirm(`Excluir ${label}? Esta acao nao pode ser desfeita.`)) return;
    setChamados((p) => p.filter((chamado) => chamado.id !== id));
    setSelCh(null);
  };
  const sendGlpi = (id, glpiId) => { updCh(id, { glpi: { sent: true, id: glpiId, sentAt: EXA.TODAY } }, [ev("glpi", `Enviado ao GLPI — ticket #${glpiId}.`)]); pushToast({ type: "glpi", title: "Enviado ao GLPI", msg: `Ticket #${glpiId}` }); };
  const addAnexoCh = (id, novos) => updCh(id, { anexos: [...(chamados.find((c) => c.id === id).anexos || []), ...novos] }, [ev("comentou", `${novos.length} anexo(s) adicionado(s): ${novos.map((n) => n.nome).join(", ")}.`)]);
  const rmAnexoCh = (id, axId) => { const c = chamados.find((x) => x.id === id); const a = (c.anexos || []).find((x) => x.id === axId); updCh(id, { anexos: (c.anexos || []).filter((x) => x.id !== axId) }, [ev("comentou", `Anexo removido${a ? ": " + a.nome : ""}.`)]); };

  /* abrir chamado a partir de um pedido */
  const abrirChamadoDoPedido = (o) => { setSelId(null); setChPrefill(o.numero); setSection("chamados"); setShowNewCh(true); };

  /* ações — estoque */
  const selPecaObj = estoque.find((p) => p.id === selPeca) || null;
  const aplicarMov = (id, tipo, qtd, motivo, novoSaldo, ref) => {
    const p = estoque.find((x) => x.id === id);
    const mov = ST_.mkMov(tipo, qtd, motivo, stamp, ref || null);
    const nova = tipo === "ajuste" ? novoSaldo : tipo === "entrada" ? p.qtd + qtd : Math.max(0, p.qtd - qtd);
    setEstoque((arr) => arr.map((x) => x.id === id ? { ...x, qtd: nova, movs: [...(x.movs || []), mov] } : x));
    return nova;
  };
  const confirmMov = (id, tipo, qtd, motivo, novoSaldo) => {
    const p = estoque.find((x) => x.id === id);
    const nova = aplicarMov(id, tipo, qtd, motivo, novoSaldo);
    setMovPeca(null);
    const m = ST_.MOV[tipo];
    pushToast({ type: tipo === "entrada" ? "ok" : tipo === "saida" ? "chamado" : "glpi", title: `${m.label} registrada`, msg: `${p.nome} · saldo ${nova}` });
    if (ST_.isLow({ ...p, qtd: nova })) pushToast({ type: "alerta", title: "Estoque baixo", msg: `${p.sku} chegou a ${nova} (mín ${p.minimo})` });
  };
  const addPart = (p) => {
    const full = { ...p, movs: p.qtd > 0 ? [ST_.mkMov("entrada", p.qtd, "Cadastro inicial", stamp)] : [] };
    setEstoque((arr) => [full, ...arr]); setShowAddPart(false); setSelPeca(full.id);
    pushToast({ type: "ok", title: "Peça cadastrada", msg: `${p.sku} · ${p.nome}` });
  };
  const saveEditPart = (p) => { setEstoque((arr) => arr.map((x) => x.id === p.id ? { ...x, ...p } : x)); setEditPart(null); };
  const delPart = (id) => {
    const p = estoque.find((x) => x.id === id);
    const label = p ? `${p.sku} - ${p.nome}` : "esta peca";
    if (!window.confirm(`Excluir ${label}? Esta acao nao pode ser desfeita.`)) return;
    setEstoque((arr) => arr.filter((x) => x.id !== id));
    setSelPeca(null);
  };
  /* repor: abre chamado de reposição já preenchido */
  const reporPeca = (p) => {
    setSelPeca(null); setSection("chamados");
    setChPrefill({ tipoChamado: "solicitacao", titulo: `Reposição de estoque — ${p.nome}`, categoria: "Reposição de estoque", prioridade: ST_.isOut(p) ? "urgente" : "alta", descricao: `Peça ${p.sku} (${p.nome}) está ${ST_.isOut(p) ? "sem estoque" : "abaixo do mínimo"}.\nSaldo atual: ${p.qtd} · Mínimo: ${p.minimo}\nSugestão de reposição: ${Math.max(p.minimo * 2 - p.qtd, p.minimo)} un.` });
    setShowNewCh(true);
  };
  /* comprar: abre novo pedido já com o item */
  const comprarPeca = (p) => {
    setSelPeca(null); setSection("pedidos");
    setOrderPrefill({ fornecedor: p.marca, itens: [{ nome: p.nome, qtd: Math.max(p.minimo * 2 - p.qtd, p.minimo), valor: p.custo, sku: p.sku }] });
    setShowAdd(true);
  };

  const nextNum = useMemo(() => "PD-" + (Math.max(1000, ...orders.map((o) => parseInt((o.numero.match(/\d+/) || [0])[0], 10))) + 1), [orders]);
  const nextChNum = useMemo(() => "CH-" + (Math.max(1199, ...chamados.map((c) => parseInt((c.numero.match(/\d+/) || [0])[0], 10))) + 1), [chamados]);

  const filter = isPed ? filterPed : filterCh;
  const setFilter = isPed ? setFilterPed : setFilterCh;
  const filterChips = isPed
    ? [{ key: "todos", label: "Todos", count: orders.length }, ...EXA.STATUS.map((s) => ({ key: s.key, label: s.label, count: orders.filter((o) => o.status === s.key).length, color: s.color }))]
    : [{ key: "todos", label: "Todos", count: chamados.length }, ...CHM.CH_STATUS.map((s) => ({ key: s.key, label: s.label, count: chamados.filter((c) => c.status === s.key).length, color: s.color }))];

  const podeCriar = AU.can(me, "criar");
  const newAction = () => { if (isPed) setShowAdd(true); else if (isEst) setShowAddPart(true); else { setChPrefill(null); setShowNewCh(true); } };

  if (!me) return <LoginScreen onLogin={login} />;

  return (
    <div className="ex-app">
      {/* RAIL */}
      <nav className="ex-rail">
        <div className="ex-brand">
          <LogoTile size={38} radius={10} />
          <div className="ex-brand-tx"><strong>EIXO</strong><span>Controle logístico</span></div>
        </div>
        <div className="ex-nav">
          <button className={"ex-navbtn ex-navbtn--sala" + (isSala ? " is-on" : "")} onClick={() => switchSection("sala")}>
            <Icons.bolt size={17} /> <span className="ex-nav-lbl">Sala de Guerra</span>
            <span className="wr-livetag">AO VIVO</span>
          </button>
          <button className={"ex-navbtn" + (isPed ? " is-on" : "")} onClick={() => switchSection("pedidos")}>
            <Icons.box size={17} /> <span className="ex-nav-lbl">Pedidos</span><span className="ex-navct">{orders.length}</span>
          </button>
          <button className={"ex-navbtn" + (section === "chamados" ? " is-on" : "")} onClick={() => switchSection("chamados")}>
            <Icons.ticket size={17} /> <span className="ex-nav-lbl">Chamados</span><span className="ex-navct">{chamados.filter(CHM.isOpen).length}</span>
          </button>
          <button className={"ex-navbtn" + (isEst ? " is-on" : "")} onClick={() => switchSection("estoque")}>
            <Icons.warehouse size={17} /> <span className="ex-nav-lbl">Estoque</span>
            {estoque.filter(ST_.isLow).length > 0 && <span className="ex-navct ex-navct--warn">{estoque.filter(ST_.isLow).length}</span>}
          </button>
          <button className={"ex-navbtn" + (isHist ? " is-on" : "")} onClick={() => switchSection("historico")}>
            <Icons.clock size={17} /> <span className="ex-nav-lbl">Histórico</span>
          </button>
          {canViewReports && (
            <button className={"ex-navbtn" + (isRel ? " is-on" : "")} onClick={() => switchSection("relatorios")}>
              <Icons.chart size={17} /> <span className="ex-nav-lbl">Relatórios</span>
            </button>
          )}
        </div>
        {!isRel && !isHist && !isSala && !isEst && (
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
        {isEst && (
          <>
            <div className="ex-rail-cap">Filtrar peças</div>
            <div className="ex-rail-chips">
              <button className={"ex-chip" + (catFilter === "todos" ? " is-on" : "")} onClick={() => setCatFilter("todos")}>
                <span className="ex-chip-lbl">Todas</span><span className="ex-chip-ct">{estoque.length}</span>
              </button>
              <button className={"ex-chip" + (catFilter === "baixo" ? " is-on" : "")} onClick={() => setCatFilter("baixo")}>
                <span className="ex-chip-dot" style={{ background: "#D4541E" }} />
                <span className="ex-chip-lbl">Abaixo do mínimo</span><span className="ex-chip-ct">{estoque.filter(ST_.isLow).length}</span>
              </button>
              {ST_.CATEGORIAS.map((c) => (
                <button key={c.key} className={"ex-chip" + (catFilter === c.key ? " is-on" : "")} onClick={() => setCatFilter(c.key)}>
                  <span className="ex-chip-dot" style={{ background: c.cor }} />
                  <span className="ex-chip-lbl">{c.label}</span><span className="ex-chip-ct">{estoque.filter((p) => p.categoria === c.key).length}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {(isRel || isHist || isSala) && <div className="ex-rail-chips" style={{ flex: 1 }} />}
        <div className="ex-rail-foot">
          <UserMenu me={me} onLogout={logout} />
        </div>
      </nav>

      {/* MAIN */}
      <main className="ex-main">
        <header className="ex-top">
          <div className="ex-top-l">
            <h1>{isPed ? "Painel de operações" : isRel ? "Relatórios" : isHist ? "Histórico geral" : isSala ? "Sala de Guerra" : isEst ? "Estoque & Almoxarifado" : "Central de chamados"}</h1>
            <span className="ex-top-date">Terça, 17 jun 2026</span>
          </div>
          <div className="ex-top-r">
            {!semChrome && (
              <label className="ex-search">
                <Icons.search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isPed ? "Buscar pedido, cliente, peça…" : isHist ? "Buscar no histórico…" : isEst ? "Buscar peça, SKU, modelo…" : "Buscar chamado, título…"} />
              </label>
            )}
            <NotificationsBell orders={orders} chamados={chamados} estoque={estoque} onOpenPedido={openPedidoByNum} onOpenChamado={openChamado} onOpenEstoque={(id) => { setSection("estoque"); setSelId(null); setSelCh(null); setSelPeca(id); }} />
            {!isRel && !isHist && !isSala && !isEst && (
              <div className="ex-viewtog">
                <button className={view === "board" ? "is-on" : ""} onClick={() => setView("board")} aria-label="Quadro"><Icons.grid size={16} /></button>
                <button className={view === "list" ? "is-on" : ""} onClick={() => setView("list")} aria-label="Lista"><Icons.list size={16} /></button>
              </div>
            )}
            {isEst && (
              <div className="ex-viewtog">
                <button className={view !== "mapa" ? "is-on" : ""} onClick={() => setView("list")} aria-label="Lista"><Icons.list size={16} /></button>
                <button className={view === "mapa" ? "is-on" : ""} onClick={() => setView("mapa")} aria-label="Mapa"><Icons.warehouse size={16} /></button>
              </div>
            )}
            {!isRel && !isHist && !isSala && podeCriar && (
              <button className="ex-btn ex-btn--primary ex-new" onClick={newAction}>
                <Icons.plus size={16} /> <span>{isPed ? "Novo pedido" : isEst ? "Nova peça" : "Novo chamado"}</span>
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
              {canSeeValues && <KPI icon={Icons.doc} label="Valor em aberto" value={EXA.BRL(kpis.valorAberto)} sub="pedidos não concluídos" accent="#1F7A45" />}
            </section>
            {view === "board"
              ? <BoardView orders={filtered} onSelect={setSelId} onAdvance={advance} compact={t.density === "compact"} />
              : <ListView orders={filtered} onSelect={setSelId} showValues={canSeeValues} />}
          </>
        )}
        {section === "chamados" && (
          <ChamadosContent chamados={chamadosFiltered} view={view} onSelect={setSelCh} onAdvance={advanceCh} compact={t.density === "compact"} />
        )}
        {isRel && canViewReports && <ReportsView orders={orders} chamados={chamados} />}
        {isHist && <GlobalHistory orders={orders} chamados={chamados} query={query} onOpenPedido={openPedidoByNum} onOpenChamado={openChamado} />}
        {isSala && <WarRoom orders={orders} chamados={chamados} pushToast={pushToast} onOpenPedido={openPedidoByNum} onOpenChamado={openChamado} showValues={canSeeValues} />}
        {isEst && <EstoqueContent pecas={estoque} view={view} query={query} catFilter={catFilter} setCatFilter={setCatFilter} onSelect={setSelPeca} onNew={() => setShowAddPart(true)} podeEditar={AU.can(me, "editar")} showValues={canSeeValues} />}
      </main>

      {/* FAB mobile */}
      {!isRel && !isHist && !isSala && podeCriar && <button className="ex-fab" onClick={newAction} aria-label="Novo"><Icons.plus size={22} /></button>}

      {showAdd && <OrderModal onClose={() => { setShowAdd(false); setOrderPrefill(null); }} onSave={addOrder} nextNum={nextNum} prefill={orderPrefill} />}
      {editOrder && <OrderModal onClose={() => setEditOrder(null)} onSave={saveEditOrder} edit={editOrder} />}
      {confOrder && <ConferenciaModal order={confOrder} onClose={() => setConfOrder(null)} onConfirm={confirmConf} />}
      {sel && <DetailDrawer order={sel} me={me} linked={linkedFor(sel.numero)} onClose={() => setSelId(null)}
        onStatus={setStatus} onDelete={delOrder} onEdit={(o) => { setSelId(null); setEditOrder(o); }}
        onConferir={(o) => { setSelId(null); setConfOrder(o); }} onAbrirChamado={abrirChamadoDoPedido} onOpenChamado={openChamado}
        onAddAnexo={addAnexoOrder} onRemoveAnexo={rmAnexoOrder} onComprovante={(o) => setComprovOrder(o)} />}
      {comprovOrder && <ComprovanteModal order={orders.find((o) => o.id === comprovOrder.id) || comprovOrder} me={me} onClose={() => setComprovOrder(null)} onSaveEntrega={saveEntrega} onAnexar={addAnexoOrder} />}

      {showNewCh && <NewChamadoModal onClose={() => { setShowNewCh(false); setChPrefill(null); }} onSave={addChamado} nextNum={nextChNum} pedidos={orders} pedidoPrefill={chPrefill} />}
      {editCh && <NewChamadoModal onClose={() => setEditCh(null)} onSave={saveEditCh} pedidos={orders} edit={editCh} />}
      {selChamado && <ChamadoDrawer chamado={selChamado} me={me} onClose={() => setSelCh(null)} onStatus={setChStatus}
        onDelete={delChamado} onSendGlpi={(c) => setGlpiFor(c)} onEdit={(c) => { setSelCh(null); setEditCh(c); }} onOpenPedido={openPedidoByNum}
        onAddAnexo={addAnexoCh} onRemoveAnexo={rmAnexoCh} />}
      {glpiFor && <GlpiPrompt chamado={glpiFor} onSend={sendGlpi} onSkip={() => setGlpiFor(null)} />}

      {showAddPart && <PartModal onClose={() => setShowAddPart(false)} onSave={addPart} nextSku={"SKU-" + String(estoque.length + 1).padStart(3, "0")} />}
      {editPart && <PartModal edit={editPart} onClose={() => setEditPart(null)} onSave={saveEditPart} />}
      {movPeca && <MovModal peca={movPeca.peca} tipo={movPeca.tipo} onClose={() => setMovPeca(null)} onConfirm={confirmMov} />}
      {selPecaObj && <PartDrawer peca={selPecaObj} me={me} onClose={() => setSelPeca(null)}
        onMov={(p, tp) => setMovPeca({ peca: p, tipo: tp })} onEdit={(p) => { setSelPeca(null); setEditPart(p); }}
        onDelete={delPart} onRepor={reporPeca} onComprar={comprarPeca} showValues={canSeeValues} />}
      <ToastStack toasts={toasts} onClose={closeToast} />

      {/* TWEAKS */}
      <TweaksPanel>
        <TweakSection label="Aparência" />
        <TweakColor label="Cor de acento" value={t.accent} options={["#234A78", "#1F3B5C", "#2C5E4F", "#5B4B8A", "#7A2E3A"]} onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label="Densidade" value={t.density} options={["compact", "regular"]} onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Visualização" />
        <TweakRadio label="Padrão" value={t.view} options={["board", "list"]} onChange={(v) => setTweak("view", v)} />
        {AU.can(me, "valoresVer") && <TweakToggle label="Mostrar valores (R$)" value={t.showValues} onChange={(v) => setTweak("showValues", v)} />}
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
