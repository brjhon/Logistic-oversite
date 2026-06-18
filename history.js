/* EIXO — histórico / linha do tempo (helpers JS puro) */
(function () {
  "use strict";

  const NOW = () => new Date().toISOString();

  // "12/06 · 14:30"
  function fmtDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  // "há 2 dias", "há 3 h", "agora"
  function fromNow(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.floor(h / 24);
    return `há ${d} ${d === 1 ? "dia" : "dias"}`;
  }

  // tipos de evento -> ícone (chave em Icons) + cor
  const EVENTS = {
    criou:      { ico: "plus",   cor: "#234A78" },
    editou:     { ico: "edit",   cor: "#B66A12" },
    status:     { ico: "chevR",  cor: "#2F6FCF" },
    conferiu:   { ico: "clipboard", cor: "#1F7A45" },
    divergencia:{ ico: "alert",  cor: "#B42318" },
    glpi:       { ico: "send",   cor: "#2C3E66" },
    vinculou:   { ico: "link",   cor: "#5B4B8A" },
    comentou:   { ico: "doc",    cor: "#586478" },
  };

  let seq = 1;
  // makeEvent(stamp, tipo, texto, ts?)
  function makeEvent(userStamp, tipo, texto, ts) {
    return { id: "ev-" + Date.now() + "-" + (seq++), ts: ts || NOW(), user: userStamp, tipo, texto };
  }

  // cria um "carimbo" de usuário a partir de um nome solto
  function stampName(nome) {
    if (!nome || nome === "—") return { nome: "Sistema", iniciais: "EX", cor: "#8A94A4" };
    const parts = nome.trim().split(/\s+/);
    const ini = (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
    const cores = ["#234A78", "#1F7A45", "#B66A12", "#5B4B8A", "#475569", "#2F6FCF"];
    let h = 0; for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return { nome, iniciais: ini, cor: cores[h % cores.length] };
  }

  // datahora a partir de uma data ISO (YYYY-MM-DD) + hora fixa
  const at = (d, h, m) => d ? `${d}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00` : NOW();

  // histórico-base sintetizado para um pedido de exemplo
  function seedHistoryOrder(o) {
    if (o.historico && o.historico.length) return o.historico;
    const u = stampName(o.responsavel);
    const ev = [makeEvent(u, "criou", `Pedido ${o.numero} registrado para ${o.cliente}.`, at(o.criadoEm, 8, 15))];
    const flow = ["aguardando", "transito", "chegou", "concluido"];
    const idx = flow.indexOf(o.status);
    const labels = { transito: "Despachado — em trânsito", chegou: "Chegou ao pátio", concluido: "Recebido e conferido" };
    for (let i = 1; i <= idx; i++) {
      ev.push(makeEvent(u, "status", labels[flow[i]] + ".", at(o.criadoEm, 9 + i, 0)));
    }
    return ev;
  }

  // histórico-base sintetizado para um chamado de exemplo
  function seedHistoryChamado(c) {
    if (c.historico && c.historico.length) return c.historico;
    const u = stampName(c.solicitante);
    const ev = [makeEvent(u, "criou", `Chamado ${c.numero} aberto.`, at(c.aberto, 9, 10))];
    if (c.glpi && c.glpi.sent)
      ev.push(makeEvent(u, "glpi", `Enviado ao GLPI — ticket #${c.glpi.id}.`, at(c.glpi.sentAt, 9, 20)));
    const flow = ["novo", "atendimento", "pendente", "solucionado", "fechado"];
    const idx = flow.indexOf(c.status);
    const labels = { atendimento: "Em atendimento", pendente: "Marcado como pendente", solucionado: "Solucionado", fechado: "Chamado fechado" };
    for (let i = 1; i <= idx; i++) {
      if (labels[flow[i]]) ev.push(makeEvent(stampName(c.tecnico), "status", labels[flow[i]] + ".", at(c.aberto, 10 + i, 0)));
    }
    return ev;
  }

  window.HIST = { NOW, fmtDateTime, fromNow, EVENTS, makeEvent, stampName, at, seedHistoryOrder, seedHistoryChamado };
})();
