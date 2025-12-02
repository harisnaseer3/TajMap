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
        Schema::create('plots', function (Blueprint $table) {
            $table->id();
            $table->string('plot_number')->unique();
            $table->decimal('area', 10, 2); // Square feet/meters
            $table->string('sector')->nullable();
            $table->string('street')->nullable();
            $table->string('type')->nullable();
            $table->string('category')->nullable();
            $table->decimal('price', 15, 2)->nullable();
            $table->foreignId('base_image_id')->nullable()->constrained('media')->nullOnDelete();
            $table->json('base_image_transform')->nullable(); // {x, y, scale, rotation}
            $table->text('description')->nullable();
            $table->json('features')->nullable(); // Additional features as JSON
            $table->json('coordinates')->nullable(); // Array of {x, y} points normalized to 0-1
            $table->enum('status', ['available', 'reserved', 'hold', 'sold'])->default('available');
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'sector', 'street']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plots');
    }
};
