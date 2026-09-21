export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Profile: {username}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Member profile page placeholder.
      </p>
    </main>
  );
}
