import { getProducts } from "@/actions/product-actions";
import { ProductClient } from "./product-client";

export default async function ProductsPage() {
  const res = await getProducts();
  const products = res.success && res.data ? res.data : [];

  return <ProductClient products={products} />;
}
