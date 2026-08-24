import { describe, expect, it } from "vitest";
import { calculateTeacherWorkload, detectTimetableClashes, validateTimeRange } from "./timetable";

const base = { academicYearId: 1, termId: 2, dayOfWeek: "MONDAY", startTime: "08:00", endTime: "09:00", entryType: "LESSON" as const, title: "Mathematics", classId: 4, teacherStaffId: 8, roomId: 12 };

describe("Stage 8 timetable operations", () => {
  it("accepts valid school-day times and rejects reversed or malformed ranges", () => {
    expect(validateTimeRange("08:00", "09:00")).toBe(true);
    expect(validateTimeRange("09:00", "08:00")).toBe(false);
    expect(validateTimeRange("8am", "09:00")).toBe(false);
  });

  it("detects overlapping class, teacher, and room allocations", () => {
    const clashes = detectTimetableClashes({ ...base, title: "Physics", startTime: "08:30", endTime: "09:30" }, [{ ...base, id: 11 }]);
    expect(clashes).toHaveLength(1);
    expect(clashes[0].message).toMatch(/Mathematics/);
    expect(clashes[0].type).toBe("TEACHER");
  });

  it("allows adjacent lessons and detects invalid time ranges", () => {
    expect(detectTimetableClashes({ ...base, startTime: "09:00", endTime: "10:00" }, [{ ...base, id: 11 }])).toHaveLength(0);
    expect(detectTimetableClashes({ ...base, startTime: "10:00", endTime: "09:00" }, [])).toEqual([{ type: "TIME_RANGE", message: "The timetable start time must be before the end time." }]);
  });

  it("calculates teacher period, minute, and hour workloads", () => {
    expect(calculateTeacherWorkload([{ teacherStaffId: 8, startTime: "08:00", endTime: "09:00" }, { teacherStaffId: 8, startTime: "09:15", endTime: "10:00" }, { teacherStaffId: 9, startTime: "08:00", endTime: "09:30" }])).toEqual([{ teacherStaffId: 8, periods: 2, minutes: 105, hours: 1.8 }, { teacherStaffId: 9, periods: 1, minutes: 90, hours: 1.5 }]);
  });
});
