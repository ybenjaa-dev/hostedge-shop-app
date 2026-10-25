ALTER TABLE `bundles` ADD `price` integer;--> statement-breakpoint
ALTER TABLE `bundles` ADD `label` text;--> statement-breakpoint
ALTER TABLE `bundles` ADD `popular` integer DEFAULT false NOT NULL;