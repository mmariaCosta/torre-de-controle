// Converte "08/10/2026 13:09:12" em Date
export function parseDataHora(str) {
  if (!str) return null;
  const [data, hora] = str.split(' ');
  if (!data || !hora) return null;

  const [dia, mes, ano] = data.split('/').map(Number);
  const [h, m, s] = hora.split(':').map(Number);

  if (Number.isNaN(dia) || Number.isNaN(mes) || Number.isNaN(ano)) return null;
  if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) return null;

  return new Date(ano, mes - 1, dia, h, m, s);
}

// Calcula tempo entre duas datas e formata
export function calcularTempo(inicio, fim) {
  const d1 = parseDataHora(inicio);
  const d2 = parseDataHora(fim);

  if (!d1 || !d2) return '—';

  const diff = Math.floor((d2 - d1) / 1000);
  if (diff < 0) return '—';
  if (diff < 60) return `${diff}s`;

  const min = Math.floor(diff / 60);
  if (min < 60) return `${min} min`;

  const h = Math.floor(min / 60);
  const restoMin = min % 60;
  return `${h}h ${restoMin}min`;
}

// Verifica se a data está dentro do período escolhido
export function dentroDoPeriodo(dataStr, filtro) {
  if (filtro === 'todas') return true;

  const data = parseDataHora(dataStr);
  if (!data) return false;

  const agora = new Date();
  const diffMs = agora - data;
  const diffDias = diffMs / (1000 * 60 * 60 * 24);

  if (filtro === 'hoje') {
    return (
      data.getDate() === agora.getDate() &&
      data.getMonth() === agora.getMonth() &&
      data.getFullYear() === agora.getFullYear()
    );
  }

  if (filtro === '7d') return diffDias <= 7;
  if (filtro === '30d') return diffDias <= 30;

  return true;
}