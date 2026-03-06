import User from "../models/User.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import generateToken from "../utils/generateToken.js";

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const safeEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

  const user = await User.findOne({ email: safeEmail }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Correo o contraseña incorrectos", 401));
  }

  if (!user.isActive) {
    return next(new AppError("Cuenta desactivada. Contacta al soporte.", 403));
  }

  const token = generateToken(user._id);
  user.password = undefined;

  sendResponse(res, 200, { user, token }, "Sesión iniciada correctamente");
});

const registerUser = asyncHandler(async (req, res, next) => {

  const { email } = req.body;
  const safeEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

  const userExists = await User.findOne({ email: safeEmail });
  if (userExists) {
    return next(new AppError("Ya existe un usuario con este correo", 400));
  }

  // Creamos la instancia
  const user = new User({
    ...req.body,
    email: safeEmail,
    createdBy: req.user?._id, // Usamos el ? para que no truene si es undefined
  });

  console.log("Intentando guardar en MongoDB...");
  const savedUser = await user.save();

  sendResponse(res, 201, savedUser, "Miembro registrado correctamente");
});

const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({ isActive: true })
    .select("-password")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, users);
});

const getProfile = asyncHandler(async (req, res, next) => {
  sendResponse(res, 200, req.user);
});

const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user || !user.isActive)
    return next(new AppError("Usuario no encontrado", 404));
  sendResponse(res, 200, user);
});

const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) return next(new AppError("Usuario no encontrado", 404));
  sendResponse(res, 200, user, "Usuario actualizado correctamente");
});

const deleteUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  sendResponse(res, 200, null, "Usuario desactivado correctamente");
});

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export {
  login,
  registerUser,
  getUsers,
  getProfile,
  getUserById,
  updateUser,
  deleteUser,
};
