ALTER TABLE `playlists` ADD `showLyricsOnShare` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `playlists` ADD `allowRiffsOnShare` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `showLyricsOnShare` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `allowRiffsOnShare` boolean DEFAULT true NOT NULL;