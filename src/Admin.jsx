import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';

export default function Admin() {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [contribuicoes, setContribuicoes] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Busca as contribuições no banco (fora do useEffect, pra poder reusar)
  async function buscarContribuicoes() {
    setBuscando(true);
    const { data, error } = await supabase
      .from('contribuicoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar:', error);
    } else {
      setContribuicoes(data);
    }
    setBuscando(false);
  }

  // Quando existir sessão, busca os dados
  useEffect(() => {
    if (sessao) {
      buscarContribuicoes();
    }
  }, [sessao]);

  // Confirma uma contribuição (muda status para 'confirmado')
  async function confirmar(id) {
    const { error } = await supabase
      .from('contribuicoes')
      .update({ status: 'confirmado' })
      .eq('id', id);

    if (error) {
      console.error('Erro ao confirmar:', error);
      alert('Não foi possível confirmar.');
      return;
    }
    buscarContribuicoes();
  }

  const brl = (n) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- Cálculos dos totais ---
  const doacoes = contribuicoes.filter((c) => c.tipo === 'doacao');
  const emprestimos = contribuicoes.filter((c) => c.tipo === 'emprestimo');
  const somar = (lista) => lista.reduce((total, c) => total + Number(c.valor), 0);
  const totalDoacoes = somar(doacoes);
  const totalEmprestimos = somar(emprestimos);
  const totalGeral = totalDoacoes + totalEmprestimos;

  if (carregando) return null;
  if (!sessao) return <Login />;

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui', maxWidth: 900, margin: '0 auto' }}>
      <h1>Painel da Diretoria</h1>
      <p>Logado como {sessao.user.email}. <button onClick={() => supabase.auth.signOut()}>Sair</button></p>

      <div style={{ display: 'flex', gap: 16, margin: '20px 0', flexWrap: 'wrap' }}>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, minWidth: 160 }}>
          <div style={{ fontSize: 13, color: '#666' }}>Total arrecadado</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{brl(totalGeral)}</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, minWidth: 160 }}>
          <div style={{ fontSize: 13, color: '#666' }}>Em doações</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{brl(totalDoacoes)}</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, minWidth: 160 }}>
          <div style={{ fontSize: 13, color: '#666' }}>Em empréstimos</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{brl(totalEmprestimos)}</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, minWidth: 160 }}>
          <div style={{ fontSize: 13, color: '#666' }}>A devolver</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{brl(totalEmprestimos)}</div>
        </div>
      </div>

      {buscando && <p>Carregando contribuições...</p>}

      {!buscando && contribuicoes.length === 0 && <p>Nenhuma contribuição ainda.</p>}

      {!buscando && contribuicoes.length > 0 && (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Contato</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Prazo (meses)</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {contribuicoes.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td>{c.contato}</td>
                <td>{brl(c.valor)}</td>
                <td>{c.tipo === 'doacao' ? 'Doação' : 'Empréstimo'}</td>
                <td>{c.prazo_retorno ?? '—'}</td>
                <td>{c.status}</td>
                <td>
                  {c.status === 'pendente' && (
                    <button onClick={() => confirmar(c.id)}>Confirmar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}