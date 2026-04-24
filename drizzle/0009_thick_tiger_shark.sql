ALTER TABLE `music_generations` ADD `voiceReferenceUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `studioTheme` varchar(64) DEFAULT 'forest-studio' NOT NULL;