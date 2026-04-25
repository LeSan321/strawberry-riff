CREATE TABLE `style_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`prompt` text NOT NULL,
	`sourceGenerationId` int,
	`sourceTitle` varchar(200),
	`notes` text,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `style_library_id` PRIMARY KEY(`id`)
);
