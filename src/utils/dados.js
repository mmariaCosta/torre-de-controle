// Alertas são agrupamentos de voos suspeitos que dispararam uma regra
// Voos simulados — cada voo é uma tentativa de acesso ao sistema
export const voos = [
  { id: 'VG-001', hora: '14:32:08', passageiro: 'joao.silva',    origem: 'BR', destino: 'Servidor Produção', status: 'autorizado', motivo: 'Acesso normal' },
  { id: 'VG-002', hora: '14:31:52', passageiro: 'root',          origem: 'RU', destino: 'Servidor Produção', status: 'bloqueado',  motivo: 'Brute force detectado', tecnica: 'T1110.001' },
  { id: 'VG-003', hora: '14:31:14', passageiro: 'maria.souza',   origem: 'BR', destino: 'Portal Financeiro', status: 'autorizado', motivo: 'Acesso normal' },
  { id: 'VG-004', hora: '14:30:47', passageiro: 'admin',         origem: 'CN', destino: 'Servidor Produção', status: 'suspeito',   motivo: 'Origem incomum', tecnica: 'T1078' },
  { id: 'VG-005', hora: '14:30:03', passageiro: 'carlos.mendes', origem: 'BR', destino: 'Portal Fiscal',     status: 'autorizado', motivo: 'Acesso normal' },
  { id: 'VG-006', hora: '14:29:38', passageiro: 'suporte01',     origem: 'BR', destino: 'Painel Admin',       status: 'suspeito',   motivo: 'Fora do horário comercial', tecnica: 'T1078' },
  { id: 'VG-007', hora: '14:29:11', passageiro: 'ana.paula',     origem: 'BR', destino: 'Portal Financeiro', status: 'autorizado', motivo: 'Acesso normal' },
  { id: 'VG-008', hora: '14:28:44', passageiro: 'test',          origem: 'KP', destino: 'Servidor Produção', status: 'bloqueado',  motivo: 'Origem em lista negra', tecnica: 'T1078' },
];

export const alertas = [
  {
    id: 'ALT-001',
    titulo: 'Possível ataque de força bruta',
    severidade: 'alto',
    status: 'aberto',
    tecnica: 'T1110.001',
    tecnicaNome: 'Brute Force: Password Guessing',
    passageiro: 'root',
    origem: 'Rússia (RU)',
    destino: 'Servidor de Produção',
    detectadoEm: '10/10/2024 14:31:52',
    regra: 'Ataque coordenado',
    descricao: 'Detectadas 6 tentativas de login falhas consecutivas para a conta root em menos de 2 minutos, todas originadas do mesmo endereço IP na Rússia.',
    recomendacoes: [
      'Bloquear o endereço IP de origem no firewall',
      'Forçar redefinição da senha da conta root',
      'Ativar autenticação em dois fatores para contas administrativas',
      'Revisar políticas de acesso remoto',
    ],
    voos: [
      { id: 'VG-002', hora: '14:31:52', acao: 'Login falhou (senha incorreta)', ip: '185.220.101.42' },
      { id: 'VG-008', hora: '14:31:44', acao: 'Login falhou (senha incorreta)', ip: '185.220.101.42' },
      { id: 'VG-010', hora: '14:31:31', acao: 'Login falhou (senha incorreta)', ip: '185.220.101.42' },
      { id: 'VG-011', hora: '14:31:15', acao: 'Login falhou (senha incorreta)', ip: '185.220.101.42' },
      { id: 'VG-012', hora: '14:30:58', acao: 'Login falhou (senha incorreta)', ip: '185.220.101.42' },
      { id: 'VG-013', hora: '14:30:42', acao: 'Login falhou (senha incorreta)', ip: '185.220.101.42' },
    ],
  },
  {
    id: 'ALT-002',
    titulo: 'Origem geográfica incomum',
    severidade: 'medio',
    status: 'aberto',
    tecnica: 'T1078',
    tecnicaNome: 'Valid Accounts',
    passageiro: 'admin',
    origem: 'China (CN)',
    destino: 'Servidor de Produção',
    detectadoEm: '10/10/2024 14:30:47',
    regra: 'Passageiro de origem incomum',
    descricao: 'Conta administrativa realizou login a partir de país sem histórico de acesso. Perfil do usuário indica localização habitual no Brasil.',
    recomendacoes: [
      'Verificar com o titular se o acesso é legítimo',
      'Solicitar confirmação via canal secundário',
      'Registrar o evento para correlação futura',
    ],
    voos: [
      { id: 'VG-004', hora: '14:30:47', acao: 'Login bem-sucedido', ip: '103.27.185.11' },
      { id: 'VG-014', hora: '14:30:35', acao: 'Navegação para área administrativa', ip: '103.27.185.11' },
    ],
  },
  {
    id: 'ALT-003',
    titulo: 'Acesso fora do horário comercial',
    severidade: 'baixo',
    status: 'investigando',
    tecnica: 'T1078',
    tecnicaNome: 'Valid Accounts',
    passageiro: 'suporte01',
    origem: 'Brasil (BR)',
    destino: 'Painel Administrativo',
    detectadoEm: '10/10/2024 03:29:38',
    regra: 'Acesso fora do horário',
    descricao: 'Conta de suporte realizou acesso ao painel administrativo em horário atípico, fora da janela comercial configurada.',
    recomendacoes: [
      'Confirmar se há chamado ou manutenção agendada',
      'Contatar a equipe de plantão para validar',
    ],
    voos: [
      { id: 'VG-006', hora: '03:29:38', acao: 'Login bem-sucedido', ip: '201.17.98.3' },
      { id: 'VG-015', hora: '03:29:52', acao: 'Consulta a relatório de usuários', ip: '201.17.98.3' },
      { id: 'VG-016', hora: '03:31:10', acao: 'Logout', ip: '201.17.98.3' },
    ],
  },
  {
    id: 'ALT-004',
    titulo: 'Origem em lista negra',
    severidade: 'critico',
    status: 'concluido',
    tecnica: 'T1078',
    tecnicaNome: 'Valid Accounts',
    passageiro: 'test',
    origem: 'Coreia do Norte (KP)',
    destino: 'Servidor de Produção',
    detectadoEm: '10/10/2024 14:28:44',
    regra: 'Origem suspeita',
    descricao: 'Tentativa de acesso a partir de endereço IP presente em lista de ameaças conhecidas. Bloqueio aplicado automaticamente pelo firewall.',
    recomendacoes: [
      'Nenhuma ação adicional necessária',
      'Manter IP na lista de bloqueio',
    ],
    voos: [
      { id: 'VG-008b', hora: '14:28:44', acao: 'Conexão recusada pelo firewall', ip: '175.45.176.99' },
    ],
  },
  {
    id: 'ALT-005',
    titulo: 'Consultas em massa a dados de clientes',
    severidade: 'alto',
    status: 'escalado',
    tecnica: 'T1530',
    tecnicaNome: 'Data from Cloud Storage',
    passageiro: 'carlos.mendes',
    origem: 'Brasil (BR)',
    destino: 'Banco de Clientes',
    detectadoEm: '09/10/2024 22:14:08',
    regra: 'Volume anômalo de leitura',
    descricao: 'Usuário realizou 847 consultas ao cadastro de clientes em 30 minutos, muito acima da média histórica de 12 consultas.',
    recomendacoes: [
      'Convocar reunião com o gestor do usuário',
      'Verificar se há justificativa operacional',
      'Considerar suspensão preventiva da conta',
    ],
    voos: [
      { id: 'VG-020', hora: '22:14:08', acao: 'Início de consulta em massa', ip: '191.32.12.4' },
      { id: 'VG-021', hora: '22:28:41', acao: '500 consultas acumuladas', ip: '191.32.12.4' },
      { id: 'VG-022', hora: '22:44:12', acao: '847 consultas acumuladas', ip: '191.32.12.4' },
    ],
  },
];

