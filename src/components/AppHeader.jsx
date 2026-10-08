import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const NAV = [
  { to: '/painel', label: 'Painel' },
  { to: '/radar', label: 'Radar' },
];

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const sessao = JSON.parse(sessionStorage.getItem('tc_sessao')) || {};

  const handleSair = () => {
    sessionStorage.removeItem('tc_sessao');
    navigate('/');
  };

  return (
    <header className="header" data-tour="header">
      <div className="header-left">
        <div className="header-brand">
          <span className="header-brand-dot"></span>
          <span>Torre de Controle</span>
        </div>
      </div>

      <nav className="header-nav">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={location.pathname.startsWith(item.to) ? 'active' : ''}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="header-right">
        <div className="header-user">
          <strong>{sessao.controlador || 'Controlador'}</strong>
          <span>Turno {sessao.turno === 'noturno' ? 'noturno' : 'diurno'}</span>
        </div>

        <button
          type="button"
          className="header-theme"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          <span className="header-theme-icon" data-theme-icon={theme}></span>
        </button>

        <button type="button" className="header-sair" onClick={handleSair}>
          Encerrar turno
        </button>
      </div>
    </header>
  );
}