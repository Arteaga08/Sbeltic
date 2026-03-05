// src/utils/asyncHandler.js
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Es vital que 'next' esté en la línea de arriba y se pase a la de abajo
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
