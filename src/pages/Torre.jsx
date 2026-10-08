import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LEITURAS = [
  'Inicializando varredura primária',
  'Sincronizando relógio da torre',
  'Carregando regras de detecção',
  'Calibrando sensores de borda',
  'Conectando ao centro de comando',
];

const BLIPS_BASE = [
  { top: 28, left: 62, tipo: 'ok',    delay: 0.4 },
  { top: 42, left: 74, tipo: 'warn',  delay: 1.1 },
  { top: 58, left: 68, tipo: 'ok',    delay: 0.8 },
  { top: 72, left: 52, tipo: 'ok',    delay: 1.6 },
  { top: 64, left: 32, tipo: 'danger', delay: 0.2 },
  { top: 44, left: 22, tipo: 'ok',    delay: 2.0 },
  { top: 30, left: 38, tipo: 'warn',  delay: 1.3 },
  { top: 50, left: 48, tipo: 'ok',    delay: 0.6 },
  { top: 20, left: 50, tipo: 'ok',    delay: 1.8 },
  { top: 80, left: 40, tipo: 'ok',    delay: 2.2 },
];

export default function Torre() {
  const navigate = useNavigate();
  const [indiceLeitura, setIndiceLeitura] = useState(0);
  const [horaAtual, setHoraAtual] = useState(() => new Date());

  // Roda as leituras em sequência
  useEffect(() => {
    const timer = setInterval(() => {
      setIndiceLeitura((i) => (i + 1) % LEITURAS.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  // Relógio vivo no rodapé
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hora = horaAtual.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Blips gerados uma vez só (não regeneram a cada render)
  const blips = useMemo(() => BLIPS_BASE, []);

  const entrar = () => navigate('/painel');

  return (
    <div className="torre-screen">

      {/* Cabeçalho */}
      <header className="torre-head">
        <div className="torre-head-left">
          <span className="torre-dot"></span>
          <span>Torre de Controle</span>
        </div>
        <div className="torre-head-right mono">
          <span>SSE · 22°54'S 47°03'W</span>
        </div>
      </header>

      {/* Radar central */}
      <div className="torre-stage">

        <div className="torre-radar">
          {/* Anéis de alcance */}
          <svg className="torre-rings" viewBox="-100 -100 200 200" aria-hidden="true">
            <circle cx="0" cy="0" r="25" />
            <circle cx="0" cy="0" r="50" />
            <circle cx="0" cy="0" r="75" />
            <circle cx="0" cy="0" r="95" />
            {/* Linhas cardeais */}
            <line x1="-100" y1="0" x2="100" y2="0" />
            <line x1="0" y1="-100" x2="0" y2="100" />
            {/* Linhas diagonais */}
            <line x1="-71" y1="-71" x2="71" y2="71" />
            <line x1="-71" y1="71" x2="71" y2="-71" />
          </svg>

          {/* Sweep girando */}
          <div className="torre-sweep"></div>

          {/* Blips */}
          {blips.map((b, i) => (
            <span
              key={i}
              className={`torre-blip torre-blip-${b.tipo}`}
              style={{
                top: `${b.top}%`,
                left: `${b.left}%`,
                animationDelay: `${b.delay}s`,
              }}
            ></span>
          ))}

          {/* Ponto central */}
          <span className="torre-center"></span>
        </div>

        {/* Textos laterais — em desktop, ao redor do radar */}
        <div className="torre-side torre-side-left mono">
          <div className="torre-side-lbl">Modo</div>
          <div className="torre-side-val">Varredura ativa</div>
          <div className="torre-side-lbl">Frequência</div>
          <div className="torre-side-val">2.4 GHz</div>
        </div>

        <div className="torre-side torre-side-right mono">
          <div className="torre-side-lbl">Contatos</div>
          <div className="torre-side-val">{blips.length}</div>
          <div className="torre-side-lbl">Setor</div>
          <div className="torre-side-val">N-04</div>
        </div>

      </div>

      {/* Rodapé — leituras + ação */}
      <footer className="torre-foot">
        <div className="torre-readings">
          <span className="torre-readings-dot"></span>
          <span className="torre-readings-txt">
            {LEITURAS[indiceLeitura]}
          </span>
          <span className="torre-readings-bar">
            <span
              className="torre-readings-bar-fill"
              style={{ width: `${((indiceLeitura + 1) / LEITURAS.length) * 100}%` }}
            />
          </span>
        </div>

        <div className="torre-actions">
          <span className="torre-time mono">{hora}</span>
          <button className="torre-btn" onClick={entrar} type="button">
            Entrar na torre
          </button>
        </div>
      </footer>

    </div>
  );
}