CREATE TABLE `learner_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`subjectId` int,
	`title` varchar(180) NOT NULL,
	`description` text,
	`dueAt` timestamp,
	`portalAssignmentStatus` enum('ASSIGNED','SUBMITTED','GRADED','OVERDUE') NOT NULL DEFAULT 'ASSIGNED',
	`documentUrl` varchar(800),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learner_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learner_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`category` varchar(80) NOT NULL,
	`documentUrl` varchar(800) NOT NULL,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learner_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learner_report_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`academicYearId` int NOT NULL,
	`termId` int NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'PUBLISHED',
	`summary` text,
	`documentUrl` varchar(800),
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learner_report_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learner_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`academicYearId` int NOT NULL,
	`termId` int NOT NULL,
	`subjectId` int,
	`subjectName` varchar(140) NOT NULL,
	`marks` int,
	`grade` varchar(20),
	`remarks` varchar(500),
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learner_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sbp_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`academicYearId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'RECORDED',
	`score` int,
	`remarks` text,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sbp_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `school_notices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`noticeAudience` enum('ALL','LEARNERS','GUARDIANS','STAFF') NOT NULL DEFAULT 'ALL',
	`publishedAt` timestamp,
	`expiresAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `school_notices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `learners` ADD `houseId` int;--> statement-breakpoint
ALTER TABLE `learner_assignments` ADD CONSTRAINT `learner_assignments_classId_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_assignments` ADD CONSTRAINT `learner_assignments_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_assignments` ADD CONSTRAINT `learner_assignments_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_documents` ADD CONSTRAINT `learner_documents_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_report_cards` ADD CONSTRAINT `learner_report_cards_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_report_cards` ADD CONSTRAINT `learner_report_cards_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_report_cards` ADD CONSTRAINT `learner_report_cards_termId_academic_terms_id_fk` FOREIGN KEY (`termId`) REFERENCES `academic_terms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_results` ADD CONSTRAINT `learner_results_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_results` ADD CONSTRAINT `learner_results_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_results` ADD CONSTRAINT `learner_results_termId_academic_terms_id_fk` FOREIGN KEY (`termId`) REFERENCES `academic_terms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_results` ADD CONSTRAINT `learner_results_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sbp_records` ADD CONSTRAINT `sbp_records_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sbp_records` ADD CONSTRAINT `sbp_records_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_notices` ADD CONSTRAINT `school_notices_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learners` ADD CONSTRAINT `learners_houseId_houses_id_fk` FOREIGN KEY (`houseId`) REFERENCES `houses`(`id`) ON DELETE no action ON UPDATE no action;