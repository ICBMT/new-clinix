# Clinix — Laravel application

Laravel 12 / PHP 8.2+, React + Inertia, Node.js 20.19+ (or 22.12+), Composer 2, and MySQL 8+. Use MySQL: some existing migrations contain MySQL-specific SQL despite `.env.example` defaulting to SQLite.

## Local setup

From the repository root:

```bash
cd clinic_backend
composer install
cp .env.example .env
php artisan key:generate
npm ci
```

Create an empty MySQL database, then edit `.env`:

```dotenv
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=clinix
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
```

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
composer run dev
```

Open `http://localhost:8000/login`. `composer run dev` runs Laravel, Vite, the queue listener, and logs. For a compiled frontend use `npm run build`; Laravel still needs a PHP server. Ensure `storage` and `bootstrap/cache` are writable.

### Existing admin seed

`DatabaseSeeder` already calls `PermissionSeeder`, which creates roles, permissions, and this **local-development** account:

- Email: `admin@example.com`
- Password: `password`

To run only that existing seed: `php artisan db:seed --class=PermissionSeeder`. It uses `firstOrCreate`, so it does not reset an existing admin's password; it **does resync system-role permissions**. Change the default password before exposing the application. Other default seeds provide settings, payment methods, locations/categories, booking reasons, skin/body types, subscription packages, banners, and FAQs—not clinic/staff demo accounts. Create a clinic owner/clinic and assign staff through the dashboard to use leave management.

## Staff leave CRUD added

**Clinics → Staff leave** (`/dashboard/staff-leaves`) includes a searchable, filtered, paginated list; create, view, edit, and confirmed delete screens; English/Arabic and RTL support.

- Full-day, clinic-specific leave: assigned staff member, type (annual/sick/unpaid/other), inclusive start/end dates, reason, and status (pending/approved/rejected/cancelled).
- Owners manage owned clinics; managers manage assigned clinics; super-admins manage all clinics. Each action also checks its `staff-leaves.*` permission. Managers with create/edit permission can set status directly; this is management CRUD, not a separate employee-request/approval workflow.
- Server validation checks clinic access, current staff assignment, dates, and overlapping pending/approved leave for the same staff member **within that clinic**. Historical dates are allowed. Rejected/cancelled records do not reserve dates.
- Added migration/model relationships, repository + contract/container binding, form request, controller/resource routes, role/sidebar integration, activity logging, translations, and feature tests. Existing booking availability is unchanged: bookings currently have no staff assignment to connect to leave.

### Apply to an existing installation

Back up the database first. From `clinic_backend`:

```bash
php artisan migrate
php artisan db:seed --class=StaffLeavePermissionSeeder
php artisan permission:cache-reset
npm ci
npm run build
```

The new seeder only adds leave permissions to existing `super-admin`, `clinic`, and `clinic_manager` roles; it does not reset their other permissions. Fresh installations receive these permissions through the normal `php artisan db:seed` command. Do not use `migrate:fresh` on an existing database.

### Tests

Use a **separate, disposable MySQL test database**, configured via `.env.testing` (including a test `APP_KEY`). The existing PHPUnit config defaults to SQLite, so explicitly override it for the existing MySQL migrations:

```bash
DB_CONNECTION=mysql DB_DATABASE=clinix_test php artisan test --filter=StaffLeaveTest
```

The feature tests use `RefreshDatabase` and cover CRUD, clinic isolation, permissions, staff assignment, date/overlap validation, filtering/pagination, activity logs, and repeatable permission seeding. Never point this command at your application database. PHP/Composer were not available in the implementation sandbox, so these tests must be run in a PHP-enabled environment.

## Optional integrations

Configure SMS/OTP, Firebase, MyFatoorah, and social-login settings in the existing Site Settings screens before using those features. Leave CRUD does not need them. See `CRONJOB_SETUP.md` for the scheduler; use `routes/console.php` as the source of truth for enabled tasks.
