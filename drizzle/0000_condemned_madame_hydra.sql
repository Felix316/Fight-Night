CREATE TABLE `nights` (
	`id` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`guest` text NOT NULL,
	`status` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_username_unique` ON `players` (`username`);