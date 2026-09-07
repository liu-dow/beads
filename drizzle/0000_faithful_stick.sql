CREATE TABLE `designs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`data` text NOT NULL,
	`bead_count` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_designs_updated_at` ON `designs` (`updated_at`);--> statement-breakpoint
CREATE TABLE `exports` (
	`id` text PRIMARY KEY NOT NULL,
	`design_id` text,
	`format` text NOT NULL,
	`created_at` text NOT NULL
);
