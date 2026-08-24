CREATE TABLE `academic_terms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academicYearId` int NOT NULL,
	`termNumber` int NOT NULL,
	`name` varchar(40) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isCurrent` boolean NOT NULL DEFAULT false,
	CONSTRAINT `academic_terms_id` PRIMARY KEY(`id`),
	CONSTRAINT `academic_term_year_number_unique` UNIQUE(`academicYearId`,`termNumber`)
);
--> statement-breakpoint
CREATE TABLE `academic_years` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(40) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isCurrent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academic_years_id` PRIMARY KEY(`id`),
	CONSTRAINT `academic_year_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`streamName` varchar(80),
	`attendanceMode` enum('DAY_SCHOLAR','BOARDING','MIXED') NOT NULL DEFAULT 'MIXED',
	`roomId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `class_form_stream_unique` UNIQUE(`formId`,`name`,`streamName`)
);
--> statement-breakpoint
CREATE TABLE `school_departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`code` varchar(30) NOT NULL,
	`description` text,
	`hodStaffId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `school_departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `school_department_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formNumber` int NOT NULL,
	`pathway` enum('O_LEVEL','A_LEVEL') NOT NULL,
	`label` varchar(40) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `forms_id` PRIMARY KEY(`id`),
	CONSTRAINT `form_number_unique` UNIQUE(`formNumber`)
);
--> statement-breakpoint
CREATE TABLE `houses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`colour` varchar(20),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `houses_id` PRIMARY KEY(`id`),
	CONSTRAINT `house_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(140) NOT NULL,
	`description` text,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permission_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleId` int NOT NULL,
	`permissionId` int NOT NULL,
	`canView` boolean NOT NULL DEFAULT true,
	`canCreate` boolean NOT NULL DEFAULT false,
	`canEdit` boolean NOT NULL DEFAULT false,
	`canDelete` boolean NOT NULL DEFAULT false,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_permission_unique` UNIQUE(`roleId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`roomType` enum('CLASSROOM','LABORATORY','OFFICE','LIBRARY','HALL','OTHER') NOT NULL DEFAULT 'CLASSROOM',
	`capacity` int,
	`building` varchar(100),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `room_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `school_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`category` enum('SCHOOL_PROFILE','POLICY','ADMINISTRATION','OTHER') NOT NULL DEFAULT 'ADMINISTRATION',
	`storageKey` varchar(600) NOT NULL,
	`storageUrl` varchar(800) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `school_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `school_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolName` varchar(180) NOT NULL,
	`motto` varchar(240),
	`registrationNumber` varchar(80) NOT NULL,
	`registrationAuthority` varchar(120) NOT NULL DEFAULT 'MoPSE',
	`schoolType` enum('secondary') NOT NULL DEFAULT 'secondary',
	`logoKey` varchar(500),
	`logoUrl` varchar(700),
	`primaryColour` varchar(20) NOT NULL DEFAULT '#123B5D',
	`accentColour` varchar(20) NOT NULL DEFAULT '#C99A3E',
	`addressLine1` varchar(180) NOT NULL,
	`addressLine2` varchar(180),
	`town` varchar(100) NOT NULL,
	`province` varchar(100),
	`country` varchar(80) NOT NULL DEFAULT 'Zimbabwe',
	`phone` varchar(40),
	`alternativePhone` varchar(40),
	`email` varchar(320),
	`website` varchar(320),
	`headteacherName` varchar(180),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `school_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `school_profile_registration_unique` UNIQUE(`registrationNumber`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`staffNumber` varchar(60) NOT NULL,
	`firstName` varchar(80) NOT NULL,
	`lastName` varchar(80) NOT NULL,
	`nationalId` varchar(40),
	`phone` varchar(40),
	`email` varchar(320),
	`employmentType` enum('PERMANENT','TEMPORARY','RELIEF','VOLUNTEER') NOT NULL DEFAULT 'PERMANENT',
	`status` enum('ACTIVE','INACTIVE','ON_LEAVE') NOT NULL DEFAULT 'ACTIVE',
	`joinedOn` timestamp,
	`notes` text,
	CONSTRAINT `staff_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_number_unique` UNIQUE(`staffNumber`)
);
--> statement-breakpoint
CREATE TABLE `staff_role_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`roleId` int NOT NULL,
	`effectiveFrom` timestamp NOT NULL DEFAULT (now()),
	`effectiveTo` timestamp,
	CONSTRAINT `staff_role_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_role_assignment_unique` UNIQUE(`staffId`,`roleId`)
);
--> statement-breakpoint
CREATE TABLE `staff_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(40) NOT NULL,
	`description` text,
	`isSystemRole` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `staff_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_role_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(140) NOT NULL,
	`code` varchar(30) NOT NULL,
	`pathway` enum('O_LEVEL','A_LEVEL') NOT NULL,
	`departmentId` int,
	`isCore` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subject_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `teacher_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherStaffId` int NOT NULL,
	`subjectId` int NOT NULL,
	`classId` int NOT NULL,
	`academicYearId` int NOT NULL,
	`termId` int,
	`isPrimaryTeacher` boolean NOT NULL DEFAULT false,
	CONSTRAINT `teacher_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `teacher_subject_class_year_unique` UNIQUE(`teacherStaffId`,`subjectId`,`classId`,`academicYearId`,`termId`)
);
--> statement-breakpoint
ALTER TABLE `academic_terms` ADD CONSTRAINT `academic_terms_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_formId_forms_id_fk` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_staff_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `staff_roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_permissions_id_fk` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_documents` ADD CONSTRAINT `school_documents_uploadedByUserId_users_id_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff` ADD CONSTRAINT `staff_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_role_assignments` ADD CONSTRAINT `staff_role_assignments_staffId_staff_id_fk` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_role_assignments` ADD CONSTRAINT `staff_role_assignments_roleId_staff_roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `staff_roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_departmentId_school_departments_id_fk` FOREIGN KEY (`departmentId`) REFERENCES `school_departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_assignments` ADD CONSTRAINT `teacher_assignments_teacherStaffId_staff_id_fk` FOREIGN KEY (`teacherStaffId`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_assignments` ADD CONSTRAINT `teacher_assignments_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_assignments` ADD CONSTRAINT `teacher_assignments_classId_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_assignments` ADD CONSTRAINT `teacher_assignments_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_assignments` ADD CONSTRAINT `teacher_assignments_termId_academic_terms_id_fk` FOREIGN KEY (`termId`) REFERENCES `academic_terms`(`id`) ON DELETE no action ON UPDATE no action;