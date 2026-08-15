import api from "./api.js";

export const membershipApi = {
  getStudentMembership: (studentId) =>
    api.get(`/memberships/student/${studentId}`),
  createAdjustment: (studentId, payload) =>
    api.post(`/memberships/student/${studentId}/adjustments`, payload),
  reverseAdjustment: (adjustmentId, reason) =>
    api.post(`/memberships/adjustments/${adjustmentId}/reverse`, { reason }),
};

export default membershipApi;
