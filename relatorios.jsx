/* EIXO — relatórios + exportação */
const EXR = window.EIXO;
const CHR = window.CHAM;

/* barra horizontal simples */
function BarRow({ label, value, max, color, suffix }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="ex-bar">
      <span className="ex-bar-lbl">{label}</span>
      <span className="ex-bar-track"><span className="ex-bar-fill" style={{ width: pct + "%", background: color || "var(--accent)" }} /></span>
      <span className="ex-bar-val">{value}{suffix || ""}</span>
    </div>
  );
}
function ReportCard({ title, children, action }) {
  return (
    <div className="ex-rep-card">
      <div className="ex-rep-card-head"><h3>{title}</h3>{action}</div>
      {children}
    </div>
  );
}

/* download helper */
function downloadCSV(filename, rows) {
  const esc = (v) => {
    const s = String(v == null ? "" : v).replace(/"/g, '""');
    return /[",;\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function ReportsView({ orders, chamados }) {
  const H = window.HIST;
  // --- métricas pedidos ---
  const totalValor = orders.reduce((s, o) => s + EXR.orderTotal(o), 0);
  const concluidos = orders.filter((o) => o.status === "concluido").length;
  const taxaConcl = orders.length ? Math.round((concluidos / orders.length) * 100) : 0;
  const atrasados = orders.filter(EXR.isLate).length;

  const porStatus = EXR.STATUS.map((s) => ({ ...s, n: orders.filter((o) => o.status === s.key).length }));
  const maxStatus = Math.max(1, ...porStatus.map((x) => x.n));

  // atraso por fornecedor
  const fornMap = {};
  orders.forEach((o) => {
    const f = o.fornecedor || "—";
    fornMap[f] = fornMap[f] || { total: 0, atras: 0, valor: 0 };
    fornMap[f].total++; fornMap[f].valor += EXR.orderTotal(o);
    if (EXR.isLate(o)) fornMap[f].atras++;
  });
  const fornArr = Object.entries(fornMap).map(([nome, v]) => ({ nome, ...v })).sort((a, b) => b.valor - a.valor);
  const maxFornVal = Math.max(1, ...fornArr.map((x) => x.valor));

  // --- métricas chamados ---
  const abertos = chamados.filter(CHR.isOpen).length;
  const resolvidos = chamados.filter((c) => !CHR.isOpen(c)).length;
  const sincronizados = chamados.filter((c) => c.glpi && c.glpi.sent).length;

  // SLA: média de dias entre 1º e último evento dos chamados resolvidos
  const slaArr = chamados.filter((c) => !CHR.isOpen(c) && c.historico && c.historico.length > 1)
    .map((c) => {
      const ts = c.historico.map((e) => new Date(e.ts).getTime());
      return (Math.max(...ts) - Math.min(...ts)) / 86400000;
    });
  const slaMedio = slaArr.length ? (slaArr.reduce((a, b) => a + b, 0) / slaArr.length) : 0;

  const porCat = {};
  chamados.forEach((c) => { porCat[c.categoria] = (porCat[c.categoria] || 0) + 1; });
  const catArr = Object.entries(porCat).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n);
  const maxCat = Math.max(1, ...catArr.map((x) => x.n));

  const porPrio = CHR.PRIORITY.map((p) => ({ ...p, n: chamados.filter((c) => c.prioridade === p.key).length }));
  const maxPrio = Math.max(1, ...porPrio.map((x) => x.n));

  // exportações
  const exportPedidos = () => {
    const rows = [["Pedido", "Nota", "Cliente", "Fornecedor", "Responsável", "Previsão", "Status", "Itens", "Valor total"]];
    orders.forEach((o) => rows.push([o.numero, o.nota, o.cliente, o.fornecedor, o.responsavel, o.previsao || "", EXR.STATUS_MAP[o.status].label, EXR.orderQty(o), EXR.orderTotal(o).toFixed(2)]));
    downloadCSV("eixo-pedidos.csv", rows);
  };
  const exportChamados = () => {
    const rows = [["Chamado", "Título", "Tipo", "Categoria", "Prioridade", "Pedido", "Solicitante", "Responsável", "Status", "Aberto", "GLPI"]];
    chamados.forEach((c) => rows.push([c.numero, c.titulo, c.tipo, c.categoria, CHR.PR_MAP[c.prioridade].label, c.pedido || "", c.solicitante, c.tecnico, CHR.CH_MAP[c.status].label, c.aberto, c.glpi.sent ? c.glpi.id : "não enviado"]));
    downloadCSV("eixo-chamados.csv", rows);
  };

  return (
    <div className="ex-reports">
      <div className="ex-rep-toolbar">
        <div className="ex-rep-note"><Icons.alert size={13} /> Visão consolidada — exporte para Excel (CSV) ou gere um PDF para enviar à diretoria.</div>
        <div className="ex-rep-actions">
          <button className="ex-btn" onClick={exportPedidos}><Icons.download size={15} /> Pedidos (CSV)</button>
          <button className="ex-btn" onClick={exportChamados}><Icons.download size={15} /> Chamados (CSV)</button>
          <button className="ex-btn ex-btn--primary" onClick={() => window.print()}><Icons.doc size={15} /> Gerar PDF</button>
        </div>
      </div>

      <section className="ex-kpis ex-kpis--rep">
        <KPI icon={Icons.box} label="Pedidos no período" value={orders.length} sub={`${concluidos} concluídos`} accent="var(--accent)" />
        <KPI icon={Icons.doc} label="Valor movimentado" value={EXR.BRL(totalValor)} sub="soma de todos os pedidos" accent="#1F7A45" />
        <KPI icon={Icons.check} label="Taxa de conclusão" value={taxaConcl + "%"} sub={`${atrasados} atrasados`} accent="#2F6FCF" alert={atrasados > 0} />
        <KPI icon={Icons.ticket} label="Chamados resolvidos" value={`${resolvidos}/${chamados.length}`} sub={`${abertos} em aberto`} accent="#B66A12" />
        <KPI icon={Icons.clock} label="SLA médio (chamados)" value={slaMedio ? slaMedio.toFixed(1) + " d" : "—"} sub={`${sincronizados} enviados ao GLPI`} accent="#5B4B8A" />
      </section>

      <div className="ex-rep-grid">
        <ReportCard title="Pedidos por status">
          {porStatus.map((s) => <BarRow key={s.key} label={s.label} value={s.n} max={maxStatus} color={s.color} />)}
        </ReportCard>

        <ReportCard title="Chamados por prioridade">
          {porPrio.map((p) => <BarRow key={p.key} label={p.label} value={p.n} max={maxPrio} color={p.color} />)}
        </ReportCard>

        <ReportCard title="Valor por fornecedor">
          {fornArr.slice(0, 6).map((f) => <BarRow key={f.nome} label={f.nome} value={EXR.BRL(f.valor)} max={maxFornVal} color="var(--accent)" />)}
        </ReportCard>

        <ReportCard title="Chamados por categoria">
          {catArr.map((c) => <BarRow key={c.k} label={c.k} value={c.n} max={maxCat} color="#2F6FCF" />)}
        </ReportCard>

        <ReportCard title="Atrasos por fornecedor">
          {fornArr.filter((f) => f.atras > 0).length === 0 ? (
            <div className="ex-tl-empty">Nenhum pedido atrasado. 👌</div>
          ) : fornArr.filter((f) => f.atras > 0).map((f) => (
            <BarRow key={f.nome} label={f.nome} value={f.atras} max={Math.max(1, ...fornArr.map((x) => x.atras))} color="#B42318" suffix={` de ${f.total}`} />
          ))}
        </ReportCard>

        <ReportCard title="Sincronização GLPI">
          <BarRow label="Enviados" value={sincronizados} max={Math.max(1, chamados.length)} color="#1F7A45" />
          <BarRow label="Pendentes" value={chamados.length - sincronizados} max={Math.max(1, chamados.length)} color="#8A94A4" />
        </ReportCard>
      </div>
    </div>
  );
}

Object.assign(window, { ReportsView });
