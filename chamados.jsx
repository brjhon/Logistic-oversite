/* EIXO — tela de chamados + integração GLPI (simulada) */
const CH = window.CHAM;

/* ---------------- Badges ---------------- */
function ChamadoBadge({ status, size = "md" }) {
  const s = CH.CH_MAP[status];
  if (!s) return null;
  const pad = size === "sm" ? "3px 9px" : "5px 11px";
  const fs = size === "sm" ? 11.5 : 12.5;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: pad,
      borderRadius: 999, fontSize: fs, fontWeight: 600, letterSpacing: ".01em",
      color: s.color, background: s.tint, border: `1px solid ${s.color}40`,
      whiteSpace: "nowrap", lineHeight: 1,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.color }} />
      {s.label}
    </span>
  );
}
function PriorityTag({ priority }) {
  const p = CH.PR_MAP[priority];
  if (!p) return null;
  return (
    <span className="ex-prio" style={{ color: p.color, background: p.color + "16", borderColor: p.color + "3d" }}>
      <Icons.flag size={11} /> {p.label}
    </span>
  );
}
function GlpiTag({ glpi }) {
  if (glpi && glpi.sent)
    return <span className="ex-glpi-tag is-sent"><Icons.check size={12} /> GLPI #{glpi.id}</span>;
  return <span className="ex-glpi-tag"><Icons.send size={12} /> Não enviado</span>;
}

/* ---------------- Card ---------------- */
function ChamadoCard({ c, onClick, onAdvance, compact, canAdvance = true }) {
  const s = CH.CH_MAP[c.status];
  const next = CH.nextCh(c.status);
  const advLabel = { novo: "Atender", atendimento: "Resolver", pendente: "Retomar", solucionado: "Fechar" }[c.status];
  return (
    <article className={"ex-card" + (compact ? " ex-card--c" : "")} onClick={onClick} style={{ "--st": s.color }}>
      <div className="ex-card-head">
        <span className="ex-card-num">{c.numero}</span>
        <PriorityTag priority={c.prioridade} />
      </div>
      <div className="ex-card-client">{c.titulo}</div>
      <div className="ex-card-meta">
        <span><Icons.tag size={13} /> {c.categoria}</span>
        {c.pedido ? <span className="ex-ped-link"><Icons.link size={12} /> {c.pedido}</span> : null}
      </div>
      {!compact && (
        <div className="ex-card-foot">
          <GlpiTag glpi={c.glpi} />
          {next && advLabel && canAdvance ? (
            <button className="ex-adv" onClick={(e) => { e.stopPropagation(); onAdvance(c.id); }}>
              {advLabel} <Icons.chevR size={13} />
            </button>
          ) : next ? (
            <span className="ex-card-supp">Somente leitura</span>
          ) : (
            <span className="ex-done-tag"><Icons.check size={13} /> fechado</span>
          )}
        </div>
      )}
    </article>
  );
}

