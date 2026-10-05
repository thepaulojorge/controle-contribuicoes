import { useState } from 'react';
import './FormularioContribuicao.css';
import { supabase } from './supabaseClient';

/*
  Modelo de dados de UMA contribuição (o formato que vamos salvar no Supabase na Fase 2):

  {
    id: string,
    nome: string,
    contato: string,               // telefone ou e-mail para a diretoria falar com a pessoa
    valor: number,                 // em reais
    tipo: 'doacao' | 'emprestimo',
    prazoRetorno: number | null,   // em meses — só para empréstimo
    data: string,                  // data/hora ISO
    status: 'pendente' | 'confirmado'
  }
*/

export default function FormularioContribuicao() {
  // --- Estado dos campos do formulário ---
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('doacao');
  const [prazoRetorno, setPrazoRetorno] = useState('');
  const [erros, setErros] = useState({});

  // Todas as contribuições enviadas nesta sessão.
  // OBS de privacidade: esta lista NÃO é mostrada ao contribuinte.
  // Ela vai virar o painel restrito (Fase 3), visível só para a diretoria.
  const [contribuicoes, setContribuicoes] = useState([]);

  // A contribuição que a pessoa acabou de enviar — ela vê só a DELA.
  const [enviada, setEnviada] = useState(null);

  // --- Validação ---
  function validar() {
    const e = {};
    if (!nome.trim()) e.nome = 'Informe seu nome.';
    if (!contato.trim()) e.contato = 'Informe um telefone ou e-mail para contato.';

    const valorNum = Number(valor);
    if (!valor || isNaN(valorNum) || valorNum <= 0) {
      e.valor = 'Informe um valor maior que zero.';
    }

    // prazo só é obrigatório quando é empréstimo
    if (tipo === 'emprestimo') {
      const prazoNum = Number(prazoRetorno);
      if (!prazoRetorno || isNaN(prazoNum) || prazoNum <= 0) {
        e.prazoRetorno = 'Informe o prazo de retorno (em meses).';
      }
    }
    return e;
  }

  // --- Envio ---
    async function handleSubmit() {
    const e = validar();
    setErros(e);
    if (Object.keys(e).length > 0) return; // tem erro: não envia

    // Monta a contribuição no formato das COLUNAS do banco (com underline)
    const nova = {
      nome: nome.trim(),
      contato: contato.trim(),
      valor: Number(valor),
      tipo,
      prazo_retorno: tipo === 'emprestimo' ? Number(prazoRetorno) : null,
      status: 'pendente',
    };

    // Envia pro Supabase e espera a resposta
        const { error } = await supabase
      .from('contribuicoes')
      .insert(nova);

    if (error) {
      console.error('Erro ao salvar:', error);
      alert('Não foi possível enviar. Tente novamente.');
      return;
    }

    // deu certo: mostra a confirmação com o que voltou do banco
        setEnviada(nova);

    // limpa o formulário
    setNome('');
    setContato('');
    setValor('');
    setTipo('doacao');
    setPrazoRetorno('');
    setErros({});
  }

  // formata número como moeda brasileira: 100000 -> "R$ 100.000,00"
  const brl = (n) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ---------- TELA DE CONFIRMAÇÃO (a pessoa vê só a contribuição dela) ----------
  if (enviada) {
    return (
      <div className="fc-tela">
        <div className="fc-card fc-card--ok">
          <div className="fc-selo">✓</div>
          <h1 className="fc-titulo">Recebemos, {enviada.nome.split(' ')[0]}!</h1>
          <p className="fc-sub">Sua contribuição foi registrada. Segue o resumo:</p>

          <dl className="fc-resumo">
            <div>
              <dt>Tipo</dt>
              <dd>{enviada.tipo === 'doacao' ? 'Doação' : 'Empréstimo'}</dd>
            </div>
            <div>
              <dt>Valor</dt>
              <dd>{brl(enviada.valor)}</dd>
            </div>
            {enviada.tipo === 'emprestimo' && (
              <div>
                <dt>Prazo de retorno</dt>
                <dd>{enviada.prazoRetorno} meses</dd>
              </div>
            )}
            <div>
              <dt>Contato</dt>
              <dd>{enviada.contato}</dd>
            </div>
            <div>
              <dt>Situação</dt>
              <dd>Aguardando confirmação da diretoria</dd>
            </div>
          </dl>

          <button className="fc-btn" onClick={() => setEnviada(null)}>
            Cadastrar outra contribuição
          </button>
        </div>
      </div>
    );
  }

  // ---------- FORMULÁRIO ----------
  return (
    <div className="fc-tela">
      <div className="fc-card">
        <p className="fc-eyebrow">Terreno da igreja</p>
        <h1 className="fc-titulo">Registrar contribuição</h1>
        <p className="fc-sub">
          Preencha com seus dados. Só a diretoria terá acesso às informações.
        </p>

        {/* Nome */}
        <label className="fc-campo">
          <span className="fc-label">Seu nome</span>
          <input
            className={`fc-input ${erros.nome ? 'fc-input--erro' : ''}`}
            type="text"
            value={nome}
            onChange={(ev) => setNome(ev.target.value)}
            placeholder="Nome completo"
          />
          {erros.nome && <span className="fc-erro">{erros.nome}</span>}
        </label>

        {/* Contato */}
        <label className="fc-campo">
          <span className="fc-label">Contato (telefone ou e-mail)</span>
          <input
            className={`fc-input ${erros.contato ? 'fc-input--erro' : ''}`}
            type="text"
            value={contato}
            onChange={(ev) => setContato(ev.target.value)}
            placeholder="(11) 99999-9999 ou voce@email.com"
          />
          {erros.contato && <span className="fc-erro">{erros.contato}</span>}
        </label>

        {/* Valor */}
        <label className="fc-campo">
          <span className="fc-label">Valor (R$)</span>
          <input
            className={`fc-input ${erros.valor ? 'fc-input--erro' : ''}`}
            type="number"
            min="0"
            value={valor}
            onChange={(ev) => setValor(ev.target.value)}
            placeholder="Ex: 500"
          />
          {erros.valor && <span className="fc-erro">{erros.valor}</span>}
        </label>

        {/* Tipo */}
        <fieldset className="fc-campo fc-fieldset">
          <span className="fc-label">Tipo de contribuição</span>
          <div className="fc-radios">
            <label className={`fc-radio ${tipo === 'doacao' ? 'fc-radio--on' : ''}`}>
              <input
                type="radio"
                name="tipo"
                checked={tipo === 'doacao'}
                onChange={() => setTipo('doacao')}
              />
              <span>Doação</span>
            </label>
            <label className={`fc-radio ${tipo === 'emprestimo' ? 'fc-radio--on' : ''}`}>
              <input
                type="radio"
                name="tipo"
                checked={tipo === 'emprestimo'}
                onChange={() => setTipo('emprestimo')}
              />
              <span>Empréstimo</span>
            </label>
          </div>
        </fieldset>

        {/* Prazo — SÓ aparece para empréstimo */}
        {tipo === 'emprestimo' && (
          <label className="fc-campo">
            <span className="fc-label">Prazo de retorno (meses)</span>
            <input
              className={`fc-input ${erros.prazoRetorno ? 'fc-input--erro' : ''}`}
              type="number"
              min="0"
              value={prazoRetorno}
              onChange={(ev) => setPrazoRetorno(ev.target.value)}
              placeholder="Ex: 24"
            />
            {erros.prazoRetorno && (
              <span className="fc-erro">{erros.prazoRetorno}</span>
            )}
          </label>
        )}

        <button className="fc-btn" onClick={handleSubmit}>
          Enviar contribuição
        </button>
      </div>
    </div>
  );
}