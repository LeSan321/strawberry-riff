CREATE TABLE `music_generation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`generationId` int NOT NULL,
	`operation` enum('generate','retake','extend') NOT NULL DEFAULT 'generate',
	`audioUrl` text,
	`audioKey` text,
	`aceStepTaskId` varchar(100),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `music_generation_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `music_generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`prompt` text NOT NULL,
	`lyrics` text NOT NULL,
	`duration` int NOT NULL,
	`audioUrl` text NOT NULL,
	`audioKey` text NOT NULL,
	`status` enum('generating','complete','failed') NOT NULL DEFAULT 'generating',
	`aceStepTaskId` varchar(100),
	`metadata` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `music_generations_id` PRIMARY KEY(`id`)
);
