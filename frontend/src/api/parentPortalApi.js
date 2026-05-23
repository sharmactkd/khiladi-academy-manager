import api from "./api.js";

export const parentPortalApi = {
  getMyStudents: () => api.get("/parent-portal/my-students"),
  getStudentProfile: (studentId) =>
    api.get(`/parent-portal/students/${studentId}/profile`),
  getStudentAttendance: (studentId) =>
    api.get(`/parent-portal/students/${studentId}/attendance`),
  getStudentFees: (studentId) =>
    api.get(`/parent-portal/students/${studentId}/fees`),
  getStudentProgress: (studentId) =>
    api.get(`/parent-portal/students/${studentId}/progress`),
  getStudentDocuments: (studentId) =>
    api.get(`/parent-portal/students/${studentId}/documents`),
};