/* ---------------- Conteúdo (KPIs + quadro/lista) ---------------- */
function ChamadosContent({ chamados, view, onSelect, onAdvance, compact, canAdvance = true }) {
  const abertos = chamados.filter(CH.isOpen).length;
  const atendimento = chamados.filter((c) => c.status === "atendimento").length;
  const altas = chamados.filter((c) => CH.isOpen(c) && (c.prioridade === "alta" || c.prioridade === "urgente")).length;
  const naoEnviados = chamados.filter((c) => !c.glpi.sent).length;
  const sincronizados = chamados.filter((c) => c.glpi.sent).length;

  return (
    <>
      <section className="ex-kpis">
        <KPI icon={Icons.ticket} label="Chamados abertos" value={abertos} sub={`${chamados.length} no total`} accent="var(--accent)" />
        <KPI icon={Icons.clock} label="Em atendimento" value={atendimento} sub="sendo tratados" accent="#B66A12" />
        <KPI icon={Icons.alert} label="Alta prioridade" value={altas} sub="alta + urgente em aberto" accent="#B42318" alert={altas > 0} />
        <KPI icon={Icons.send} label="Não enviados ao GLPI" value={naoEnviados} sub={naoEnviados ? "aguardando envio" : "tudo sincronizado"} accent="#2F6FCF" />
        <KPI icon={Icons.check} label="Sincronizados GLPI" value={sincronizados} sub="tickets criados" accent="#1F7A45" />
      </section>

      {view === "board" ? (
        <section className="ex-board ex-board--ch">
          {CH.CH_STATUS.map((s) => {
            const items = chamados.filter((c) => c.status === s.key);
            return (
              <div className="ex-col" key={s.key} style={{ "--st": s.color }}>
                <div className="ex-col-head">
                  <span className="ex-col-dot" />
                  <span className="ex-col-name">{s.label}</span>
                  <span className="ex-col-ct">{items.length}</span>
                </div>
                <div className="ex-col-body">
                  {items.length === 0 ? (
                    <div className="ex-col-empty">Sem chamados</div>
                  ) : items.map((c) => (
                    <ChamadoCard key={c.id} c={c} compact={compact} onClick={() => onSelect(c.id)} onAdvance={onAdvance} canAdvance={canAdvance} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <ChamadosList chamados={chamados} onSelect={onSelect} />
      )}
    </>
  );
}

function ChamadosList({ chamados, onSelect }) {
  if (chamados.length === 0)
    return <div className="ex-empty">Nenhum chamado encontrado com esse filtro.</div>;
  return (
    <section className="ex-listwrap">
      <div className="ex-tbl ex-tbl--ch">
        <div className="ex-tr ex-tr--head">
          <span>Chamado</span><span>Título</span><span>Categoria</span>
          <span>Prioridade</span><span>Pedido</span><span>GLPI</span><span>Status</span>
        </div>
        {chamados.map((c) => (
          <div className="ex-tr" key={c.id} onClick={() => onSelect(c.id)}>
            <span className="ex-tr-num">{c.numero}</span>
            <span className="ex-tr-client">{c.titulo}</span>
            <span className="ex-tr-mut">{c.categoria}</span>
            <span><PriorityTag priority={c.prioridade} /></span>
            <span className="ex-tr-mut">{c.pedido || "—"}</span>
            <span className="ex-tr-mut">{c.glpi.sent ? <span className="ex-glpi-tag is-sent ex-glpi-tag--mini"><Icons.check size={11} /> #{c.glpi.id}</span> : "—"}</span>
            <span><ChamadoBadge status={c.status} size="sm" /></span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Modal: novo / editar chamado ---------------- */
function NewChamadoModal({ onClose, onSave, nextNum, pedidos, edit, pedidoPrefill }) {
  const isEdit = !!edit;
  const [f, setF] = useState(() => edit ? {
    tipo: edit.tipo, titulo: edit.titulo, categoria: edit.categoria, prioridade: edit.prioridade,
    pedido: edit.pedido || (pedidos[0] ? pedidos[0].numero : ""),
    solicitante: edit.solicitante === "—" ? "" : edit.solicitante,
    tecnico: edit.tecnico === "—" ? "" : edit.tecnico, descricao: edit.descricao,
  } : {
    tipo: pedidoPrefill ? "ocorrencia" : "ocorrencia", titulo: "", categoria: CH.CATEGORIAS[0], prioridade: "media",
    pedido: pedidoPrefill || (pedidos[0] ? pedidos[0].numero : ""), solicitante: "", tecnico: "", descricao: "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const isOcc = f.tipo === "ocorrencia";
  const valid = f.titulo.trim() && f.descricao.trim() && (!isOcc || f.pedido);

  const submit = () => {
    if (!valid) return;
    const base = {
      tipo: f.tipo, titulo: f.titulo.trim(), categoria: f.categoria, prioridade: f.prioridade,
      pedido: isOcc ? f.pedido : null, solicitante: f.solicitante.trim() || "—",
      tecnico: f.tecnico.trim() || "—", descricao: f.descricao.trim(),
    };
    if (isEdit) onSave({ ...edit, ...base });
    else onSave({
      ...base, id: "c-" + Date.now(), numero: nextNum, status: "novo", aberto: EX.TODAY,
      glpi: { sent: false, id: null, sentAt: null },
    });
  };

  return (
    <div className="ex-overlay" onMouseDown={onClose}>
      <div className="ex-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ex-modal-head">
          <div>
            <div className="ex-eyebrow">{isEdit ? "Editar chamado" : "Novo chamado"}</div>
            <h2>{isEdit ? `Editar ${edit.numero}` : "Abrir chamado"}</h2>
          </div>
          <button className="ex-icobtn" onClick={onClose} aria-label="Fechar"><Icons.x /></button>
        </div>

        <div className="ex-modal-body">
          <div className="ex-field" style={{ marginBottom: 16 }}>
            <span className="ex-field-label">Tipo de chamado</span>
            <div className="ex-seg">
              <button className={f.tipo === "ocorrencia" ? "is-on" : ""} onClick={() => set("tipo", "ocorrencia")}>
                <Icons.link size={14} /> Ocorrência de pedido
              </button>
              <button className={f.tipo === "solicitacao" ? "is-on" : ""} onClick={() => set("tipo", "solicitacao")}>
                <Icons.ticket size={14} /> Solicitação avulsa
              </button>
            </div>
          </div>

          <div className="ex-form-grid">
            <label className="ex-field" style={{ gridColumn: "1 / -1" }}>
              <span className="ex-field-label">Título / assunto <i>*</i></span>
              <input value={f.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Resuma o chamado em uma linha" />
            </label>
            <label className="ex-field">
              <span className="ex-field-label">Categoria</span>
              <select value={f.categoria} onChange={(e) => set("categoria", e.target.value)}>
                {CH.CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="ex-field">
              <span className="ex-field-label">Prioridade</span>
              <select value={f.prioridade} onChange={(e) => set("prioridade", e.target.value)}>
                {CH.PRIORITY.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </label>
            {isOcc && (
              <label className="ex-field">
                <span className="ex-field-label">Pedido vinculado <i>*</i></span>
                <select value={f.pedido} onChange={(e) => set("pedido", e.target.value)}>
                  {pedidos.map((o) => <option key={o.id} value={o.numero}>{o.numero} — {o.cliente}</option>)}
                </select>
              </label>
            )}
            <label className="ex-field">
              <span className="ex-field-label">Solicitante</span>
              <input value={f.solicitante} onChange={(e) => set("solicitante", e.target.value)} placeholder="Quem abriu" />
            </label>
            <label className="ex-field">
              <span className="ex-field-label">Responsável / técnico</span>
              <input value={f.tecnico} onChange={(e) => set("tecnico", e.target.value)} placeholder="Quem vai tratar" />
            </label>
          </div>

          <label className="ex-field">
            <span className="ex-field-label">Descrição <i>*</i></span>
            <textarea rows={3} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Detalhe a ocorrência ou solicitação" />
          </label>
        </div>

        <div className="ex-modal-foot">
          <button className="ex-btn ex-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="ex-btn ex-btn--primary" onClick={submit} disabled={!valid}>
            {isEdit ? <><Icons.check size={16} /> Salvar alterações</> : <><Icons.plus size={16} /> Abrir chamado</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Prompt: enviar ao GLPI (simulado) ---------------- */
function GlpiPrompt({ chamado, onSend, onSkip }) {
  const [stage, setStage] = useState("confirm");
  const [glpiId, setGlpiId] = useState(null);
  const doSend = () => {
    setStage("sending");
    setTimeout(() => {
      const id = CH.genGlpiId();
      setGlpiId(id);
      onSend(chamado.id, id);
      setStage("done");
    }, 1300);
  };
  return (
    <div className="ex-overlay" onMouseDown={stage === "sending" ? undefined : onSkip}>
      <div className="ex-glpi-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ex-glpi-mark">GLPI</div>

        {stage === "confirm" && (
          <>
            <h3>Enviar para o GLPI?</h3>
            <p>O chamado <strong>{chamado.numero}</strong> — “{chamado.titulo}” — será aberto como ticket no GLPI.</p>
            <div className="ex-glpi-note"><Icons.alert size={13} /> Integração simulada (demonstração). A conexão real com o seu GLPI fica como próximo passo.</div>
            <div className="ex-glpi-actions">
              <button className="ex-btn ex-btn--ghost" onClick={onSkip}>Agora não</button>
              <button className="ex-btn ex-btn--primary" onClick={doSend}><Icons.send size={15} /> Enviar ao GLPI</button>
            </div>
          </>
        )}
        {stage === "sending" && (
          <>
            <div className="ex-spinner" />
            <h3>Enviando ao GLPI…</h3>
            <p>Criando o ticket no sistema.</p>
          </>
        )}
        {stage === "done" && (
          <>
            <div className="ex-glpi-check"><Icons.check size={28} /></div>
            <h3>Chamado enviado!</h3>
            <p>Ticket criado no GLPI com o número:</p>
            <div className="ex-glpi-id">GLPI #{glpiId}</div>
            <div className="ex-glpi-actions ex-glpi-actions--center">
              <button className="ex-btn ex-btn--primary" onClick={onSkip}>Concluir</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Drawer de detalhe ---------------- */
function ChamadoDrawer({ chamado, me, onClose, onStatus, onDelete, onSendGlpi, onEdit, onOpenPedido, onAddAnexo, onRemoveAnexo }) {
  const [tab, setTab] = useState("detalhe");
  if (!chamado) return null;
  const c = chamado;
  const A = window.AUTH;
  const curIdx = CH.CH_STATUS.findIndex((s) => s.key === c.status);
  const tipoLbl = c.tipo === "ocorrencia" ? "Ocorrência de pedido" : "Solicitação avulsa";
  const podeStatus = A.can(me, "chamadosStatus");

  return (
    <div className="ex-overlay ex-overlay--right" onMouseDown={onClose}>
      <aside className="ex-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ex-drawer-head">
          <div>
            <div className="ex-eyebrow">{c.numero} · {tipoLbl}</div>
            <h2>{c.titulo}</h2>
          </div>
          <div className="ex-drawer-actions">
            {A.can(me, "chamadosEditar") && <button className="ex-icobtn" onClick={() => onEdit(c)} title="Editar" aria-label="Editar"><Icons.edit size={16} /></button>}
            <button className="ex-icobtn" onClick={onClose} aria-label="Fechar"><Icons.x /></button>
          </div>
        </div>

        <div className="ex-tabs">
          <button className={tab === "detalhe" ? "is-on" : ""} onClick={() => setTab("detalhe")}>Detalhes</button>
          <button className={tab === "hist" ? "is-on" : ""} onClick={() => setTab("hist")}>
            Histórico <span className="ex-tab-ct">{(c.historico || []).length}</span>
          </button>
          <button className={tab === "anexos" ? "is-on" : ""} onClick={() => setTab("anexos")}>
            Anexos <span className="ex-tab-ct">{(c.anexos || []).length}</span>
          </button>
        </div>

        <div className="ex-drawer-body">
          {tab === "hist" ? (
            <div className="ex-mt"><Timeline events={c.historico} /></div>
          ) : tab === "anexos" ? (
            <AttachmentsPanel anexos={c.anexos} podeEditar={A.can(me, "anexosEditar")}
              onAdd={(novos) => onAddAnexo(c.id, novos)} onRemove={(axId) => onRemoveAnexo(c.id, axId)} />
          ) : (
          <>
          <div className="ex-badge-row">
            <PriorityTag priority={c.prioridade} />
            <ChamadoBadge status={c.status} />
          </div>

          {/* GLPI panel */}
          <div className={"ex-glpi-panel" + (c.glpi.sent ? " is-sent" : "")}>
            <div className="ex-glpi-panel-mark">GLPI</div>
            {c.glpi.sent ? (
              <div className="ex-glpi-panel-info">
                <strong><Icons.check size={14} /> Sincronizado com o GLPI</strong>
                <span>Ticket #{c.glpi.id} · enviado em {EX.fmtDate(c.glpi.sentAt)}</span>
              </div>
            ) : (
              <div className="ex-glpi-panel-info">
                <strong>Ainda não enviado ao GLPI</strong>
                <span>Abra um ticket no GLPI a partir deste chamado.</span>
              </div>
            )}
            {!c.glpi.sent && A.can(me, "chamadosGlpi") && (
              <button className="ex-btn ex-btn--primary ex-glpi-panel-btn" onClick={() => onSendGlpi(c)}>
                <Icons.send size={15} /> Enviar ao GLPI
              </button>
            )}
          </div>

          {/* stepper */}
          <div className="ex-eyebrow ex-mt">Status do chamado</div>
          <div className="ex-stepper ex-stepper--ch">
            {CH.CH_STATUS.map((s, i) => {
              const done = i < curIdx, cur = i === curIdx;
              return (
                <button key={s.key} className={"ex-step" + (cur ? " is-cur" : done ? " is-done" : "")}
                  style={{ "--st": s.color }} onClick={() => podeStatus && onStatus(c.id, s.key)} disabled={!podeStatus}>
                  <span className="ex-step-dot">{done ? <Icons.check size={12} /> : i + 1}</span>
                  <span className="ex-step-lbl">{s.short}</span>
                </button>
              );
            })}
          </div>

          {/* info */}
          <div className="ex-info-grid ex-mt">
            <Info icon={Icons.tag} label="Categoria" value={c.categoria} />
            <Info icon={Icons.user} label="Solicitante" value={c.solicitante} />
            <Info icon={Icons.user} label="Responsável" value={c.tecnico} />
            <Info icon={Icons.clock} label="Aberto em" value={EX.fmtDate(c.aberto)} />
          </div>
          {c.pedido && (
            <button className="ex-linkrow ex-linkrow--ped" onClick={() => onOpenPedido && onOpenPedido(c.pedido)} style={{ "--st": "var(--accent)", marginTop: 11 }}>
              <span className="ex-linkrow-dot" />
              <span className="ex-linkrow-tx"><strong><Icons.link size={13} /> Pedido vinculado {c.pedido}</strong><span>abrir o pedido</span></span>
              <Icons.chevR size={16} />
            </button>
          )}

          <div className="ex-eyebrow ex-mt">Descrição</div>
          <p className="ex-obs">{c.descricao}</p>

          {A.can(me, "chamadosExcluir") && (
            <button className="ex-del" onClick={() => onDelete(c.id)}>
              <Icons.trash size={15} /> Excluir chamado
            </button>
          )}
          </>
          )}
        </div>
      </aside>
    </div>
  );
}

Object.assign(window, {
  ChamadoBadge, PriorityTag, GlpiTag, ChamadoCard,
  ChamadosContent, ChamadosList, NewChamadoModal, GlpiPrompt, ChamadoDrawer,
});
