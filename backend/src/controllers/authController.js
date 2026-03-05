import User from "../models/User.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import generateToken from "../utils/generateToken.js"; // 🛡️ Importación necesaria para el login

/**
 * @desc    Autenticar usuario y obtener token (Login)
 * @route   POST /api/users/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. 🛡️ CWE-1287 Fix: Validar presencia y que ESTRICTAMENTE sean strings
  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    return next(
      new AppError("Por favor, proporciona credenciales válidas", 400),
    );
  }

  // 2. Buscar usuario
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  // 3. Validar existencia y contraseña
  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError("Correo o contraseña incorrectos", 401));
  }

  // 4. Verificar que el usuario no esté desactivado
  if (!user.isActive) {
    return next(
      new AppError(
        "Tu cuenta está desactivada. Contacta al administrador.",
        403,
      ),
    );
  }

  // 5. Generar el JWT
  const token = generateToken(user._id);

  // 6. Limpiar el password de la respuesta por seguridad
  user.password = undefined;

  // 7. Enviar respuesta exitosa
  sendResponse(
    res,
    200,
    {
      user,
      token,
    },
    "Sesión iniciada correctamente",
  );
});

/**
 * @desc    Registrar un nuevo miembro del staff
 * @route   POST /api/users
 * @access  Private (Admin Only)
 */
const registerUser = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // 1. 🛡️ CWE-1287 Fix: Prevenir inyección de objetos en el email
  if (!email || typeof email !== "string") {
    return next(new AppError("El formato del correo es inválido", 400));
  }

  // 2. Evitar duplicados
  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return next(
      new AppError("Ya existe un usuario con este correo electrónico", 400),
    );
  }

  // 3. Crear usuario con trazabilidad (quién lo dio de alta)
  const user = new User({
    ...req.body,
    createdBy: req.user._id,
  });

  await user.save();

  // 4. Respuesta limpia
  sendResponse(res, 201, user, "Miembro del equipo registrado exitosamente");
});

/**
 * @desc    Obtener todos los miembros del staff activos
 * @route   GET /api/users
 * @access  Private (Admin Only)
 */
const getUsers = asyncHandler(async (req, res, next) => {
  // Filtramos solo los activos por defecto para el dashboard
  const users = await User.find({ isActive: true })
    .select("-password")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, users);
});

/**
 * @desc    Obtener perfil del usuario actual (logueado)
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res, next) => {
  // El usuario ya viene en req.user gracias al middleware checkAuth
  sendResponse(res, 200, req.user);
});

/**
 * @desc    Obtener un miembro del staff por su ID
 * @route   GET /api/users/:id
 * @access  Private (Admin Only)
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user || !user.isActive) {
    return next(new AppError("Usuario no encontrado o inactivo", 404));
  }

  sendResponse(res, 200, user);
});

/**
 * @desc    Actualizar datos de un miembro del staff
 * @route   PUT /api/users/:id
 * @access  Private (Admin Only)
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("Usuario no encontrado", 404));
  }

  // Protección: No permitir que un admin se desactive a sí mismo por error
  if (
    req.params.id === req.user._id.toString() &&
    req.body.isActive === false
  ) {
    return next(
      new AppError(
        "No puedes desactivar tu propia cuenta de administrador",
        400,
      ),
    );
  }

  // Actualización de campos permitidos
  if (req.body.name) user.name = req.body.name;
  if (req.body.role) user.role = req.body.role;
  if (req.body.phone) user.phone = req.body.phone;
  if (typeof req.body.isActive === "boolean") user.isActive = req.body.isActive;

  const updatedUser = await user.save();
  sendResponse(res, 200, updatedUser, "Usuario actualizado correctamente");
});

/**
 * @desc    Desactivar miembro del staff (Soft Delete)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin Only)
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("Usuario no encontrado", 404));
  }

  // Evitar auto-eliminación
  if (req.params.id === req.user._id.toString()) {
    return next(
      new AppError("Acción denegada: No puedes eliminarte a ti mismo", 400),
    );
  }

  user.isActive = false;
  await user.save();

  sendResponse(res, 200, null, "Usuario desactivado correctamente");
});

// --- EXPORTACIÓN AGRUPADA ---
export {
  registerUser,
  getUsers,
  getProfile,
  getUserById,
  updateUser,
  deleteUser,
};
