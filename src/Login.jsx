import { useState } from 'react';
import { supabase } from './supabaseClient';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    setErro('');
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro('E-mail ou senha incorretos.');
      return;
    }
    // Se deu certo, o App vai detectar a sessão e trocar de tela sozinho.
  }

  return (
    <div className="login-tela">
      <div className="login-card">
        <h1 className="login-titulo">Área da Diretoria</h1>
        <p className="login-sub">Acesso restrito. Entre com suas credenciais.</p>

        <label className="login-campo">
          <span className="login-label">E-mail</span>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="voce@email.com"
          />
        </label>

        <label className="login-campo">
          <span className="login-label">Senha</span>
          <input
            className="login-input"
            type="password"
            value={senha}
            onChange={(ev) => setSenha(ev.target.value)}
            placeholder="Sua senha"
          />
        </label>

        {erro && <p className="login-erro">{erro}</p>}

        <button className="login-btn" onClick={handleLogin} disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}