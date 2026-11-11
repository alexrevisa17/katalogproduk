import { Link } from 'react-router';
import { Shield } from 'lucide-react';
import { fetchStoreConfig, useStoreConfig } from '@/hooks/useStoreConfig';
import { useEffect, useState } from 'react';

export default function Header() {
  const config = useStoreConfig();
  const [configReady, setConfigReady] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchStoreConfig().finally(() => { if (active) setConfigReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setLogoLoaded(false);
    setLogoFailed(false);
  }, [config.logoUrl]);

  return (
    <header
      className="sticky top-0 z-40 bg-background"
      style={{ boxShadow: '0 4px 16px hsl(var(--neu-shadow-dark)), 0 -2px 8px hsl(var(--neu-shadow-light))' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link
          to="/"
          aria-label="Bang Pray Store - Beranda"
          className="relative flex items-center justify-start shrink-0 no-underline"
          style={{ width: '160px', height: '36px' }}
        >
          {(!configReady || !logoLoaded) && !logoFailed && (
            <span className="absolute inset-0 rounded-lg animate-pulse" style={{ background: 'hsl(var(--muted))' }} aria-hidden="true" />
          )}
          {configReady && !logoFailed && (
            <img
              src={config.logoUrl}
              alt={config.storeName}
              width={160}
              height={36}
              className="absolute inset-0 block h-full w-full object-contain object-left"
              style={{ opacity: logoLoaded ? 1 : 0, transition: 'opacity 180ms ease' }}
              onLoad={() => setLogoLoaded(true)}
              onError={() => { setLogoFailed(true); setLogoLoaded(false); }}
            />
          )}
        </Link>

        <Link
          to="/admin"
          aria-label="Buka panel admin"
          title="Admin"
          className="relative flex items-center justify-center shrink-0 text-muted-foreground hover:text-primary transition-colors"
          style={{
            width: '44px',
            height: '40px',
            borderRadius: '10px',
            boxShadow: '3px 3px 6px hsl(var(--neu-shadow-dark)), -3px -3px 6px hsl(var(--neu-shadow-light))',
            background: 'hsl(var(--background))',
          }}
        >
          {(!configReady || !logoLoaded) && !logoFailed
            ? <span className="absolute inset-1 rounded-md animate-pulse" style={{ background: 'hsl(var(--muted))' }} aria-hidden="true" />
            : <Shield size={19} />}
          <span className="sr-only">Admin</span>
        </Link>
      </div>
    </header>
  );
}
