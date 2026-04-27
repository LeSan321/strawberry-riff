CREATE TABLE `playlist_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlistId` int NOT NULL,
	`ownerId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastViewedAt` timestamp,
	CONSTRAINT `playlist_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `playlist_shares_token_unique` UNIQUE(`token`)
);
