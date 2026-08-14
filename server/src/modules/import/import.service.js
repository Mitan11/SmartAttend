import * as xlsx from "xlsx";
import User from "../../models/User.js";
import Student from "../../models/Student.js";
import Faculty from "../../models/Faculty.js";
import Enrollment from "../../models/Enrollment.js";
import Semester from "../../models/Semester.js";

export const parseExcel = (buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Read as 2D array to scan for headers dynamically
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  let headerRowIndex = -1;
  let enrollmentColIdx = -1;
  let nameColIdx = -1;
  let sectionColIdx = -1;

  // Find the row that contains the actual headers
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    for (let j = 0; j < row.length; j++) {
      const cellValue = String(row[j] || "").toLowerCase().replace(/\s/g, '');
      if (cellValue === 'enrollmentno' || cellValue === 'enrollmentnumber') {
        enrollmentColIdx = j;
      }
      if (cellValue === 'fullname' || cellValue === 'name' || cellValue === 'studentname') {
        nameColIdx = j;
      }
      if (cellValue === 'section' || cellValue === 'class' || cellValue === 'batch') {
        sectionColIdx = j;
      }
    }

    // Stop searching once we find the row with both required columns
    if (enrollmentColIdx !== -1 && nameColIdx !== -1) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("Could not find required headers (EnrollmentNo, FullName) in the excel file.");
  }

  const students = [];
  
  // Parse the subsequent rows for student data
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.length) continue;
    
    const enrollmentNo = String(row[enrollmentColIdx] || "").trim();
    const fullName = String(row[nameColIdx] || "").trim();
    const section = sectionColIdx !== -1 ? String(row[sectionColIdx] || "").trim() : null;

    // Only add if both fields are present
    if (enrollmentNo && fullName && enrollmentNo !== "undefined" && fullName !== "undefined") {
      students.push({ enrollmentNo, fullName, section });
    }
  }

  return students;
};

export const processStudentImport = async (studentsData, semesterId, defaultSection = "A") => {
  const semester = await Semester.findById(semesterId).populate("courseId");
  if (!semester) throw new Error("Semester not found");
  
  const departmentId = semester.courseId?.departmentId;

  const results = {
      totalProcessed: 0,
      successful: 0,
      duplicates: 0,
      errors: []
  };

  for (const student of studentsData) {
      results.totalProcessed++;
      try {
          let existingStudent = await Student.findOne({ enrollmentNo: student.enrollmentNo });
          
          if (!existingStudent) {
              const firstName = student.fullName.split(' ')[0];
              const last4 = student.enrollmentNo.slice(-4);
              const generatedPassword = `${firstName}@${last4}`;
              
              const email = `${student.enrollmentNo.toLowerCase()}@smartattend.edu`;

              const newUser = new User({
                  name: student.fullName,
                  email: email,
                  password: generatedPassword,
                  role: "Student",
                  status: "Active",
                  departmentId: departmentId // Inherited from Semester -> Course
              });
              await newUser.save(); // pre-save hook handles hashing

              existingStudent = new Student({
                  userId: newUser._id,
                  enrollmentNo: student.enrollmentNo,
                  fullName: student.fullName
              });
              await existingStudent.save();
          }

          const existingEnrollment = await Enrollment.findOne({ studentId: existingStudent._id, semesterId });
          if (existingEnrollment) {
              results.duplicates++;
          } else {
              await Enrollment.create({
                  studentId: existingStudent._id,
                  semesterId,
                  section: student.section || defaultSection || "A",
                  status: "Active"
              });
              results.successful++;
          }

      } catch (err) {
          results.errors.push(`Row ${student.enrollmentNo}: ${err.message}`);
      }
  }

  return results;
};

export const parseFacultyExcel = (buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  let headerRowIndex = -1;
  let employeeIdColIdx = -1;
  let nameColIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    for (let j = 0; j < row.length; j++) {
      const cellValue = String(row[j] || "").toLowerCase().replace(/\s/g, '');
      if (cellValue === 'employeeid' || cellValue === 'empid') {
        employeeIdColIdx = j;
      }
      if (cellValue === 'fullname' || cellValue === 'name' || cellValue === 'facultyname' || cellValue === 'teachername') {
        nameColIdx = j;
      }
    }

    if (employeeIdColIdx !== -1 && nameColIdx !== -1) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("Could not find required headers (EmployeeID, FullName) in the excel file.");
  }

  const faculties = [];
  
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.length) continue;
    
    const employeeId = String(row[employeeIdColIdx] || "").trim();
    const fullName = String(row[nameColIdx] || "").trim();

    if (employeeId && fullName && employeeId !== "undefined" && fullName !== "undefined") {
      faculties.push({ employeeId, fullName });
    }
  }

  return faculties;
};

export const processFacultyImport = async (facultiesData, departmentId) => {
  const results = {
      totalProcessed: 0,
      successful: 0,
      duplicates: 0,
      errors: []
  };

  for (const faculty of facultiesData) {
      results.totalProcessed++;
      try {
          let existingFaculty = await Faculty.findOne({ employeeId: faculty.employeeId });
          
          if (!existingFaculty) {
              let cleanName = faculty.fullName.toLowerCase();
              cleanName = cleanName.replace(/^(dr\.?|mrs\.?|miss\.?|mr\.?|prof\.?)\s+/i, '');
              cleanName = cleanName.replace(/[^a-z0-9]/g, '');
              const email = cleanName ? `${cleanName}@smartattend.com` : `emp${faculty.employeeId.toLowerCase()}@smartattend.com`;

              const existingUser = await User.findOne({ email });
              if (existingUser) {
                  results.errors.push(`Row ${faculty.employeeId}: Email ${email} already exists in User collection.`);
                  continue;
              }

              const newUser = new User({
                  name: faculty.fullName,
                  email: email,
                  password: "teacher123",
                  role: "Teacher",
                  status: "Active",
                  departmentId: departmentId
              });
              await newUser.save();

              existingFaculty = new Faculty({
                  userId: newUser._id,
                  employeeId: faculty.employeeId,
                  fullName: faculty.fullName,
                  departmentId: departmentId
              });
              await existingFaculty.save();
              results.successful++;
          } else {
              results.duplicates++;
          }
      } catch (err) {
          results.errors.push(`Row ${faculty.employeeId}: ${err.message}`);
      }
  }

  return results;
};
