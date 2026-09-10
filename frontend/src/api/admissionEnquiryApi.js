import api from "./api.js";
export const admissionEnquiryApi = {
  list: (params) => api.get("/admissions/enquiries", { params }),
  dashboard: () => api.get("/admissions/enquiries/dashboard"),
  get: (id) => api.get(`/admissions/enquiries/${id}`),
  update: (id, payload) => api.patch(`/admissions/enquiries/${id}`, payload),
  convert: (id, studentId) => api.post(`/admissions/enquiries/${id}/convert`, { studentId }),
  logCommunication: (id, payload) => api.post(`/admissions/enquiries/${id}/communications`, payload),
  exportCsv: () => api.get("/admissions/enquiries/export.csv", { responseType: "blob" }),
  remove: (id) => api.delete(`/admissions/enquiries/${id}`),
};
export default admissionEnquiryApi;
