<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('short_description')->nullable();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('organizer_id')->constrained('users')->restrictOnDelete();
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->string('location');
            $table->string('address')->nullable();
            $table->string('city');
            $table->string('zip_code')->nullable();
            $table->string('country')->default('DE');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('image')->nullable();
            $table->string('status')->default('draft'); // draft, published, cancelled, completed
            $table->boolean('is_featured')->default(false);
            $table->integer('max_attendees')->nullable();
            $table->integer('current_attendees')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
