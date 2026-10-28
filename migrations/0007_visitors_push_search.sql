CREATE TABLE `blocked_fingerprints` (
	`fp` text PRIMARY KEY NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `push_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`url` text,
	`image` text,
	`audience` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'sending' NOT NULL,
	`targeted` integer DEFAULT 0 NOT NULL,
	`delivered` integer DEFAULT 0 NOT NULL,
	`failed` integer DEFAULT 0 NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `push_messages_created_idx` ON `push_messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`visitor_id` text,
	`lang` text,
	`country` text,
	`city` text,
	`ua` text,
	`created_at` integer NOT NULL,
	`last_sent_at` integer,
	`last_msg` text,
	`failures` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_endpoint_idx` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_visitor_idx` ON `push_subscriptions` (`visitor_id`);--> statement-breakpoint
CREATE TABLE `visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`fp` text,
	`first_seen` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`visits` integer DEFAULT 1 NOT NULL,
	`page_views` integer DEFAULT 1 NOT NULL,
	`ip` text,
	`country` text,
	`region` text,
	`city` text,
	`timezone` text,
	`latitude` text,
	`longitude` text,
	`network` text,
	`ua` text,
	`browser` text,
	`os` text,
	`device` text,
	`screen` text,
	`lang` text,
	`referrer` text,
	`landing` text,
	`utm` text,
	`phone` text,
	`orders` integer DEFAULT 0 NOT NULL,
	`push` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visitors_fp_idx` ON `visitors` (`fp`);--> statement-breakpoint
CREATE INDEX `visitors_last_idx` ON `visitors` (`last_seen`);--> statement-breakpoint
CREATE INDEX `visitors_country_idx` ON `visitors` (`country`);--> statement-breakpoint
CREATE INDEX `visitors_phone_idx` ON `visitors` (`phone`);--> statement-breakpoint
ALTER TABLE `orders` ADD `visitor_id` text;--> statement-breakpoint
ALTER TABLE `products` ADD `search_text` text;