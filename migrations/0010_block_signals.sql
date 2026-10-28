CREATE TABLE `blocked_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL,
	`visitor_id` text,
	`reason` text,
	`created_at` integer NOT NULL,
	`last_hit_at` integer,
	`hits` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blocked_signals_kind_value_idx` ON `blocked_signals` (`kind`,`value`);--> statement-breakpoint
CREATE INDEX `blocked_signals_visitor_idx` ON `blocked_signals` (`visitor_id`);