import api from "./api.js";

export const studentApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/students", { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },

  create: async (payload) => {
    const res = await api.post("/students", payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await api.patch(`/students/${id}`, payload);
    return res.data;
  },

  remove: async (id) => {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },
};

export const getStudents = studentApi.getAll;
export const getStudentById = studentApi.getById;
export const createStudent = studentApi.create;
export const updateStudent = studentApi.update;
export const deleteStudent = studentApi.remove;

export default studentApi;