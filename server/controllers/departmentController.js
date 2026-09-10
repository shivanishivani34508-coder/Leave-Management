const Department = require("../models/Department");

/* =========================================================
   GET ALL DEPARTMENTS
========================================================= */

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .sort({ name: 1 });

    return res.status(200).json(departments);

  } catch (error) {
    console.error("GET DEPARTMENTS ERROR:", error);

    return res.status(500).json({
      message: "Unable to fetch departments.",
    });
  }
};

/* =========================================================
   CREATE DEPARTMENT
========================================================= */

const createDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "Department name and code are required.",
      });
    }

    const existingDepartment = await Department.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() },
      ],
    });

    if (existingDepartment) {
      return res.status(400).json({
        message: "Department already exists.",
      });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description,
    });

    return res.status(201).json({
      message: "Department created successfully.",
      department,
    });

  } catch (error) {
    console.error("CREATE DEPARTMENT ERROR:", error);

    return res.status(500).json({
      message: "Unable to create department.",
    });
  }
};

/* =========================================================
   UPDATE DEPARTMENT
========================================================= */

const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found.",
      });
    }

    const {
      name,
      code,
      description,
      status,
    } = req.body;

    if (name) department.name = name.trim();
    if (code) department.code = code.trim().toUpperCase();
    if (description !== undefined)
      department.description = description;
    if (status) department.status = status;

    await department.save();

    return res.status(200).json({
      message: "Department updated successfully.",
      department,
    });

  } catch (error) {
    console.error("UPDATE DEPARTMENT ERROR:", error);

    return res.status(500).json({
      message: "Unable to update department.",
    });
  }
};

/* =========================================================
   DELETE DEPARTMENT
========================================================= */

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found.",
      });
    }

    await department.deleteOne();

    return res.status(200).json({
      message: "Department deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE DEPARTMENT ERROR:", error);

    return res.status(500).json({
      message: "Unable to delete department.",
    });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};