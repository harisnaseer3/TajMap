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
            $table->string('sector')->nullable();
            $table->string('block')->nullable();
            $table->json('coordinates'); // Array of {x, y} points normalized to 0-1
            $table->enum('status', ['available', 'reserved', 'sold'])->default('available');
            $table->decimal('area', 10, 2); // Square feet/meters
            $table->decimal('price', 15, 2);
            $table->foreignId('base_image_id')->nullable()->constrained('media')->nullOnDelete();
            $table->json('base_image_transform')->nullable(); // {x, y, scale, rotation}
            $table->text('description')->nullable();
            $table->json('features')->nullable(); // Additional features as JSON
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'sector', 'block']);
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