import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ROTEIRO = [
  { path: '/painel', target: 'header',        title: 'Torre de Controle',         text: 'Este é o cabeçalho da torre. Aqui você navega entre o Painel e o Radar, alterna o tema e encerra o turno.', duration: 4000 },
  { path: '/painel', target: 'painel-kpis',   title: 'Indicadores em tempo real', text: 'Quatro números que resumem o turno: voos monitorados, suspeitos, bloqueados e alertas pendentes.', duration: 4200 },
  { path: '/painel', target: 'painel-voos',   title: 'Voos recentes',             text: 'Cada linha é um voo que passou pelo radar. As cores indicam autorizado, suspeito ou bloqueado.', duration: 4200 },
  { path: '/painel', target: 'painel-status', title: 'Status do radar',           text: 'Varredura ativa, última leitura, regras em execução e disponibilidade do sistema.', duration: 4000 },
  { path: '/radar',  target: 'radar-filtros', title: 'Radar de alertas',          text: 'Filtre por severidade ou status para encontrar rapidamente o que precisa de atenção.', duration: 4200 },
  { path: '/radar',  target: 'radar-lista',   title: 'Cartões de alerta',         text: 'Cada cartão traz severidade, técnica MITRE, passageiro, origem e horário da detecção.', duration: 4500 },
  { path: '/painel', target: 'header',        title: 'Fim do tour',               text: 'Pronto. Explore os alertas, investigue e emita relatórios. A torre é sua.', duration: 4000 },
];

// Calcula dimensões do tooltip conforme a tela
function calcularDimensoes() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 640;

  return {
    tooltipW: isMobile ? Math.min(vw - 32, 340) : 380,
    tooltipH: isMobile ? 200 : 220,
    padding: isMobile ? 12 : 16,
  };
}

export default function Tour({ active, onFinish }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [dims, setDims] = useState(calcularDimensoes);

  const step = ROTEIRO[stepIndex];
  const timerRef = useRef(null);

  // Atualiza dimensões se a tela mudar de tamanho
  useEffect(() => {
    const handleResize = () => setDims(calcularDimensoes());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  const finishedRef = useRef(false);
  const navigatedRef = useRef(null);

  useEffect(() => {
    if (active) {
      setStepIndex(0);
      setRect(null);
      setVisible(false);
      finishedRef.current = false;
      navigatedRef.current = null;
    }
  }, [active]);

  // Navegação protegida
  useEffect(() => {
    if (!active || !step) return;
    const targetPath = step.path;
    const currentPath = location.pathname;

    if (currentPath === targetPath) return;
    if (navigatedRef.current === targetPath) return;

    navigatedRef.current = targetPath;
    navigateRef.current(targetPath);
  }, [active, stepIndex, step?.path, location.pathname]);

  // Localiza o elemento e agenda próximo passo
  useEffect(() => {
    if (!active || !step) return;
    if (location.pathname !== step.path) return;

    let cancelled = false;
    let elapsed = 0;
    const interval = 80;
    const maxWait = 3000;

    const tryFind = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          if (cancelled) return;
          const r = el.getBoundingClientRect();
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
          setVisible(true);

          timerRef.current = setTimeout(() => {
            setVisible(false);
            setRect(null);
            setTimeout(() => setStepIndex((i) => i + 1), 300);
          }, step.duration);
        }, 500);
      } else if (elapsed < maxWait) {
        elapsed += interval;
        timerRef.current = setTimeout(tryFind, interval);
      } else {
        setStepIndex((i) => i + 1);
      }
    };

    tryFind();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, stepIndex, step?.path, step?.target, step?.duration, location.pathname]);

  // Posição do tooltip
  useEffect(() => {
    if (!rect) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { tooltipW, tooltipH, padding } = dims;

    const spaceBelow = vh - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const spaceRight = vw - (rect.left + rect.width);

    let top, left, useTransform = false;

    if (spaceBelow >= tooltipH + padding * 2) {
      top = rect.top + rect.height + padding;
      left = rect.left + rect.width / 2 - tooltipW / 2;
    } else if (spaceAbove >= tooltipH + padding * 2) {
      top = rect.top - padding;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      useTransform = true;
    } else if (spaceRight >= tooltipW + padding * 2) {
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left + rect.width + padding;
    } else {
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - padding;
    }

    left = Math.max(padding, Math.min(left, vw - tooltipW - padding));
    if (top < padding) top = padding;
    if (top + tooltipH > vh - padding) top = vh - tooltipH - padding;

    setTooltipPos({ top, left, useTransform });
  }, [rect, dims]);

  // Fim do tour
  useEffect(() => {
    if (!active) return;
    if (stepIndex < ROTEIRO.length) return;
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinishRef.current();
  }, [stepIndex, active]);

  if (!active) return null;
  if (!step) return null;
  if (!visible || !rect) return null;

  const progress = ((stepIndex + 1) / ROTEIRO.length) * 100;

  return (
    <div className="tour-layer">
      <div className="tour-progress">
        <div className="tour-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <button className="tour-exit" onClick={onFinish} type="button">
        Sair do tour
      </button>

      <div
        className="tour-spot"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
      />

      <div
        className="tour-tip"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: dims.tooltipW,
          transform: tooltipPos.useTransform ? 'translateY(-100%)' : 'none',
        }}
      >
        <div className="tour-tip-num">
          Passo {stepIndex + 1} de {ROTEIRO.length}
        </div>
        <h3 className="tour-tip-title">{step.title}</h3>
        <p className="tour-tip-text">{step.text}</p>
        <div className="tour-tip-auto">
          <span className="tour-tip-dot" />
          Avançando automaticamente
        </div>
      </div>
    </div>
  );
}