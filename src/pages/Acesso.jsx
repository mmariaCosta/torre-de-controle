import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Acesso() {
  const [nome, setNome] = useState('');
  const [turno, setTurno] = useState('diurno');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleAssumir = (e) => {
    e.preventDefault();
    setErro('');

    const nomeLimpo = nome.trim();

    if (nomeLimpo.length < 2) {
      setErro('Informe o nome do controlador.');
      return;
    }

    setCarregando(true);

    // Sessão de demonstração — nenhum dado é enviado para fora
    const sessao = {
      controlador: nomeLimpo,
      turno,
      inicio: Date.now(),
    };

    sessionStorage.setItem('tc_sessao', JSON.stringify(sessao));

    setTimeout(() => {
      setCarregando(false);
      sessionStorage.removeItem('tc_tour_visto');
      localStorage.removeItem('@tc_status_alertas'); // limpa status da demo anterior
      window.dispatchEvent(new CustomEvent('turno-assumido'));
      navigate('/torre');
    }, 400);
  };

  return (
    <div className="login-wrap">

      {/* LADO ESQUERDO — pitch visual */}
      <aside className="login-aside">

        <div className="login-brand">
          <span className="login-brand-dot"></span>
          <span>Torre de Controle</span>
        </div>

        <div className="login-pitch">
          <h1>
            Monitoramento do
            <br />
            espaço aéreo digital
            <br />
            <em>em tempo real.</em>
          </h1>

          <p>
            Ambiente de simulação que reproduz o trabalho de um analista de SOC:
            cada log é um voo, cada alerta é uma aeronave suspeita, cada decisão
            é uma ação da torre.
          </p>

          <div className="login-pitch-stats">
            <div>
              <div className="login-stat-lbl">Voos hoje</div>
              <div className="login-stat-val">1.247</div>
            </div>
            <div>
              <div className="login-stat-lbl">Alertas</div>
              <div className="login-stat-val">38</div>
            </div>
            <div>
              <div className="login-stat-lbl">Bloqueios</div>
              <div className="login-stat-val">12</div>
            </div>
          </div>
        </div>

        <div className="login-aside-footer">
          Ambiente de demonstração · Dados fictícios
        </div>

      </aside>

      {/* LADO DIREITO — formulário */}
      <main className="login-main">

        <form className="login-form" onSubmit={handleAssumir}>

          <div className="login-form-head">
            <h2>Assumir turno</h2>
            <p>
              Este é um ambiente de demonstração. Informe seu nome e escolha o
              turno para entrar na torre.
            </p>
          </div>

          <div className="login-field">
            <label htmlFor="nome">Nome do controlador</label>
            <input
              id="nome"
              type="text"
              placeholder="Ex: Maria Costa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={50}
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="login-field">
            <label htmlFor="turno">Turno</label>
            <select
              id="turno"
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
            >
              <option value="diurno">Diurno · 06:00 às 18:00</option>
              <option value="noturno">Noturno · 18:00 às 06:00</option>
            </select>
          </div>

          {erro && (
            <div className="login-error" role="alert">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={carregando}
          >
            {carregando ? 'Conectando à torre…' : 'Assumir turno'}
          </button>

        </form>

      </main>

    </div>
  );
}