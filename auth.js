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
    gerente:  { criar: true,  editar: true,  excluir: true,  status: true,  conferir: true,  glpi: true,  relatorios: true },
    operador: { criar: true,  editar: true,  excluir: false, status: true,  conferir: true,  glpi: true,  relatorios: true },
    leitura:  { criar: false, editar: false, excluir: false, status: false, conferir: false, glpi: false, relatorios: true },
  };
  const can = (user, acao) => !!(user && PERMS[user.role] && PERMS[user.role][acao]);

  const USERS = [
    { id: "u-ana",    nome: "Ana Ferraz",     cargo: "Gerente de Logística", role: "gerente",  iniciais: "AF", cor: "#234A78", senha: "1234" },
    { id: "u-carlos", nome: "Carlos Andrade", cargo: "Supervisor de Pátio",  role: "operador", iniciais: "CA", cor: "#1F7A45", senha: "1234" },
    { id: "u-marina", nome: "Marina Souza",   cargo: "Conferente",           role: "operador", iniciais: "MS", cor: "#B66A12", senha: "1234" },
    { id: "u-rafael", nome: "Rafael Lima",    cargo: "Auxiliar de Logística", role: "operador", iniciais: "RL", cor: "#5B4B8A", senha: "1234" },
    { id: "u-julia",  nome: "Júlia Mendes",   cargo: "Analista (consulta)",  role: "leitura",  iniciais: "JM", cor: "#475569", senha: "1234" },
  ];
  const byId = (id) => USERS.find((u) => u.id === id) || null;

  const LS_USER = "eixo.user.v1";
  function loadUser() {
    try {
      const id = localStorage.getItem(LS_USER);
      if (id) return byId(id);
    } catch (e) {}
    return null;
  }
  function saveUser(id) {
    try {
      if (id) localStorage.setItem(LS_USER, id);
      else localStorage.removeItem(LS_USER);
    } catch (e) {}
  }
  // versão enxuta do usuário para gravar em históricos
  const stamp = (u) => u ? { id: u.id, nome: u.nome, iniciais: u.iniciais, cor: u.cor } : { nome: "Sistema", iniciais: "EX", cor: "#8A94A4" };

  window.AUTH = { ROLES, PERMS, can, USERS, byId, loadUser, saveUser, stamp };
})();
