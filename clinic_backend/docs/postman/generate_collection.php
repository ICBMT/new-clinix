<?php
// Generate Postman Collection from routes
$collection = [
    'info' => [
        'name' => 'Clinic Management API - V1',
        'description' => 'Complete API collection for Clinic Management System - All endpoints from routes/api/v1.php',
        'schema' => 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        'version' => ['major' => 1, 'minor' => 0, 'patch' => 0]
    ],
    'variable' => [
        ['key' => 'base_url', 'value' => '{{base_url}}', 'type' => 'string'],
        ['key' => 'token', 'value' => '{{token}}', 'type' => 'string'],
        ['key' => 'security_token', 'value' => '{{security_token}}', 'type' => 'string']
    ],
    'event' => [
        [
            'listen' => 'prerequest',
            'script' => [
                'type' => 'text/javascript',
                'exec' => [
                    "// Auto-inject Authorization header if token exists",
                    "const token = pm.environment.get('token');",
                    "if (token) {",
                    "  pm.request.headers.upsert({",
                    "    key: 'Authorization',",
                    "    value: `Bearer \${token}`",
                    "  });",
                    "}",
                    "",
                    "// Auto-inject Accept-Language header",
                    "const language = pm.environment.get('language') || 'en';",
                    "pm.request.headers.upsert({",
                    "  key: 'Accept-Language',",
                    "  value: language",
                    "});",
                    "",
                    "// Auto-inject Accept header",
                    "pm.request.headers.upsert({",
                    "  key: 'Accept',",
                    "  value: 'application/json'",
                    "});"
                ]
            ]
        ],
        [
            'listen' => 'test',
            'script' => [
                'type' => 'text/javascript',
                'exec' => [
                    "// Auto-save tokens from response",
                    "try {",
                    "  const json = pm.response.json();",
                    "  ",
                    "  // Extract access token (multiple patterns)",
                    "  const accessToken = json?.data?.token?.token || ",
                    "                      json?.data?.token?.access_token || ",
                    "                      json?.data?.access_token || ",
                    "                      json?.access_token || ",
                    "                      json?.token;",
                    "  ",
                    "  if (accessToken) {",
                    "    pm.environment.set('token', accessToken);",
                    "    console.log('✅ Access token saved');",
                    "  }",
                    "  ",
                    "  // Extract security token",
                    "  const securityToken = json?.data?.security_token || json?.security_token;",
                    "  if (securityToken) {",
                    "    pm.environment.set('security_token', securityToken);",
                    "    console.log('✅ Security token saved');",
                    "  }",
                    "  ",
                    "  // Log response status",
                    "  if (json?.success) {",
                    "    console.log('✅ Request successful:', json?.message);",
                    "  } else {",
                    "    console.log('❌ Request failed:', json?.message);",
                    "  }",
                    "} catch (e) {",
                    "  // Silently fail if response is not JSON",
                    "}"
                ]
            ]
        ]
    ],
    'item' => []
];

echo json_encode($collection, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
