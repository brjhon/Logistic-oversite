/* EIXO — Estoque / Almoxarifado (UI) */
const ST = window.STOCK;

/* ---------- barra de nível de estoque ---------- */
function StockBar({ p, w }) {
  const niv = ST.nivel(p);
  const cor = ST.NIVEIS[niv].cor;
  const max = Math.max(p.minimo * 2.2, p.qtd, 1);
  const pct = Math.min(100, (p.qtd / max) * 100);
  const minPct = Math.min(100, (p.minimo / max) * 100);
  return (
    <div className="st-bar" style={{ width: w || "100%" }}>
      <div className="st-bar-track">
        <div className="st-bar-fill" style={{ width: pct + "%", background: cor }} />
        <div className="st-bar-min" style={{ left: minPct + "%" }} title={"Mínimo: " + p.minimo} />
      </div>
    </div>
  );
}

function NivelBadge({ p, size }) {
  const niv = ST.nivel(p);
  const m = ST.NIVEIS[niv];
  return (
    <span className="st-nivel" style={{ color: m.cor, background: m.cor + "16", borderColor: m.cor + "33", fontSize: size === "sm" ? 11 : 12 }}>
      <span className="st-nivel-dot" style={{ background: m.cor }} />{m.label}
    </span>
  );
}

function CatBadge({ cat }) {
  const c = ST.CAT_MAP[cat]; if (!c) return null;
  return <span className="st-cat" style={{ color: c.cor, background: c.cor + "14", borderColor: c.cor + "30" }}>{c.label}</span>;
}

/* ============================ conteúdo principal ============================ */
function EstoqueContent({ pecas, view, query, catFilter, setCatFilter, onSelect, onNew, podeEditar, showValues = true }) {
  const filtered = useMemo(() => {
    const q = ST.normNome(query);
    return pecas.filter((p) => {
      if (catFilter === "baixo" && !ST.isLow(p)) return false;
      if (catFilter !== "todos" && catFilter !== "baixo" && p.categoria !== catFilter) return false;
      if (!q) return true;
      return ST.normNome(p.nome).includes(q) || p.sku.toLowerCase().includes(q.replace(/ /g, "")) ||
        ST.normNome(p.marca).includes(q) || (p.aplicacao || []).some((a) => ST.normNome(a).includes(q));
    });
  }, [pecas, query, catFilter]);

  const k = useMemo(() => {
    const valor = pecas.reduce((s, p) => s + ST.valorEstoque(p), 0);
    return {
      skus: pecas.length,
      itens: pecas.reduce((s, p) => s + p.qtd, 0),
      valor,
      baixo: pecas.filter(ST.isLow).length,
      zerado: pecas.filter(ST.isOut).length,
    };
  }, [pecas]);

  return (
    <>
      <section className="ex-kpis">
        <KPI icon={Icons.barcode} label="SKUs cadastrados" value={k.skus} sub={`${k.itens} itens no total`} accent="var(--accent)" />
        {showValues && <KPI icon={Icons.warehouse} label="Valor em estoque" value={ST.BRL(k.valor)} sub="a preço de custo" accent="#1F7A45" />}
        <KPI icon={Icons.alert} label="Abaixo do mínimo" value={k.baixo} sub={k.baixo ? "precisam reposição" : "níveis saudáveis"} accent="#D4541E" alert={k.baixo > 0} />
        <KPI icon={Icons.arrowDown} label="Sem estoque" value={k.zerado} sub={k.zerado ? "ruptura — repor já" : "nenhuma ruptura"} accent="#B42318" alert={k.zerado > 0} />
      </section>

      {view === "mapa"
        ? <MapaAlmox pecas={filtered} onSelect={onSelect} />
        : <EstoqueList pecas={filtered} onSelect={onSelect} showValues={showValues} />}
    </>
  );
}

