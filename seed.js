/* EIXO — dados de exemplo + helpers (JS puro, anexado a window) */
(function () {
  "use strict";

  // ---- Definição dos status (ordem = fluxo) ----
  const STATUS = [
    { key: "aguardando", label: "Aguardando",  short: "Aguard.", color: "#64748B", tint: "#EEF1F5", desc: "Pedido feito, ainda não despachado" },
    { key: "transito",   label: "Em trânsito", short: "Trânsito", color: "#2F6FCF", tint: "#EAF1FB", desc: "A caminho do destino" },
    { key: "chegou",     label: "Chegou",       short: "Chegou",  color: "#B66A12", tint: "#FAF1E3", desc: "No local — aguardando conferência" },
    { key: "concluido",  label: "Concluído",    short: "Concl.",  color: "#1F7A45", tint: "#E9F4EC", desc: "Recebido e conferido" },
  ];
  const STATUS_MAP = Object.fromEntries(STATUS.map((s) => [s.key, s]));
  const nextStatus = (k) => {
    const i = STATUS.findIndex((s) => s.key === k);
    return i >= 0 && i < STATUS.length - 1 ? STATUS[i + 1].key : null;
  };
  const prevStatus = (k) => {
    const i = STATUS.findIndex((s) => s.key === k);
    return i > 0 ? STATUS[i - 1].key : null;
  };

  // ---- Formatadores ----
  const BRL = (n) =>
    (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const toISODate = (date) => {
    const d = date || new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const fmtDate = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y.slice(2)}`;
  };
  const TODAY = toISODate();
  const fmtLongDate = (iso) => {
    const d = new Date((iso || TODAY) + "T00:00:00");
    if (isNaN(d)) return fmtDate(iso);
    const text = d.toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "short", year: "numeric",
    });
    return text.charAt(0).toUpperCase() + text.slice(1).replace(".", "");
  };
  const daysBetween = (a, b) => {
    const da = new Date(a + "T00:00:00");
    const db = new Date(b + "T00:00:00");
    return Math.round((db - da) / 86400000);
  };
  // atrasado = ainda não chegou/concluído e a previsão já passou
  const isLate = (o) =>
    (o.status === "aguardando" || o.status === "transito") &&
    o.previsao &&
    daysBetween(o.previsao, TODAY) > 0;

  const orderTotal = (o) =>
    (o.itens || []).reduce((s, it) => s + (it.qtd || 0) * (it.valor || 0), 0);
  const orderQty = (o) =>
    (o.itens || []).reduce((s, it) => s + (it.qtd || 0), 0);

  // ---- Dados de exemplo ----
  const SEED = [
    {
      id: "p-1042", numero: "PD-1042", nota: "NF 88.214", cliente: "Auto Center São Jorge",
      fornecedor: "Bosch", responsavel: "Carlos Andrade", previsao: "2026-06-14",
      status: "transito", obs: "Entrega agendada para o período da manhã.",
      criadoEm: "2026-06-09",
      itens: [
        { nome: "Pastilha de freio diant. (cerâmica)", qtd: 8, valor: 119.9 },
        { nome: "Disco de freio ventilado 256mm", qtd: 4, valor: 184.0 },
        { nome: "Fluido de freio DOT4 500ml", qtd: 6, valor: 32.5 },
      ],
    },
    {
      id: "p-1041", numero: "PD-1041", nota: "NF 88.190", cliente: "Mecânica Veloz",
      fornecedor: "Cofap", responsavel: "Marina Souza", previsao: "2026-06-08",
      status: "transito", obs: "Transportadora relatou atraso na rota.",
      criadoEm: "2026-06-03",
      itens: [
        { nome: "Amortecedor dianteiro (par)", qtd: 2, valor: 389.0 },
        { nome: "Kit batente + coifa", qtd: 2, valor: 96.0 },
      ],
    },
    {
      id: "p-1040", numero: "PD-1040", nota: "NF 87.998", cliente: "Oficina do Zé",
      fornecedor: "Mahle", responsavel: "Rafael Lima", previsao: "2026-06-11",
      status: "chegou", obs: "Conferir quantidade dos filtros antes de liberar.",
      criadoEm: "2026-06-05",
      itens: [
        { nome: "Filtro de óleo", qtd: 24, valor: 21.9 },
        { nome: "Filtro de ar esportivo", qtd: 10, valor: 58.0 },
        { nome: "Filtro de combustível", qtd: 12, valor: 34.5 },
      ],
    },
    {
      id: "p-1039", numero: "PD-1039", nota: "NF 87.954", cliente: "RetíficaMotor Forte",
      fornecedor: "SKF", responsavel: "Júlia Mendes", previsao: "2026-06-13",
      status: "aguardando", obs: "",
      criadoEm: "2026-06-10",
      itens: [
        { nome: "Rolamento de roda diant.", qtd: 6, valor: 142.0 },
        { nome: "Kit correia dentada + tensor", qtd: 3, valor: 268.0 },
        { nome: "Bomba d'água", qtd: 3, valor: 156.0 },
      ],
    },
    {
      id: "p-1038", numero: "PD-1038", nota: "NF 87.900", cliente: "Auto Peças União",
      fornecedor: "NGK", responsavel: "Carlos Andrade", previsao: "2026-06-05",
      status: "aguardando", obs: "Aguardando confirmação de estoque do fornecedor.",
      criadoEm: "2026-06-02",
      itens: [
        { nome: "Vela de ignição (jogo 4)", qtd: 20, valor: 89.0 },
        { nome: "Bobina de ignição", qtd: 8, valor: 174.0 },
      ],
    },
    {
      id: "p-1037", numero: "PD-1037", nota: "NF 87.812", cliente: "Mecânica Veloz",
      fornecedor: "Valeo", responsavel: "Marina Souza", previsao: "2026-06-04",
      status: "concluido", obs: "Recebido e conferido sem divergências.",
      criadoEm: "2026-05-28",
      itens: [
        { nome: "Kit embreagem completo", qtd: 4, valor: 612.0 },
        { nome: "Atuador hidráulico", qtd: 4, valor: 198.0 },
      ],
    },
    {
      id: "p-1036", numero: "PD-1036", nota: "NF 87.770", cliente: "Oficina do Zé",
      fornecedor: "Magneti Marelli", responsavel: "Rafael Lima", previsao: "2026-06-02",
      status: "concluido", obs: "",
      criadoEm: "2026-05-26",
      itens: [
        { nome: "Bico injetor", qtd: 16, valor: 132.0 },
        { nome: "Sonda lambda", qtd: 6, valor: 245.0 },
      ],
    },
    {
      id: "p-1035", numero: "PD-1035", nota: "NF 87.690", cliente: "Concessionária Rota Sul",
      fornecedor: "Fras-le", responsavel: "Júlia Mendes", previsao: "2026-06-15",
      status: "aguardando", obs: "Pedido grande — separar em 2 entregas.",
      criadoEm: "2026-06-11",
      itens: [
        { nome: "Lona de freio (jogo)", qtd: 12, valor: 78.0 },
        { nome: "Cilindro mestre", qtd: 5, valor: 214.0 },
        { nome: "Cabo de freio de mão", qtd: 10, valor: 46.0 },
      ],
    },
    {
      id: "p-1034", numero: "PD-1034", nota: "NF 87.610", cliente: "Auto Center São Jorge",
      fornecedor: "MTE-Thomson", responsavel: "Carlos Andrade", previsao: "2026-06-12",
      status: "chegou", obs: "Chegou hoje — pendente de conferência.",
      criadoEm: "2026-06-07",
      itens: [
        { nome: "Válvula termostática", qtd: 14, valor: 64.0 },
        { nome: "Sensor de temperatura", qtd: 9, valor: 52.0 },
      ],
    },
    {
      id: "p-1033", numero: "PD-1033", nota: "NF 87.540", cliente: "Mecânica do Bairro",
      fornecedor: "Moura", responsavel: "Marina Souza", previsao: "2026-06-16",
      status: "transito", obs: "",
      criadoEm: "2026-06-10",
      itens: [
        { nome: "Bateria 60Ah", qtd: 10, valor: 389.0 },
        { nome: "Bateria 70Ah", qtd: 6, valor: 469.0 },
      ],
    },
  ];

  window.EIXO = {
    STATUS, STATUS_MAP, nextStatus, prevStatus,
    BRL, fmtDate, fmtLongDate, TODAY, daysBetween, isLate, orderTotal, orderQty,
    SEED,
  };
})();
