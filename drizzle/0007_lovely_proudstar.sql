CREATE TABLE `lyrics_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL DEFAULT 'Untitled',
	`fusion` varchar(200),
	`mood` varchar(200),
	`topic` varchar(500),
	`perspective` varchar(100),
	`hookSeed` varchar(500),
	`structure` varchar(200),
	`writingTeam` varchar(100),
	`generatedLyrics` text,
	`stickinessAnalysis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lyrics_drafts_id` PRIMARY KEY(`id`)
);
