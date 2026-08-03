# Installation Guide

## Prerequisites

- PHP 8.2+
- Composer 2.x
- Node.js 20+ and npm
- SQLite (development) or MySQL (production)
- Pusher account (for real-time notifications)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/JosepTibs/Project-Management-System.git
cd Project-Management-System
```

### 2. Install PHP Dependencies

```bash
composer install
```

### 3. Install JavaScript Dependencies

```bash
npm install
```

### 4. Environment Configuration

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and configure the following:

**Database (SQLite for development):**
```
DB_CONNECTION=sqlite
# SQLite database file: database/database.sqlite
```

**Database (MySQL for production):**
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=project_management
DB_USERNAME=root
DB_PASSWORD=
```

**Broadcasting (Pusher for real-time):**
```
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=your-app-id
PUSHER_APP_KEY=your-app-key
PUSHER_APP_SECRET=your-app-secret
PUSHER_APP_CLUSTER=your-cluster
```

### 5. Create SQLite Database (if using SQLite)

```bash
touch database/database.sqlite
```

### 6. Run Migrations

```bash
php artisan migrate
```

### 7. (Optional) Seed the Database

```bash
php artisan db:seed
```

### 8. Start the Development Server

Run all services concurrently:

```bash
composer run dev
```

This starts:
- **Laravel development server** on `http://localhost:8000`
- **Queue worker** for processing jobs/notifications
- **Vite dev server** for hot-reloading frontend assets

Alternatively, run them individually:

```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Queue worker (required for notifications)
php artisan queue:listen --tries=1

# Terminal 3: Vite dev server
npm run dev
```

### 9. Access the Application

Open `http://localhost:8000` in your browser.

## Troubleshooting

### Vite manifest error
If you see `Unable to locate file in Vite manifest`, run:
```bash
npm run build
```

### Queue not processing
Ensure the queue worker is running:
```bash
php artisan queue:listen --tries=1
```

### Broadcasting not working
- Verify Pusher credentials in `.env`
- Ensure the queue worker is running (broadcasts are queued)
- Check browser console for Echo connection errors

### Storage link
If file uploads are not working:
```bash
php artisan storage:link