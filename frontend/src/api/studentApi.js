import api from "./api.js";

const multipartConfig = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
};

const IMPORT_CHUNK_MAX_ROWS = 500;
const IMPORT_CHUNK_MAX_BYTES = 900 * 1024;

const splitImportRows = (students) => {
  const chunks = [];
  let chunk = [];
  let chunkBytes = 0;

  students.forEach((student) => {
    const rowBytes = new Blob([JSON.stringify(student)]).size;
    if (
      chunk.length &&
      (chunk.length >= IMPORT_CHUNK_MAX_ROWS ||
        chunkBytes + rowBytes > IMPORT_CHUNK_MAX_BYTES)
    ) {
      chunks.push(chunk);
      chunk = [];
      chunkBytes = 0;
    }
    chunk.push(student);
    chunkBytes += rowBytes;
  });

  if (chunk.length) chunks.push(chunk);
  return chunks;
};

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
    const res =
      payload instanceof FormData
        ? await api.post("/students", payload, multipartConfig)
        : await api.post("/students", payload);

    return res.data;
  },

  update: async (id, payload) => {
    const res =
      payload instanceof FormData
        ? await api.patch(`/students/${id}`, payload, multipartConfig)
        : await api.patch(`/students/${id}`, payload);

    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await api.patch(`/students/${id}/status`, { status });
    return res.data;
  },

  importBulk: async (payload = {}) => {
    const students = Array.isArray(payload) ? payload : payload.students || [];
    let destination = Array.isArray(payload) ? {} : payload.destination || {};
    const duplicateMode = Array.isArray(payload) ? "skip" : payload.duplicateMode || "skip";
    const allowProvisional =
      !Array.isArray(payload) && payload.allowProvisional === true;
    const chunks = splitImportRows(students);
    const combined = {
      totalRows: students.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      warnings: [],
      errors: [],
      destination: null,
    };

    for (const chunk of chunks) {
      const res = await api.post("/students/import", {
        students: chunk,
        destination,
        duplicateMode,
        allowProvisional,
      });
      const summary = res.data?.data || {};

      combined.imported += Number(summary.imported || 0);
      combined.skipped += Number(summary.skipped || 0);
      combined.failed += Number(summary.failed || 0);
      combined.warnings.push(...(summary.warnings || []));
      combined.errors.push(...(summary.errors || []));

      if (summary.destination) {
        combined.destination = summary.destination;
        destination = {
          branchMode: "existing",
          branchId: summary.destination.branchId,
          batchMode: "existing",
          batchId: summary.destination.batchId,
        };
      }
    }

    return {
      success: true,
      message: "Student import completed",
      data: combined,
    };
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
export const importStudents = studentApi.importBulk;
export const deleteStudent = studentApi.remove;

export default studentApi;
