ALTER TABLE `abandoned_orders` ADD `status` text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `note` text;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `contacted_at` integer;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `contacted_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `converted_order_id` text;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `address` text;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `lines` text;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `subtotal` integer;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `total` integer;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `currency` text;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `coupon` text;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `lang` text;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `source` text;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `device` text;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `extra` text;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `saves` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `abandoned_orders` ADD `last_seen_at` integer;--> statement-breakpoint
CREATE INDEX `abandoned_status_idx` ON `abandoned_orders` (`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `abandoned_phone_idx` ON `abandoned_orders` (`phone`);--> statement-breakpoint
UPDATE `abandoned_orders` SET `status` = 'converted' WHERE `recovered` = 1 AND `status` = 'new';--> statement-breakpoint
UPDATE `abandoned_orders` SET `last_seen_at` = `updated_at` WHERE `last_seen_at` IS NULL;