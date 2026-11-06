import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { Avatar } from "@/components/avatar";
import { getCurrentUser } from "@/lib/auth";
import { getMemberProducts, getPublicProfile } from "@/lib/users";

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    notFound();
  }

  const [products, currentUser] = await Promise.all([
    getMemberProducts(username),
    getCurrentUser(),
  ]);

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar src={profile.avatarUrl} alt={fullName} size={96} />

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl tracking-tight">{fullName}</h1>
              {profile.bio && (
                <p className="mt-2 text-lg text-muted">{profile.bio}</p>
              )}

              {profile.links.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-hairline px-3 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-y border-hairline py-6">
            <Stat value={profile.productsCount} label="Products launched" />
            <Stat value={formatMemberSince(profile.memberSince)} label="Member since" />
            <Stat value={profile.votesReceivedCount} label="Upvotes received" />
          </div>

          <div className="mt-12">
            <h2 className="font-display text-xl">Products</h2>

            {products.length > 0 ? (
              <div className="mt-6 divide-y divide-hairline">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted">
                {fullName} hasn&apos;t launched a product yet.
              </p>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
