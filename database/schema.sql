-- ============================================================
-- event-veranstaltungen.de – MariaDB Datenbankschema
-- Erstellt für: MariaDB 10.6+
-- Zeichensatz: utf8mb4
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Datenbank erstellen
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `event_veranstaltungen`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `event_veranstaltungen`;

-- ------------------------------------------------------------
-- Tabelle: users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`              VARCHAR(255) NOT NULL,
  `email`             VARCHAR(255) NOT NULL,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password`          VARCHAR(255) NOT NULL,
  `role`              VARCHAR(50) NOT NULL DEFAULT 'user'
                      COMMENT 'admin | organizer | user',
  `phone`             VARCHAR(50) NULL DEFAULT NULL,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `remember_token`    VARCHAR(100) NULL DEFAULT NULL,
  `created_at`        TIMESTAMP NULL DEFAULT NULL,
  `updated_at`        TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabelle: password_reset_tokens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email`      VARCHAR(255) NOT NULL,
  `token`      VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabelle: sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`            VARCHAR(255) NOT NULL,
  `user_id`       BIGINT UNSIGNED NULL DEFAULT NULL,
  `ip_address`    VARCHAR(45) NULL DEFAULT NULL,
  `user_agent`    TEXT NULL DEFAULT NULL,
  `payload`       LONGTEXT NOT NULL,
  `last_activity` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabelle: categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(255) NOT NULL,
  `slug`        VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `icon`        VARCHAR(100) NULL DEFAULT NULL,
  `color`       VARCHAR(20) NULL DEFAULT NULL,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order`  INT NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP NULL DEFAULT NULL,
  `updated_at`  TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`),
  UNIQUE KEY `categories_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabelle: events
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`             VARCHAR(255) NOT NULL,
  `slug`              VARCHAR(255) NOT NULL,
  `description`       TEXT NOT NULL,
  `short_description` VARCHAR(500) NULL DEFAULT NULL,
  `category_id`       BIGINT UNSIGNED NOT NULL,
  `organizer_id`      BIGINT UNSIGNED NOT NULL,
  `start_date`        DATETIME NOT NULL,
  `end_date`          DATETIME NOT NULL,
  `location`          VARCHAR(255) NOT NULL,
  `address`           VARCHAR(255) NULL DEFAULT NULL,
  `city`              VARCHAR(100) NOT NULL,
  `zip_code`          VARCHAR(20) NULL DEFAULT NULL,
  `country`           VARCHAR(10) NOT NULL DEFAULT 'DE',
  `latitude`          DECIMAL(10, 7) NULL DEFAULT NULL,
  `longitude`         DECIMAL(10, 7) NULL DEFAULT NULL,
  `image`             VARCHAR(255) NULL DEFAULT NULL,
  `status`            VARCHAR(50) NOT NULL DEFAULT 'draft'
                      COMMENT 'draft | published | cancelled | completed | sold_out',
  `is_featured`       TINYINT(1) NOT NULL DEFAULT 0,
  `max_attendees`     INT NULL DEFAULT NULL,
  `current_attendees` INT NOT NULL DEFAULT 0,
  `deleted_at`        TIMESTAMP NULL DEFAULT NULL,
  `created_at`        TIMESTAMP NULL DEFAULT NULL,
  `updated_at`        TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `events_slug_unique` (`slug`),
  KEY `events_category_id_foreign` (`category_id`),
  KEY `events_organizer_id_foreign` (`organizer_id`),
  KEY `events_status_index` (`status`),
  KEY `events_start_date_index` (`start_date`),
  CONSTRAINT `events_category_id_foreign`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `events_organizer_id_foreign`
    FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabelle: tickets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tickets` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id`      BIGINT UNSIGNED NOT NULL,
  `name`          VARCHAR(255) NOT NULL,
  `description`   TEXT NULL DEFAULT NULL,
  `price`         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `quantity`      INT NOT NULL,
  `quantity_sold` INT NOT NULL DEFAULT 0,
  `sale_start`    DATETIME NULL DEFAULT NULL,
  `sale_end`      DATETIME NULL DEFAULT NULL,
  `type`          VARCHAR(50) NOT NULL DEFAULT 'standard'
                  COMMENT 'standard | vip | free | early_bird',
  `is_active`     TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP NULL DEFAULT NULL,
  `updated_at`    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tickets_event_id_foreign` (`event_id`),
  CONSTRAINT `tickets_event_id_foreign`
    FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabelle: orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`        BIGINT UNSIGNED NULL DEFAULT NULL,
  `event_id`       BIGINT UNSIGNED NOT NULL,
  `order_number`   VARCHAR(255) NOT NULL,
  `status`         VARCHAR(50) NOT NULL DEFAULT 'pending'
                   COMMENT 'pending | confirmed | cancelled | refunded',
  `total_amount`   DECIMAL(10, 2) NOT NULL,
  `first_name`     VARCHAR(255) NOT NULL,
  `last_name`      VARCHAR(255) NOT NULL,
  `email`          VARCHAR(255) NOT NULL,
  `phone`          VARCHAR(50) NULL DEFAULT NULL,
  `notes`          TEXT NULL DEFAULT NULL,
  `payment_method` VARCHAR(100) NOT NULL DEFAULT 'online',
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending'
                   COMMENT 'pending | paid | failed | refunded',
  `paid_at`        TIMESTAMP NULL DEFAULT NULL,
  `created_at`     TIMESTAMP NULL DEFAULT NULL,
  `updated_at`     TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number_unique` (`order_number`),
  KEY `orders_user_id_foreign` (`user_id`),
  KEY `orders_event_id_foreign` (`event_id`),
  KEY `orders_status_index` (`status`),
  KEY `orders_payment_status_index` (`payment_status`),
  CONSTRAINT `orders_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `orders_event_id_foreign`
    FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabelle: order_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`       BIGINT UNSIGNED NOT NULL,
  `ticket_id`      BIGINT UNSIGNED NOT NULL,
  `quantity`       INT NOT NULL,
  `unit_price`     DECIMAL(10, 2) NOT NULL,
  `subtotal`       DECIMAL(10, 2) NOT NULL,
  `attendee_name`  VARCHAR(255) NULL DEFAULT NULL,
  `attendee_email` VARCHAR(255) NULL DEFAULT NULL,
  `created_at`     TIMESTAMP NULL DEFAULT NULL,
  `updated_at`     TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_foreign` (`order_id`),
  KEY `order_items_ticket_id_foreign` (`ticket_id`),
  CONSTRAINT `order_items_order_id_foreign`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `order_items_ticket_id_foreign`
    FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Laravel migrations tracking table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `migrations` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `batch`     INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Beispieldaten / Seed Data
