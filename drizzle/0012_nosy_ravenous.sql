CREATE TABLE `preview_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackId` int NOT NULL,
	`ownerId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`playsRemaining` int NOT NULL DEFAULT 3,
	`playsTotal` int NOT NULL DEFAULT 3,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastPlayedAt` timestamp,
	CONSTRAINT `preview_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `preview_links_token_unique` UNIQUE(`token`)
);
