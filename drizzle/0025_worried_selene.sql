ALTER TABLE `users` ADD `isPlatinum` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `platinumSince` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionTier` enum('free','premium','platinum') DEFAULT 'free' NOT NULL;