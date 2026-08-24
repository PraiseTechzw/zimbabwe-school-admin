CREATE TABLE `a_level_application_subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`subjectId` int NOT NULL,
	`subjectName` varchar(140) NOT NULL,
	CONSTRAINT `a_level_application_subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `a_level_application_subject_unique` UNIQUE(`applicationId`,`subjectId`)
);
--> statement-breakpoint
CREATE TABLE `a_level_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`academicYearId` int NOT NULL,
	`oLevelResultId` int NOT NULL,
	`requirementId` int,
	`pathway` enum('O_LEVEL','A_LEVEL') NOT NULL DEFAULT 'A_LEVEL',
	`applicationStatus` enum('NOT_STARTED','DRAFT','SUBMITTED','UNDER_REVIEW','RESULTS_VERIFICATION','ACCEPTED','CONDITIONALLY_ACCEPTED','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'NOT_STARTED',
	`verificationStatus` enum('NOT_STARTED','PENDING','VERIFIED','FAILED') NOT NULL DEFAULT 'NOT_STARTED',
	`selectionDecision` enum('PENDING','SELECTED','NOT_SELECTED','ADMITTED','NOT_ADMITTED') NOT NULL DEFAULT 'PENDING',
	`admissionDecision` enum('PENDING','SELECTED','NOT_SELECTED','ADMITTED','NOT_ADMITTED') NOT NULL DEFAULT 'PENDING',
	`submittedAt` timestamp,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `a_level_applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `a_level_application_learner_year_unique` UNIQUE(`learnerId`,`academicYearId`)
);
--> statement-breakpoint
CREATE TABLE `a_level_requirement_subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requirementId` int NOT NULL,
	`subjectId` int NOT NULL,
	`minimumGrade` varchar(10),
	`isRequired` boolean NOT NULL DEFAULT false,
	CONSTRAINT `a_level_requirement_subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `a_level_requirement_subject_unique` UNIQUE(`requirementId`,`subjectId`)
);
--> statement-breakpoint
CREATE TABLE `a_level_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`minimumPoints` int,
	`minimumPasses` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `a_level_requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guardian_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`firstName` varchar(80) NOT NULL,
	`lastName` varchar(80) NOT NULL,
	`relationship` varchar(60) NOT NULL,
	`phone` varchar(40),
	`email` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guardian_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learner_academic_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`academicYearId` int NOT NULL,
	`termId` int NOT NULL,
	`formId` int NOT NULL,
	`classId` int,
	`pathway` enum('O_LEVEL','A_LEVEL') NOT NULL,
	`registrationStatus` enum('ACTIVE','INACTIVE','WITHDRAWN','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
	`progressionType` enum('NORMAL_SECONDARY','A_LEVEL_ADMISSION','A_LEVEL_CONTINUATION'),
	`previousHistoryId` int,
	`recordedByUserId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learner_academic_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `learner_history_year_term_unique` UNIQUE(`learnerId`,`academicYearId`,`termId`)
);
--> statement-breakpoint
CREATE TABLE `learner_guardians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`guardianId` int NOT NULL,
	`isPrimary` boolean NOT NULL DEFAULT false,
	CONSTRAINT `learner_guardians_id` PRIMARY KEY(`id`),
	CONSTRAINT `learner_guardian_unique` UNIQUE(`learnerId`,`guardianId`)
);
--> statement-breakpoint
CREATE TABLE `learners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` varchar(60) NOT NULL,
	`admissionNumber` varchar(60),
	`userId` int,
	`firstName` varchar(80) NOT NULL,
	`middleName` varchar(80),
	`lastName` varchar(80) NOT NULL,
	`dateOfBirth` timestamp,
	`gender` varchar(30),
	`registrationStatus` enum('ACTIVE','INACTIVE','WITHDRAWN','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learners_id` PRIMARY KEY(`id`),
	CONSTRAINT `learner_student_id_unique` UNIQUE(`studentId`),
	CONSTRAINT `learner_admission_number_unique` UNIQUE(`admissionNumber`)
);
--> statement-breakpoint
CREATE TABLE `o_level_result_subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resultId` int NOT NULL,
	`subjectId` int,
	`subjectName` varchar(140) NOT NULL,
	`grade` varchar(10) NOT NULL,
	`points` int,
	CONSTRAINT `o_level_result_subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `o_level_result_subject_unique` UNIQUE(`resultId`,`subjectName`)
);
--> statement-breakpoint
CREATE TABLE `o_level_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`examinationYear` int NOT NULL,
	`candidateNumber` varchar(80) NOT NULL,
	`centreNumber` varchar(80),
	`candidateName` varchar(180) NOT NULL,
	`verificationStatus` enum('NOT_STARTED','PENDING','VERIFIED','FAILED') NOT NULL DEFAULT 'PENDING',
	`verifiedByUserId` int,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `o_level_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `learner_o_level_exam_year_unique` UNIQUE(`learnerId`,`examinationYear`)
);
--> statement-breakpoint
ALTER TABLE `a_level_application_subjects` ADD CONSTRAINT `a_level_application_subjects_applicationId_a_level_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `a_level_applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `a_level_application_subjects` ADD CONSTRAINT `a_level_application_subjects_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `a_level_applications` ADD CONSTRAINT `a_level_applications_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `a_level_applications` ADD CONSTRAINT `a_level_applications_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `a_level_applications` ADD CONSTRAINT `a_level_applications_oLevelResultId_o_level_results_id_fk` FOREIGN KEY (`oLevelResultId`) REFERENCES `o_level_results`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `a_level_applications` ADD CONSTRAINT `a_level_applications_requirementId_a_level_requirements_id_fk` FOREIGN KEY (`requirementId`) REFERENCES `a_level_requirements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `a_level_applications` ADD CONSTRAINT `a_level_applications_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `a_level_requirement_subjects` ADD CONSTRAINT `a_level_requirement_subjects_requirementId_a_level_requirements_id_fk` FOREIGN KEY (`requirementId`) REFERENCES `a_level_requirements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `a_level_requirement_subjects` ADD CONSTRAINT `a_level_requirement_subjects_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `a_level_requirements` ADD CONSTRAINT `a_level_requirements_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guardian_contacts` ADD CONSTRAINT `guardian_contacts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_academic_history` ADD CONSTRAINT `learner_academic_history_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_academic_history` ADD CONSTRAINT `learner_academic_history_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_academic_history` ADD CONSTRAINT `learner_academic_history_termId_academic_terms_id_fk` FOREIGN KEY (`termId`) REFERENCES `academic_terms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_academic_history` ADD CONSTRAINT `learner_academic_history_formId_forms_id_fk` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_academic_history` ADD CONSTRAINT `learner_academic_history_classId_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_academic_history` ADD CONSTRAINT `learner_academic_history_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_guardians` ADD CONSTRAINT `learner_guardians_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_guardians` ADD CONSTRAINT `learner_guardians_guardianId_guardian_contacts_id_fk` FOREIGN KEY (`guardianId`) REFERENCES `guardian_contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learners` ADD CONSTRAINT `learners_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `o_level_result_subjects` ADD CONSTRAINT `o_level_result_subjects_resultId_o_level_results_id_fk` FOREIGN KEY (`resultId`) REFERENCES `o_level_results`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `o_level_result_subjects` ADD CONSTRAINT `o_level_result_subjects_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `o_level_results` ADD CONSTRAINT `o_level_results_learnerId_learners_id_fk` FOREIGN KEY (`learnerId`) REFERENCES `learners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `o_level_results` ADD CONSTRAINT `o_level_results_verifiedByUserId_users_id_fk` FOREIGN KEY (`verifiedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;