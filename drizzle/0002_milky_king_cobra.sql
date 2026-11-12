CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
DELETE FROM payments WHERE order_id IN ('20d93f58-2f27-483e-a431-464779337e7c', 'cd0a4ea8-8e54-460d-81ed-4171b2de3d19', 'f3c7c8fb-2c9a-42a7-ba04-37aaaea6d631');
--> statement-breakpoint
DELETE FROM orders WHERE id IN ('20d93f58-2f27-483e-a431-464779337e7c', 'cd0a4ea8-8e54-460d-81ed-4171b2de3d19', 'f3c7c8fb-2c9a-42a7-ba04-37aaaea6d631');
