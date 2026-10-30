import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactNode, MouseEventHandler } from 'react';
import { usePublicDemo } from '@/lib/priva/store';

/** The same content links remain inside /demo without changing protected routes. */
export function AppLink({ children, className, onClick, ...props }: LinkProps & { children?: ReactNode; className?: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  const publicDemo = usePublicDemo();
  if (publicDemo && props.to && props.to !== '/auth' && props.to !== '/demo') {
    const aba = props.to.includes('/anpd/') ? 'anpd' : props.to.replace(/^\//, '');
    return <Link to="/demo" search={{ aba }} hash={props.hash} className={className} onClick={onClick}>{children}</Link>;
  }
  return <Link {...props} className={className} onClick={onClick}>{children}</Link>;
}