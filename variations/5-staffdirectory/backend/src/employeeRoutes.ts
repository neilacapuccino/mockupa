// employee routes - filters, sorting, pagination, soft delete
import { Router } from "express";
import { pool } from "./db";
import { Employee } from "./types";
import { validateResource } from "./validate";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdSchema,
  employeeQuerySchema,
} from "./schemas";
import { authenticateToken } from "./authMiddleware";

const router = Router();


// helper used by several routes: ONE employee + the NAME of their department (JOIN)
const findEmployee = async (id: string) => {
  const result = await pool.query(
    `SELECT e.*, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.id = $1`,
    [id]
  );

  return result.rows[0];
};


// ========================================
// GET EMPLOYEES (filter + sort + pages)
// GET /api/employees
//
// Query params (ALL optional):
//   search=ana               first name, last name or position contains "ana"
//   department_id=<uuid>     only this department
//   status=active            active (default) | inactive | all
//   sort=salary              last_name (default) | salary | hire_date
//   order=desc               asc (default) | desc
//   page=2                   which page (default 1)
//   limit=5                  rows per page (default 5)
//
// Response 200 (NEW shape - the rows + info about the pages):
// {
//   "data": [ { "id": "...", "first_name": "Ana", ..., "department_name": "Engineering" } ],
//   "total": 21, "page": 1, "limit": 5, "totalPages": 5
// }
// ========================================

