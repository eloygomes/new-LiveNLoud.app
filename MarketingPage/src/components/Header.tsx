import { useState } from 'react';

type Link = readonly [string, string];
export default function Header({ nav, ctaLabel, ctaUrl, appUrl }: { nav: readonly Link[]; ctaLabel: string; ctaUrl: string; appUrl: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <header className="site-header" data-header>
    <a className="brand" href="#top" aria-label="Sustenido — início"><span>#</span> SUSTENIDO</a>
    <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}><span className="sr-only">Abrir menu</span><i/><i/></button>
    <nav id="site-nav" className={open ? 'nav open' : 'nav'} aria-label="Navegação principal">
      {nav.map(([label, href]) => <a key={href} href={href} onClick={close}>{label}</a>)}
      {appUrl && <a href={appUrl}>Entrar</a>}
      <a className="button button-small" href={ctaUrl || '#acesso'} onClick={close}>{ctaLabel}</a>
    </nav>
  </header>;
}
