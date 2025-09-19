export type Product = {
  id?: number;
  name: string;
  description: string;
  price: number;
};

export type ProductImage = {
  id?: number;
  product_id: number | null;
  image_url: string;
};

export type ProductWithImages = Product & {
  images: ProductImage[];
};
