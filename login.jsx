/* EIXO — tela de login + menu de usuário */
const AU = window.AUTH;

function LoginScreen({ onLogin }) {
  const [sel, setSel] = useState(AU.USERS[0].id);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [showPass, setShowPass] = useState(false);
  const user = AU.byId(sel);

  const entrar = () => {
    if (senha !== user.senha) { setErro("Senha incorreta."); return; }
    onLogin(user.id);
  };
  const onKey = (e) => { if (e.key === "Enter") entrar(); };

  return (
    <div className="ex-login2">
      <section className="ex-login2-brand">
        <div className="ex-login2-grid" />
        <svg className="ex-login2-routes" viewBox="0 0 900 760" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#9cc8ff" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <path className="ex-route" d="M80 570 C210 390 300 450 410 285 S650 125 805 210" />
          <path className="ex-route ex-route--2" d="M110 210 C235 260 230 390 390 420 S620 475 760 620" />
          <g className="ex-nodes" fill="#d7e8ff">
            <circle cx="80" cy="570" r="5" />
            <circle cx="410" cy="285" r="5" />
            <circle cx="805" cy="210" r="5" />
            <circle cx="110" cy="210" r="4" />
            <circle cx="760" cy="620" r="4" />
          </g>
          <circle className="ex-traveler" cx="410" cy="285" r="7" fill="#fff" />
        </svg>

        <div className="ex-login2-brandtop">
          <span className="ex-logo" style={{ width: 44, height: 44 }}><Icons.hub size={24} /></span>
          <div className="ex-login2-word">
            <strong>EIXO</strong>
            <span>Controle logístico</span>
          </div>
        </div>

        <div className="ex-login2-hero">
          <h1>Operação logística sob controle.</h1>
          <p>Acompanhe pedidos, chamados, conferências e entregas em uma central única para a rotina do pátio.</p>
          <ul className="ex-login2-feats">
            <li><span><Icons.truck size={16} /></span>Pedidos com status, atrasos e conferência.</li>
            <li><span><Icons.ticket size={16} /></span>Chamados operacionais com fluxo GLPI simulado.</li>
            <li><span><Icons.chart size={16} /></span>Relatórios e histórico para auditoria diária.</li>
          </ul>
        </div>

        <div className="ex-login2-foot">Sessão segura da demonstração · expira em 8h</div>
      </section>

      <section className="ex-login2-form">
        <div className="ex-login2-card">
          <div className="ex-login2-mobilebrand">
            <span className="ex-logo" style={{ width: 40, height: 40 }}><Icons.hub size={22} /></span>
            <div>
              <strong>EIXO</strong>
              <div className="ex-login-sub">Controle logístico</div>
            </div>
          </div>

          <div className="ex-login2-h">
            <h2>Acessar painel</h2>
            <p>Selecione seu perfil e informe a senha para continuar.</p>
          </div>

          <label className="ex-field">
            <span className="ex-field-label">Usuário</span>
            <div className="ex-userlist">
              {AU.USERS.map((u) => (
                <button key={u.id} className={"ex-userpick" + (sel === u.id ? " is-on" : "")}
                  onClick={() => { setSel(u.id); setErro(""); }}>
                  <Avatar user={u} size={34} />
                  <span className="ex-userpick-tx">
                    <strong>{u.nome}</strong>
                    <span>{u.cargo}</span>
                  </span>
                  <span className="ex-role-pill" data-role={u.role}>{AU.ROLES[u.role].label}</span>
                </button>
              ))}
            </div>
          </label>

          <label className="ex-field">
            <span className="ex-field-label">Senha</span>
            <span className="ex-pass">
              <input type={showPass ? "text" : "password"} value={senha} autoFocus
                onChange={(e) => { setSenha(e.target.value); setErro(""); }}
                onKeyDown={onKey} placeholder="Digite sua senha" />
              <button type="button" className="ex-pass-eye" onClick={() => setShowPass((v) => !v)}
                title={showPass ? "Ocultar senha" : "Mostrar senha"} aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}>
                <Icons.eye size={16} />
              </button>
            </span>
          </label>
          {erro ? <div className="ex-login-err"><Icons.alert size={14} /> {erro}</div> : null}

          <button className="ex-btn ex-btn--primary ex-login2-btn" onClick={entrar}>
            <Icons.logout size={16} style={{ transform: "scaleX(-1)" }} /> Entrar
          </button>
          <div className="ex-login-note">
            Ambiente de demonstração. A sessão expira automaticamente após 8 horas. Os papéis controlam o que cada pessoa pode fazer —
            <strong> Gerente</strong> faz tudo, <strong>Operador</strong> opera o dia a dia,
            <strong> Consulta</strong> só visualiza.
          </div>
        </div>
      </section>
    </div>
  );
}

/* menu do usuário logado (rodapé do rail) */
function UserMenu({ me, onLogout }) {
  return (
    <div className="ex-usermenu">
      <Avatar user={me} size={36} />
      <div className="ex-usermenu-tx">
        <strong>{me.nome}</strong>
        <span className="ex-role-pill" data-role={me.role}>{AU.ROLES[me.role].label}</span>
      </div>
      <button className="ex-icobtn ex-icobtn--mini" onClick={onLogout} title="Sair" aria-label="Sair">
        <Icons.logout size={16} />
      </button>
    </div>
  );
}

Object.assign(window, { LoginScreen, UserMenu });
