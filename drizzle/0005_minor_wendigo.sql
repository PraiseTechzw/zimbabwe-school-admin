CREATE TABLE `school_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academicYearId` int NOT NULL,
	`termId` int,
	`eventType` enum('ASSEMBLY','EXAMINATION','SCHOOL_EVENT','SPORTS_EVENT','CONSULTATION_DAY','SPEECH_DAY') NOT NULL,
	`eventVisibility` enum('HEADTEACHER','STAFF','LEARNERS_GUARDIANS','ALL') NOT NULL DEFAULT 'ALL',
	`title` varchar(180) NOT NULL,
	`startAt` timestamp NOT NULL,
	`endAt` timestamp NOT NULL,
	`roomId` int,
	`description` text,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `school_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timetable_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academicYearId` int NOT NULL,
	`termId` int,
	`classId` int,
	`teacherStaffId` int,
	`subjectId` int,
	`roomId` int,
	`dayOfWeek` varchar(12) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`timetableEntryType` enum('LESSON','ASSEMBLY','EXAMINATION','EVENT') NOT NULL DEFAULT 'LESSON',
	`title` varchar(180) NOT NULL,
	`isLaboratory` boolean NOT NULL DEFAULT false,
	`isRecurring` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timetable_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `timetable_slot_index` UNIQUE(`academicYearId`,`termId`,`dayOfWeek`,`startTime`,`endTime`,`classId`,`teacherStaffId`,`roomId`)
);
--> statement-breakpoint
ALTER TABLE `school_events` ADD CONSTRAINT `school_events_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_events` ADD CONSTRAINT `school_events_termId_academic_terms_id_fk` FOREIGN KEY (`termId`) REFERENCES `academic_terms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_events` ADD CONSTRAINT `school_events_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `school_events` ADD CONSTRAINT `school_events_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable_entries` ADD CONSTRAINT `timetable_entries_academicYearId_academic_years_id_fk` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable_entries` ADD CONSTRAINT `timetable_entries_termId_academic_terms_id_fk` FOREIGN KEY (`termId`) REFERENCES `academic_terms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable_entries` ADD CONSTRAINT `timetable_entries_classId_classes_id_fk` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable_entries` ADD CONSTRAINT `timetable_entries_teacherStaffId_staff_id_fk` FOREIGN KEY (`teacherStaffId`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable_entries` ADD CONSTRAINT `timetable_entries_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable_entries` ADD CONSTRAINT `timetable_entries_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetable_entries` ADD CONSTRAINT `timetable_entries_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;