/* ---------- Lista (planilha) ---------- */
function EstoqueList({ pecas, onSelect, showValues = true }) {
  if (!pecas.length) return <div className="ex-empty">Nenhuma peça encontrada com esse filtro.</div>;
  return (
    <section className="ex-listwrap">
      <div className="st-tbl">
        <div className="st-tr st-tr--head">
          <span>SKU</span><span>Peça</span><span>Categoria</span><span>Local</span>
          <span className="st-c">Estoque</span><span>Nível</span><span className="st-r">Custo un.</span><span className="st-r">Valor</span>
        </div>
        {pecas.map((p) => (
          <div className="st-tr" key={p.id} onClick={() => onSelect(p.id)}>
            <span className="st-sku">{p.sku}</span>
            <span className="st-name"><strong>{p.nome}</strong><em>{p.marca}</em></span>
            <span><CatBadge cat={p.categoria} /></span>
            <span className="st-loc"><Icons.pin size={12} /> {p.prateleira}</span>
            <span className="st-c">
              <span className="st-qtd" style={ST.isLow(p) ? { color: ST.NIVEIS[ST.nivel(p)].cor } : null}>{p.qtd}</span>
              <span className="st-min">/ mín {p.minimo}</span>
              <StockBar p={p} />
            </span>
            <span><NivelBadge p={p} size="sm" /></span>
            <span className="st-r st-mono">{showValues ? ST.BRL(p.custo) : "RESTRITO"}</span>
            <span className="st-r st-mono st-val">{showValues ? ST.BRL(ST.valorEstoque(p)) : "RESTRITO"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Mapa do almoxarifado ---------- */
function MapaAlmox({ pecas, onSelect }) {
  const byCorr = useMemo(() => {
    const g = {};
    ST.CORREDORES.forEach((c) => (g[c] = []));
    pecas.forEach((p) => { (g[p.corredor] = g[p.corredor] || []).push(p); });
    Object.values(g).forEach((arr) => arr.sort((a, b) => a.prateleira.localeCompare(b.prateleira)));
    return g;
  }, [pecas]);

  return (
    <section className="st-mapa">
      {ST.CORREDORES.map((c) => {
        const items = byCorr[c] || [];
        const low = items.filter(ST.isLow).length;
        return (
          <div className="st-corr" key={c}>
            <div className="st-corr-head">
              <span className="st-corr-tag">Corredor {c}</span>
              <span className="st-corr-meta">{items.length} SKUs{low ? ` · ${low} baixo` : ""}</span>
            </div>
            <div className="st-corr-body">
              {items.length === 0 ? <div className="st-corr-empty">vazio</div> : items.map((p) => {
                const cor = ST.NIVEIS[ST.nivel(p)].cor;
                return (
                  <button className="st-cell" key={p.id} onClick={() => onSelect(p.id)} style={{ "--nc": cor }}>
                    <div className="st-cell-top">
                      <span className="st-cell-shelf">{p.prateleira}</span>
                      <span className="st-cell-qtd">{p.qtd}</span>
                    </div>
                    <div className="st-cell-name">{p.nome}</div>
                    <div className="st-cell-bar"><StockBar p={p} /></div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/* ============================ drawer da peça ============================ */
function PartDrawer({ peca, me, onClose, onMov, onEdit, onDelete, onRepor, onComprar, showValues = true }) {
  const [tab, setTab] = useState("info");
  if (!peca) return null;
  const p = peca;
  const niv = ST.nivel(p);
  const pode = window.AUTH.can(me, "editar");
  const movs = (p.movs || []).slice().sort((a, b) => new Date(b.ts) - new Date(a.ts));

  return (
    <div className="ex-overlay ex-overlay--right" onMouseDown={onClose}>
      <aside className="ex-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ex-drawer-head">
          <div>
            <div className="ex-eyebrow">{p.sku} · {ST.CAT_MAP[p.categoria].label}</div>
            <h2>{p.nome}</h2>
          </div>
          <button className="ex-icobtn" onClick={onClose} aria-label="Fechar"><Icons.x /></button>
        </div>

        {/* destaque do estoque */}
        <div className="st-drawer-hero" style={{ "--nc": ST.NIVEIS[niv].cor }}>
          <div className="st-hero-main">
            <span className="st-hero-qtd">{p.qtd}</span>
            <span className="st-hero-unit">em estoque</span>
          </div>
          <div className="st-hero-side">
            <NivelBadge p={p} />
            <div className="st-hero-min">mínimo {p.minimo} · {p.marca}</div>
            <StockBar p={p} />
          </div>
        </div>

        {ST.isLow(p) && (
          <div className="st-repor-banner">
            <div><Icons.alert size={16} /> {ST.isOut(p) ? "Sem estoque — ruptura!" : "Abaixo do mínimo."} Sugerimos repor {Math.max(p.minimo * 2 - p.qtd, p.minimo)} un.</div>
            <div className="st-repor-acts">
              <button onClick={() => onComprar(p)}><Icons.cart size={13} /> Pedido de compra</button>
              <button onClick={() => onRepor(p)}><Icons.ticket size={13} /> Abrir reposição</button>
            </div>
          </div>
        )}

        <div className="ex-tabs">
          <button className={tab === "info" ? "is-on" : ""} onClick={() => setTab("info")}>Detalhes</button>
          <button className={tab === "movs" ? "is-on" : ""} onClick={() => setTab("movs")}>Movimentações <span className="ex-tab-ct">{movs.length}</span></button>
        </div>

        <div className="ex-drawer-body">
          {tab === "info" ? (
            <>
              {pode && (
                <div className="st-mov-actions">
                  <button className="st-mov-btn st-in" onClick={() => onMov(p, "entrada")}><Icons.arrowDown size={16} /> Entrada</button>
                  <button className="st-mov-btn st-out" onClick={() => onMov(p, "saida")}><Icons.arrowUp size={16} /> Saída</button>
                  <button className="st-mov-btn st-adj" onClick={() => onMov(p, "ajuste")}><Icons.edit size={15} /> Ajuste</button>
                </div>
              )}
              <div className="ex-info-grid ex-mt">
                <Info icon={Icons.barcode} label="SKU" value={p.sku} />
                <Info icon={Icons.tag} label="Marca" value={p.marca} />
                <Info icon={Icons.pin} label="Localização" value={`Corredor ${p.corredor} · ${p.prateleira}`} />
                <Info icon={Icons.layers} label="Categoria" value={ST.CAT_MAP[p.categoria].label} />
                {showValues && <Info icon={Icons.doc} label="Custo unitário" value={ST.BRL(p.custo)} />}
                {showValues && <Info icon={Icons.tag} label="Preço de venda" value={`${ST.BRL(p.venda)} · +${ST.margem(p)}%`} />}
              </div>
              {showValues && (
                <div className="st-valorbox">
                  <span>Valor total imobilizado</span>
                  <strong>{ST.BRL(ST.valorEstoque(p))}</strong>
                </div>
              )}
              <div className="ex-eyebrow ex-mt">Aplicação</div>
              <div className="st-aplic">
                {(p.aplicacao || []).map((a, i) => <span key={i} className="st-aplic-tag"><Icons.truck size={12} /> {a}</span>)}
              </div>
              {pode && (
                <div className="st-drawer-foot">
                  <button className="ex-btn ex-btn--ghost" onClick={() => onEdit(p)}><Icons.edit size={15} /> Editar peça</button>
                  {window.AUTH.can(me, "excluir") && <button className="ex-del" onClick={() => onDelete(p.id)}><Icons.trash size={15} /> Excluir</button>}
                </div>
              )}
            </>
          ) : (
            <div className="ex-mt">
              {movs.length === 0 ? <div className="ex-tl-empty">Nenhuma movimentação.</div> : (
                <div className="st-movlist">
                  {movs.map((mv) => {
                    const m = ST.MOV[mv.tipo];
                    const I = Icons[m.ico] || Icons.swap;
                    return (
                      <div className="st-movrow" key={mv.id}>
                        <span className="st-mov-ico" style={{ color: m.cor, background: m.cor + "16", borderColor: m.cor + "33" }}><I size={14} /></span>
                        <div className="st-mov-tx">
                          <div className="st-mov-l1">
                            <strong>{m.label}</strong>
                            <span className="st-mov-q" style={{ color: m.cor }}>{mv.tipo === "entrada" ? "+" : mv.tipo === "saida" ? "−" : "="}{mv.qtd}</span>
                          </div>
                          <div className="st-mov-l2">{mv.motivo || "—"}{mv.ref ? ` · ${mv.ref}` : ""}</div>
                          <div className="st-mov-l3"><Avatar user={mv.user} size={16} /> {mv.user.nome} · {window.HIST.fmtDateTime(mv.ts)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ============================ modal de movimentação ============================ */
function MovModal({ peca, tipo: tipo0, onClose, onConfirm }) {
  const [tipo, setTipo] = useState(tipo0 || "entrada");
  const [qtd, setQtd] = useState(tipo0 === "ajuste" ? peca.qtd : 1);
  const [motivo, setMotivo] = useState("");
  const m = ST.MOV[tipo];
  const novoSaldo = tipo === "entrada" ? peca.qtd + Number(qtd || 0) : tipo === "saida" ? peca.qtd - Number(qtd || 0) : Number(qtd || 0);
  const invalido = tipo === "saida" && Number(qtd) > peca.qtd;

  const motivos = {
    entrada: ["Recebimento de pedido", "Devolução", "Compra avulsa", "Correção de inventário"],
    saida: ["Requisição — oficina interna", "Venda / atendimento cliente", "Transferência", "Perda / avaria"],
    ajuste: ["Inventário físico", "Correção de cadastro"],
  };

  const confirm = () => {
    if (!qtd || (tipo !== "ajuste" && Number(qtd) <= 0) || invalido) return;
    onConfirm(peca.id, tipo, Number(qtd), motivo, novoSaldo);
  };

  return (
    <div className="ex-overlay" onMouseDown={onClose}>
      <div className="ex-modal" style={{ width: "min(460px,100%)" }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="ex-modal-head">
          <div><div className="ex-eyebrow">{peca.sku} · {peca.qtd} em estoque</div><h2>Movimentar estoque</h2></div>
          <button className="ex-icobtn" onClick={onClose} aria-label="Fechar"><Icons.x /></button>
        </div>
        <div className="ex-modal-body">
          <div className="st-mov-seg">
            {["entrada", "saida", "ajuste"].map((tp) => {
              const mm = ST.MOV[tp]; const I = Icons[mm.ico] || Icons.swap;
              return (
                <button key={tp} className={"st-seg-btn" + (tipo === tp ? " is-on" : "")} style={tipo === tp ? { "--sc": mm.cor } : null}
                  onClick={() => { setTipo(tp); setQtd(tp === "ajuste" ? peca.qtd : 1); }}>
                  <I size={15} /> {mm.label}
                </button>
              );
            })}
          </div>

          <div className="ex-form-grid" style={{ gridTemplateColumns: "1fr", marginTop: 16 }}>
            <Field label={tipo === "ajuste" ? "Novo saldo (contagem física)" : "Quantidade"} req>
              <input type="number" min={tipo === "ajuste" ? "0" : "1"} value={qtd} autoFocus onChange={(e) => setQtd(e.target.value)} />
            </Field>
            <Field label="Motivo">
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option value="">Selecione…</option>
                {motivos[tipo].map((mo) => <option key={mo} value={mo}>{mo}</option>)}
              </select>
            </Field>
          </div>

          {invalido && <div className="ex-login-err"><Icons.alert size={14} /> Saída maior que o estoque disponível ({peca.qtd}).</div>}

          <div className="st-mov-preview" style={{ "--pc": m.cor }}>
            <span>Saldo após {m.label.toLowerCase()}</span>
            <strong>{peca.qtd} → {novoSaldo < 0 ? 0 : novoSaldo}</strong>
          </div>
        </div>
        <div className="ex-modal-foot">
          <button className="ex-btn ex-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="ex-btn ex-btn--primary" onClick={confirm} disabled={invalido || !qtd}>Confirmar {m.label.toLowerCase()}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ modal de peça (novo/editar) ============================ */
function PartModal({ edit, onClose, onSave, nextSku }) {
  const [f, setF] = useState(edit || {
    sku: nextSku, nome: "", categoria: "freio", marca: "", qtd: 0, minimo: 5,
    corredor: "A", prateleira: "", custo: "", venda: "", aplicacao: [],
  });
  const [aplic, setAplic] = useState((edit && edit.aplicacao || []).join(", "));
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valido = f.nome.trim() && f.sku.trim();

  const submit = () => {
    if (!valido) return;
    onSave({
      ...f, id: edit ? edit.id : "sk-" + Date.now(),
      qtd: Number(f.qtd) || 0, minimo: Number(f.minimo) || 0,
      custo: Number(f.custo) || 0, venda: Number(f.venda) || 0,
      aplicacao: aplic.split(",").map((s) => s.trim()).filter(Boolean),
      movs: edit ? edit.movs : [],
    });
  };

  return (
    <div className="ex-overlay" onMouseDown={onClose}>
      <div className="ex-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ex-modal-head">
          <div><div className="ex-eyebrow">{edit ? "Editar" : "Nova peça"}</div><h2>{edit ? f.nome : "Cadastrar peça no estoque"}</h2></div>
          <button className="ex-icobtn" onClick={onClose} aria-label="Fechar"><Icons.x /></button>
        </div>
        <div className="ex-modal-body">
          <div className="ex-form-grid">
            <Field label="SKU / código" req><input value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder="FRE-PAST-001" /></Field>
            <Field label="Categoria">
              <select value={f.categoria} onChange={(e) => set("categoria", e.target.value)}>
                {ST.CATEGORIAS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Nome / descrição" req><input value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Pastilha de freio dianteira" /></Field>
            </div>
            <Field label="Marca / fabricante"><input value={f.marca} onChange={(e) => set("marca", e.target.value)} placeholder="Ex: Bosch" /></Field>
            <Field label="Quantidade atual"><input type="number" min="0" value={f.qtd} onChange={(e) => set("qtd", e.target.value)} disabled={!!edit} /></Field>
            <Field label="Estoque mínimo"><input type="number" min="0" value={f.minimo} onChange={(e) => set("minimo", e.target.value)} /></Field>
            <Field label="Corredor">
              <select value={f.corredor} onChange={(e) => set("corredor", e.target.value)}>
                {ST.CORREDORES.map((c) => <option key={c} value={c}>Corredor {c}</option>)}
              </select>
            </Field>
            <Field label="Prateleira"><input value={f.prateleira} onChange={(e) => set("prateleira", e.target.value)} placeholder="A-03" /></Field>
            <Field label="Preço de custo"><input type="number" min="0" step="0.01" value={f.custo} onChange={(e) => set("custo", e.target.value)} placeholder="0,00" /></Field>
            <Field label="Preço de venda"><input type="number" min="0" step="0.01" value={f.venda} onChange={(e) => set("venda", e.target.value)} placeholder="0,00" /></Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Aplicação (modelos, separados por vírgula)"><input value={aplic} onChange={(e) => setAplic(e.target.value)} placeholder="Gol G6, Onix, HB20" /></Field>
            </div>
          </div>
          {edit && <p className="st-hint">A quantidade só muda por movimentações (entrada/saída/ajuste), preservando o histórico.</p>}
        </div>
        <div className="ex-modal-foot">
          <button className="ex-btn ex-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="ex-btn ex-btn--primary" onClick={submit} disabled={!valido}><Icons.check size={16} /> {edit ? "Salvar" : "Cadastrar peça"}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EstoqueContent, PartDrawer, MovModal, PartModal, StockBar, NivelBadge, CatBadge });
