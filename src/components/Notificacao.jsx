import { useNavigate } from 'react-router-dom';

export default function Notificacao({ alerta, onClose }) {
  const navigate = useNavigate();

  if (!alerta) return null;

  const abrirAlerta = () => {
    navigate(`/radar/${alerta.id}`);
    onClose();
  };

  return (
    <div className="notif" role="alert">
      <button
        className="notif-close"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Fechar"
        type="button"
      >
        ×
      </button>

      <div className="notif-head" onClick={abrirAlerta}>
        <span className="notif-badge">
          <span className="notif-badge-dot"></span>
          Novo alerta no radar
        </span>
      </div>

      <div className="notif-body" onClick={abrirAlerta}>
        <div className="notif-id mono">{alerta.id}</div>
        <div className="notif-titulo">{alerta.titulo}</div>
        <div className="notif-desc">{alerta.descricao.slice(0, 110)}…</div>
      </div>

      <div className="notif-action" onClick={abrirAlerta}>
        Investigar agora →
      </div>
    </div>
  );
}