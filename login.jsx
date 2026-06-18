/* EIXO — tela de login + menu de usuário */
const AU = window.AUTH;

function LoginScreen({ onLogin }) {
  const [sel, setSel] = useState(AU.USERS[0].id);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const user = AU.byId(sel);

  const entrar = () => {
    if (senha !== user.senha) { setErro("Senha incorreta."); return; }
    onLogin(user.id);
  };
  const onKey = (e) => { if (e.key === "Enter") entrar(); };

  return (
    <div className="ex-login">
      <div className="ex-login-card">
        <div className="ex-login-brand">
          <span className="ex-logo" style={{ width: 44, height: 44 }}><Icons.hub size={24} /></span>
          <div>
            <div className="ex-login-name">EIXO</div>
            <div className="ex-login-sub">Mecanismo de dados — Logística</div>
          </div>
        </div>

        <div className="ex-login-form">
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
            <input type="password" value={senha} autoFocus
              onChange={(e) => { setSenha(e.target.value); setErro(""); }}
              onKeyDown={onKey} placeholder="Digite sua senha" />
          </label>
          {erro ? <div className="ex-login-err"><Icons.alert size={14} /> {erro}</div> : null}

          <button className="ex-btn ex-btn--primary ex-login-btn" onClick={entrar}>
            <Icons.logout size={16} style={{ transform: "scaleX(-1)" }} /> Entrar
          </button>
          <div className="ex-login-note">
            Ambiente de demonstração. A sessão expira automaticamente após 8 horas. Os papéis controlam o que cada pessoa pode fazer —
            <strong> Gerente</strong> faz tudo, <strong>Operador</strong> opera o dia a dia,
            <strong> Consulta</strong> só visualiza.
          </div>
        </div>
      </div>
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
