import { Link } from 'react-router';
import { Shield } from 'lucide-react';
import { useStoreConfig } from '@/hooks/useStoreConfig';

export default function Header() {
  const config = useStoreConfig();

  return (
    <header
      className="sticky top-0 z-40 bg-background"
      style={{ boxShadow: '0 4px 16px hsl(var(--neu-shadow-dark)), 0 -2px 8px hsl(var(--neu-shadow-light))' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 no-underline min-w-0">
          <img
            src={config.logoUrl}
            alt={config.storeName}
            className="block h-auto w-auto object-contain"
            style={{ maxHeight: '44px', maxWidth: '200px' }}
          />
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
