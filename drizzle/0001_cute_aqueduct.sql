CREATE TABLE `making_progress` (
	`design_id` text NOT NULL,
	`signature` text NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`design_id`, `signature`)
);
