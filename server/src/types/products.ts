export type Product = {
  id?: number;
  name: string;
  description: string;
  price: number;
};

export type ProductImage = {
  id?: number;
  product_id: number;
  image_url: string;
};
