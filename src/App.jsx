import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Acesso from './pages/Acesso';
import Torre from './pages/Torre';
import Painel from './pages/Painel';
import Radar from './pages/Radar';
import VooDetalhe from './pages/VooDetalhe';
import Relatorio from './pages/Relatorio';
import Historico from './pages/Historico';
import Tour from './components/Tour';
import Notificacao from './components/Notificacao';
import { api } from './utils/api';
import Investigacao from './pages/Investigacao';

function RotaProtegida({ children }) {
  const sessao = sessionStorage.getItem('tc_sessao');
  return sessao ? children : <Navigate to="/" replace />;
}

function BotaoTour({ onClick, running }) {
  const location = useLocation();
  const dentro = ['/painel', '/radar', '/historico'].some((p) =>
    location.pathname.startsWith(p)
  );
  const ehRelatorio = location.pathname.endsWith('/relatorio');

  if (!dentro || ehRelatorio || running) return null;

  return (
    <button className="tour-launch" onClick={onClick} type="button">
      <span className="tour-launch-dot" />
      Assistir tour
    </button>
  );
}

function AppInner() {
  const [tourAtivo, setTourAtivo] = useState(false);
  const [notificacao, setNotificacao] = useState(null);
  const navigate = useNavigate();
  const showTimer = useRef(null);

  const buscarNotificacao = async () => {
    try {
      const lista = await api.listarAlertas();
      const novo =
        lista.find((a) => a.status === 'aberto' && a.severidade === 'critico') ||
        lista.find((a) => a.status === 'aberto');
      if (novo) setNotificacao(novo);
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    const handleAssumir = () => {
      const tourVisto = sessionStorage.getItem('tc_tour_visto');
      if (tourVisto) {
        showTimer.current = setTimeout(buscarNotificacao, 3000);
      } else {
        showTimer.current = setTimeout(() => setTourAtivo(true), 1200);
      }
    };

    window.addEventListener('turno-assumido', handleAssumir);
    return () => {
      window.removeEventListener('turno-assumido', handleAssumir);
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, []);

  const finalizarTour = () => {
    setTourAtivo(false);
    sessionStorage.setItem('tc_tour_visto', 'true');
    navigate('/painel');
    showTimer.current = setTimeout(buscarNotificacao, 1200);
  };

  const iniciarTourManual = () => {
    setNotificacao(null);
    setTourAtivo(true);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Acesso />} />
        <Route path="/torre" element={<Torre />} />

        <Route path="/painel" element={<RotaProtegida><Painel /></RotaProtegida>} />
        <Route path="/radar" element={<RotaProtegida><Radar /></RotaProtegida>} />
        <Route path="/radar/:id" element={<RotaProtegida><VooDetalhe /></RotaProtegida>} />
        <Route path="/radar/:id/relatorio" element={<RotaProtegida><Relatorio /></RotaProtegida>} />
        <Route path="/historico" element={<RotaProtegida><Historico /></RotaProtegida>} />
        <Route path="/investigacao" element={<RotaProtegida><Investigacao /></RotaProtegida>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <BotaoTour onClick={iniciarTourManual} running={tourAtivo} />

      <Notificacao alerta={notificacao} onClose={() => setNotificacao(null)} />

      <Tour active={tourAtivo} onFinish={finalizarTour} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}