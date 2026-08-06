import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listCategories from "./tools/list-categories";
import listCart from "./tools/list-cart";
import addToCart from "./tools/add-to-cart";
import listOrders from "./tools/list-orders";
import listMyProducts from "./tools/list-my-products";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "maelove",
  title: "MaeLove",
  version: "0.1.0",
  instructions:
    "Tools for MaeLove, an East African boutique fashion marketplace. Browse categories and products, inspect a product, manage the signed-in shopper's bag and orders, and list a seller's own products.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchProducts,
    getProduct,
    listCategories,
    listCart,
    addToCart,
    listOrders,
    listMyProducts,
  ],
});
