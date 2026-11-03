import { requireUser } from "@/lib/auth";
import { getTopics } from "@/lib/products";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requireUser("/dashboard/products/new");
  const topics = await getTopics();

  return (
    <div className="mx-auto w-full max-w-[80%] px-6 py-16">
      <h1 className="font-display text-3xl tracking-tight">
        Submit a product
      </h1>
      <p className="mt-2 text-muted">
        This saves as a draft. Submit it for review when it&apos;s ready —
        you can pick a launch day once a reviewer approves it.
      </p>

      <ProductForm topics={topics} />
    </div>
  );
}
