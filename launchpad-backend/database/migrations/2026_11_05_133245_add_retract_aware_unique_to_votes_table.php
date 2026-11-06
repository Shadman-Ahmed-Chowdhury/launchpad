<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('votes', function (Blueprint $table) {
            // The composite unique being dropped below is also the only
            // index covering `product_id`'s foreign key — MySQL refuses to
            // drop it until another index can take over that job.
            $table->index('product_id');
        });

        Schema::table('votes', function (Blueprint $table) {
            $table->dropUnique(['product_id', 'user_id']);
        });

        Schema::table('votes', function (Blueprint $table) {
            // MySQL has no partial/filtered unique index, so ADR-014's "unique
            // among active votes only" is emulated with a generated column
            // that is NULL whenever the vote is retracted — a unique index
            // allows any number of NULLs, but only one non-null value per
            // (product_id, active_user_id) pair, which is exactly "at most
            // one active vote per member per product" (see ADR-029).
            // Standard CASE expression (not MySQL's IF()) so this also works
            // against the sqlite :memory: database the test suite migrates.
            $table->unsignedBigInteger('active_user_id')->nullable()
                ->virtualAs('case when retracted_at is null then user_id else null end')
                ->after('user_id');

            $table->unique(['product_id', 'active_user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('votes', function (Blueprint $table) {
            $table->dropUnique(['product_id', 'active_user_id']);
            $table->dropColumn('active_user_id');
        });

        Schema::table('votes', function (Blueprint $table) {
            $table->unique(['product_id', 'user_id']);
            $table->dropIndex(['product_id']);
        });
    }
};
