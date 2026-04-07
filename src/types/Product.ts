import type { ProductCategory } from '../config/volera';

export interface Product {
  id: number;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  finalPrice: number;
  image: string;
  category: ProductCategory | string;
  description: string;
  descriptionAr: string;
  sizes: string[];
  images: string[];
  isFeatured?: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  sizeMl: string;
  lowStock: boolean;
}
