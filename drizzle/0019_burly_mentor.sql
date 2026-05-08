CREATE TABLE `stem_splits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trackId` int NOT NULL,
	`jobId` varchar(128) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`vocalUrl` text,
	`drumsUrl` text,
	`bassUrl` text,
	`otherUrl` text,
	`pianoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `stem_splits_id` PRIMARY KEY(`id`),
	CONSTRAINT `stem_splits_jobId_unique` UNIQUE(`jobId`)
);
