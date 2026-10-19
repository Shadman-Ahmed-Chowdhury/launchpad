<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Topic;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! User::where('email', 'test@example.com')->exists()) {
            User::factory()->create(['email' => 'test@example.com']);
        }

        $topics = collect([
            ['name' => 'Productivity', 'slug' => 'productivity'],
            ['name' => 'Developer Tools', 'slug' => 'developer-tools'],
            ['name' => 'Writing', 'slug' => 'writing'],
            ['name' => 'DevOps', 'slug' => 'devops'],
            ['name' => 'No-Code', 'slug' => 'no-code'],
            ['name' => 'Design', 'slug' => 'design'],
        ])->map(fn (array $attributes) => Topic::firstOrCreate(['slug' => $attributes['slug']], $attributes));

        $founders = $this->pickOrCreateUsers(3, []);
        $voters = $this->pickOrCreateUsers(60, $founders->pluck('id')->all());

        $products = [
            [
                'name' => 'FlowCraft',
                'tagline' => 'Visual workflows for small teams',
                'description' => 'Turn a messy checklist into a workflow the whole team can see and run, without writing a line of code.',
                'website_url' => 'https://example.com/flowcraft',
                'topics' => ['Productivity', 'No-Code'],
                'votes' => 42,
            ],
            [
                'name' => 'Inkwell',
                'tagline' => 'Write your newsletter, not your HTML',
                'description' => 'A distraction-free editor for writers who send a newsletter every week and never want to touch a template again.',
                'website_url' => 'https://example.com/inkwell',
                'topics' => ['Writing'],
                'votes' => 27,
            ],
            [
                'name' => 'Runbook',
                'tagline' => 'Incident response your team will actually read',
                'description' => 'Short, versioned runbooks that link straight to the alert that triggered them.',
                'website_url' => 'https://example.com/runbook',
                'topics' => ['DevOps', 'Developer Tools'],
                'votes' => 15,
            ],
        ];

        foreach ($products as $index => $definition) {
            $founder = $founders[$index];

            $product = Product::factory()->launched()->create([
                'founder_id' => $founder->id,
                'name' => $definition['name'],
                'slug' => Product::generateUniqueSlug($definition['name']),
                'tagline' => $definition['tagline'],
                'description' => $definition['description'],
                'website_url' => $definition['website_url'],
            ]);

            $product->topics()->sync(
                $topics->whereIn('name', $definition['topics'])->pluck('id')
            );

            // No voting on your own product (see docs/01-client-brief.md).
            $voterPool = $voters->reject(fn (User $voter) => $voter->is($founder))
                ->shuffle()
                ->take($definition['votes']);

            foreach ($voterPool as $voter) {
                Vote::factory()->create([
                    'product_id' => $product->id,
                    'user_id' => $voter->id,
                ]);
            }
        }
    }

    /**
     * Prefer users that already exist in the database (the task calls for
     * products "for already present users") and only create new ones to make
     * up any shortfall.
     *
     * @param  array<int, int>  $excludeIds
     * @return Collection<int, User>
     */
    private function pickOrCreateUsers(int $count, array $excludeIds): Collection
    {
        $existing = User::whereNotIn('id', $excludeIds)->inRandomOrder()->limit($count)->get();

        if ($existing->count() < $count) {
            $existing = $existing->merge(User::factory($count - $existing->count())->create());
        }

        return $existing;
    }
}
