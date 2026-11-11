import type { Product } from '../../../components/ProductSheet.js';
import { supabaseRequest } from '../../supabase.js';
import { DEFAULT_PRODUCTS } from '../../../lib/default-products.js';

const columns = 'id,name,category,price,stock,unit,description,image,image_thumbnail,image_detail,available';
function fromRow(row: Record<string, unknown>): Product {
  return { id: String(row.id), name: String(row.name || ''), category: String(row.category || ''), price: Number(row.price || 0), stock: Number(row.stock || 0), unit: String(row.unit || 'item'), description: String(row.description || ''), image: String(row.image || ''), imageThumbnail: String(row.image_thumbnail || row.image || ''), imageDetail: String(row.image_detail || row.image || ''), available: row.available !== false };
}
function toRow(p: Product) {
  return { id: p.id, name: p.name, category: p.category, price: p.price, stock: p.stock, unit: p.unit, description: p.description, image: p.image, image_thumbnail: p.imageThumbnail || p.image, image_detail: p.imageDetail || p.image, available: p.available !== false };
}
export async function getProducts(): Promise<Product[]> {
  let rows = await supabaseRequest(`products?select=${columns}&order=created_at.asc`) as Record<string, unknown>[];
  if (rows.length === 0) {
    await supabaseRequest('products?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify((DEFAULT_PRODUCTS as Product[]).map(toRow)) });
    rows = await supabaseRequest(`products?select=${columns}&order=created_at.asc`) as Record<string, unknown>[];
  }
  return rows.map(fromRow);
}
export async function saveProduct(p: Product): Promise<Product> {
  const rows = await supabaseRequest('products?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(toRow(p)) }) as Record<string, unknown>[];
  return fromRow(rows[0]);
}
export async function deleteProduct(id: string): Promise<void> {
  await supabaseRequest(`products?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
}
export function validateProduct(value: unknown): Product {
  if (!value || typeof value !== 'object') throw new Error('Data produk tidak valid.');
  const p = value as Partial<Product>;
  if (!p.id || !p.name?.trim() || !p.category?.trim() || !Number.isFinite(Number(p.price)) || Number(p.price) <= 0 || !Number.isFinite(Number(p.stock)) || Number(p.stock) < 0) throw new Error('Nama, kategori, harga, dan stok wajib valid.');
  return { id: String(p.id), name: p.name.trim(), category: p.category.trim(), price: Number(p.price), stock: Number(p.stock), unit: p.unit || 'item', description: p.description || '', image: p.image || '', imageThumbnail: p.imageThumbnail || p.image || '', imageDetail: p.imageDetail || p.image || '', available: p.available !== false };
}
