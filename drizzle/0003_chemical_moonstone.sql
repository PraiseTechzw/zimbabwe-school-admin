CREATE TABLE `attendance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`learnerId` int NOT NULL,
	`attendanceStatus` enum('PRESENT','ABSENT','LATE','EXCUSED') NOT NULL,
	`arrivalTime` timestamp,
	`reason` varchar(500),
	`note` text,
	`guardianAlerted` boolean NOT NULL DEFAULT false,
	`alertSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendance_session_learner_unique` UNIQUE(`sessionId`,`learnerId`)
);
--> statement-breakpoint
CREATE TABLE `attendance_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academicYearId` int NOT NULL,
	`termId` int NOT NULL,
	`classId` int,
	`sessionDate` timestamp NOT NULL,
	`attendanceMode` enum('DAILY','PERIOD','BOARDING_ROLL_CALL') NOT NULL,
	`periodNumber` int,
	`periodName` varchar(80),
	`recordedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `counselling_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`sessionAt` timestamp NOT NULL,
	`summary` text NOT NULL,
	`outcome` text,
	`followUpAt` timestamp,
	`recordedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `counselling_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discipline_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`disciplineActionType` enum('NONE','DEMERIT','DETENTION','SUSPENSION') NOT NULL,
	`points` int,
	`startAt` timestamp,
	`endAt` timestamp,
	`completedAt` timestamp,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discipline_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discipline_incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`category` varchar(100) NOT NULL,
	`severity` int NOT NULL DEFAULT 1,
	`summary` varchar(500) NOT NULL,
	`details` text,
	`disciplineIncidentStatus` enum('OPEN','RESOLVED','REFERRED') NOT NULL DEFAULT 'OPEN',
	`reportedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discipline_incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exeat_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`requestedByUserId` int NOT NULL,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`departureAt` timestamp NOT NULL,
	`expectedReturnAt` timestamp NOT NULL,
	`destination` varchar(240) NOT NULL,
	`reason` varchar(500) NOT NULL,
	`exeatStatus` enum('REQUESTED','APPROVED','DECLINED','RETURNED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
	`decisionNotes` text,
	`decidedByUserId` int,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exeat_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fee_structure_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feeStructureId` int NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`amountMinor` int NOT NULL,
	`feeFrequency` enum('ONCE','TERM','ANNUAL') NOT NULL DEFAULT 'TERM',
	`isMandatory` boolean NOT NULL DEFAULT true,
	CONSTRAINT `fee_structure_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `fee_structure_item_code_unique` UNIQUE(`feeStructureId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `fee_structures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`academicYearId` int NOT NULL,
	`formId` int,
	`pathway` enum('O_LEVEL','A_LEVEL') NOT NULL DEFAULT 'A_LEVEL',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fee_structures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guardian_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`attendanceRecordId` int,
	`guardianAlertType` enum('ABSENCE','LATE_ARRIVAL','WELFARE') NOT NULL,
	`guardianAlertStatus` enum('QUEUED','SENT','FAILED') NOT NULL DEFAULT 'QUEUED',
	`message` varchar(500) NOT NULL,
	`queuedAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`failureReason` text,
	CONSTRAINT `guardian_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`feeItemId` int,
	`description` varchar(180) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitAmountMinor` int NOT NULL,
	`lineTotalMinor` int NOT NULL,
	CONSTRAINT `invoice_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(60) NOT NULL,
	`learnerId` int NOT NULL,
	`academicYearId` int NOT NULL,
	`feeStructureId` int,
	`currency` varchar(3) NOT NULL,
	`subtotalMinor` int NOT NULL,
	`discountMinor` int NOT NULL DEFAULT 0,
	`totalMinor` int NOT NULL,
	`invoiceStatus` enum('DRAFT','ISSUED','PARTIALLY_PAID','PAID','VOID','OVERDUE') NOT NULL DEFAULT 'DRAFT',
	`issuedAt` timestamp,
	`dueDate` timestamp,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoice_number_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `medical_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`bloodGroup` varchar(10),
	`allergies` text,
	`conditions` text,
	`medications` text,
	`emergencyContactName` varchar(160),
	`emergencyContactPhone` varchar(40),
	`notes` text,
	`updatedByUserId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medical_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `medical_profile_learner_unique` UNIQUE(`learnerId`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receiptNumber` varchar(60) NOT NULL,
	`learnerId` int NOT NULL,
	`invoiceId` int,
	`amountMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`paymentMethod` enum('CASH','ECOCASH','ZIPIT','BANK_TRANSFER','CARD','OTHER') NOT NULL,
	`reference` varchar(120),
	`paymentStatus` enum('PENDING','CONFIRMED','REVERSED') NOT NULL DEFAULT 'CONFIRMED',
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	`receivedByUserId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_receipt_number_unique` UNIQUE(`receiptNumber`)
);
--> statement-breakpoint
CREATE TABLE `prefect_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`reportedAt` timestamp NOT NULL DEFAULT (now()),
	`category` varchar(100) NOT NULL,
	`summary` varchar(500) NOT NULL,
	`disciplineIncidentStatus` enum('OPEN','RESOLVED','REFERRED') NOT NULL DEFAULT 'OPEN',
	`reviewedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prefect_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safeguarding_referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`welfareCaseId` int NOT NULL,
	`learnerId` int NOT NULL,
	`referralType` varchar(120) NOT NULL,
	`safeguardingReferralStatus` enum('DRAFT','SUBMITTED','IN_REVIEW','ACTIONED','CLOSED') NOT NULL DEFAULT 'DRAFT',
	`details` text NOT NULL,
	`referredAt` timestamp NOT NULL DEFAULT (now()),
	`externalAgency` varchar(180),
	`resolvedAt` timestamp,
	`createdByUserId` int NOT NULL,
	CONSTRAINT `safeguarding_referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `welfare_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`severity` int NOT NULL DEFAULT 1,
	`welfareCaseStatus` enum('OPEN','ON_HOLD','CLOSED') NOT NULL DEFAULT 'OPEN',
	`summary` varchar(500) NOT NULL,
	`privateNotes` text,
	`assignedToUserId` int,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	`createdByUserId` int NOT NULL,
	CONSTRAINT `welfare_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_sessionId_attendance_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `attendance_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_termId_academic_terms_id_fk` FOREIGN KEY (`termId`) REFERENCES `academic_terms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_classId_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `counselling_records` ADD CONSTRAINT `counselling_records_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `counselling_records` ADD CONSTRAINT `counselling_records_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_actions` ADD CONSTRAINT `discipline_actions_incidentId_discipline_incidents_id_fk` FOREIGN KEY (`incidentId`) REFERENCES `discipline_incidents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_actions` ADD CONSTRAINT `discipline_actions_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incidents` ADD CONSTRAINT `discipline_incidents_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discipline_incidents` ADD CONSTRAINT `discipline_incidents_reportedByUserId_users_id_fk` FOREIGN KEY (`reportedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exeat_requests` ADD CONSTRAINT `exeat_requests_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exeat_requests` ADD CONSTRAINT `exeat_requests_requestedByUserId_users_id_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exeat_requests` ADD CONSTRAINT `exeat_requests_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_structure_items` ADD CONSTRAINT `fee_structure_items_feeStructureId_fee_structures_id_fk` FOREIGN KEY (`feeStructureId`) REFERENCES `fee_structures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_formId_forms_id_fk` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guardian_alerts` ADD CONSTRAINT `guardian_alerts_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guardian_alerts` ADD CONSTRAINT `guardian_alerts_attendanceRecordId_attendance_records_id_fk` FOREIGN KEY (`attendanceRecordId`) REFERENCES `attendance_records`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoice_lines` ADD CONSTRAINT `invoice_lines_invoiceId_invoices_id_fk` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoice_lines` ADD CONSTRAINT `invoice_lines_feeItemId_fee_structure_items_id_fk` FOREIGN KEY (`feeItemId`) REFERENCES `fee_structure_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_feeStructureId_fee_structures_id_fk` FOREIGN KEY (`feeStructureId`) REFERENCES `fee_structures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_profiles` ADD CONSTRAINT `medical_profiles_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_profiles` ADD CONSTRAINT `medical_profiles_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoiceId_invoices_id_fk` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_receivedByUserId_users_id_fk` FOREIGN KEY (`receivedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prefect_reports` ADD CONSTRAINT `prefect_reports_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prefect_reports` ADD CONSTRAINT `prefect_reports_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safeguarding_referrals` ADD CONSTRAINT `safeguarding_referrals_welfareCaseId_welfare_cases_id_fk` FOREIGN KEY (`welfareCaseId`) REFERENCES `welfare_cases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safeguarding_referrals` ADD CONSTRAINT `safeguarding_referrals_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safeguarding_referrals` ADD CONSTRAINT `safeguarding_referrals_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `welfare_cases` ADD CONSTRAINT `welfare_cases_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `welfare_cases` ADD CONSTRAINT `welfare_cases_assignedToUserId_users_id_fk` FOREIGN KEY (`assignedToUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `welfare_cases` ADD CONSTRAINT `welfare_cases_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;