router.get(
  "/",
  authenticateToken,
  validateResource(employeeQuerySchema),
  async (req, res) => {
    const { search, department_id, status, sort, order, page, limit } = req.query;

    try {
      // ---- 1. build the WHERE part from the filters that were sent ----
      const conditions: string[] = [];
      const values: string[] = [];

      if (typeof search === "string" && search !== "") {
        values.push(`%${search}%`);
        // $1, $2... = the position of the value in the "values" array
        const n = values.length;
        conditions.push(`(e.first_name ILIKE $${n} OR e.last_name ILIKE $${n} OR e.position ILIKE $${n})`);
      }

      if (typeof department_id === "string") {
        values.push(department_id);
        conditions.push(`e.department_id = $${values.length}`);
      }

      // status: "active" is the default, "all" adds no condition
      const statusFilter = typeof status === "string" ? status : "active";

      if (statusFilter === "active") conditions.push("e.is_active = true");
      if (statusFilter === "inactive") conditions.push("e.is_active = false");

      // e.g. "WHERE e.department_id = $1 AND e.is_active = true"   (or "" if no filters)
      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // ---- 2. sorting ----
      // safe to put directly in the SQL ONLY because zod allows just 3 column names
      const sortColumn = typeof sort === "string" ? sort : "last_name";
      const sortOrder = order === "desc" ? "DESC" : "ASC";

      // ---- 3. pages ----
      const pageNumber = Number(page ?? "1");
      const limitNumber = Number(limit ?? "5");
      const offset = (pageNumber - 1) * limitNumber;   // page 3 with limit 5 -> skip 10 rows

      // ---- 4. count ALL matching rows (for "page 1 of 5") ----
      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total
         FROM employees e
         ${where}`,
        values
      );

      const total = countResult.rows[0].total;

      // ---- 5. get ONE page of rows ----
      const result = await pool.query(
        `SELECT e.*, d.name AS department_name
         FROM employees e
         LEFT JOIN departments d ON d.id = e.department_id
         ${where}
         ORDER BY e.${sortColumn} ${sortOrder}, e.first_name ASC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limitNumber, offset]
      );

      res.json({
        data: result.rows,
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.max(1, Math.ceil(total / limitNumber)),
      });
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// GET ONE EMPLOYEE
// GET /api/employees/:id
//
// Response 200: { ...employee, "department_name": "Engineering" }
// Response 404: { "error": "Employee not found" }
// ========================================

router.get(
  "/:id",
  authenticateToken,
  validateResource(employeeIdSchema),
  async (req, res) => {
    try {
      const employee = await findEmployee(req.params.id as string);

      if (!employee) {
        return res.status(404).json({
          error: "Employee not found",
        });
      }

      res.json(employee);
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// ADD AN EMPLOYEE
// POST /api/employees
//
// Body JSON:
// {
//   "first_name": "Juan", "last_name": "Dela Cruz", "email": "juan@company.com",
//   "phone": "0917-000-0000",                   optional
//   "department_id": "<uuid from /api/departments>",   optional
//   "position": "Developer",
//   "employment_type": "full_time",             optional (full_time | part_time | contract)
//   "salary": 50000,                            NUMBER
//   "hire_date": "2026-09-24"
// }
//
// Response 201: { ...the new employee with department_name }
// Response 409: { "error": "Email already exists" }
// ========================================

router.post(
  "/",
  authenticateToken,
  validateResource(createEmployeeSchema),
  async (req, res) => {
    const {
      first_name,
      last_name,
      email,
      phone,
      department_id,
      position,
      employment_type,
      salary,
      hire_date,
    }: Employee = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO employees
           (first_name, last_name, email, phone, department_id, position, employment_type, salary, hire_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          first_name,
          last_name,
          email,
          phone ?? null,
          department_id ?? null,
          position,
          employment_type ?? "full_time",
          salary,
          hire_date,
        ]
      );

      // send it back WITH the department name
      res.status(201).json(await findEmployee(result.rows[0].id));
    } catch (error: any) {
      console.error(error);

      // UNIQUE violation on email
      if (error.code === "23505") {
        return res.status(409).json({
          error: "Email already exists",
        });
      }

      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);


// ========================================
// UPDATE AN EMPLOYEE
// PUT /api/employees/:id
//
// Body JSON: any of the POST fields, e.g.
// { "salary": 60000, "position": "Senior Developer" }
//
// Response 200: { ...the updated employee with department_name }
// Response 404: { "error": "Employee not found" }
// Response 409: { "error": "Email already exists" }
// ========================================

router.put(
  "/:id",
  authenticateToken,
  validateResource(updateEmployeeSchema),
  async (req, res) => {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      department_id,
      position,
      employment_type,
      salary,
      hire_date,
    }: Employee = req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "No fields provided for update",
      });
    }

    try {
      // same COALESCE idea as practice-c, just more columns
      const result = await pool.query(
        `UPDATE employees
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             email = COALESCE($3, email),
             phone = COALESCE($4, phone),
             department_id = COALESCE($5, department_id),
             position = COALESCE($6, position),
             employment_type = COALESCE($7, employment_type),
             salary = COALESCE($8, salary),
             hire_date = COALESCE($9, hire_date)
         WHERE id = $10
         RETURNING id`,
        [
          first_name ?? null,
          last_name ?? null,
          email ?? null,
          phone ?? null,
          department_id ?? null,
          position ?? null,
          employment_type ?? null,
          salary ?? null,
          hire_date ?? null,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Employee not found",
        });
      }

      res.json(await findEmployee(id as string));
    } catch (error: any) {
      console.error(error);

      if (error.code === "23505") {
        return res.status(409).json({
          error: "Email already exists",
        });
      }

      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);


// ========================================
// REACTIVATE AN EMPLOYEE
// PATCH /api/employees/:id/reactivate
//
// Response 200: { ...employee (is_active: true) }
// Response 404: { "error": "Employee not found" }
// Response 409: { "error": "Employee is already active" }
// ========================================

router.patch(
  "/:id/reactivate",
  authenticateToken,
  validateResource(employeeIdSchema),
  async (req, res) => {
    const id = req.params.id as string;

    try {
      const employee = await findEmployee(id);

      if (!employee) {
        return res.status(404).json({
          error: "Employee not found",
        });
      }

      if (employee.is_active) {
        return res.status(409).json({
          error: "Employee is already active",
        });
      }

      await pool.query(
        `UPDATE employees
         SET is_active = true
         WHERE id = $1`,
        [id]
      );

      res.json(await findEmployee(id));
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// DEACTIVATE AN EMPLOYEE  (NEW: "soft delete")
// DELETE /api/employees/:id
//
// The row is NOT removed - is_active becomes false.
// (HR still needs old records, so real apps rarely delete people)
//
// Response 200: { ...employee (is_active: false) }
// Response 404: { "error": "Employee not found" }
// Response 409: { "error": "Employee is already inactive" }
// ========================================

router.delete("/:id", authenticateToken, async (req, res) => {
  const id = req.params.id as string;

  try {
    const employee = await findEmployee(id);

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    if (!employee.is_active) {
      return res.status(409).json({
        error: "Employee is already inactive",
      });
    }

    await pool.query(
      `UPDATE employees
       SET is_active = false
       WHERE id = $1`,
      [id]
    );

    res.json(await findEmployee(id));
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


export default router;
