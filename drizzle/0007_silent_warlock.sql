CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`role` varchar(60),
	`auditAction` enum('CREATE','UPDATE','DELETE','APPROVE','LOCK','UNLOCK','LOGIN','LOGOUT','EXPORT','REVERSE','TRANSFER','WITHDRAW') NOT NULL,
	`entity` varchar(100) NOT NULL,
	`entityId` varchar(100),
	`previousValue` text,
	`newValue` text,
	`reason` varchar(500),
	`ipAddress` varchar(80),
	`deviceInfo` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int,
	`recipientUserId` int,
	`notificationType` varchar(100) NOT NULL,
	`provider` varchar(100),
	`notificationDeliveryStatus` enum('PENDING','SENT','DELIVERED','FAILED') NOT NULL DEFAULT 'PENDING',
	`providerReference` varchar(180),
	`failureReason` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_id_integrity_issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int,
	`studentId` varchar(60),
	`integrityIssueType` enum('DUPLICATE_STUDENT_ID','MISSING_STUDENT_ID','INVALID_STUDENT_ID','ORPHANED_ACADEMIC_RECORD','DUPLICATE_ACTIVE_LEARNER') NOT NULL,
	`detail` varchar(500) NOT NULL,
	`resolvedAt` timestamp,
	`resolvedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_id_integrity_issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_health_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(100) NOT NULL,
	`healthStatus` enum('HEALTHY','DEGRADED','DOWN','NOT_CONFIGURED') NOT NULL,
	`detail` varchar(500),
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_health_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_audit` ADD CONSTRAINT `notification_audit_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_audit` ADD CONSTRAINT `notification_audit_recipientUserId_users_id_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_id_integrity_issues` ADD CONSTRAINT `student_id_integrity_issues_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_id_integrity_issues` ADD CONSTRAINT `student_id_integrity_issues_resolvedByUserId_users_id_fk` FOREIGN KEY (`resolvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;