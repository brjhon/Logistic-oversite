/* EIXO — chamados (GLPI) — dados + helpers (JS puro, anexado a window) */
(function () {
  "use strict";

  // Status no padrão GLPI
  const CH_STATUS = [
    { key: "novo",        label: "Novo",          short: "Novo",   color: "#2F6FCF", tint: "#EAF1FB" },
    { key: "atendimento", label: "Em atendimento", short: "Atend.", color: "#B66A12", tint: "#FAF1E3" },
    { key: "pendente",    label: "Pendente",       short: "Pend.",  color: "#6B7280", tint: "#EFF1F4" },
    { key: "solucionado", label: "Solucionado",    short: "Soluc.", color: "#1F7A45", tint: "#E9F4EC" },
    { key: "fechado",     label: "Fechado",        short: "Fech.",  color: "#475569", tint: "#EDF0F4" },
  ];
  const CH_MAP = Object.fromEntries(CH_STATUS.map((s) => [s.key, s]));
  const nextCh = (k) => {
    const i = CH_STATUS.findIndex((s) => s.key === k);
    return i >= 0 && i < CH_STATUS.length - 1 ? CH_STATUS[i + 1].key : null;
  };
  const isOpen = (c) => c.status !== "fechado" && c.status !== "solucionado";

  const PRIORITY = [
    { key: "baixa",   label: "Baixa",   color: "#6B7280" },
    { key: "media",   label: "Média",   color: "#2F6FCF" },
    { key: "alta",    label: "Alta",    color: "#B66A12" },
    { key: "urgente", label: "Urgente", color: "#B42318" },
  ];
  const PR_MAP = Object.fromEntries(PRIORITY.map((p) => [p.key, p]));

  const CATEGORIAS = [
    "Logística", "Divergência de carga", "Transporte / entrega",
    "Avaria / dano", "Falta de peça", "Solicitação de material", "Cadastro / sistema",
  ];

  // Gera um nº de chamado no GLPI (simulado)
  let glpiSeq = 4418;
  const genGlpiId = () => "2026-" + String(glpiSeq++).padStart(5, "0");

  const SEED = [
    { id:"c-1207", numero:"CH-1207", tipo:"ocorrencia", titulo:"Atraso na entrega do pedido PD-1041",
      categoria:"Transporte / entrega", prioridade:"alta", pedido:"PD-1041",
      solicitante:"Mecânica Veloz", tecnico:"Marina Souza", status:"atendimento", aberto:"2026-06-10",
      descricao:"Transportadora informou atraso na rota. Cliente cobrando previsão atualizada de entrega.",
      glpi:{ sent:true, id:"2026-04412", sentAt:"2026-06-10" } },
    { id:"c-1206", numero:"CH-1206", tipo:"ocorrencia", titulo:"Divergência na quantidade de filtros",
      categoria:"Divergência de carga", prioridade:"media", pedido:"PD-1040",
      solicitante:"Oficina do Zé", tecnico:"Rafael Lima", status:"novo", aberto:"2026-06-11",
      descricao:"Recebido 22 filtros de óleo, nota indica 24. Conferir antes de liberar o pedido.",
      glpi:{ sent:false, id:null, sentAt:null } },
    { id:"c-1205", numero:"CH-1205", tipo:"solicitacao", titulo:"Reposição de fluido de freio DOT4",
      categoria:"Solicitação de material", prioridade:"baixa", pedido:null,
      solicitante:"Carlos Andrade", tecnico:"—", status:"pendente", aberto:"2026-06-09",
      descricao:"Estoque do pátio abaixo do mínimo. Solicitar reposição junto ao fornecedor.",
      glpi:{ sent:true, id:"2026-04401", sentAt:"2026-06-09" } },
    { id:"c-1204", numero:"CH-1204", tipo:"ocorrencia", titulo:"Avaria em amortecedor recebido",
      categoria:"Avaria / dano", prioridade:"urgente", pedido:"PD-1037",
      solicitante:"Mecânica Veloz", tecnico:"Júlia Mendes", status:"atendimento", aberto:"2026-06-08",
      descricao:"Uma das peças chegou com a haste amassada. Necessária troca e abertura de garantia.",
      glpi:{ sent:true, id:"2026-04388", sentAt:"2026-06-08" } },
    { id:"c-1203", numero:"CH-1203", tipo:"solicitacao", titulo:"Atualizar cadastro do fornecedor Moura",
      categoria:"Cadastro / sistema", prioridade:"baixa", pedido:null,
      solicitante:"Marina Souza", tecnico:"TI", status:"solucionado", aberto:"2026-06-05",
      descricao:"Dados bancários e CNPJ do fornecedor mudaram. Atualizar no sistema.",
      glpi:{ sent:true, id:"2026-04377", sentAt:"2026-06-05" } },
    { id:"c-1202", numero:"CH-1202", tipo:"ocorrencia", titulo:"Faltam 2 baterias no PD-1033",
      categoria:"Falta de peça", prioridade:"alta", pedido:"PD-1033",
      solicitante:"Mecânica do Bairro", tecnico:"Marina Souza", status:"novo", aberto:"2026-06-11",
      descricao:"Pedido despachado com 14 baterias, deveriam ser 16. Verificar separação.",
      glpi:{ sent:false, id:null, sentAt:null } },
    { id:"c-1201", numero:"CH-1201", tipo:"solicitacao", titulo:"Agendar coleta extra na rota sul",
      categoria:"Logística", prioridade:"media", pedido:null,
      solicitante:"Concessionária Rota Sul", tecnico:"Carlos Andrade", status:"pendente", aberto:"2026-06-07",
      descricao:"Volume acima do previsto; avaliar coleta adicional para não atrasar entregas.",
      glpi:{ sent:true, id:"2026-04360", sentAt:"2026-06-07" } },
    { id:"c-1200", numero:"CH-1200", tipo:"ocorrencia", titulo:"Nota fiscal divergente no PD-1036",
      categoria:"Divergência de carga", prioridade:"media", pedido:"PD-1036",
      solicitante:"Oficina do Zé", tecnico:"Rafael Lima", status:"fechado", aberto:"2026-06-02",
      descricao:"Valor da NF diferente do pedido. Corrigido com o fornecedor e conferido.",
      glpi:{ sent:true, id:"2026-04342", sentAt:"2026-06-02" } },
  ];

  window.CHAM = {
    CH_STATUS, CH_MAP, nextCh, isOpen,
    PRIORITY, PR_MAP, CATEGORIAS, genGlpiId, SEED,
  };
})();
