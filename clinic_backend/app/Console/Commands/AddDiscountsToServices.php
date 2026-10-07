<?php

namespace App\Console\Commands;

use App\Models\Service;
use Illuminate\Console\Command;

class AddDiscountsToServices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'services:add-discounts {--count=5 : Number of services to add discounts to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add discounts to some existing approved services';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = (int) $this->option('count');
        
        $services = Service::where('status', 'approved')
            ->where('has_discount', false)
            ->inRandomOrder()
            ->limit($count)
            ->get();

        if ($services->isEmpty()) {
            $this->warn('No services found without discounts to update.');
            return Command::FAILURE;
        }

        $this->info("Adding discounts to {$services->count()} services...");

        foreach ($services as $index => $service) {
            $basePrice = (float) $service->base_price;
            
            if ($basePrice <= 0) {
                continue;
            }

            // Alternate between percentage and fixed discounts
            $usePercentage = ($index % 2 === 0);
            
            if ($usePercentage) {
                // Percentage discount: 10%, 15%, 20%, 25%, 30%
                $discountPercentages = [10, 15, 20, 25, 30];
                $discountPercentage = $discountPercentages[array_rand($discountPercentages)];
                
                $discountAmount = round(($basePrice * $discountPercentage) / 100, 2);
                $finalPrice = $basePrice - $discountAmount;
                
                $service->update([
                    'has_discount' => true,
                    'discount_type' => 'percentage',
                    'discount_value' => (string) $discountPercentage,
                    'final_price' => (string) number_format($finalPrice, 2, '.', ''),
                ]);
                
                $this->line("✓ {$service->name_en}: {$discountPercentage}% off (from {$basePrice} to {$finalPrice} KWD)");
            } else {
                // Fixed discount: 5, 10, 15, 20 KWD
                $fixedDiscounts = [5, 10, 15, 20];
                $discountAmount = $fixedDiscounts[array_rand($fixedDiscounts)];
                
                // Make sure discount doesn't exceed base price
                if ($discountAmount >= $basePrice) {
                    $discountAmount = round($basePrice * 0.2, 2); // 20% if fixed would exceed
                }
                
                $finalPrice = $basePrice - $discountAmount;
                $discountPercentage = round(($discountAmount / $basePrice) * 100, 2);
                
                $service->update([
                    'has_discount' => true,
                    'discount_type' => 'fixed',
                    'discount_value' => (string) number_format($discountAmount, 2, '.', ''),
                    'final_price' => (string) number_format($finalPrice, 2, '.', ''),
                ]);
                
                $this->line("✓ {$service->name_en}: {$discountAmount} KWD off (from {$basePrice} to {$finalPrice} KWD)");
            }
        }

        $this->info("Successfully added discounts to {$services->count()} services!");
        return Command::SUCCESS;
    }
}

