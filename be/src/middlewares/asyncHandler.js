// Wrapper để catch lỗi từ async functions và chuyển cho error handler
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

