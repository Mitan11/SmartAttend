import { useState, useEffect } from "react";
import api from "../../api/axios";
import { BookOpen, Users } from "lucide-react";
import StartSessionModal from "./StartSessionModal";

export default function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const res = await api.get("/sessions/my-courses");
      setCourses(res.data.data.courses);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
          <p className="text-gray-500 mt-1">Select a course to start an attendance session</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 transition-all duration-300 group flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                <BookOpen size={26} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight text-lg">{course.name}</h3>
                <p className="text-sm text-gray-500 font-medium">{course.code}</p>
              </div>
            </div>
            
            <div className="mt-auto pt-5 border-t border-gray-50 relative z-10">
              <button
                onClick={() => {
                  setSelectedCourse(course);
                  setIsModalOpen(true);
                }}
                className="w-full bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn"
              >
                <span>Start Session</span>
                <span className="opacity-0 -ml-2 group-hover/btn:opacity-100 group-hover/btn:ml-1 transition-all duration-300">→</span>
              </button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Assigned</h3>
            <p className="text-gray-500 max-w-sm">
              You are not currently assigned to any active courses. Please contact your system administrator to configure your teaching schedule.
            </p>
          </div>
        )}
      </div>

      <StartSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={selectedCourse}
      />
    </div>
  );
}
