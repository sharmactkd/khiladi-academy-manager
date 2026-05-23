import api from "../api";

export const getStudentsReport = async (params = {}) => {
  const res = await api.get("/reports/students", { params });
  return res.data;
};

export const getAttendanceReport = async (params = {}) => {
  const res = await api.get("/reports/attendance", { params });
  return res.data;
};

export const getFeesReport = async (params = {}) => {
  const res = await api.get("/reports/fees", { params });
  return res.data;
};

export const getBeltTestsReport = async (params = {}) => {
  const res = await api.get("/reports/belt-tests", { params });
  return res.data;
};

export const getChampionshipsReport = async (params = {}) => {
  const res = await api.get("/reports/championships", { params });
  return res.data;
};

export const getCertificatesReport = async (params = {}) => {
  const res = await api.get("/reports/certificates", { params });
  return res.data;
};

export const getIdCardsReport = async (params = {}) => {
  const res = await api.get("/reports/id-cards", { params });
  return res.data;
};

export const getBranchesReport = async (params = {}) => {
  const res = await api.get("/reports/branches", { params });
  return res.data;
};

export const getReportByType = async (reportType, params = {}) => {
  const reportMap = {
    students: getStudentsReport,
    attendance: getAttendanceReport,
    fees: getFeesReport,
    "belt-tests": getBeltTestsReport,
    championships: getChampionshipsReport,
    certificates: getCertificatesReport,
    "id-cards": getIdCardsReport,
    branches: getBranchesReport,
  };

  const handler = reportMap[reportType];

  if (!handler) {
    throw new Error("Invalid report type");
  }

  return handler(params);
};