/* EIXO - dados e helpers de estoque (JS puro) */
(function () {
  "use strict";

  const BRL = (n) =>
    (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const CATEGORIAS = [
    { key: "freio", label: "Freio", cor: "#B42318" },
    { key: "suspensao", label: "Suspensao", cor: "#7A4E18" },
    { key: "motor", label: "Motor", cor: "#2F6FCF" },
    { key: "eletrica", label: "Eletrica", cor: "#6F42C1" },
    { key: "filtro", label: "Filtro", cor: "#1F7A45" },
    { key: "transmissao", label: "Transmissao", cor: "#0F766E" },
    { key: "consumo", label: "Consumo", cor: "#64748B" },
  ];
  const CAT_MAP = Object.fromEntries(CATEGORIAS.map((c) => [c.key, c]));
  const CORREDORES = ["A", "B", "C", "D"];

  const NIVEIS = {
    zerado: { label: "Sem estoque", cor: "#B42318" },
    baixo: { label: "Baixo", cor: "#D4541E" },
    ok: { label: "Saudavel", cor: "#1F7A45" },
    alto: { label: "Alto", cor: "#2F6FCF" },
  };

  const MOV = {
    entrada: { label: "Entrada", ico: "arrowDown", cor: "#1F7A45" },
    saida: { label: "Saida", ico: "arrowUp", cor: "#B42318" },
    ajuste: { label: "Ajuste", ico: "edit", cor: "#B66A12" },
  };

  const normNome = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const valorEstoque = (p) => (Number(p.qtd) || 0) * (Number(p.custo) || 0);
  const isOut = (p) => (Number(p.qtd) || 0) <= 0;
  const isLow = (p) => !isOut(p) && (Number(p.qtd) || 0) <= (Number(p.minimo) || 0);
  const nivel = (p) => {
    const qtd = Number(p.qtd) || 0;
    const min = Number(p.minimo) || 0;
    if (qtd <= 0) return "zerado";
    if (qtd <= min) return "baixo";
    if (min > 0 && qtd >= min * 3) return "alto";
    return "ok";
  };
  const margem = (p) => {
    const custo = Number(p.custo) || 0;
    const venda = Number(p.venda) || 0;
    return custo ? Math.round(((venda - custo) / custo) * 100) : 0;
  };

  const nowIso = () => new Date().toISOString();
  const mkMov = (tipo, qtd, motivo, user, ref) => ({
    id: "mv-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    tipo,
    qtd: Number(qtd) || 0,
    motivo: motivo || "",
    ref: ref || null,
    user: user || { nome: "Sistema", iniciais: "EX", cor: "#8A94A4" },
    ts: nowIso(),
  });

  const seedMovs = (p) => {
    if (!p || !p.qtd) return [];
    return [mkMov("entrada", p.qtd, "Saldo inicial de demonstracao", { nome: "Sistema", iniciais: "EX", cor: "#8A94A4" })];
  };

  const SEED = [
    {
      id: "sk-001", sku: "FRE-PAST-001", nome: "Pastilha de freio dianteira", categoria: "freio",
      marca: "Bosch", qtd: 6, minimo: 8, corredor: "A", prateleira: "A-03", custo: 89.9, venda: 139.9,
      aplicacao: ["Gol G6", "Voyage", "Fox"],
    },
    {
      id: "sk-002", sku: "FRE-DISC-256", nome: "Disco de freio ventilado 256mm", categoria: "freio",
      marca: "Fras-le", qtd: 14, minimo: 6, corredor: "A", prateleira: "A-05", custo: 142, venda: 219,
      aplicacao: ["Onix", "Prisma", "Cobalt"],
    },
    {
      id: "sk-003", sku: "SUS-AMOR-DI", nome: "Amortecedor dianteiro", categoria: "suspensao",
      marca: "Cofap", qtd: 2, minimo: 4, corredor: "B", prateleira: "B-01", custo: 298, venda: 459,
      aplicacao: ["HB20", "Ka", "Fiesta"],
    },
    {
      id: "sk-004", sku: "FIL-OLEO-001", nome: "Filtro de oleo", categoria: "filtro",
      marca: "Mahle", qtd: 32, minimo: 12, corredor: "C", prateleira: "C-02", custo: 18.5, venda: 34.9,
      aplicacao: ["Linha leve"],
    },
    {
      id: "sk-005", sku: "ELE-BOB-004", nome: "Bobina de ignicao", categoria: "eletrica",
      marca: "NGK", qtd: 0, minimo: 5, corredor: "D", prateleira: "D-04", custo: 128, venda: 199,
      aplicacao: ["Palio", "Siena", "Uno"],
    },
    {
      id: "sk-006", sku: "MOT-COR-TEN", nome: "Kit correia dentada + tensor", categoria: "motor",
      marca: "Gates", qtd: 9, minimo: 4, corredor: "B", prateleira: "B-07", custo: 214, venda: 329,
      aplicacao: ["Celta", "Classic", "Corsa"],
    },
    {
      id: "sk-007", sku: "CON-DOT4-500", nome: "Fluido de freio DOT4 500ml", categoria: "consumo",
      marca: "Varga", qtd: 18, minimo: 10, corredor: "C", prateleira: "C-08", custo: 21.5, venda: 38,
      aplicacao: ["Universal"],
    },
    {
      id: "sk-008", sku: "TRA-EMB-KIT", nome: "Kit embreagem completo", categoria: "transmissao",
      marca: "Valeo", qtd: 3, minimo: 3, corredor: "D", prateleira: "D-02", custo: 486, venda: 699,
      aplicacao: ["Sandero", "Logan"],
    },
  ];

  window.STOCK = {
    BRL, CATEGORIAS, CAT_MAP, CORREDORES, NIVEIS, MOV, SEED,
    normNome, valorEstoque, isOut, isLow, nivel, margem, mkMov, seedMovs,
  };
})();
