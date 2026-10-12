import type { Category } from "@/lib/types";

/** Commodity landing page for each product category (locale-less paths). Safe for client components. */
export const hubPaths: Record<Category, string> = { coffee: "/green-coffee", cashew: "/cashew-kernels" };