-- ============================================================

-- Admin-Benutzer (Passwort: Admin1234!)
-- Das Passwort ist mit bcrypt gehasht. Bitte nach dem Import ändern!
INSERT INTO `users` (`name`, `email`, `password`, `role`, `is_active`, `created_at`, `updated_at`)
VALUES (
  'Administrator',
  'admin@event-veranstaltungen.de',
  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  1,
  NOW(),
  NOW()
);

-- Startkategorien
INSERT INTO `categories` (`name`, `slug`, `description`, `icon`, `color`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
('Musik & Konzerte',     'musik-konzerte',    'Konzerte, Festivals und Musikevents',     'music',      '#7950f2', 1, 1, NOW(), NOW()),
('Sport & Fitness',      'sport-fitness',     'Sportveranstaltungen und Wettkämpfe',     'trophy',     '#2f9e44', 1, 2, NOW(), NOW()),
('Kultur & Kunst',       'kultur-kunst',      'Ausstellungen, Theater und Kulturevents', 'palette',    '#e67700', 1, 3, NOW(), NOW()),
('Business & Networking','business-networking','Konferenzen, Messen und Networking',      'briefcase',  '#1971c2', 1, 4, NOW(), NOW()),
('Essen & Trinken',      'essen-trinken',     'Foodfestivals, Weinproben und Märkte',    'chef-hat',   '#c2255c', 1, 5, NOW(), NOW()),
('Familie & Kinder',     'familie-kinder',    'Familienfreundliche Veranstaltungen',     'heart',      '#f08c00', 1, 6, NOW(), NOW()),
('Bildung & Workshops',  'bildung-workshops', 'Seminare, Kurse und Workshops',           'school',     '#0c8599', 1, 7, NOW(), NOW()),
('Sonstiges',            'sonstiges',         'Weitere Veranstaltungen',                 'calendar',   '#868e96', 1, 8, NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
