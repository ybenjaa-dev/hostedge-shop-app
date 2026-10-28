CREATE TABLE `product_links` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`linked_id` text NOT NULL,
	`kind` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_links_uniq_idx` ON `product_links` (`product_id`,`linked_id`,`kind`);--> statement-breakpoint
CREATE INDEX `product_links_product_idx` ON `product_links` (`product_id`,`kind`);--> statement-breakpoint
CREATE TABLE `tracking_events` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`platform` text NOT NULL,
	`event` text NOT NULL,
	`event_id` text NOT NULL,
	`status` text NOT NULL,
	`http_status` integer,
	`response` text,
	`attempts` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tracking_events_order_idx` ON `tracking_events` (`order_id`);--> statement-breakpoint
CREATE INDEX `tracking_events_created_idx` ON `tracking_events` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `tracking_events_uniq_idx` ON `tracking_events` (`platform`,`event_id`,`event`);--> statement-breakpoint
ALTER TABLE `order_items` ADD `addon` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking` text;