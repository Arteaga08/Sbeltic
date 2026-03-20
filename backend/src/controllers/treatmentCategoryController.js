import TreatmentCategory from "../models/clinical/TreatmentCategory.js";

// GET /api/treatment-categories
export const getTreatmentCategories = async (req, res) => {
  try {
    const { botFlow, active } = req.query;

    const filter = {};
    if (botFlow) filter.botFlow = botFlow;
    if (active !== "false") filter.isActive = true; // por defecto solo activas

    const categories = await TreatmentCategory.find(filter)
      .sort({ name: 1 })
      .populate("createdBy", "name");

    res.json({ status: "success", data: categories });
  } catch (err) {
    console.error("❌ [TreatmentCategory] getTreatmentCategories:", err.message);
    res.status(500).json({ status: "error", message: "Error al obtener categorías" });
  }
};

// POST /api/treatment-categories
export const createTreatmentCategory = async (req, res) => {
  try {
    const existing = await TreatmentCategory.findOne({ slug: req.body.slug });
    if (existing) {
      return res.status(409).json({
        status: "fail",
        message: `Ya existe una categoría con el slug "${req.body.slug}"`,
      });
    }

    const category = await TreatmentCategory.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({ status: "success", data: category });
  } catch (err) {
    console.error("❌ [TreatmentCategory] createTreatmentCategory:", err.message);
    res.status(500).json({ status: "error", message: "Error al crear categoría" });
  }
};

// PUT /api/treatment-categories/:id
export const updateTreatmentCategory = async (req, res) => {
  try {
    // Si se cambia el slug, verificar que no exista otro con ese slug
    if (req.body.slug) {
      const existing = await TreatmentCategory.findOne({
        slug: req.body.slug,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({
          status: "fail",
          message: `Ya existe una categoría con el slug "${req.body.slug}"`,
        });
      }
    }

    const category = await TreatmentCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!category) {
      return res.status(404).json({ status: "fail", message: "Categoría no encontrada" });
    }

    res.json({ status: "success", data: category });
  } catch (err) {
    console.error("❌ [TreatmentCategory] updateTreatmentCategory:", err.message);
    res.status(500).json({ status: "error", message: "Error al actualizar categoría" });
  }
};

// DELETE /api/treatment-categories/:id  (soft delete)
export const deleteTreatmentCategory = async (req, res) => {
  try {
    const category = await TreatmentCategory.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!category) {
      return res.status(404).json({ status: "fail", message: "Categoría no encontrada" });
    }

    res.json({ status: "success", message: "Categoría desactivada", data: category });
  } catch (err) {
    console.error("❌ [TreatmentCategory] deleteTreatmentCategory:", err.message);
    res.status(500).json({ status: "error", message: "Error al eliminar categoría" });
  }
};
