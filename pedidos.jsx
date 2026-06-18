/* EIXO — pedidos: modais, drawer, conferência, quadro/lista */
const EXP = window.EIXO;
const AUP = window.AUTH;
const HP = window.HIST;

/* ---------------- Campo genérico ---------------- */
function Field({ label, req, children, full }) {
  return (
    <label className={"ex-field" + (full ? " ex-field--full" : "")}>
      <span className="ex-field-label">{label}{req ? <i> *</i> : null}</span>
      {children}
    </label>
  );
}
function Info({ icon: I, label, value, accent }) {
  return (
    <div className="ex-info">
      <span className="ex-info-ico"><I size={15} /></span>
      <div>
        <div className="ex-info-lbl">{label}</div>
        <div className="ex-info-val" style={accent ? { color: "var(--accent-d)" } : null}>{value}</div>
      </div>
    </div>
  );
}

/* ---------------- Modal adicionar / editar pedido ---------------- */
function OrderModal({ onClose, onSave, nextNum, edit, prefill }) {
  const isEdit = !!edit;
  const [f, setF] = useState(() => edit ? {
    numero: edit.numero, nota: edit.nota || "", cliente: edit.cliente, fornecedor: edit.fornecedor === "—" ? "" : edit.fornecedor,
    responsavel: edit.responsavel === "—" ? "" : edit.responsavel, previsao: edit.previsao || "", status: edit.status, obs: edit.obs || "",
  } : {
    numero: nextNum, nota: "", cliente: "", fornecedor: (prefill && prefill.fornecedor) || "", responsavel: "", previsao: "", status: "aguardando", obs: (prefill && prefill.obs) || "",
  });
  const [itens, setItens] = useState(() => edit ? edit.itens.map((it) => ({ ...it, valor: it.valor })) : (prefill && prefill.itens) ? prefill.itens.map((it) => ({ nome: it.nome, qtd: it.qtd, valor: it.valor, sku: it.sku })) : [{ nome: "", qtd: 1, valor: "" }]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setItem = (i, k, v) => setItens((p) => p.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const addItem = () => setItens((p) => [...p, { nome: "", qtd: 1, valor: "" }]);
  const rmItem = (i) => setItens((p) => p.filter((_, j) => j !== i));

  const total = itens.reduce((s, it) => s + (Number(it.qtd) || 0) * (Number(it.valor) || 0), 0);
  const valid = f.cliente.trim() && itens.some((it) => it.nome.trim());

  const submit = () => {
    if (!valid) return;
    const clean = itens.filter((it) => it.nome.trim())
      .map((it) => ({ nome: it.nome.trim(), qtd: Number(it.qtd) || 1, valor: Number(it.valor) || 0, ...(it.sku ? { sku: it.sku } : {}) }));
    const base = {
      numero: f.numero, nota: f.nota, cliente: f.cliente.trim(),
      fornecedor: f.fornecedor.trim() || "—", responsavel: f.responsavel.trim() || "—",
      previsao: f.previsao || null, status: f.status, obs: f.obs.trim(), itens: clean,
    };
    if (isEdit) onSave({ ...edit, ...base });
    else onSave({ ...base, id: "p-" + Date.now(), criadoEm: EXP.TODAY });
  };

  return (
    <div className="ex-overlay" onMouseDown={onClose}>
      <div className="ex-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ex-modal-head">
          <div>
            <div className="ex-eyebrow">{isEdit ? "Editar registro" : "Novo registro"}</div>
            <h2>{isEdit ? `Editar pedido ${edit.numero}` : "Adicionar pedido de peças"}</h2>
          </div>
          <button className="ex-icobtn" onClick={onClose} aria-label="Fechar"><Icons.x /></button>
        </div>

        <div className="ex-modal-body">
          <div className="ex-form-grid">
            <Field label="Nº do pedido"><input value={f.numero} onChange={(e) => set("numero", e.target.value)} /></Field>
            <Field label="Nota fiscal"><input value={f.nota} onChange={(e) => set("nota", e.target.value)} placeholder="NF 00.000" /></Field>
            <Field label="Cliente / destino" req><input value={f.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Ex: Auto Center São Jorge" /></Field>
            <Field label="Fornecedor"><input value={f.fornecedor} onChange={(e) => set("fornecedor", e.target.value)} placeholder="Ex: Bosch" /></Field>
            <Field label="Responsável"><input value={f.responsavel} onChange={(e) => set("responsavel", e.target.value)} placeholder="Quem acompanha" /></Field>
            <Field label="Previsão de chegada"><input type="date" value={f.previsao || ""} onChange={(e) => set("previsao", e.target.value)} /></Field>
            <Field label="Status"><select value={f.status} onChange={(e) => set("status", e.target.value)}>{EXP.STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></Field>
          </div>

          <div className="ex-items-head">
            <span className="ex-eyebrow">Itens do pedido</span>
            <span className="ex-items-total">Total {EXP.BRL(total)}</span>
          </div>
          <div className="ex-items">
            <div className="ex-item-row ex-item-row--head"><span>Peça / descrição</span><span>Qtd</span><span>Valor un.</span><span></span></div>
            {itens.map((it, i) => (
              <div className="ex-item-row" key={i}>
                <input value={it.nome} onChange={(e) => setItem(i, "nome", e.target.value)} placeholder="Ex: Pastilha de freio" />
                <input type="number" min="1" value={it.qtd} onChange={(e) => setItem(i, "qtd", e.target.value)} />
                <input type="number" min="0" step="0.01" value={it.valor} onChange={(e) => setItem(i, "valor", e.target.value)} placeholder="0,00" />
                <button className="ex-icobtn ex-icobtn--mini" onClick={() => rmItem(i)} disabled={itens.length === 1} aria-label="Remover"><Icons.trash size={15} /></button>
              </div>
            ))}
          </div>
          <button className="ex-additem" onClick={addItem}><Icons.plus size={14} /> Adicionar item</button>

          <Field label="Observações" full><textarea rows={2} value={f.obs} onChange={(e) => set("obs", e.target.value)} placeholder="Notas para a equipe (opcional)" /></Field>
        </div>

        <div className="ex-modal-foot">
          <button className="ex-btn ex-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="ex-btn ex-btn--primary" onClick={submit} disabled={!valid}>
            {isEdit ? <><Icons.check size={16} /> Salvar alterações</> : <><Icons.plus size={16} /> Registrar pedido</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Conferência no recebimento ---------------- */
function ConferenciaModal({ order, onClose, onConfirm }) {
  const [rows, setRows] = useState(() => order.itens.map((it) => ({ nome: it.nome, qtd: it.qtd, recebido: it.qtd })));
  const [obs, setObs] = useState("");
  const setRec = (i, v) => setRows((p) => p.map((r, j) => j === i ? { ...r, recebido: v === "" ? "" : Math.max(0, Number(v)) } : r));
  const divergencias = rows.filter((r) => Number(r.recebido) !== r.qtd);
  const temDiv = divergencias.length > 0;

  const confirm = () => {
    onConfirm({
      itens: rows.map((r) => ({ ...r, recebido: Number(r.recebido) || 0 })),
      temDivergencia: temDiv,
      divergencias: divergencias.map((d) => `${d.nome}: esperado ${d.qtd}, recebido ${Number(d.recebido) || 0}`),
      obs: obs.trim(),
    });
  };

  return (
    <div className="ex-overlay" onMouseDown={onClose}>
      <div className="ex-modal ex-modal--conf" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ex-modal-head">
          <div>
            <div className="ex-eyebrow">Recebimento · {order.numero}</div>
            <h2>Conferência de itens</h2>
          </div>
          <button className="ex-icobtn" onClick={onClose} aria-label="Fechar"><Icons.x /></button>
        </div>
        <div className="ex-modal-body">
          <p className="ex-conf-help">Confira a quantidade recebida de cada item. Se algo faltar ou vier a mais, o sistema abre um <strong>chamado de divergência</strong> automático.</p>
          <div className="ex-conf">
            <div className="ex-conf-row ex-conf-row--head"><span>Item</span><span>Esperado</span><span>Recebido</span><span>OK</span></div>
            {rows.map((r, i) => {
              const ok = Number(r.recebido) === r.qtd;
              return (
                <div className={"ex-conf-row" + (ok ? "" : " is-div")} key={i}>
                  <span className="ex-conf-name">{r.nome}</span>
                  <span className="ex-conf-exp">{r.qtd}</span>
                  <input type="number" min="0" value={r.recebido} onChange={(e) => setRec(i, e.target.value)} />
                  <span className="ex-conf-ok">{ok ? <Icons.check size={16} style={{ color: "#1F7A45" }} /> : <Icons.alert size={15} style={{ color: "#B42318" }} />}</span>
                </div>
              );
            })}
          </div>
          {temDiv && (
            <div className="ex-banner-late" style={{ marginTop: 14 }}>
              <Icons.alert size={16} /> {divergencias.length} divergência(s) — um chamado será aberto automaticamente ao confirmar.
            </div>
          )}
          <Field label="Observações da conferência" full><textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" /></Field>
        </div>
        <div className="ex-modal-foot">
          <button className="ex-btn ex-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="ex-btn ex-btn--primary" onClick={confirm}>
            <Icons.clipboard size={16} /> {temDiv ? "Confirmar e abrir chamado" : "Confirmar recebimento"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Drawer de detalhe do pedido ---------------- */
function DetailDrawer({ order, me, linked, onClose, onStatus, onDelete, onEdit, onConferir, onAbrirChamado, onOpenChamado, onAddAnexo, onRemoveAnexo, onComprovante }) {
  const [tab, setTab] = useState("detalhe");
  if (!order) return null;
  const total = EXP.orderTotal(order);
  const late = EXP.isLate(order);
  const curIdx = EXP.STATUS.findIndex((s) => s.key === order.status);
  const podeEditar = AUP.can(me, "editar");
  const podeStatus = AUP.can(me, "status");
  const podeConferir = AUP.can(me, "conferir");
  const conf = order.conferencia;

  return (
    <div className="ex-overlay ex-overlay--right" onMouseDown={onClose}>
      <aside className="ex-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ex-drawer-head">
          <div>
            <div className="ex-eyebrow">{order.numero} · {order.nota || "sem nota"}</div>
            <h2>{order.cliente}</h2>
          </div>
          <div className="ex-drawer-actions">
            {podeEditar && <button className="ex-icobtn" onClick={() => onEdit(order)} title="Editar" aria-label="Editar"><Icons.edit size={16} /></button>}
            <button className="ex-icobtn" onClick={onClose} aria-label="Fechar"><Icons.x /></button>
          </div>
        </div>

        <div className="ex-tabs">
          <button className={tab === "detalhe" ? "is-on" : ""} onClick={() => setTab("detalhe")}>Detalhes</button>
          <button className={tab === "hist" ? "is-on" : ""} onClick={() => setTab("hist")}>
            Histórico <span className="ex-tab-ct">{(order.historico || []).length}</span>
          </button>
          <button className={tab === "chamados" ? "is-on" : ""} onClick={() => setTab("chamados")}>
            Chamados <span className="ex-tab-ct">{linked.length}</span>
          </button>
          <button className={tab === "anexos" ? "is-on" : ""} onClick={() => setTab("anexos")}>
            Anexos <span className="ex-tab-ct">{(order.anexos || []).length}</span>
          </button>
        </div>

        <div className="ex-drawer-body">
          {tab === "detalhe" && (
            <>
              {late && <div className="ex-banner-late"><Icons.alert size={16} /> Previsão vencida em {EXP.fmtDate(order.previsao)} — pendência de chegada.</div>}

              <div className="ex-eyebrow ex-mt">Status do pedido</div>
              <div className="ex-stepper">
                {EXP.STATUS.map((s, i) => {
                  const done = i < curIdx, cur = i === curIdx;
                  return (
                    <button key={s.key} className={"ex-step" + (cur ? " is-cur" : done ? " is-done" : "")}
                      style={{ "--st": s.color }} onClick={() => podeStatus && onStatus(order.id, s.key)} disabled={!podeStatus}>
                      <span className="ex-step-dot">{done ? <Icons.check size={13} /> : i + 1}</span>
                      <span className="ex-step-lbl">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* conferência */}
              {order.status === "chegou" && !conf && podeConferir && (
                <button className="ex-btn ex-btn--primary ex-fullbtn ex-mt" onClick={() => onConferir(order)}>
                  <Icons.clipboard size={16} /> Conferir recebimento
                </button>
              )}
              {conf && (
                <div className={"ex-conf-done" + (conf.temDivergencia ? " is-div" : "")}>
                  {conf.temDivergencia ? <Icons.alert size={15} /> : <Icons.check size={15} />}
                  <div>
                    <strong>{conf.temDivergencia ? "Conferido com divergência" : "Conferido sem divergências"}</strong>
                    <span>Por {conf.por} · {HP.fmtDateTime(conf.em)}</span>
                  </div>
                </div>
              )}

              {order.entrega && (
                <div className="ex-conf-done" style={{ marginTop: 11 }}>
                  <Icons.pen size={15} />
                  <div>
                    <strong>Entrega assinada</strong>
                    <span>Recebido por {order.entrega.por} · {HP.fmtDateTime(order.entrega.em)}</span>
                  </div>
                </div>
              )}

              <button className="ex-btn ex-fullbtn ex-mt" onClick={() => onComprovante(order)}>
                <Icons.print size={16} /> {order.entrega ? "Ver comprovante de entrega" : "Comprovante de entrega / imprimir"}
              </button>

              <div className="ex-info-grid ex-mt">
                <Info icon={Icons.truck} label="Fornecedor" value={order.fornecedor} />
                <Info icon={Icons.user} label="Responsável" value={order.responsavel} />
                <Info icon={Icons.clock} label="Previsão" value={EXP.fmtDate(order.previsao)} />
                <Info icon={Icons.box} label="Volume" value={`${EXP.orderQty(order)} itens · ${order.itens.length} ref.`} />
              </div>

              <div className="ex-eyebrow ex-mt">Itens ({order.itens.length})</div>
              <div className="ex-dtable">
                {order.itens.map((it, i) => (
                  <div className="ex-dtable-row" key={i}>
                    <span className="ex-dt-name">{it.nome}</span>
                    <span className="ex-dt-qty">{it.qtd}×</span>
                    <span className="ex-dt-val">{EXP.BRL(it.valor)}</span>
                    <span className="ex-dt-sub">{EXP.BRL(it.qtd * it.valor)}</span>
                  </div>
                ))}
                <div className="ex-dtable-total"><span>Total do pedido</span><strong>{EXP.BRL(total)}</strong></div>
              </div>

              {order.obs && <><div className="ex-eyebrow ex-mt">Observações</div><p className="ex-obs">{order.obs}</p></>}

              {AUP.can(me, "excluir") && (
                <button className="ex-del" onClick={() => onDelete(order.id)}><Icons.trash size={15} /> Excluir pedido</button>
              )}
            </>
          )}

          {tab === "hist" && <div className="ex-mt"><Timeline events={order.historico} /></div>}

          {tab === "anexos" && (
            <AttachmentsPanel anexos={order.anexos} podeEditar={podeEditar}
              onAdd={(novos) => onAddAnexo(order.id, novos)} onRemove={(axId) => onRemoveAnexo(order.id, axId)} />
          )}

          {tab === "chamados" && (
            <div className="ex-mt">
              {AUP.can(me, "criar") && (
                <button className="ex-btn ex-fullbtn" onClick={() => onAbrirChamado(order)} style={{ marginBottom: 14 }}>
                  <Icons.ticket size={16} /> Abrir chamado para este pedido
                </button>
              )}
              {linked.length === 0 ? (
                <div className="ex-tl-empty">Nenhum chamado vinculado a este pedido.</div>
              ) : (
                <div className="ex-linklist">
                  {linked.map((c) => {
                    const s = window.CHAM.CH_MAP[c.status];
                    return (
                      <button className="ex-linkrow" key={c.id} onClick={() => onOpenChamado(c.id)} style={{ "--st": s.color }}>
                        <span className="ex-linkrow-dot" />
                        <span className="ex-linkrow-tx">
                          <strong>{c.numero} · {c.titulo}</strong>
                          <span>{c.categoria}</span>
                        </span>
                        <ChamadoBadge status={c.status} size="sm" />
                      </button>
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

/* ---------------- Quadro ---------------- */
function BoardView({ orders, onSelect, onAdvance, compact }) {
  return (
    <section className="ex-board">
      {EXP.STATUS.map((s) => {
        const items = orders.filter((o) => o.status === s.key);
        return (
          <div className="ex-col" key={s.key} style={{ "--st": s.color }}>
            <div className="ex-col-head"><span className="ex-col-dot" /><span className="ex-col-name">{s.label}</span><span className="ex-col-ct">{items.length}</span></div>
            <div className="ex-col-body">
              {items.length === 0 ? <div className="ex-col-empty">Sem pedidos</div> :
                items.map((o) => <OrderCard key={o.id} order={o} compact={compact} onClick={() => onSelect(o.id)} onAdvance={onAdvance} />)}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/* ---------------- Lista ---------------- */
function ListView({ orders, onSelect, showValues }) {
  if (orders.length === 0) return <div className="ex-empty">Nenhum pedido encontrado com esse filtro.</div>;
  return (
    <section className="ex-listwrap">
      <div className="ex-tbl">
        <div className="ex-tr ex-tr--head">
          <span>Pedido</span><span>Cliente / destino</span><span>Fornecedor</span><span>Previsão</span><span>Itens</span>{showValues && <span>Valor</span>}<span>Status</span>
        </div>
        {orders.map((o) => {
          const late = EXP.isLate(o);
          return (
            <div className="ex-tr" key={o.id} onClick={() => onSelect(o.id)}>
              <span className="ex-tr-num">{o.numero}</span>
              <span className="ex-tr-client">{o.cliente}</span>
              <span className="ex-tr-mut">{o.fornecedor}</span>
              <span className={"ex-tr-mut" + (late ? " ex-tr-late" : "")}>{late && <Icons.alert size={12} />} {EXP.fmtDate(o.previsao)}</span>
              <span className="ex-tr-mut">{EXP.orderQty(o)}</span>
              {showValues && <span className="ex-tr-val">{EXP.BRL(EXP.orderTotal(o))}</span>}
              <span><StatusBadge status={o.status} size="sm" /></span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

Object.assign(window, { Field, Info, OrderModal, ConferenciaModal, DetailDrawer, BoardView, ListView });
