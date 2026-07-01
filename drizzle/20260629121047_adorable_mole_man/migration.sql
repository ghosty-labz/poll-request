CREATE TABLE `poll_options` (
	`id` text PRIMARY KEY,
	`poll_id` text NOT NULL,
	`text` text NOT NULL,
	`image_url` text,
	`display_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_poll_options_poll_id_polls_id_fk` FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `polls` (
	`id` text PRIMARY KEY,
	`public_id` text NOT NULL UNIQUE,
	`management_key` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY,
	`poll_id` text NOT NULL,
	`option_id` text NOT NULL,
	`voter_token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_votes_poll_id_polls_id_fk` FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_votes_option_id_poll_options_id_fk` FOREIGN KEY (`option_id`) REFERENCES `poll_options`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `votes_poll_voter_unq` ON `votes` (`poll_id`,`voter_token`);