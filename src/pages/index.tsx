import { useState, useEffect, useMemo } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageCircle, Package, RefreshCw } from 'lucide-react';
import BestsellerCarousel from '@/components/BestsellerCarousel';
import ProductSheet, { type Product } from '@/components/ProductSheet';
import { home } from 'virtual:content';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { buildWaUrl } from '@/lib/store-config';
import { DEFAULT_PRODUCTS } from '@/lib/default-products';



function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

async function loadProducts(): Promise<Product[]> {
  const response = await fetch('/api/products', { cache: 'no-store' });
  if (!response.ok) throw new Error('Tidak dapat memuat produk dari database.');
  const products = await response.json() as Product[];

  // Keep the catalogue skeleton visible until every product/carousel image has
  // either decoded or failed. A failed image must not leave the page loading.
  const imageUrls = Array.from(new Set(products.flatMap(product =>
    [product.imageThumbnail, product.imageDetail, product.image].filter((url): url is string => Boolean(url))
  )));
  await Promise.all(imageUrls.map(url => new Promise<void>(resolve => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
    if (image.complete) resolve();
    else if (typeof image.decode === 'function') image.decode().then(() => resolve()).catch(() => resolve());
  })));
  return products;
}


export default function HomePage() {
  const storeConfig = useStoreConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    let active = true;
    loadProducts()
      .then(data => { if (active) setProducts(data); })
      .catch(() => { if (active) setProducts(DEFAULT_PRODUCTS); })
      .finally(() => { if (active) setIsLoadingProducts(false); });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['Semua', ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === 'Semua' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, search, activeCategory]);

  return (
    <>
      <Helmet>
        <title>Bang Pray Store — Top Up Diamond ML, Free Fire &amp; Roblox</title>
        <meta name="description" content="Bang Pray Store: top up diamond Mobile Legends, Free Fire, dan Robux Roblox. Proses cepat, harga terjangkau, aman dan terpercaya." />
        <meta property="og:title" content="Bang Pray Store — Top Up Diamond ML, Free Fire &amp; Roblox" />
        <meta property="og:description" content="Top up diamond Mobile Legends, Free Fire, dan Robux Roblox. Proses cepat, harga terjangkau, aman dan terpercaya." />
        <meta property="og:image" content="https://xf504sm1zp.c40.airoapp.ai/og-image.svg" />
        <meta property="og:url" content="https://xf504sm1zp.c40.airoapp.ai/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Bang Pray Store" />
        <meta property="og:locale" content="id_ID" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bang Pray Store — Top Up Diamond ML, Free Fire &amp; Roblox" />
        <meta name="twitter:description" content="Top up diamond Mobile Legends, Free Fire, dan Robux Roblox. Proses cepat, harga terjangkau, aman dan terpercaya." />
        <meta name="twitter:image" content="https://xf504sm1zp.c40.airoapp.ai/og-image.svg" />
        <meta name="keywords" content="top up diamond mobile legends, top up free fire, beli robux roblox, top up game murah, bang pray store" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Store",
              "@id": "https://xf504sm1zp.c40.airoapp.ai/#organization",
              "name": "Bang Pray Store",
              "url": "https://xf504sm1zp.c40.airoapp.ai/",
              "logo": "https://xf504sm1zp.c40.airoapp.ai/airo-assets/images/logo/horizontal",
              "description": "Top up diamond Mobile Legends, Free Fire, dan Robux Roblox. Proses cepat, harga terjangkau, aman dan terpercaya.",
              "areaServed": "ID",
              "currenciesAccepted": "IDR",
              "priceRange": "Rp15.000 - Rp149.000"
            },
            {
              "@type": "WebSite",
              "@id": "https://xf504sm1zp.c40.airoapp.ai/#website",
              "url": "https://xf504sm1zp.c40.airoapp.ai/",
              "name": "Bang Pray Store",
              "publisher": { "@id": "https://xf504sm1zp.c40.airoapp.ai/#organization" },
              "inLanguage": "id-ID",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://xf504sm1zp.c40.airoapp.ai/?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "WebPage",
              "@id": "https://xf504sm1zp.c40.airoapp.ai/#webpage",
              "url": "https://xf504sm1zp.c40.airoapp.ai/",
              "name": "Bang Pray Store — Top Up Diamond ML, Free Fire & Roblox",
              "description": "Top up diamond Mobile Legends, Free Fire, dan Robux Roblox. Proses cepat, harga terjangkau, aman dan terpercaya.",
              "isPartOf": { "@id": "https://xf504sm1zp.c40.airoapp.ai/#website" },
              "about": { "@id": "https://xf504sm1zp.c40.airoapp.ai/#organization" },
              "inLanguage": "id-ID"
            },
            {
              "@type": "ItemList",
              "@id": "https://xf504sm1zp.c40.airoapp.ai/#product-list",
              "name": "Katalog Top Up Game",
              "description": "Daftar produk top up game tersedia di Bang Pray Store",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Top Up Diamond Mobile Legends", "url": "https://xf504sm1zp.c40.airoapp.ai/" },
                { "@type": "ListItem", "position": 2, "name": "Top Up Diamond Free Fire", "url": "https://xf504sm1zp.c40.airoapp.ai/" },
                { "@type": "ListItem", "position": 3, "name": "Beli Robux Roblox", "url": "https://xf504sm1zp.c40.airoapp.ai/" }
              ]
            }
          ]
        }).replace(/</g, '\u003c')}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Search bar */}
        <section className="pt-6 pb-3 px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="neu-inset flex items-center gap-3 px-4 py-3"
              style={{ borderRadius: '16px' }}
            >
              {isLoadingProducts ? (
                <div className="h-6 w-full rounded-md animate-pulse" style={{ background: 'hsl(var(--muted))' }} aria-hidden="true" />
              ) : (
                <>
                  <Search size={20} className="text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder={home.search.placeholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-foreground font-semibold placeholder:text-muted-foreground"
                    style={{ fontSize: '0.95rem' }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                      <RefreshCw size={16} />
                    </button>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </section>

        {/* Produk Terlaris Carousel */}
        {!search && (isLoadingProducts ? (
          <section className="px-4 pb-4" aria-hidden="true">
            <div className="h-4 w-36 rounded-md animate-pulse mb-3" style={{ background: 'hsl(var(--muted))' }} />
            <div className="flex gap-3 overflow-hidden">
              {[0, 1].map(item => <div key={item} className="shrink-0 w-[82%] sm:w-2/3 h-40 rounded-2xl animate-pulse" style={{ background: 'hsl(var(--muted))' }} />)}
            </div>
          </section>
        ) : <BestsellerCarousel products={products} onSelect={setSelectedProduct} />)}

        {/* Category chips */}
        <section className="pb-2 px-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex gap-2 overflow-x-auto max-w-4xl mx-auto"
            style={{ scrollbarWidth: 'none', paddingLeft: '16px', paddingRight: '16px', paddingTop: '6px', paddingBottom: '10px' }}
          >
            {isLoadingProducts ? [0, 1, 2, 3].map(item => (
              <span key={item} className="h-10 w-24 shrink-0 rounded-full animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
            )) : categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </section>

        {/* Product grid */}
        <section className="px-4 pb-24 max-w-7xl mx-auto">
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5" aria-label="Memuat produk" aria-busy="true">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(item => (
                <div key={item} className="neu-card overflow-hidden">
                  <div className="w-full animate-pulse" style={{ aspectRatio: '4/3', background: 'hsl(var(--muted))' }} />
                  <div className="p-3 space-y-3">
                    <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
                    <div className="h-4 w-full rounded animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
                    <div className="h-4 w-2/3 rounded animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
                    <div className="h-9 w-full rounded-xl animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-semibold text-lg">{home.empty.title}</p>
              <p className="text-muted-foreground text-sm mt-1">{home.empty.subtitle}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              <AnimatePresence>
                {filtered.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                    className="neu-card flex flex-col overflow-hidden cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Image */}
                    <div
                      className="relative overflow-hidden"
                      style={{ aspectRatio: '4/3', background: 'hsl(var(--neu-img-bg))' }}
                    >
                      <img
                        src={product.imageThumbnail || product.imageDetail || product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'; }}
                      />
                      <div
                        className="absolute top-2 right-2 text-white font-bold"
                        style={{
                          background: product.available && product.stock > 0
                            ? 'hsl(var(--neu-success))'
                            : 'hsl(var(--neu-danger))',
                          borderRadius: '8px',
                          padding: '2px 8px',
                          fontSize: '0.65rem',
                        }}
                      >
                        {product.available && product.stock > 0 ? `Stok: ${product.stock}` : 'Habis'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col flex-1">
                      <span
                        className="text-primary font-bold mb-1"
                        style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}
                      >
                        {product.category}
                      </span>
                      <h3
                        className="font-bold text-foreground mb-2 leading-tight flex-1"
                        style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem' }}
                      >
                        {product.name}
                      </h3>
                      <p
                        className="text-primary font-black mb-3"
                        style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}
                      >
                        {formatRupiah(product.price)}
                      </p>
                      <button
                        className="neu-button w-full py-2 text-primary font-bold"
                        style={{ fontSize: '0.8rem' }}
                        onClick={e => { e.stopPropagation(); setSelectedProduct(product); }}
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* WhatsApp FAB */}
        {isLoadingProducts ? (
          <div
            className="whatsapp-fab animate-pulse"
            style={{ background: 'hsl(var(--muted))', boxShadow: 'none' }}
            aria-hidden="true"
          />
        ) : (
          <a
            href={buildWaUrl(storeConfig.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-fab"
            title={home.fab.label}
            aria-label={home.fab.label}
          >
            <MessageCircle size={28} color="white" />
          </a>
        )}

        {/* Product Sheet */}
        <ProductSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      </main>
    </>
  );
}
