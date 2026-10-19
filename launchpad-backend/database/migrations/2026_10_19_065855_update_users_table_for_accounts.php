<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->after('id');
            $table->string('last_name')->after('first_name');
            $table->string('handle')->unique()->after('email');
            $table->string('auth_provider')->after('handle');
            $table->string('password_hash')->nullable()->after('auth_provider');
            $table->string('google_id')->nullable()->unique()->after('password_hash');
            $table->string('avatar')->nullable()->after('google_id');
            $table->string('role')->default('member')->after('avatar');
            $table->boolean('is_suspended')->default(false)->after('email_verified_at');
            $table->string('bio')->nullable()->after('is_suspended');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['name', 'password', 'remember_token']);
        });

        // SQLite (used for the test suite) can't ADD CONSTRAINT after the
        // table already exists — this enforcement is MySQL-only in
        // production/dev; the app layer never writes an inconsistent
        // combination either way (see User::forceFill calls in Accounts
        // controllers).
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE users ADD CONSTRAINT chk_users_auth_provider CHECK ('
                .'(auth_provider = \'password\' AND password_hash IS NOT NULL AND google_id IS NULL)'
                .' OR (auth_provider = \'google\' AND google_id IS NOT NULL AND password_hash IS NULL)'
                .')'
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT chk_users_auth_provider');
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->after('id');
            $table->string('password')->after('email_verified_at');
            $table->rememberToken()->after('password');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'last_name',
                'handle',
                'auth_provider',
                'password_hash',
                'google_id',
                'avatar',
                'role',
                'is_suspended',
                'bio',
            ]);
        });
    }
};
