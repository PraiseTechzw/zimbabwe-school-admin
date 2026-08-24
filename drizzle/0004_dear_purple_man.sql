CREATE TABLE `approved_school_charges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`amountMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`residencyType` enum('BOARDING','DAY_SCHOLAR','ALL') NOT NULL DEFAULT 'ALL',
	`chargeStatus` enum('DRAFT','SUBMITTED','APPROVED','RETIRED') NOT NULL DEFAULT 'DRAFT',
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approved_school_charges_id` PRIMARY KEY(`id`),
	CONSTRAINT `approved_school_charge_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `beam_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`financialAccountId` int,
	`academicYearId` int NOT NULL,
	`referenceNumber` varchar(120),
	`amountMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`assistanceStatus` enum('PENDING','APPROVED','DECLINED','EXPIRED') NOT NULL DEFAULT 'PENDING',
	`notes` text,
	`approvedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beam_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financial_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountNumber` varchar(60) NOT NULL,
	`learnerId` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financial_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `financial_account_number_unique` UNIQUE(`accountNumber`),
	CONSTRAINT `financial_account_learner_currency_unique` UNIQUE(`learnerId`,`currency`)
);
--> statement-breakpoint
CREATE TABLE `payment_reconciliations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentId` int NOT NULL,
	`externalReference` varchar(160),
	`reconciliationStatus` enum('UNMATCHED','MATCHED','EXCEPTION','REVERSED') NOT NULL DEFAULT 'UNMATCHED',
	`reconciledAt` timestamp,
	`reconciledByUserId` int,
	`exceptionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_reconciliations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paynow_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` varchar(120) NOT NULL,
	`integrationKeyEncrypted` text NOT NULL,
	`returnUrl` varchar(500) NOT NULL,
	`resultUrl` varchar(500) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`updatedByUserId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paynow_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scholarships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`financialAccountId` int,
	`name` varchar(160) NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`academicYearId` int NOT NULL,
	`assistanceStatus` enum('PENDING','APPROVED','DECLINED','EXPIRED') NOT NULL DEFAULT 'PENDING',
	`sponsor` varchar(160),
	`notes` text,
	`approvedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scholarships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `paymentMethod` enum('CASH','BANK_TRANSFER','ECOCASH','ZIPIT','INNBUCKS','PAYNOW','CARD','OTHER') NOT NULL;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD `residencyType` enum('BOARDING','DAY_SCHOLAR','ALL') DEFAULT 'ALL' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `financialAccountId` int;--> statement-breakpoint
ALTER TABLE `invoices` ADD `termId` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `financialAccountId` int;--> statement-breakpoint
ALTER TABLE `approved_school_charges` ADD CONSTRAINT `approved_school_charges_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approved_school_charges` ADD CONSTRAINT `approved_school_charges_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beam_records` ADD CONSTRAINT `beam_records_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beam_records` ADD CONSTRAINT `beam_records_financialAccountId_financial_accounts_id_fk` FOREIGN KEY (`financialAccountId`) REFERENCES `financial_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beam_records` ADD CONSTRAINT `beam_records_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beam_records` ADD CONSTRAINT `beam_records_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_accounts` ADD CONSTRAINT `financial_accounts_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_reconciliations` ADD CONSTRAINT `payment_reconciliations_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_reconciliations` ADD CONSTRAINT `payment_reconciliations_reconciledByUserId_users_id_fk` FOREIGN KEY (`reconciledByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paynow_settings` ADD CONSTRAINT `paynow_settings_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scholarships` ADD CONSTRAINT `scholarships_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scholarships` ADD CONSTRAINT `scholarships_financialAccountId_financial_accounts_id_fk` FOREIGN KEY (`financialAccountId`) REFERENCES `financial_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scholarships` ADD CONSTRAINT `scholarships_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scholarships` ADD CONSTRAINT `scholarships_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_financialAccountId_financial_accounts_id_fk` FOREIGN KEY (`financialAccountId`) REFERENCES `financial_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_termId_academic_terms_id_fk` FOREIGN KEY (`termId`) REFERENCES `academic_terms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_financialAccountId_financial_accounts_id_fk` FOREIGN KEY (`financialAccountId`) REFERENCES `financial_accounts`(`id`) ON DELETE no action ON UPDATE no action;