export const resumo = {
  voosMonitorados: 1247,
  voosSuspeitos: 38,
  voosBloqueados: 12,
  alertasPendentes: alertas.filter((a) => a.status === 'aberto' || a.status === 'investigando').length,
};

export const statusRadar = {
  varredura: 'Ativa',
  ultimaVarredura: '14:32:10',
  regrasAtivas: 3,
  uptime: '99.97%',
};

export const labels = {
  severidade: {
    critico: 'Crítico',
    alto: 'Alto',
    medio: 'Médio',
    baixo: 'Baixo',
  },
  status: {
    aberto: 'Aberto',
    investigando: 'Investigando',
    falso_positivo: 'Falso positivo',
    escalado: 'Escalado',
    concluido: 'Concluído',
  },
};

export function buscarAlerta(id) {
  return alertas.find((a) => a.id === id) || null;
}

// ============================================================
// STATUS PERSISTENTE DOS ALERTAS
// ============================================================
const STATUS_KEY = '@tc_status_alertas';

// Lê o objeto de status salvos
export function lerStatusSalvos() {
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Salva o status de um alerta
export function salvarStatusAlerta(id, novoStatus) {
  const salvos = lerStatusSalvos();
  salvos[id] = novoStatus;
  localStorage.setItem(STATUS_KEY, JSON.stringify(salvos));
  // Dispara evento pra outras telas reagirem
  window.dispatchEvent(new CustomEvent('alertas-atualizados'));
}

// Limpa todos os status salvos
export function limparStatusAlertas() {
  localStorage.removeItem(STATUS_KEY);
  window.dispatchEvent(new CustomEvent('alertas-atualizados'));
}

// Retorna todos os alertas já com o status atualizado
export function carregarAlertas() {
  const salvos = lerStatusSalvos();
  return alertas.map((a) => ({
    ...a,
    status: salvos[a.id] || a.status,
  }));
}

// Conta alertas pendentes (aberto + investigando + escalado)
export function contarAlertasPendentes() {
  const atualizados = carregarAlertas();
  return atualizados.filter(
    (a) => a.status === 'aberto' || a.status === 'investigando' || a.status === 'escalado'
  ).length;
}