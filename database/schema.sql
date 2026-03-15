-- ============================================================
-- event-veranstaltungen.de – MariaDB Schema
-- Kompatibel mit MariaDB 10.6+
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS `event_veranstaltungen`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `event_veranstaltungen`;

-- -------------------------------------------------------
-- Tabelle: users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`              VARCHAR(255)    NOT NULL,
    `email`             VARCHAR(255)    NOT NULL,
    `email_verified_at` TIMESTAMP       NULL DEFAULT NULL,
    `password`          VARCHAR(255)    NOT NULL,
    `role`              ENUM('admin','organizer','staff','attendee') NOT NULL DEFAULT 'attendee',
    `avatar`            VARCHAR(500)    NULL,
    `phone`             VARCHAR(50)     NULL,
    `locale`            VARCHAR(10)     NOT NULL DEFAULT 'de',
    `timezone`          VARCHAR(50)     NOT NULL DEFAULT 'Europe/Berlin',
    `remember_token`    VARCHAR(100)    NULL,
    `created_at`        TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`        TIMESTAMP       NULL DEFAULT NULL,
    `deleted_at`        TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_email_unique` (`email`),
    INDEX `users_role_index` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: personal_access_tokens (Laravel Sanctum)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
    `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tokenable_type` VARCHAR(255)    NOT NULL,
    `tokenable_id`   BIGINT UNSIGNED NOT NULL,
    `name`           VARCHAR(255)    NOT NULL,
    `token`          VARCHAR(64)     NOT NULL,
    `abilities`      TEXT            NULL,
    `last_used_at`   TIMESTAMP       NULL DEFAULT NULL,
    `expires_at`     TIMESTAMP       NULL DEFAULT NULL,
    `created_at`     TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`     TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
    INDEX `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: password_reset_tokens
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `email`      VARCHAR(255) NOT NULL,
    `token`      VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP    NULL DEFAULT NULL,
    PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: organizers
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `organizers` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`     BIGINT UNSIGNED NOT NULL,
    `name`        VARCHAR(255)    NOT NULL,
    `slug`        VARCHAR(255)    NOT NULL,
    `description` TEXT            NULL,
    `email`       VARCHAR(255)    NULL,
    `phone`       VARCHAR(50)     NULL,
    `website`     VARCHAR(500)    NULL,
    `logo`        VARCHAR(500)    NULL,
    `banner`      VARCHAR(500)    NULL,
    `address`     VARCHAR(500)    NULL,
    `city`        VARCHAR(255)    NULL,
    `state`       VARCHAR(255)    NULL,
    `zip`         VARCHAR(20)     NULL,
    `country`     VARCHAR(3)      NOT NULL DEFAULT 'DE',
    `currency`    VARCHAR(3)      NOT NULL DEFAULT 'EUR',
    `is_active`   TINYINT(1)      NOT NULL DEFAULT 1,
    `created_at`  TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`  TIMESTAMP       NULL DEFAULT NULL,
    `deleted_at`  TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `organizers_slug_unique` (`slug`),
    CONSTRAINT `organizers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: organizer_users (Pivot: Mitarbeiter eines Veranstalters)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `organizer_users` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organizer_id`  BIGINT UNSIGNED NOT NULL,
    `user_id`       BIGINT UNSIGNED NOT NULL,
    `role`          ENUM('owner','admin','staff') NOT NULL DEFAULT 'staff',
    `created_at`    TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`    TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `organizer_users_organizer_user_unique` (`organizer_id`, `user_id`),
    CONSTRAINT `organizer_users_organizer_id_foreign` FOREIGN KEY (`organizer_id`) REFERENCES `organizers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `organizer_users_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: venues
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `venues` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organizer_id` BIGINT UNSIGNED NOT NULL,
    `name`         VARCHAR(255)    NOT NULL,
    `description`  TEXT            NULL,
    `address`      VARCHAR(500)    NOT NULL,
    `city`         VARCHAR(255)    NOT NULL,
    `state`        VARCHAR(255)    NULL,
    `zip`          VARCHAR(20)     NULL,
    `country`      VARCHAR(3)      NOT NULL DEFAULT 'DE',
    `latitude`     DECIMAL(10,8)   NULL,
    `longitude`    DECIMAL(11,8)   NULL,
    `capacity`     INT UNSIGNED    NULL,
    `website`      VARCHAR(500)    NULL,
    `phone`        VARCHAR(50)     NULL,
    `email`        VARCHAR(255)    NULL,
    `image`        VARCHAR(500)    NULL,
    `is_online`    TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`   TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`   TIMESTAMP       NULL DEFAULT NULL,
    `deleted_at`   TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `venues_organizer_id_foreign` FOREIGN KEY (`organizer_id`) REFERENCES `organizers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: event_categories
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_categories` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(255)    NOT NULL,
    `slug`       VARCHAR(255)    NOT NULL,
    `icon`       VARCHAR(100)    NULL,
    `color`      VARCHAR(20)     NULL,
    `sort_order` INT UNSIGNED    NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP       NULL DEFAULT NULL,
    `updated_at` TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `event_categories_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: events
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organizer_id`    BIGINT UNSIGNED NOT NULL,
    `venue_id`        BIGINT UNSIGNED NULL,
    `category_id`     BIGINT UNSIGNED NULL,
    `title`           VARCHAR(500)    NOT NULL,
    `slug`            VARCHAR(500)    NOT NULL,
    `description`     LONGTEXT        NULL,
    `short_description` VARCHAR(1000) NULL,
    `start_date`      DATETIME        NOT NULL,
    `end_date`        DATETIME        NULL,
    `timezone`        VARCHAR(50)     NOT NULL DEFAULT 'Europe/Berlin',
    `status`          ENUM('draft','published','cancelled','completed','archived') NOT NULL DEFAULT 'draft',
    `visibility`      ENUM('public','private','unlisted') NOT NULL DEFAULT 'public',
    `cover_image`     VARCHAR(500)    NULL,
    `banner_image`    VARCHAR(500)    NULL,
    `max_attendees`   INT UNSIGNED    NULL,
    `is_online`       TINYINT(1)      NOT NULL DEFAULT 0,
    `online_url`      VARCHAR(500)    NULL,
    `website`         VARCHAR(500)    NULL,
    `tags`            JSON            NULL,
    `meta`            JSON            NULL,
    `currency`        VARCHAR(3)      NOT NULL DEFAULT 'EUR',
    `is_featured`     TINYINT(1)      NOT NULL DEFAULT 0,
    `views_count`     INT UNSIGNED    NOT NULL DEFAULT 0,
    `created_at`      TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP       NULL DEFAULT NULL,
    `deleted_at`      TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `events_slug_unique` (`slug`),
    INDEX `events_organizer_id_index` (`organizer_id`),
    INDEX `events_status_index` (`status`),
    INDEX `events_start_date_index` (`start_date`),
    CONSTRAINT `events_organizer_id_foreign` FOREIGN KEY (`organizer_id`) REFERENCES `organizers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `events_venue_id_foreign` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE SET NULL,
    CONSTRAINT `events_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `event_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: event_images
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_images` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id`   BIGINT UNSIGNED NOT NULL,
    `url`        VARCHAR(500)    NOT NULL,
    `caption`    VARCHAR(500)    NULL,
    `sort_order` INT UNSIGNED    NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP       NULL DEFAULT NULL,
    `updated_at` TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `event_images_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: ticket_types
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ticket_types` (
    `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id`            BIGINT UNSIGNED NOT NULL,
    `name`                VARCHAR(255)    NOT NULL,
    `description`         TEXT            NULL,
    `price`               DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    `quantity`            INT UNSIGNED    NULL,
    `min_per_order`       INT UNSIGNED    NOT NULL DEFAULT 1,
    `max_per_order`       INT UNSIGNED    NULL,
    `sale_start_date`     DATETIME        NULL,
    `sale_end_date`       DATETIME        NULL,
    `status`              ENUM('active','inactive','sold_out') NOT NULL DEFAULT 'active',
    `type`                ENUM('paid','free','donation') NOT NULL DEFAULT 'paid',
    `is_hidden`           TINYINT(1)      NOT NULL DEFAULT 0,
    `sort_order`          INT UNSIGNED    NOT NULL DEFAULT 0,
    `tax_rate`            DECIMAL(5,2)    NOT NULL DEFAULT 19.00,
    `created_at`          TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`          TIMESTAMP       NULL DEFAULT NULL,
    `deleted_at`          TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `ticket_types_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: promo_codes
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `promo_codes` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id`        BIGINT UNSIGNED NOT NULL,
    `code`            VARCHAR(100)    NOT NULL,
    `discount_type`   ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
    `discount_value`  DECIMAL(10,2)   NOT NULL,
    `max_uses`        INT UNSIGNED    NULL,
    `uses_count`      INT UNSIGNED    NOT NULL DEFAULT 0,
    `valid_from`      DATETIME        NULL,
    `valid_until`     DATETIME        NULL,
    `is_active`       TINYINT(1)      NOT NULL DEFAULT 1,
    `created_at`      TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `promo_codes_event_code_unique` (`event_id`, `code`),
    CONSTRAINT `promo_codes_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: orders
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id`        BIGINT UNSIGNED NOT NULL,
    `user_id`         BIGINT UNSIGNED NULL,
    `promo_code_id`   BIGINT UNSIGNED NULL,
    `order_number`    VARCHAR(50)     NOT NULL,
    `status`          ENUM('pending','confirmed','cancelled','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
    `first_name`      VARCHAR(255)    NOT NULL,
    `last_name`       VARCHAR(255)    NOT NULL,
    `email`           VARCHAR(255)    NOT NULL,
    `phone`           VARCHAR(50)     NULL,
    `subtotal`        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    `discount`        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    `tax`             DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    `total`           DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    `currency`        VARCHAR(3)      NOT NULL DEFAULT 'EUR',
    `payment_method`  VARCHAR(50)     NULL,
    `payment_id`      VARCHAR(255)    NULL,
    `paid_at`         TIMESTAMP       NULL DEFAULT NULL,
    `notes`           TEXT            NULL,
    `ip_address`      VARCHAR(45)     NULL,
    `created_at`      TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP       NULL DEFAULT NULL,
    `deleted_at`      TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `orders_order_number_unique` (`order_number`),
    INDEX `orders_event_id_index` (`event_id`),
    INDEX `orders_email_index` (`email`),
    INDEX `orders_status_index` (`status`),
    CONSTRAINT `orders_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
    CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `orders_promo_code_id_foreign` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: order_items
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id`        BIGINT UNSIGNED NOT NULL,
    `ticket_type_id`  BIGINT UNSIGNED NOT NULL,
    `quantity`        INT UNSIGNED    NOT NULL DEFAULT 1,
    `unit_price`      DECIMAL(10,2)   NOT NULL,
    `discount`        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    `tax_rate`        DECIMAL(5,2)    NOT NULL DEFAULT 19.00,
    `total`           DECIMAL(10,2)   NOT NULL,
    `created_at`      TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `order_items_ticket_type_id_foreign` FOREIGN KEY (`ticket_type_id`) REFERENCES `ticket_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: attendees
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendees` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id`        BIGINT UNSIGNED NOT NULL,
    `order_id`        BIGINT UNSIGNED NOT NULL,
    `order_item_id`   BIGINT UNSIGNED NOT NULL,
    `ticket_type_id`  BIGINT UNSIGNED NOT NULL,
    `first_name`      VARCHAR(255)    NOT NULL,
    `last_name`       VARCHAR(255)    NOT NULL,
    `email`           VARCHAR(255)    NOT NULL,
    `phone`           VARCHAR(50)     NULL,
    `ticket_number`   VARCHAR(100)    NOT NULL,
    `qr_code`         VARCHAR(500)    NULL,
    `status`          ENUM('active','cancelled','checked_in') NOT NULL DEFAULT 'active',
    `checked_in_at`   TIMESTAMP       NULL DEFAULT NULL,
    `checked_in_by`   BIGINT UNSIGNED NULL,
    `notes`           TEXT            NULL,
    `public_id`       VARCHAR(36)     NOT NULL,
    `created_at`      TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`      TIMESTAMP       NULL DEFAULT NULL,
    `deleted_at`      TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `attendees_ticket_number_unique` (`ticket_number`),
    UNIQUE KEY `attendees_public_id_unique` (`public_id`),
    INDEX `attendees_event_id_index` (`event_id`),
    INDEX `attendees_email_index` (`email`),
    CONSTRAINT `attendees_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
    CONSTRAINT `attendees_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `attendees_order_item_id_foreign` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
    CONSTRAINT `attendees_ticket_type_id_foreign` FOREIGN KEY (`ticket_type_id`) REFERENCES `ticket_types` (`id`) ON DELETE CASCADE,
    CONSTRAINT `attendees_checked_in_by_foreign` FOREIGN KEY (`checked_in_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: check_in_lists
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `check_in_lists` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id`     BIGINT UNSIGNED NOT NULL,
    `name`         VARCHAR(255)    NOT NULL,
    `description`  TEXT            NULL,
    `short_code`   VARCHAR(20)     NOT NULL,
    `is_active`    TINYINT(1)      NOT NULL DEFAULT 1,
    `created_at`   TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`   TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `check_in_lists_short_code_unique` (`short_code`),
    CONSTRAINT `check_in_lists_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: check_in_list_ticket_types (Pivot)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `check_in_list_ticket_types` (
    `check_in_list_id` BIGINT UNSIGNED NOT NULL,
    `ticket_type_id`   BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`check_in_list_id`, `ticket_type_id`),
    CONSTRAINT `cilt_check_in_list_id_foreign` FOREIGN KEY (`check_in_list_id`) REFERENCES `check_in_lists` (`id`) ON DELETE CASCADE,
    CONSTRAINT `cilt_ticket_type_id_foreign` FOREIGN KEY (`ticket_type_id`) REFERENCES `ticket_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: settings
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
    `id`    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `key`   VARCHAR(255)    NOT NULL,
    `value` LONGTEXT        NULL,
    `group` VARCHAR(100)    NOT NULL DEFAULT 'general',
    PRIMARY KEY (`id`),
    UNIQUE KEY `settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: activity_log
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_log` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `log_name`     VARCHAR(255)    NULL DEFAULT 'default',
    `description`  TEXT            NOT NULL,
    `subject_type` VARCHAR(255)    NULL,
    `subject_id`   BIGINT UNSIGNED NULL,
    `causer_type`  VARCHAR(255)    NULL,
    `causer_id`    BIGINT UNSIGNED NULL,
    `properties`   JSON            NULL,
    `created_at`   TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`   TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `activity_log_log_name_index` (`log_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: email_templates
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `email_templates` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id`    BIGINT UNSIGNED NULL,
    `type`        VARCHAR(100)    NOT NULL,
    `subject`     VARCHAR(500)    NOT NULL,
    `body`        LONGTEXT        NOT NULL,
    `is_active`   TINYINT(1)      NOT NULL DEFAULT 1,
    `created_at`  TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`  TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `email_templates_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: messages (Kommunikation mit Teilnehmern)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id`     BIGINT UNSIGNED NOT NULL,
    `user_id`      BIGINT UNSIGNED NOT NULL,
    `subject`      VARCHAR(500)    NOT NULL,
    `body`         LONGTEXT        NOT NULL,
    `type`         ENUM('email','sms','push') NOT NULL DEFAULT 'email',
    `status`       ENUM('draft','sent','failed') NOT NULL DEFAULT 'draft',
    `sent_at`      TIMESTAMP       NULL DEFAULT NULL,
    `recipient_filter` JSON        NULL,
    `recipients_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at`   TIMESTAMP       NULL DEFAULT NULL,
    `updated_at`   TIMESTAMP       NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `messages_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
    CONSTRAINT `messages_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: failed_jobs
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `failed_jobs` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid`       VARCHAR(255)    NOT NULL,
    `connection` TEXT            NOT NULL,
    `queue`      TEXT            NOT NULL,
    `payload`    LONGTEXT        NOT NULL,
    `exception`  LONGTEXT        NOT NULL,
    `failed_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: jobs (Queue)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `jobs` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `queue`        VARCHAR(255)    NOT NULL,
    `payload`      LONGTEXT        NOT NULL,
    `attempts`     TINYINT UNSIGNED NOT NULL,
    `reserved_at`  INT UNSIGNED    NULL,
    `available_at` INT UNSIGNED    NOT NULL,
    `created_at`   INT UNSIGNED    NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: cache
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cache` (
    `key`        VARCHAR(255) NOT NULL,
    `value`      MEDIUMTEXT   NOT NULL,
    `expiration` INT          NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Tabelle: cache_locks
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cache_locks` (
    `key`        VARCHAR(255) NOT NULL,
    `owner`      VARCHAR(255) NOT NULL,
    `expiration` INT          NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Standard-Seed-Daten
-- -------------------------------------------------------

INSERT IGNORE INTO `event_categories` (`name`, `slug`, `icon`, `color`, `sort_order`) VALUES
('Konzert',         'konzert',        'IconMicrophone2',  '#7c3aed', 1),
('Festival',        'festival',       'IconMusic',        '#db2777', 2),
('Theater',         'theater',        'IconMasksTheater', '#d97706', 3),
('Sport',           'sport',          'IconBall',         '#16a34a', 4),
('Ausstellung',     'ausstellung',    'IconPainting',     '#0891b2', 5),
('Konferenz',       'konferenz',      'IconPresentation', '#4f46e5', 6),
('Workshop',        'workshop',       'IconTools',        '#9333ea', 7),
('Networking',      'networking',     'IconUsersGroup',   '#0d9488', 8),
('Party',           'party',          'IconConfetti',     '#e11d48', 9),
('Sonstiges',       'sonstiges',      'IconCategory',     '#64748b', 10);

INSERT IGNORE INTO `settings` (`key`, `value`, `group`) VALUES
('site_name',            'event-veranstaltungen.de',         'general'),
('site_url',             'https://www.event-veranstaltungen.de', 'general'),
('site_description',     'Ihre Plattform für Events und Veranstaltungen in Deutschland', 'general'),
('default_currency',     'EUR',                              'general'),
('default_timezone',     'Europe/Berlin',                    'general'),
('default_locale',       'de',                               'general'),
('support_email',        'info@event-veranstaltungen.de',    'general'),
('tickets_per_page',     '50',                               'general'),
('mail_from_address',    'noreply@event-veranstaltungen.de', 'mail'),
('mail_from_name',       'event-veranstaltungen.de',         'mail');

-- Admin-Benutzer (Passwort: Admin1234! – bitte nach dem Import ändern)
INSERT IGNORE INTO `users` (`name`, `email`, `password`, `role`, `email_verified_at`, `locale`, `timezone`, `created_at`, `updated_at`) VALUES
('Administrator', 'admin@event-veranstaltungen.de',
 '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'admin', NOW(), 'de', 'Europe/Berlin', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
