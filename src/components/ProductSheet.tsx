import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Tag, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { buildWaUrl } from '@/lib/store-config';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  description: string;
  /** @deprecated gunakan imageThumbnail / imageDetail */
  image: string;
  /** Gambar kartu katalog — 400×400 px (1:1). Jika kosong, pakai imageDetail atau image. */
  imageThumbnail?: string;
  /** Gambar detail & carousel background — 800×450 px (16:9). Jika kosong, pakai image. */
  imageDetail?: string;
  available: boolean;
}

interface ProductSheetProps {
  product: Product | null;
  onClose: () => void;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export default function ProductSheet({ product, onClose }: ProductSheetProps) {
  const storeConfig = useStoreConfig();
  const sheetRef = useRef<HTMLDivElement>(null);
  const detailImg = product ? (product.imageDetail || product.image) : '';

  const waText = product
    ? encodeURIComponent(`Halo, saya ingin menanyakan stok produk: ${product.name}`)
    : '';
  const waUrl = buildWaUrl(storeConfig.whatsappNumber, waText);

  return (
    <AnimatePresence>
      {product && (
        <>
          {/* Backdrop */}
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className="sheet-container bg-background"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100) onClose();
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ touchAction: 'none' }}
          >
            {/* Handle */}
            <div className="sheet-handle" />



            <div className="px-5 pb-8 pt-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
              {/* Product Image */}
              <div
                className="rounded-2xl overflow-hidden mb-5"
                style={{
                  boxShadow: '6px 6px 16px hsl(var(--neu-shadow-dark)), -6px -6px 16px hsl(var(--neu-shadow-light))',
                  aspectRatio: '16/9',
                  background: 'hsl(var(--neu-img-bg))',
                }}
              >
                <img
                  src={detailImg}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'; }}
                />
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className="neu-inset flex items-center gap-1 text-primary font-bold"
                  style={{ borderRadius: '20px', padding: '3px 12px', fontSize: '0.75rem' }}
                >
                  <Tag size={11} />
                  {product.category}
                </span>

                {product.available && product.stock > 0 ? (
                  <span className="flex items-center gap-1 font-bold" style={{ fontSize: '0.75rem', color: 'hsl(var(--neu-success))' }}>
                    <CheckCircle size={13} />
                    Tersedia ({product.stock} {product.unit})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold" style={{ fontSize: '0.75rem', color: 'hsl(var(--neu-danger))' }}>
                    <XCircle size={13} />
                    Stok Habis
                  </span>
                )}
              </div>

              {/* Name */}
              <h2
                className="font-extrabold text-foreground mb-3"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', lineHeight: 1.2 }}
              >
                {product.name}
              </h2>

              {/* Price */}
              <div
                className="neu-inset flex items-center gap-2 mb-4"
                style={{ padding: '12px 16px', borderRadius: '14px' }}
              >
                <Package size={18} className="text-primary" />
                <span
                  className="text-primary font-black"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}
                >
                  {formatRupiah(product.price)}
                </span>
                <span className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>/ {product.unit}</span>
              </div>

              {/* Description */}
              <p className="text-foreground/70 mb-6" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                {product.description}
              </p>

              {/* WhatsApp CTA */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 text-white font-extrabold rounded-2xl py-4 no-underline transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'hsl(var(--neu-wa-green))',
                  boxShadow: '4px 4px 12px hsl(var(--neu-wa-glow)), -2px -2px 8px hsl(var(--neu-shadow-light))',
                  fontSize: '1rem',
                }}
              >
                <MessageCircle size={22} />
                Tanya Stok via WhatsApp
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
