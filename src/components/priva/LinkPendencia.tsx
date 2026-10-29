import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { Pendencia } from '@/lib/priva/pendencias';
export function LinkPendencia({ item, children, className, onClick }: { item: Pendencia; children: ReactNode; className?: string; onClick?: React.MouseEventHandler<HTMLAnchorElement> }) {
  if (item.incidenteId && item.ancora === 'anpd') return <Link to="/bloco-4/anpd/$incidenteId" params={{ incidenteId: item.incidenteId }} className={className}>{children}</Link>;
  return <Link to={`/bloco-${item.bloco}` as '/bloco-1'} hash={item.ancora} className={className} onClick={onClick}>{children}</Link>;
}