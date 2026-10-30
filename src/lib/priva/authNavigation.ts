const destinos = new Set(['/painel', '/bloco-1', '/bloco-2', '/bloco-3', '/bloco-4', '/bloco-5', '/kanban', '/auditoria', '/manual', '/glossario', '/membros', '/enterprise']);
/** Aceita apenas destinos conhecidos do aplicativo, nunca origens externas. */
export function safeAuthPath(value?: string): string {
  if (!value || /[\\\s\u0000-\u001f]/.test(value) || !value.startsWith('/') || value.startsWith('//')) return '/painel';
  const path = value.split(/[?#]/)[0] ?? "";
  return destinos.has(path) || /^\/bloco-4\/anpd\/[a-zA-Z0-9-]+$/.test(path) ? value : '/painel';
}
export function isLoginSessionEvent(event: string) {
  return event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
}