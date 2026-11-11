import { useRef } from 'react';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import type { Product } from '@/components/ProductSheet';

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

interface Props {
  products: Product[];
  onSelect: (p: Product) => void;
}

export default function BestsellerCarousel({ products, onSelect }: Props) {
  const autoplay = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));

  const bestsellers = products.filter(p => p.available).slice(0, 5);
  if (bestsellers.length === 0) return null;

  function getCardStyle(category: string): React.CSSProperties {
    if (category === 'Mobile Legends') {
      return {
        background: `linear-gradient(135deg, hsl(var(--carousel-ml-from)) 0%, hsl(var(--carousel-ml-mid)) 60%, hsl(var(--carousel-ml-to)) 100%)`,
        boxShadow: '6px 6px 14px var(--carousel-shadow-dark), -4px -4px 10px var(--carousel-shadow-light)',
        borderRadius: '20px',
        height: '160px',
      };
    }
    if (category === 'Free Fire') {
      return {
        background: `linear-gradient(135deg, hsl(var(--carousel-ff-from)) 0%, hsl(var(--carousel-ff-mid)) 60%, hsl(var(--carousel-ff-to)) 100%)`,
        boxShadow: '6px 6px 14px var(--carousel-shadow-dark), -4px -4px 10px var(--carousel-shadow-light)',
        borderRadius: '20px',
        height: '160px',
      };
    }
    return {
      background: `linear-gradient(135deg, hsl(var(--carousel-rb-from)) 0%, hsl(var(--carousel-rb-mid)) 60%, hsl(var(--carousel-rb-to)) 100%)`,
      boxShadow: '6px 6px 14px var(--carousel-shadow-dark), -4px -4px 10px var(--carousel-shadow-light)',
      borderRadius: '20px',
      height: '160px',
    };
  }

  function getBadgeStyle(category: string): React.CSSProperties {
    const varName =
      category === 'Mobile Legends' ? '--carousel-badge-ml' :
      category === 'Free Fire'      ? '--carousel-badge-ff' :
                                      '--carousel-badge-rb';
    return {
      background: `hsl(var(${varName}))`,
      fontSize: '0.65rem',
      letterSpacing: '0.03em',
    };
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="px-4 pb-4"
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-3 max-w-2xl mx-auto">
        <Flame size={16} className="text-accent" />
        <span className="font-black text-sm tracking-wide text-accent">
          Produk Terlaris
        </span>
      </div>

      <Carousel
        opts={{ loop: true, align: 'start' }}
        plugins={[autoplay.current]}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {bestsellers.map(product => (
            <CarouselItem key={product.id} className="pl-3 basis-4/5 sm:basis-2/3 md:basis-1/2">
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(product)}
                className="relative overflow-hidden cursor-pointer select-none"
                style={getCardStyle(product.category)}
              >
                {/* Background image blended */}
                <img
                  src={product.imageDetail || product.image}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ opacity: 0.3, mixBlendMode: 'luminosity' }}
                  loading="lazy"
                />

                {/* Dark overlay kiri */}
                <div
                  className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/50 to-transparent"
                />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                  {/* Badge kategori */}
                  <div>
                    <span
                      className="text-white font-bold px-2 py-0.5 rounded-full"
                      style={getBadgeStyle(product.category)}
                    >
                      {product.category}
                    </span>
                  </div>

                  {/* Nama & harga */}
                  <div>
                    <p
                      className="text-white font-black leading-tight mb-1 drop-shadow"
                      style={{ fontSize: 'clamp(0.9rem, 3vw, 1.05rem)' }}
                    >
                      {product.name}
                    </p>
                    <p
                      className="font-black drop-shadow"
                      style={{
                        fontSize: '1rem',
                        background: `linear-gradient(90deg, hsl(var(--carousel-price-from)), hsl(var(--carousel-price-to)))`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {formatRupiah(product.price)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </motion.section>
  );
}
