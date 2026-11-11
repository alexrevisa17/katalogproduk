import { Link } from 'react-router';
import { Shield } from 'lucide-react';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { useEffect, useState } from 'react';

export default function Header() {
  const config = useStoreConfig();
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => { setLogoLoaded(false); setLogoFailed(false); }, [config.logoUrl]);

  return (
    <header
      className="sticky top-0 z-40 bg-background"
      style={{ boxShadow: '0 4px 16px hsl(var(--neu-shadow-dark)), 0 -2px 8px hsl(var(--neu-shadow-light))' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 no-underline min-w-0">
          <span className="relative block h-11 w-[200px] max-w-[48vw]">
            {!logoLoaded && !logoFailed && <span className="absolute inset-0 rounded-lg animate-pulse" style={{ background: 'hsl(var(--muted))' }} />}
            {!logoFailed && <img
              src={config.logoUrl}
              alt={config.storeName}
              className="absolute inset-0 block h-full w-full object-contain"
              style={{ opacity: logoLoaded ? 1 : 0, transition: 'opacity 180ms ease' }}
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoFailed(true)}
            />}
            {logoFailed && <span className="flex h-full items-center font-black tracking-wide text-primary">{config.storeName}</span>}
          </span>
        </Link>

        {/* Admin link */}
        <Link
          to="/admin"
          className="flex items-center gap-1.5 no-underline text-muted-foreground hover:text-primary transition-colors"
          style={{
            borderRadius: '10px',
            boxShadow: '3px 3px 6px hsl(var(--neu-shadow-dark)), -3px -3px 6px hsl(var(--neu-shadow-light))',
            padding: '8px 14px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: 'hsl(var(--background))',
          }}
        >
          <Shield size={15} />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      </div>
    </header>
  );
}
