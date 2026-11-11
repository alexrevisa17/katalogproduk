import { Link } from 'react-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { OTPInput } from 'input-otp';
import { Shield, LogOut, Plus, Edit2, Trash2, Eye, EyeOff, CheckCircle, XCircle, Save, Package, AlertTriangle, Upload, Link2, ImageIcon, Settings, Phone, Image as ImageLucide, MessageCircle, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import type { Product } from '@/components/ProductSheet';
import { admin } from 'virtual:content';
import { useStoreConfig, saveStoreConfig } from '@/hooks/useStoreConfig';

const MAX_ATTEMPTS = 3;
const LOCK_SECONDS = 30;

async function loadProducts(): Promise<Product[]> {
  const response = await fetch('/api/products', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal memuat produk dari Supabase.');
  return await response.json() as Product[];
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

// OTP Slot component
interface SlotProps {
  char: string | null;
  hasFakeCaret: boolean;
  isActive: boolean;
}

function Slot({ char, hasFakeCaret, isActive }: SlotProps) {
  return (
    <div
      className="otp-slot"
      style={{ borderColor: isActive ? 'hsl(var(--primary))' : 'transparent' }}
    >
      {char ? '●' : hasFakeCaret ? <span className="animate-pulse">|</span> : null}
    </div>
  );
}

// ===== IMAGE INPUT COMPONENT =====
type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface ImageInputProps {
  label: string;
  hint: string;
  hintColor: 'primary' | 'accent';
  value: string;
  onChange: (val: string) => void;
}

function ImageInput({ label, hint, hintColor, value, onChange }: ImageInputProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [urlDraft, setUrlDraft] = useState(value);
  const [previewError, setPreviewError] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // sync external value → urlDraft when switching products
  useEffect(() => {
    setUrlDraft(value);
    setPreviewError(false);
    setUploadStatus('idle');
    setUploadMsg('');
  }, [value]);

  function handleUrlBlur() {
    onChange(urlDraft.trim());
    setPreviewError(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload directly to Supabase Storage; this avoids Vercel's request-body limit.
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadMsg('Ukuran file maksimal 10 MB');
      return;
    }

    setUploadStatus('uploading');
    setUploadMsg('Mengupload gambar...');

    try {
      // Request a short-lived signed URL, then send the binary file directly to Supabase.
      const signResponse = await fetch('/api/upload/sign', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mime: file.type }),
      });
      const signed = await signResponse.json() as { uploadUrl?: string; publicUrl?: string; error?: string };
      if (!signResponse.ok || !signed.uploadUrl || !signed.publicUrl) {
        throw new Error(signed.error ?? 'Gagal menyiapkan upload gambar');
      }

      const uploadResponse = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type, 'x-upsert': 'false' },
        body: file,
      });
      if (!uploadResponse.ok) {
        const detail = await uploadResponse.text().catch(() => '');
        throw new Error(detail.slice(0, 180) || 'Upload ke Supabase Storage gagal');
      }
      const json = { url: signed.publicUrl };

      onChange(json.url);
      setUploadStatus('done');
      setUploadMsg('✓ Gambar berhasil diupload');
      // reset file input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setUploadStatus('error');
      setUploadMsg(err instanceof Error ? err.message : 'Upload gagal, coba lagi');
    }
  }

  const hintBg = hintColor === 'primary'
    ? 'hsl(var(--primary) / 0.12)'
    : 'hsl(var(--accent) / 0.12)';
  const hintText = hintColor === 'primary'
    ? 'hsl(var(--primary))'
    : 'hsl(var(--accent))';

  const showPreview = value && value.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-muted-foreground font-bold text-sm">{label}</label>
      <div className="text-xs font-semibold px-2 py-1 rounded-lg inline-block self-start"
        style={{ background: hintBg, color: hintText }}>
        {hint}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(['upload', 'url'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setUploadStatus('idle'); setUploadMsg(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all"
            style={{
              boxShadow: mode === m
                ? 'inset 3px 3px 6px hsl(var(--neu-shadow-dark)), inset -3px -3px 6px hsl(var(--neu-shadow-light))'
                : '3px 3px 6px hsl(var(--neu-shadow-dark)), -3px -3px 6px hsl(var(--neu-shadow-light))',
              color: mode === m ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              background: 'hsl(var(--background))',
            }}
          >
            {m === 'url' ? <Link2 size={13} /> : <Upload size={13} />}
            {m === 'url' ? 'Paste URL' : 'Upload File'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFile}
          />
          {/* Drop zone / button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadStatus === 'uploading'}
            className="neu-button w-full flex flex-col items-center justify-center gap-2 py-5 text-primary font-bold transition-all"
            style={{ borderRadius: '14px', opacity: uploadStatus === 'uploading' ? 0.7 : 1 }}
          >
            {uploadStatus === 'uploading' ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Upload size={22} />
                </motion.div>
                <span className="text-sm">Mengupload...</span>
              </>
            ) : (
              <>
                <Upload size={22} />
                <span className="text-sm">Pilih Gambar dari Perangkat</span>
                <span className="text-muted-foreground font-semibold" style={{ fontSize: '0.72rem' }}>
                  JPG, PNG, WebP, GIF · Maks. 10 MB
                </span>
              </>
            )}
          </button>

          {/* Status message */}
          {uploadMsg && (
            <p
              className="text-xs font-bold px-1"
              style={{
                color: uploadStatus === 'done'
                  ? 'hsl(var(--neu-success))'
                  : uploadStatus === 'error'
                  ? 'hsl(var(--neu-danger))'
                  : 'hsl(var(--muted-foreground))',
              }}
            >
              {uploadMsg}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <input
            type="url"
            placeholder="https://i.imgur.com/... atau link gambar langsung"
            value={urlDraft}
            onChange={e => setUrlDraft(e.target.value)}
            onBlur={handleUrlBlur}
            className="neu-inset w-full px-4 py-3 bg-transparent border-none outline-none text-foreground font-semibold"
            style={{ borderRadius: '12px', fontSize: '0.85rem' }}
          />
          <p className="text-muted-foreground text-xs font-semibold px-1">
            💡 Gunakan <strong>imgbb.com</strong> atau <strong>imgur.com</strong> → salin "Direct link"
          </p>
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div
          className="rounded-xl overflow-hidden relative"
          style={{
            aspectRatio: hintColor === 'primary' ? '1/1' : '16/9',
            background: 'hsl(var(--neu-img-bg))',
            boxShadow: 'inset 3px 3px 8px hsl(var(--neu-shadow-dark)), inset -3px -3px 8px hsl(var(--neu-shadow-light))',
          }}
        >
          {previewError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <ImageIcon size={24} className="text-muted-foreground" />
              <span className="text-muted-foreground text-xs font-semibold">Gambar tidak dapat dimuat</span>
            </div>
          ) : (
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
              onError={() => setPreviewError(true)}
              onLoad={() => setPreviewError(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Product form modal
interface ProductFormProps {
  product: Partial<Product> | null;
  onSave: (p: Product) => void | Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

function ProductForm({ product, onSave, onClose, isSaving = false }: ProductFormProps) {
  const isNew = !product?.id;
  // price & stock stored as string so the field can be fully cleared (Number('') = 0 blocks deletion)
  const [form, setForm] = useState<Partial<Product> & { priceStr: string; stockStr: string }>(
    product
      ? { ...product, priceStr: product.price != null ? String(product.price) : '', stockStr: product.stock != null ? String(product.stock) : '' }
      : { name: '', category: '', price: 0, stock: 0, unit: 'unit', description: '', image: '', imageThumbnail: '', imageDetail: '', available: true, priceStr: '', stockStr: '' }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = 'Nama produk wajib diisi';
    if (!form.category?.trim()) errs.category = 'Kategori wajib diisi';
    const priceNum = Number(form.priceStr);
    if (!form.priceStr?.trim() || isNaN(priceNum) || priceNum <= 0) errs.price = 'Harga harus lebih dari 0';
    const stockNum = Number(form.stockStr);
    if (form.stockStr === undefined || form.stockStr === '') errs.stock = 'Stok wajib diisi (isi 0 jika habis)';
    else if (isNaN(stockNum) || stockNum < 0) errs.stock = 'Stok tidak boleh negatif';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll ke field error pertama
      const firstKey = ['name', 'category', 'price', 'stock'].find(k => errs[k]);
      if (firstKey && fieldRefs.current[firstKey]) {
        fieldRefs.current[firstKey]!.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    const thumb = (form.imageThumbnail ?? '').trim();
    const detail = (form.imageDetail ?? '').trim();
    const legacyImage = detail || thumb || form.image || '';
    onSave({
      id: form.id || Date.now().toString(),
      name: form.name || '',
      category: form.category || '',
      price: Number(form.priceStr) || 0,
      stock: Number(form.stockStr) || 0,
      unit: form.unit || 'unit',
      description: form.description || '',
      image: legacyImage,
      imageThumbnail: thumb,
      imageDetail: detail,
      available: form.available !== false,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => { if (!isSaving) onClose(); }}
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={(_e, info) => { if (info.offset.y > 100) onClose(); }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh', touchAction: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Sticky header */}
        <div className="flex-shrink-0 px-6 pt-3 pb-4" style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)' }}>
          <h2 className="font-black text-foreground text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
            {isNew ? 'Tambah Produk' : 'Edit Produk'}
          </h2>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain flex flex-col">
          <div className="p-6 flex flex-col gap-4 flex-1">
            {[
              { label: 'Nama Produk *', key: 'name', stateKey: 'name', type: 'text', placeholder: 'Contoh: ML Diamond 86' },
              { label: 'Kategori *', key: 'category', stateKey: 'category', type: 'text', placeholder: 'Contoh: Mobile Legends' },
              { label: 'Harga (Rp) *', key: 'price', stateKey: 'priceStr', type: 'number', placeholder: '0' },
              { label: 'Stok *', key: 'stock', stateKey: 'stockStr', type: 'number', placeholder: '0' },
              { label: 'Satuan', key: 'unit', stateKey: 'unit', type: 'text', placeholder: 'unit / pcs / buah' },
            ].map(field => (
              <div key={field.key} ref={(el: HTMLDivElement | null) => { fieldRefs.current[field.key] = el; }}>
                <label className="text-muted-foreground font-bold text-sm mb-1 block">{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(form[field.stateKey as keyof typeof form] as string | number) ?? ''}
                  onChange={e => {
                    setForm(f => ({ ...f, [field.stateKey]: e.target.value }));
                    if (errors[field.key]) setErrors(prev => { const next = { ...prev }; delete next[field.key]; return next; });
                  }}
                  className={[
                    'neu-inset w-full px-4 py-3 bg-transparent border-none outline-none font-semibold',
                    errors[field.key] ? 'text-red-500' : 'text-foreground',
                  ].join(' ')}
                  style={{ borderRadius: '12px', fontSize: '0.9rem' }}
                />
                <AnimatePresence initial={false}>
                  {errors[field.key] && (
                    <motion.p
                      key={field.key + '-err'}
                      initial={{ opacity: 0, height: 0, y: -4 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-red-500 text-xs font-bold mt-1 pl-1"
                    >
                      {errors[field.key]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Image fields */}
            <div
              className="neu-inset p-4 flex flex-col gap-5"
              style={{ borderRadius: '14px' }}
            >
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-primary" />
                <span className="text-primary font-black text-sm">Gambar Produk</span>
              </div>

              <ImageInput
                label="Thumbnail Katalog"
                hint="📐 400 × 400 px · Rasio 1:1 · Kartu homepage"
                hintColor="primary"
                value={form.imageThumbnail ?? ''}
                onChange={val => setForm(f => ({ ...f, imageThumbnail: val }))}
              />

              <ImageInput
                label="Gambar Detail & Carousel"
                hint="📐 800 × 450 px · Rasio 16:9 · Detail produk & carousel"
                hintColor="accent"
                value={form.imageDetail ?? ''}
                onChange={val => setForm(f => ({ ...f, imageDetail: val }))}
              />

              <p className="text-muted-foreground text-xs font-semibold" style={{ lineHeight: 1.5 }}>
                💡 Isi salah satu saja — gambar tersebut otomatis dipakai di semua tempat.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="text-muted-foreground font-bold text-sm mb-1 block">Deskripsi</label>
              <textarea
                placeholder="Deskripsi produk..."
                value={form.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="neu-inset w-full px-4 py-3 bg-transparent border-none outline-none text-foreground font-semibold resize-none"
                style={{ borderRadius: '12px', fontSize: '0.9rem' }}
              />
            </div>

            {/* Available toggle */}
            <div className="flex items-center justify-between neu-inset px-4 py-3" style={{ borderRadius: '12px' }}>
              <span className="text-foreground font-bold">Status Tersedia</span>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, available: !f.available }))}
                className="flex items-center gap-2 font-bold"
                style={{ color: form.available ? 'hsl(var(--neu-success))' : 'hsl(var(--neu-danger))' }}
              >
                {form.available ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {form.available ? 'Tersedia' : 'Tidak Tersedia'}
              </button>
            </div>
          </div>

          {/* Sticky footer — tombol simpan */}
          <div className="flex-shrink-0 px-6 pb-8 pt-4" style={{ borderTop: '1px solid hsl(var(--border) / 0.4)' }}>
            <button
              type="submit"
              disabled={isSaving}
              className="neu-button w-full flex items-center justify-center gap-2 py-3 text-primary font-black text-base disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden relative"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isSaving ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="flex"
                    >
                      <Loader2 size={18} />
                    </motion.span>
                    <span>{isNew ? 'Menambahkan...' : 'Menyimpan...'}</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <Save size={18} />
                    <span>{isNew ? 'Tambah Produk' : 'Simpan Perubahan'}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ===== SETTINGS PANEL COMPONENT =====
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SettingsPanelProps {
  currentConfig: { whatsappNumber: string; logoUrl: string; storeName: string };
}

function SettingsPanel({ currentConfig }: SettingsPanelProps) {
  const [waNumber, setWaNumber] = useState(currentConfig.whatsappNumber);
  const [logoUrl, setLogoUrl] = useState(currentConfig.logoUrl);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<SaveStatus>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [waStatus, setWaStatus] = useState<SaveStatus>('idle');
  const [waMsg, setWaMsg] = useState('');
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [logoDraft, setLogoDraft] = useState(currentConfig.logoUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setWaNumber(currentConfig.whatsappNumber);
    setLogoUrl(currentConfig.logoUrl);
    setLogoDraft(currentConfig.logoUrl);
  }, [currentConfig.whatsappNumber, currentConfig.logoUrl]);

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadMsg('Ukuran file maksimal 3 MB');
      return;
    }
    setUploadStatus('saving');
    setUploadMsg('Mengupload logo...');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, filename: 'logo-' + file.name.replace(/\.[^.]+$/, '') }),
      });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Upload gagal');
      await saveStoreConfig({ logoUrl: json.url });
      setLogoUrl(json.url);
      setLogoDraft(json.url);
      setLogoPreviewError(false);
      setUploadStatus('saved');
      setUploadMsg('✓ Logo berhasil diupload & disimpan');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setUploadStatus('error');
      setUploadMsg(err instanceof Error ? err.message : 'Upload gagal');
    }
  }

  async function handleSaveLogoUrl() {
    const url = logoDraft.trim();
    if (!url) return;
    setUploadStatus('saving');
    setUploadMsg('Menyimpan URL logo...');
    try {
      await saveStoreConfig({ logoUrl: url });
      setLogoUrl(url);
      setLogoPreviewError(false);
      setUploadStatus('saved');
      setUploadMsg('✓ URL logo disimpan');
    } catch (err) {
      setUploadStatus('error');
      setUploadMsg(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  }

  async function handleSaveWa() {
    const clean = waNumber.replace(/\D/g, '');
    if (clean.length < 8) {
      setWaStatus('error');
      setWaMsg('Nomor tidak valid — minimal 8 digit');
      return;
    }
    setWaStatus('saving');
    setWaMsg('Menyimpan...');
    try {
      await saveStoreConfig({ whatsappNumber: clean });
      setWaStatus('saved');
      setWaMsg('✓ Nomor WhatsApp disimpan');
    } catch (err) {
      setWaStatus('error');
      setWaMsg(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  }

  const statusColor = (s: SaveStatus) =>
    s === 'saved' ? 'hsl(var(--neu-success))' : s === 'error' ? 'hsl(var(--neu-danger))' : 'hsl(var(--muted-foreground))';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* ── Logo Section ── */}
      <div className="neu-card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <ImageLucide size={18} className="text-primary" />
          <h2 className="font-black text-foreground text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
            Logo Toko
          </h2>
        </div>
        <p className="text-muted-foreground text-sm font-semibold -mt-2">
          Logo tampil di header semua halaman. Disarankan format PNG transparan.
        </p>

        {/* Current logo preview */}
        <div className="flex items-center gap-4">
          <div
            className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
            style={{
              width: '120px', height: '56px',
              background: 'hsl(var(--background))',
              boxShadow: 'inset 3px 3px 8px hsl(var(--neu-shadow-dark)), inset -3px -3px 8px hsl(var(--neu-shadow-light))',
            }}
          >
            {logoPreviewError ? (
              <ImageLucide size={20} className="text-muted-foreground" />
            ) : (
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-auto w-auto object-contain"
                style={{ maxHeight: '44px', maxWidth: '108px' }}
                onError={() => setLogoPreviewError(true)}
                onLoad={() => setLogoPreviewError(false)}
              />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-muted-foreground">Logo saat ini</span>
            <span className="text-xs text-muted-foreground" style={{ maxWidth: '180px', wordBreak: 'break-all' }}>
              {logoUrl.length > 40 ? '...' + logoUrl.slice(-38) : logoUrl}
            </span>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2">
          {(['upload', 'url'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setLogoMode(m); setUploadStatus('idle'); setUploadMsg(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all"
              style={{
                boxShadow: logoMode === m
                  ? 'inset 3px 3px 6px hsl(var(--neu-shadow-dark)), inset -3px -3px 6px hsl(var(--neu-shadow-light))'
                  : '3px 3px 6px hsl(var(--neu-shadow-dark)), -3px -3px 6px hsl(var(--neu-shadow-light))',
                color: logoMode === m ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                background: 'hsl(var(--background))',
              }}
            >
              {m === 'url' ? <Link2 size={13} /> : <Upload size={13} />}
              {m === 'url' ? 'Paste URL' : 'Upload File'}
            </button>
          ))}
        </div>

        {logoMode === 'upload' ? (
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleLogoFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadStatus === 'saving'}
              className="neu-button w-full flex flex-col items-center justify-center gap-2 py-5 text-primary font-bold"
              style={{ borderRadius: '14px', opacity: uploadStatus === 'saving' ? 0.7 : 1 }}
            >
              {uploadStatus === 'saving' ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Upload size={22} />
                  </motion.div>
                  <span className="text-sm">Mengupload...</span>
                </>
              ) : (
                <>
                  <Upload size={22} />
                  <span className="text-sm">Pilih File Logo</span>
                  <span className="text-muted-foreground font-semibold" style={{ fontSize: '0.72rem' }}>
                    PNG, JPG, WebP · Maks. 3 MB · Disarankan PNG transparan
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://... atau /airo-assets/..."
              value={logoDraft}
              onChange={e => setLogoDraft(e.target.value)}
              className="neu-inset flex-1 px-4 py-3 bg-transparent border-none outline-none text-foreground font-semibold"
              style={{ borderRadius: '12px', fontSize: '0.85rem' }}
            />
            <button
              type="button"
              onClick={handleSaveLogoUrl}
              disabled={uploadStatus === 'saving'}
              className="neu-button px-4 py-3 text-primary font-bold flex items-center gap-1.5"
              style={{ borderRadius: '12px', fontSize: '0.85rem' }}
            >
              <Save size={15} />
              Simpan
            </button>
          </div>
        )}

        {uploadMsg && (
          <p className="text-xs font-bold px-1" style={{ color: statusColor(uploadStatus) }}>
            {uploadMsg}
          </p>
        )}

        <div className="neu-inset rounded-xl px-4 py-3">
          <p className="text-muted-foreground text-xs font-semibold">
            💡 <strong>Ukuran ideal:</strong> lebar 200–400 px, tinggi 40–80 px.
            Header menampilkan logo maks. <strong>44 px tinggi</strong> dan <strong>200 px lebar</strong>.
          </p>
        </div>
      </div>

      {/* ── WhatsApp Section ── */}
      <div className="neu-card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Phone size={18} className="text-primary" />
          <h2 className="font-black text-foreground text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
            Nomor WhatsApp
          </h2>
        </div>
        <p className="text-muted-foreground text-sm font-semibold -mt-2">
          Digunakan di tombol WA floating homepage dan tombol "Tanya Stok" di detail produk.
        </p>

        <div className="flex gap-2">
          <div className="neu-inset flex items-center gap-2 flex-1 px-4 py-3" style={{ borderRadius: '12px' }}>
            <span className="text-muted-foreground font-bold text-sm shrink-0">+</span>
            <input
              type="tel"
              placeholder="6282340619639"
              value={waNumber}
              onChange={e => { setWaNumber(e.target.value); setWaStatus('idle'); setWaMsg(''); }}
              className="bg-transparent border-none outline-none text-foreground font-semibold flex-1"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <button
            type="button"
            onClick={handleSaveWa}
            disabled={waStatus === 'saving'}
            className="neu-button px-4 py-3 text-primary font-bold flex items-center gap-1.5 shrink-0"
            style={{ borderRadius: '12px', fontSize: '0.85rem' }}
          >
            {waStatus === 'saving' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Save size={15} />
              </motion.div>
            ) : (
              <Save size={15} />
            )}
            Simpan
          </button>
        </div>

        {waMsg && (
          <p className="text-xs font-bold px-1" style={{ color: statusColor(waStatus) }}>
            {waMsg}
          </p>
        )}

        <div className="neu-inset rounded-xl px-4 py-3">
          <p className="text-muted-foreground text-xs font-semibold">
            💡 Masukkan nomor lengkap dengan kode negara tanpa tanda + atau spasi.
            Contoh: <strong>6282340619639</strong> (Indonesia 62 + nomor tanpa 0 di depan).
          </p>
        </div>

        {/* Live preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'hsl(var(--primary) / 0.08)' }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'hsl(var(--whatsapp-green))' }}
          >
            <MessageCircle size={18} color="white" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-muted-foreground">Preview link WA</span>
            <span className="text-xs font-semibold text-foreground" style={{ wordBreak: 'break-all' }}>
              wa.me/{waNumber.replace(/\D/g, '') || '...'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

// ===== MAIN ADMIN PAGE =====
export default function AdminPage() {
  const storeConfig = useStoreConfig();
  const [isAuth, setIsAuth] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [pinError, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'settings'>('products');

  // Hide global header/footer on admin page
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => document.body.classList.remove('admin-page');
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(res => res.ok ? res.json() : { authenticated: false })
      .then((data: { authenticated?: boolean }) => {
        if (active && data.authenticated) {
          setIsAuth(true);
          loadProducts().then(setProducts).catch(() => toast.error('Gagal memuat produk dari Supabase'));
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setIsCheckingAuth(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (lockUntil <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockCountdown(0);
        setLockUntil(0);
        setAttempts(0);
      } else {
        setLockCountdown(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const handlePinComplete = useCallback(async (value: string) => {
    if (lockUntil > Date.now()) return;
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: value }),
      });
      if (response.ok) {
        setIsAuth(true);
        loadProducts().then(setProducts).catch(() => toast.error('Gagal memuat produk dari Supabase'));
        setPin('');
        setError('');
        return;
      }
      const result = await response.json() as { error?: string };
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
      if (response.status === 429) {
        setError(result.error || 'Terlalu banyak percobaan. Coba lagi nanti.');
      } else if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_SECONDS * 1000;
        setLockUntil(until);
        setLockCountdown(LOCK_SECONDS);
        setError(`Terlalu banyak percobaan. Tunggu ${LOCK_SECONDS} detik.`);
      } else {
        setError(result.error || `PIN salah, coba lagi. Sisa percobaan: ${MAX_ATTEMPTS - newAttempts}`);
      }
    } catch {
      setError('Tidak dapat menghubungi server. Periksa koneksi dan konfigurasi deployment.');
    }
  }, [attempts, lockUntil]);

  const handleLogout = () => {
    void fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    setIsAuth(false);
    setPin('');
    setAttempts(0);
    setError('');
  };

  const handleSaveProduct = async (p: Product) => {
    const isNew = !editProduct?.id;
    setIsSaving(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p),
      });
      const result = await response.json() as Product & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan produk');
      const updated = await loadProducts();
      setProducts(updated);
      toast.success(isNew ? 'Produk berhasil ditambahkan!' : 'Perubahan berhasil disimpan!', { description: p.name, duration: 4000 });
      setShowForm(false); setEditProduct(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan produk');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'same-origin' });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus produk');
      setProducts(await loadProducts()); setDeleteConfirm(null);
      toast.success('Produk berhasil dihapus');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Gagal menghapus produk'); }
  };

  const handleToggleAvailable = async (id: string) => {
    const product = products.find(item => item.id === id);
    if (!product) return;
    try {
      const response = await fetch('/api/products', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, available: !product.available }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Gagal mengubah status produk');
      setProducts(await loadProducts());
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Gagal mengubah status'); }
  };

  // Keep the login form hidden until the server has checked the existing HttpOnly session cookie.
  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4" aria-busy="true">
        <div className="neu-card w-full max-w-sm p-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
          <div className="h-5 w-40 rounded-lg animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
          <div className="h-3 w-56 rounded-lg animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
          <div className="h-11 w-full rounded-xl animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
        </div>
      </main>
    );
  }

  // ===== PIN LOGIN SCREEN =====
  if (!isAuth) {
    const isLocked = lockUntil > Date.now();
    return (
      <>
        <Helmet>
          <title>Panel Admin — StokProduk</title>
          <meta name="description" content="Panel admin StokProduk untuk mengelola produk, harga, dan stok." />
          <meta name="robots" content="noindex" />
        </Helmet>
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neu-card w-full max-w-sm p-8 text-center"
          >
            <div className="neu-button w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={28} className="text-primary" />
            </div>
            <h1 className="font-black text-foreground text-2xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {admin.login.title}
            </h1>
            <p className="text-muted-foreground text-sm mb-8">{admin.login.subtitle}</p>

            {isLocked ? (
              <div className="neu-inset p-4 rounded-2xl mb-4">
                <AlertTriangle size={24} className="mx-auto mb-2" style={{ color: 'hsl(var(--neu-danger))' }} />
                <p className="font-bold text-sm" style={{ color: 'hsl(var(--neu-danger))' }}>
                  Akun terkunci selama {lockCountdown} detik
                </p>
              </div>
            ) : (
              <div className={shake ? 'shake' : ''}>
                <OTPInput
                  maxLength={6}
                  value={pin}
                  onChange={setPin}
                  onComplete={handlePinComplete}
                  containerClassName="flex gap-2 justify-center mb-4"
                  render={({ slots }) => (
                    <div className="flex gap-2 justify-center">
                      {slots.map((slot, i) => (
                        <Slot key={i} char={slot.char} hasFakeCaret={slot.hasFakeCaret} isActive={slot.isActive} />
                      ))}
                    </div>
                  )}
                />
              </div>
            )}

            {pinError && !isLocked && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-sm mt-2"
                style={{ color: 'hsl(var(--neu-danger))' }}
              >
                {pinError}
              </motion.p>
            )}
          </motion.div>
        </main>
      </>
    );
  }

  // ===== ADMIN DASHBOARD =====
  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <Helmet>
          <title>Dashboard Admin — StokProduk</title>
          <meta name="description" content="Dashboard admin untuk mengelola katalog produk, stok, dan harga di StokProduk." />
          <meta name="robots" content="noindex" />
      </Helmet>
      <main className="min-h-screen bg-background">
        {/* Admin Header */}
        <div
          className="sticky top-0 z-30 bg-background px-4 py-3"
          style={{ boxShadow: '0 4px 16px hsl(var(--neu-shadow-dark)), 0 -2px 8px hsl(var(--neu-shadow-light))' }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0" title="Kembali ke Toko">
              <img
                src={storeConfig.logoUrl}
                alt={storeConfig.storeName}
                className="block h-auto w-auto object-contain"
                style={{ maxHeight: '36px', maxWidth: '160px' }}
              />
            </Link>

            {/* Icon nav */}
            <div className="flex items-center gap-3">
              {/* Produk */}
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                title="Produk"
                className="flex items-center justify-center transition-all"
                style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  boxShadow: activeTab === 'products'
                    ? 'inset 3px 3px 6px hsl(var(--neu-shadow-dark)), inset -3px -3px 6px hsl(var(--neu-shadow-light))'
                    : '3px 3px 6px hsl(var(--neu-shadow-dark)), -3px -3px 6px hsl(var(--neu-shadow-light))',
                  color: activeTab === 'products' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  background: 'hsl(var(--background))',
                }}
              >
                <Package size={20} />
              </button>

              {/* Tambah Produk — hanya saat tab Produk aktif */}
              {activeTab === 'products' && (
                <button
                  type="button"
                  onClick={() => { setEditProduct(null); setShowForm(true); }}
                  title="Tambah Produk"
                  className="flex items-center justify-center transition-all"
                  style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    boxShadow: '3px 3px 6px hsl(var(--neu-shadow-dark)), -3px -3px 6px hsl(var(--neu-shadow-light))',
                    color: 'hsl(var(--primary))',
                    background: 'hsl(var(--background))',
                  }}
                >
                  <Plus size={20} />
                </button>
              )}

              {/* Pengaturan */}
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title="Pengaturan"
                className="flex items-center justify-center transition-all"
                style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  boxShadow: activeTab === 'settings'
                    ? 'inset 3px 3px 6px hsl(var(--neu-shadow-dark)), inset -3px -3px 6px hsl(var(--neu-shadow-light))'
                    : '3px 3px 6px hsl(var(--neu-shadow-dark)), -3px -3px 6px hsl(var(--neu-shadow-light))',
                  color: activeTab === 'settings' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  background: 'hsl(var(--background))',
                }}
              >
                <Settings size={20} />
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="flex items-center justify-center transition-all"
                style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  boxShadow: '3px 3px 6px hsl(var(--neu-shadow-dark)), -3px -3px 6px hsl(var(--neu-shadow-light))',
                  color: 'hsl(var(--muted-foreground))',
                  background: 'hsl(var(--background))',
                }}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* ===== TAB: PRODUCTS ===== */}
        {activeTab === 'products' && (
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Produk', value: products.length, icon: Package },
                { label: 'Tersedia', value: products.filter(p => p.available && p.stock > 0).length, icon: CheckCircle },
                { label: 'Stok Habis', value: products.filter(p => !p.available || p.stock === 0).length, icon: XCircle },
                { label: 'Kategori', value: new Set(products.map(p => p.category)).size, icon: Shield },
              ].map(stat => (
                <div key={stat.label} className="neu-card p-4 text-center">
                  <stat.icon size={20} className="text-primary mx-auto mb-2" />
                  <div className="font-black text-2xl text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground text-xs font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {products.length === 0 ? (
                <div className="neu-card p-12 text-center">
                  <Package size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-semibold">{admin.empty.message}</p>
                </div>
              ) : (
                products.map(product => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="neu-card p-4 flex items-center gap-4"
                  >
                    <div
                      className="shrink-0 rounded-xl overflow-hidden"
                      style={{ width: '56px', height: '56px', background: 'hsl(var(--neu-img-bg))' }}
                    >
                      <img
                        src={product.imageThumbnail || product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate" style={{ fontSize: '0.9rem' }}>{product.name}</p>
                      <p className="text-muted-foreground text-xs">{product.category} · {formatRupiah(product.price)}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: product.available && product.stock > 0 ? 'hsl(var(--neu-success))' : 'hsl(var(--neu-danger))' }}>
                        {product.available && product.stock > 0 ? `Stok: ${product.stock} ${product.unit}` : 'Stok Habis'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleToggleAvailable(product.id)} className="neu-button p-2" title={product.available ? 'Nonaktifkan' : 'Aktifkan'}>
                        {product.available ? <Eye size={16} style={{ color: 'hsl(var(--neu-success))' }} /> : <EyeOff size={16} style={{ color: 'hsl(var(--neu-danger))' }} />}
                      </button>
                      <button onClick={() => { setEditProduct(product); setShowForm(true); }} className="neu-button p-2 text-primary">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setDeleteConfirm(product.id)} className="neu-button p-2" style={{ color: 'hsl(var(--neu-danger))' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== TAB: SETTINGS ===== */}
        {activeTab === 'settings' && (
          <SettingsPanel currentConfig={storeConfig} />
        )}

        {/* Product Form Modal */}
        <AnimatePresence>
          {showForm && (
            <ProductForm
              product={editProduct}
              onSave={handleSaveProduct}
              onClose={() => { if (!isSaving) { setShowForm(false); setEditProduct(null); } }}
              isSaving={isSaving}
            />
          )}
        </AnimatePresence>

        {/* Delete Confirm Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="neu-card p-6 max-w-sm w-full text-center"
              >
                <Trash2 size={32} className="mx-auto mb-3" style={{ color: 'hsl(var(--neu-danger))' }} />
                <h3 className="font-black text-foreground text-lg mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  {admin.delete.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-6">{admin.delete.subtitle}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="neu-button flex-1 py-3 text-muted-foreground font-bold"
                  >
                    {admin.delete.cancel}
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 py-3 text-white font-bold rounded-xl"
                    style={{
                      background: 'hsl(var(--neu-danger))',
                      boxShadow: '3px 3px 8px hsl(var(--neu-shadow-dark)), -2px -2px 6px hsl(var(--neu-shadow-light))',
                    }}
                  >
                    {admin.delete.confirm}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
