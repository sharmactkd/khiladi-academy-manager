export const apiResponse = (
  res,
  statusCode,
  success,
  message,
  data = null
) => {
  const response = {
    success,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const successResponse = (res, message, data = null, statusCode = 200) => {
  return apiResponse(res, statusCode, true, message, data);
};

export const errorResponse = (res, message, statusCode = 500, data = null) => {
  return apiResponse(res, statusCode, false, message, data);
};