/* EIXO — autenticação, usuários e permissões (JS puro) */
(function () {
  "use strict";

  // Papéis e o que cada um pode fazer
  const ROLES = {
    gerente:  { label: "Gerente",   desc: "Acesso total — gestão e relatórios" },
    operador: { label: "Operador",  desc: "Opera pedidos e chamados no dia a dia" },
    leitura:  { label: "Consulta",  desc: "Apenas visualiza, sem editar" },
  };

  // can(user, acao) -> bool
  const PERMS = {
    gerente: {
      pedidosVer: true, pedidosCriar: true, pedidosEditar: true, pedidosExcluir: true, pedidosStatus: true, pedidosConferir: true,
      chamadosVer: true, chamadosCriar: true, chamadosEditar: true, chamadosExcluir: true, chamadosStatus: true, chamadosGlpi: true,
      anexosEditar: true, historicoVer: true, relatoriosVer: true, valoresVer: true,
    },
    operador: {
      pedidosVer: true, pedidosCriar: true, pedidosEditar: true, pedidosExcluir: false, pedidosStatus: true, pedidosConferir: true,
      chamadosVer: true, chamadosCriar: true, chamadosEditar: true, chamadosExcluir: false, chamadosStatus: true, chamadosGlpi: true,
      anexosEditar: true, historicoVer: true, relatoriosVer: false, valoresVer: false,
    },
    leitura: {
      pedidosVer: true, pedidosCriar: false, pedidosEditar: false, pedidosExcluir: false, pedidosStatus: false, pedidosConferir: false,
      chamadosVer: true, chamadosCriar: false, chamadosEditar: false, chamadosExcluir: false, chamadosStatus: false, chamadosGlpi: false,
      anexosEditar: false, historicoVer: true, relatoriosVer: false, valoresVer: false,
    },
  };
  const ALIASES = {
    criar: "pedidosCriar",
    editar: "pedidosEditar",
    excluir: "pedidosExcluir",
    status: "pedidosStatus",
    conferir: "pedidosConferir",
    glpi: "chamadosGlpi",
    relatorios: "relatoriosVer",
  };
  const can = (user, acao) => {
    if (!user || !PERMS[user.role]) return false;
    const key = ALIASES[acao] || acao;
    return !!PERMS[user.role][key];
  };

  const USERS = [
    { id: "u-ana",    nome: "Ana Ferraz",     cargo: "Gerente de Logística", role: "gerente",  iniciais: "AF", cor: "#234A78", senha: "1234" },
    { id: "u-carlos", nome: "Carlos Andrade", cargo: "Supervisor de Pátio",  role: "operador", iniciais: "CA", cor: "#1F7A45", senha: "1234" },
    { id: "u-marina", nome: "Marina Souza",   cargo: "Conferente",           role: "operador", iniciais: "MS", cor: "#B66A12", senha: "1234" },
    { id: "u-rafael", nome: "Rafael Lima",    cargo: "Auxiliar de Logística", role: "operador", iniciais: "RL", cor: "#5B4B8A", senha: "1234" },
    { id: "u-julia",  nome: "Júlia Mendes",   cargo: "Analista (consulta)",  role: "leitura",  iniciais: "JM", cor: "#475569", senha: "1234" },
  ];
  const byId = (id) => USERS.find((u) => u.id === id) || null;

  const LS_USER = "eixo.user.v1";
  const SESSION_MS = 8 * 60 * 60 * 1000;

  function readSession() {
    try {
      const raw = localStorage.getItem(LS_USER);
      if (!raw) return null;

      // Compatibilidade com sessões antigas, salvas como apenas o id do usuário.
      if (raw.charAt(0) !== "{") {
        return { id: raw, loginAt: Date.now() };
      }

      const session = JSON.parse(raw);
      if (!session || !session.id || !session.loginAt) return null;
      if (Date.now() - session.loginAt > SESSION_MS) {
        localStorage.removeItem(LS_USER);
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  function loadUser() {
    const session = readSession();
    return session ? byId(session.id) : null;
  }
  function saveUser(id) {
    try {
      if (id) localStorage.setItem(LS_USER, JSON.stringify({ id, loginAt: Date.now() }));
      else localStorage.removeItem(LS_USER);
    } catch (e) {}
  }
  function sessionMsLeft() {
    const session = readSession();
    return session ? Math.max(0, SESSION_MS - (Date.now() - session.loginAt)) : 0;
  }
  // versão enxuta do usuário para gravar em históricos
  const stamp = (u) => u ? { id: u.id, nome: u.nome, iniciais: u.iniciais, cor: u.cor } : { nome: "Sistema", iniciais: "EX", cor: "#8A94A4" };

  window.AUTH = { ROLES, PERMS, SESSION_MS, can, USERS, byId, loadUser, saveUser, sessionMsLeft, stamp };
})();
