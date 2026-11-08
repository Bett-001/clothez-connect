/** A product as it is kept in the shopping cart. */
export interface CartProduct {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  size: string;
  color: string;
}
