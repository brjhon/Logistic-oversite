/* EIXO — comprovante de entrega (imprimível) + assinatura na tela */
const { useState: useStateC, useRef: useRefC, useEffect: useEffectC } = React;
const EXC = window.EIXO;

/* ---------------- Bloco de assinatura (canvas) ---------------- */
function SignaturePad({ onChange }) {
  const cvRef = useRefC(null);
  const drawing = useRefC(false);
  const last = useRefC(null);
  const dirty = useRefC(false);

  useEffectC(() => {
    const cv = cvRef.current;
    const rect = cv.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cv.width = rect.width * dpr;
    cv.height = rect.height * dpr;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#16233a";
  }, []);

  const pos = (e) => {
    const r = cvRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; last.current = pos(e); };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = cvRef.current.getContext("2d");
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p; dirty.current = true;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (dirty.current && onChange) onChange(cvRef.current.toDataURL("image/png"));
  };
  const clear = () => {
    const cv = cvRef.current;
    cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
    dirty.current = false; if (onChange) onChange(null);
  };

  return (
    <div className="ex-sign">
      <canvas ref={cvRef} className="ex-sign-cv"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      <div className="ex-sign-base">
        <span><Icons.pen size={13} /> assine acima com o dedo ou mouse</span>
        <button type="button" onClick={clear}>Limpar</button>
      </div>
    </div>
  );
}

/* ---------------- Comprovante de entrega ---------------- */
function ComprovanteModal({ order, me, onClose, onSaveEntrega }) {
  const [signing, setSigning] = useStateC(false);
  const [receiver, setReceiver] = useStateC(order.entrega ? order.entrega.por : (order.cliente || ""));
  const [doc, setDoc] = useStateC(order.entrega ? (order.entrega.doc || "") : "");
  const [sig, setSig] = useStateC(order.entrega ? order.entrega.assinatura : null);
  const podeAssinar = window.AUTH.can(me, "status");
  const total = EXC.orderTotal(order);
  const entrega = order.entrega;

  useEffectC(() => {
    document.body.classList.add("print-comprovante");
    return () => document.body.classList.remove("print-comprovante");
  }, []);

  const salvar = () => {
    if (!sig || !receiver.trim()) return;
    onSaveEntrega(order.id, { por: receiver.trim(), doc: doc.trim(), assinatura: sig, em: window.HIST.NOW() });
    setSigning(false);
  };

  return (
    <div className="ex-overlay ex-cmp-overlay" onMouseDown={onClose}>
      <div className="ex-cmp-wrap" onMouseDown={(e) => e.stopPropagation()}>
        {/* toolbar (não imprime) */}
        <div className="ex-cmp-bar ex-noprint">
          <span className="ex-eyebrow">Comprovante de entrega · {order.numero}</span>
          <div className="ex-cmp-bar-actions">
            {podeAssinar && !signing && (
              <button className="ex-btn" onClick={() => setSigning(true)}>
                <Icons.pen size={15} /> {entrega ? "Refazer assinatura" : "Coletar assinatura"}
              </button>
            )}
            <button className="ex-btn ex-btn--primary" onClick={() => window.print()}><Icons.print size={15} /> Imprimir</button>
            <button className="ex-icobtn" onClick={onClose} aria-label="Fechar"><Icons.x /></button>
          </div>
        </div>

        {/* painel de assinatura (não imprime) */}
        {signing && (
          <div className="ex-cmp-sign ex-noprint">
            <div className="ex-form-grid" style={{ marginBottom: 12 }}>
              <Field label="Recebido por" req><input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="Nome de quem recebeu" /></Field>
              <Field label="Documento (RG/CPF)"><input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Opcional" /></Field>
            </div>
            <SignaturePad onChange={setSig} />
            <div className="ex-cmp-sign-foot">
              <button className="ex-btn ex-btn--ghost" onClick={() => setSigning(false)}>Cancelar</button>
              <button className="ex-btn ex-btn--primary" onClick={salvar} disabled={!sig || !receiver.trim()}>
                <Icons.check size={15} /> Confirmar entrega
              </button>
            </div>
          </div>
        )}

        {/* folha imprimível */}
        <div className="ex-cmp-sheet ex-print-area">
          <header className="ex-cmp-head">
            <div className="ex-cmp-brand">
              <span className="ex-cmp-logo">EIXO</span>
              <div>
                <div className="ex-cmp-org">Mecanismo de Dados — Logística</div>
                <div className="ex-cmp-org-sub">Pátio Central · Pavilhão B</div>
              </div>
            </div>
            <div className="ex-cmp-title">
              <strong>COMPROVANTE DE ENTREGA</strong>
              <span>{order.numero} · {order.nota || "sem nota"}</span>
            </div>
          </header>

          <div className="ex-cmp-info">
            <div><label>Cliente / destino</label><b>{order.cliente}</b></div>
            <div><label>Fornecedor</label><b>{order.fornecedor}</b></div>
            <div><label>Responsável</label><b>{order.responsavel}</b></div>
            <div><label>Previsão de entrega</label><b>{EXC.fmtDate(order.previsao)}</b></div>
          </div>

          <table className="ex-cmp-table">
            <thead><tr><th>Item / descrição</th><th>Qtd</th><th>Valor un.</th><th>Subtotal</th></tr></thead>
            <tbody>
              {order.itens.map((it, i) => (
                <tr key={i}><td>{it.nome}</td><td className="num">{it.qtd}</td><td className="num">{EXC.BRL(it.valor)}</td><td className="num">{EXC.BRL(it.qtd * it.valor)}</td></tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={3}>Total do pedido · {EXC.orderQty(order)} itens</td><td className="num">{EXC.BRL(total)}</td></tr></tfoot>
          </table>

          {order.obs ? <div className="ex-cmp-obs"><label>Observações</label><p>{order.obs}</p></div> : null}

          <div className="ex-cmp-sigarea">
            <div className="ex-cmp-sigbox">
              {sig ? <img src={sig} alt="assinatura" className="ex-cmp-sigimg" /> : <div className="ex-cmp-sigline" />}
              <label>Assinatura de quem recebeu</label>
            </div>
            <div className="ex-cmp-sigmeta">
              <div><span>Recebido por</span><b>{receiver || "_______________________"}</b></div>
              {doc ? <div><span>Documento</span><b>{doc}</b></div> : null}
              <div><span>Data / hora</span><b>{entrega ? window.HIST.fmtDateTime(entrega.em) : "____ / ____ / ______"}</b></div>
            </div>
          </div>

          <footer className="ex-cmp-foot">
            EIXO · documento gerado pelo sistema em {window.HIST.fmtDateTime(window.HIST.NOW())} · {order.numero}
          </footer>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SignaturePad, ComprovanteModal });
