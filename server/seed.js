import mongoose from "mongoose";
import env from "./src/config/env.js";

// Import models
import User from "./src/models/User.js";
import Department from "./src/models/Department.js";
import Course from "./src/models/Course.js";
import Subject from "./src/models/Subject.js";
import Faculty from "./src/models/Faculty.js";
import Student from "./src/models/Student.js";
import AcademicYear from "./src/models/AcademicYear.js";
import Semester from "./src/models/Semester.js";
import SubjectOffering from "./src/models/SubjectOffering.js";
import Enrollment from "./src/models/Enrollment.js";
import Classroom from "./src/models/Classroom.js";

const seedDatabase = async () => {
  try {
    console.log("Connecting to the database...");
    await mongoose.connect(env.MONGO_URL);
    console.log("Connected to MongoDB");

    // Clear existing data
    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Course.deleteMany({}),
      Subject.deleteMany({}),
      Faculty.deleteMany({}),
      Student.deleteMany({}),
      AcademicYear.deleteMany({}),
      Semester.deleteMany({}),
      SubjectOffering.deleteMany({}),
      Enrollment.deleteMany({}),
      Classroom.deleteMany({})
    ]);

    // Create Department
    const department = await Department.create({
      name: "Computer Science",
      code: "CS"
    });

    // Create Course
    const course = await Course.create({
      name: "Bachelor of Technology",
      code: "BTECH",
      departmentId: department._id
    });

    // Create Academic Year
    const academicYear = await AcademicYear.create({
      year: "2026-27"
    });

    // Create Semester
    const semester = await Semester.create({
      name: "Semester 1",
      courseId: course._id,
      academicYearId: academicYear._id
    });

    // Create Subject
    const subject = await Subject.create({
      code: "CS101",
      name: "Introduction to Programming",
      credits: 4,
      type: "Compulsory",
      status: "Active"
    });

    // Create Admin User
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@smartattend.com",
      password: "password123",
      role: "Admin",
      departmentId: department._id,
      status: "Active"
    });

    // Create Teacher User
    const teacherUser = await User.create({
      name: "John Doe",
      email: "teacher@smartattend.com",
      password: "password123",
      role: "Teacher",
      departmentId: department._id,
      status: "Active"
    });

    // Create Faculty Profile
    const faculty = await Faculty.create({
      userId: teacherUser._id,
      employeeId: "EMP001",
      fullName: "John Doe",
      departmentId: department._id
    });

    // Create Student User
    const studentUser = await User.create({
      name: "Jane Smith",
      email: "student@smartattend.com",
      password: "password123",
      role: "Student",
      departmentId: department._id,
      status: "Active"
    });

    // Create Student Profile
    const student = await Student.create({
      userId: studentUser._id,
      enrollmentNo: "ENR001",
      fullName: "Jane Smith"
    });

    // Enroll the student in the semester
    await Enrollment.create({
      studentId: student._id,
      semesterId: semester._id,
      section: "A",
      status: "Active"
    });

    // Create a Classroom with GPS location
    await Classroom.create({
      name: "Room 101",
      capacity: 60,
      location: {
        lat: 23.0225,
        lng: 72.5714
      }
    });

    // Assign Subject to Faculty (Create Subject Offering)
    await SubjectOffering.create({
      subjectId: subject._id,
      semesterId: semester._id,
      facultyId: faculty._id,
      section: "A",
      status: "Active"
    });

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
