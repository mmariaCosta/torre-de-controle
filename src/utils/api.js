// URL da API. Em produção, trocar pelo endereço do backend hospedado.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Timeout padrão para todas as requisições (ms)
const TIMEOUT = 5000;

async function buscar(caminho, opcoes = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(opcoes.headers || {}),
      },
    });

    if (!resposta.ok) {
      throw new Error(`API ${resposta.status}: ${resposta.statusText}`);
    }

    return await resposta.json();
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  listarVoos: (limite = 50) => buscar(`/voos?limite=${limite}`),
  listarAlertas: () => buscar('/alertas'),
  obterAlerta: (id) => buscar(`/alertas/${id}`),
  obterStats: () => buscar('/stats'),
  atualizarStatus: (id, status) =>
    buscar(`/alertas/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  resetarAlertas: () => buscar('/alertas/reset', { method: 'POST' }),
};