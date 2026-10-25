CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`alt` text,
	`mime` text NOT NULL,
	`width` integer,
	`height` integer,
	`size` integer DEFAULT 0 NOT NULL,
	`hash` text,
	`source_hash` text,
	`variants` integer DEFAULT false NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_key_idx` ON `media` (`key`);--> statement-breakpoint
CREATE INDEX `media_hash_idx` ON `media` (`hash`);--> statement-breakpoint
CREATE INDEX `media_source_hash_idx` ON `media` (`source_hash`);--> statement-breakpoint
CREATE INDEX `media_created_idx` ON `media` (`created_at`);