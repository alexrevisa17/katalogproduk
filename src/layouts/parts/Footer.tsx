export default function Footer() {
  return (
    <footer
      className="bg-background mt-auto"
      style={{ boxShadow: '0 -4px 16px hsl(var(--neu-shadow-dark)), 0 2px 8px hsl(var(--neu-shadow-light))' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          © {new Date().getFullYear()} Bang Pray Store — Top Up Game Terpercaya
        </p>
        <p style={{ color: 'hsl(var(--neu-shadow-dark))', fontSize: '0.75rem', marginTop: '4px' }}>
          Hubungi kami via WhatsApp untuk informasi stok terkini
        </p>
      </div>
    </footer>
  );
}
