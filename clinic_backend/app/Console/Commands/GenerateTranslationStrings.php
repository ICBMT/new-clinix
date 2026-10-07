<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateTranslationStrings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'generate:translationstrings 
                            {--scan-only : Only scan and generate reports, do not update files}
                            {--admin-views : Also scan admin panel views}
                            {--deep : Deep scan for all literal strings (controllers, resources, API responses, etc.)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan codebase for translation keys and add missing ones to language files';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Scanning for translation keys...');

        $projectRoot = base_path();
        $enFile = "$projectRoot/lang/en/common.php";
        $arFile = "$projectRoot/lang/ar/common.php";

        // Load existing translations
        $existingEn = file_exists($enFile) ? require $enFile : [];
        $existingAr = file_exists($arFile) ? require $arFile : [];

        // Extract all translation keys and literal strings
        $foundKeys = [];
        $foundLiterals = [];

        // Scan PHP files
        $this->info('Scanning PHP files...');
        $this->scanForKeys("$projectRoot/app", 'php', $foundKeys, $foundLiterals);
        $this->scanForKeys("$projectRoot/routes", 'php', $foundKeys, $foundLiterals);
        $this->scanForKeys("$projectRoot/database/migrations", 'php', $foundKeys, $foundLiterals);
        if (is_dir("$projectRoot/resources/views")) {
            $this->scanForKeys("$projectRoot/resources/views", 'php', $foundKeys, $foundLiterals);
        }

        // Scan JS/TS files
        $scanFrontend = $this->option('admin-views') || $this->option('deep');
        if ($scanFrontend) {
            $this->info('Scanning frontend files...');
            if (is_dir("$projectRoot/resources/js")) {
                $this->scanForKeys("$projectRoot/resources/js", 'js', $foundKeys, $foundLiterals);
            }
            if (is_dir("$projectRoot/resources/ts")) {
                $this->scanForKeys("$projectRoot/resources/ts", 'js', $foundKeys, $foundLiterals);
            }
        }

        // Remove duplicates and normalize
        $uniqueKeys = array_unique($foundKeys);
        sort($uniqueKeys);

        // Process literals into keys if deep scan
        if ($this->option('deep') && !empty($foundLiterals)) {
            $this->info('Processing literal strings...');
            foreach ($foundLiterals as $literal) {
                $key = $this->literalToKey($literal);
                if (!empty($key) && !in_array($key, $uniqueKeys)) {
                    $uniqueKeys[] = $key;
                }
            }
            sort($uniqueKeys);
        }

        $this->info("Found " . count($uniqueKeys) . " unique translation keys");

        // Find missing keys
        $missingInEn = array_filter($uniqueKeys, fn($k) => !isset($existingEn[$k]) && !array_key_exists($k, $existingEn));
        $missingInAr = array_filter($uniqueKeys, fn($k) => !isset($existingAr[$k]) && !array_key_exists($k, $existingAr));

        $this->info("Missing in English: " . count($missingInEn));
        $this->info("Missing in Arabic: " . count($missingInAr));

        if (empty($missingInEn) && empty($missingInAr)) {
            $this->info('✅ All keys are present in language files.');
            return 0;
        }

        // Generate reports
        $this->generateReports($uniqueKeys, $missingInEn, $missingInAr, $projectRoot, $foundLiterals);

        if ($this->option('scan-only')) {
            $this->info('📄 Reports generated. Use without --scan-only to update language files.');
            return 0;
        }

        // Update language files
        if (!empty($missingInEn) || !empty($missingInAr)) {
            if ($this->confirm('Update language files with missing keys?', true)) {
                $this->updateLanguageFiles($missingInEn, $missingInAr, $enFile, $arFile, $existingEn, $existingAr, $foundLiterals);
                $this->info('✅ Language files updated!');
            }
        }

        return 0;
    }

    private function scanForKeys($dir, $type, &$foundKeys, &$foundLiterals)
    {
        if (!is_dir($dir)) return;

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $ext = $file->getExtension();
                if (($type === 'php' && $ext === 'php') ||
                    ($type === 'js' && in_array($ext, ['js', 'jsx', 'ts', 'tsx', 'vue']))) {
                    $this->extractKeysFromFile($file->getPathname(), $type, $foundKeys, $foundLiterals);
                }
            }
        }
    }

    private function extractKeysFromFile($filePath, $type, &$foundKeys, &$foundLiterals)
    {
        // Skip vendor and node_modules
        if (strpos($filePath, '/vendor/') !== false || strpos($filePath, '/node_modules/') !== false) {
            return;
        }

        $content = file_get_contents($filePath);

        if ($type === 'php') {
            // Match translation function calls
            preg_match_all("/__\(['\"](common\.)?([^'\"]+)['\"]\)/", $content, $matches);
            foreach ($matches[2] as $key) {
                if (!empty($key) && !in_array($key, $foundKeys)) {
                    $foundKeys[] = $key;
                }
            }

            preg_match_all("/trans\(['\"](common\.)?([^'\"]+)['\"]\)/", $content, $matches);
            foreach ($matches[2] as $key) {
                if (!empty($key) && !in_array($key, $foundKeys)) {
                    $foundKeys[] = $key;
                }
            }

            preg_match_all("/@lang\(['\"](common\.)?([^'\"]+)['\"]\)/", $content, $matches);
            foreach ($matches[2] as $key) {
                if (!empty($key) && !in_array($key, $foundKeys)) {
                    $foundKeys[] = $key;
                }
            }

            // Deep scan: Find literal strings in controllers, resources, etc.
            if ($this->option('deep')) {
                // Find string literals in array keys and values
                // Match: 'key' => 'value', "key" => "value"
                preg_match_all("/['\"]([A-Z][a-zA-Z\s]{3,})['\"]\s*=>/", $content, $matches);
                foreach ($matches[1] as $literal) {
                    $literal = trim($literal);
                    if (strlen($literal) > 3 && !in_array($literal, $foundLiterals)) {
                        $foundLiterals[] = $literal;
                    }
                }

                // Find string literals in Inertia::render data
                preg_match_all("/Inertia::render\([^,]+,\s*\[(.*?)\]/s", $content, $matches);
                foreach ($matches[1] as $data) {
                    preg_match_all("/['\"]([A-Z][a-zA-Z\s]{5,})['\"]/", $data, $dataMatches);
                    foreach ($dataMatches[1] as $literal) {
                        $literal = trim($literal);
                        if (strlen($literal) > 5 && !in_array($literal, $foundLiterals)) {
                            $foundLiterals[] = $literal;
                        }
                    }
                }

                // Find string literals in return statements (API responses)
                preg_match_all("/return\s+\[(.*?)\];/s", $content, $matches);
                foreach ($matches[1] as $returnData) {
                    preg_match_all("/['\"]([A-Z][a-zA-Z\s]{5,})['\"]/", $returnData, $returnMatches);
                    foreach ($returnMatches[1] as $literal) {
                        $literal = trim($literal);
                        if (strlen($literal) > 5 && !in_array($literal, $foundLiterals)) {
                            $foundLiterals[] = $literal;
                        }
                    }
                }

                // Find status values, enum values
                preg_match_all("/['\"](not_specified|male|female|fair|medium|dark|ready|maintenance|busy|pending|approved|rejected|no_allergies_recorded|no_medications_recorded)['\"]/", $content, $matches);
                foreach ($matches[1] as $status) {
                    if (!in_array($status, $foundKeys)) {
                        $foundKeys[] = $status;
                    }
                }
            }
        }

        if ($type === 'js') {
            // Match translation function calls
            preg_match_all("/\.t\(['\"]([^'\"]+)['\"]\)/", $content, $matches);
            foreach ($matches[1] as $key) {
                if (!empty($key) && !in_array($key, $foundKeys)) {
                    $foundKeys[] = $key;
                }
            }

            preg_match_all("/translations\[['\"]([^'\"]+)['\"]\]/", $content, $matches);
            foreach ($matches[1] as $key) {
                if (!empty($key) && !in_array($key, $foundKeys)) {
                    $foundKeys[] = $key;
                }
            }

            // Deep scan: Find literal strings in JSX/TSX
            if ($this->option('deep')) {
                // Find text content in JSX: >Text<
                preg_match_all('/>([A-Z][a-zA-Z\s]{3,})</', $content, $matches);
                foreach ($matches[1] as $literal) {
                    $literal = trim($literal);
                    // Skip if it's a translation call
                    if (strpos($literal, 't(') === false && 
                        strpos($literal, 'useTranslation') === false &&
                        strlen($literal) > 3 && 
                        !in_array($literal, $foundLiterals)) {
                        $foundLiterals[] = $literal;
                    }
                }

                // Find string literals in object properties
                preg_match_all("/(title|label|placeholder|description|text|name|value):\s*['\"]([A-Z][a-zA-Z\s]{5,})['\"]/", $content, $matches);
                foreach ($matches[2] as $literal) {
                    $literal = trim($literal);
                    if (strlen($literal) > 5 && !in_array($literal, $foundLiterals)) {
                        $foundLiterals[] = $literal;
                    }
                }

                // Find breadcrumb titles, page titles
                preg_match_all("/(title|label):\s*['\"]([A-Z][a-zA-Z\s]{3,})['\"]/", $content, $matches);
                foreach ($matches[2] as $literal) {
                    $literal = trim($literal);
                    if (strlen($literal) > 3 && !in_array($literal, $foundLiterals)) {
                        $foundLiterals[] = $literal;
                    }
                }
            }
        }
    }

    private function literalToKey($literal)
    {
        // Convert "View user information and activity" to "view_user_information_and_activity"
        $key = strtolower($literal);
        $key = preg_replace('/[^a-z0-9\s]/', '', $key);
        $key = preg_replace('/\s+/', '_', trim($key));
        return $key;
    }

    private function generateReports($uniqueKeys, $missingInEn, $missingInAr, $projectRoot, $foundLiterals = [])
    {
        // JSON Report
        $jsonReport = [
            'scan_date' => date('Y-m-d H:i:s'),
            'total_keys_found' => count($uniqueKeys),
            'missing_in_en_count' => count($missingInEn),
            'missing_in_ar_count' => count($missingInAr),
            'missing_in_en' => array_values($missingInEn),
            'missing_in_ar' => array_values($missingInAr),
            'all_keys' => $uniqueKeys,
            'literal_strings_found' => array_unique($foundLiterals),
        ];

        file_put_contents(
            "$projectRoot/translations-report.json",
            json_encode($jsonReport, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );

        // CSV Report
        $csv = fopen("$projectRoot/translations-report.csv", 'w');
        fputcsv($csv, ['key', 'missing_in_en', 'missing_in_ar', 'source']);

        foreach ($uniqueKeys as $key) {
            $source = in_array($key, array_map([$this, 'literalToKey'], $foundLiterals)) ? 'literal' : 'translation_call';
            fputcsv($csv, [
                $key,
                in_array($key, $missingInEn) ? 'yes' : 'no',
                in_array($key, $missingInAr) ? 'yes' : 'no',
                $source,
            ]);
        }
        fclose($csv);

        $this->info('📄 Reports generated:');
        $this->info('   - translations-report.json');
        $this->info('   - translations-report.csv');
    }

    private function updateLanguageFiles($missingInEn, $missingInAr, $enFile, $arFile, $existingEn, $existingAr, $foundLiterals = [])
    {
        // Read original file content to preserve structure
        $enContent = file_get_contents($enFile);
        $arContent = file_get_contents($arFile);

        // Append to English file
        if (!empty($missingInEn)) {
            $lastBracketPos = strrpos($enContent, '];');
            if ($lastBracketPos !== false) {
                $before = substr($enContent, 0, $lastBracketPos);
                $newKeysSection = "\n    // Auto-added missing keys - " . date('Y-m-d H:i:s') . "\n";
                foreach ($missingInEn as $key) {
                    // Try to find original literal if it came from a literal string
                    $value = $this->findOriginalLiteral($key, $foundLiterals) ?? $this->generateEnglishValue($key);
                    $escapedValue = addslashes($value);
                    $newKeysSection .= "    '{$key}' => '{$escapedValue}',\n";
                }
                $newContent = $before . $newKeysSection . "];\n";
                file_put_contents($enFile, $newContent);
                $this->info("   Added " . count($missingInEn) . " keys to English file");
            }
        }

        // Append to Arabic file
        if (!empty($missingInAr)) {
            $lastBracketPos = strrpos($arContent, '];');
            if ($lastBracketPos !== false) {
                $before = substr($arContent, 0, $lastBracketPos);
                $newKeysSection = "\n    // Auto-added missing keys - " . date('Y-m-d H:i:s') . "\n";
                foreach ($missingInAr as $key) {
                    $newKeysSection .= "    '{$key}' => '',\n";
                }
                $newContent = $before . $newKeysSection . "];\n";
                file_put_contents($arFile, $newContent);
                $this->info("   Added " . count($missingInAr) . " keys to Arabic file (empty for translation)");
            }
        }
    }

    private function findOriginalLiteral($key, $foundLiterals)
    {
        foreach ($foundLiterals as $literal) {
            if ($this->literalToKey($literal) === $key) {
                return $literal;
            }
        }
        return null;
    }

    private function generateEnglishValue($key)
    {
        // Convert snake_case to Title Case
        $words = explode('_', $key);
        $titleCase = implode(' ', array_map('ucfirst', $words));

        // For common patterns, provide better defaults
        if (str_ends_with($key, '_required')) {
            $field = str_replace('_required', '', $key);
            return ucfirst(str_replace('_', ' ', $field)) . ' is required';
        }

        if (str_ends_with($key, '_not_found')) {
            $field = str_replace('_not_found', '', $key);
            return ucfirst(str_replace('_', ' ', $field)) . ' not found';
        }

        if (str_ends_with($key, '_successfully')) {
            $action = str_replace('_successfully', '', $key);
            return ucfirst(str_replace('_', ' ', $action)) . ' successfully';
        }

        // Handle namespace keys (e.g., api.payment.*)
        if (strpos($key, '.') !== false) {
            $parts = explode('.', $key);
            return implode(' ', array_map('ucfirst', $parts));
        }

        // Default: return human-readable version
        return $titleCase;
    }
}
