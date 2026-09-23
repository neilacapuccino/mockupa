# Zod (short)

## 🗺️ The 4 parts of a request

| | Part | What it is | Example |
|---|---|---|---|
| 🟦 | **body** | JSON sent by client | `{ "title": "Printer broken" }` |
| 🟩 | **params** | values inside the URL path | `/api/incidents/3` → `id = 3` |
| 🟨 | **query** | values after `?` in the URL | `?status=open` → `status = open` |
| 🟪 | **headers** | request headers like Authorization | `Authorization: Bearer abc123` |

### 🟦 body
→ JSON sent by client
```http
POST /api/incidents
```
```json
{
  "title": "Printer broken"
}
```

### 🟩 params
→ values inside the URL path
```http
GET /api/incidents/3
```
```ts
// params:
id = 3
```

### 🟨 query
→ values after ? in the URL
```http
GET /api/incidents?status=open
```
```ts
// query:
status = open
```

### 🟪 headers
→ request headers like Authorization
```http
Authorization: Bearer abc123
```
```ts
// headers:
authorization = "Bearer abc123"
```

### ⚙️ How the validator uses them
In your current validator, you'll probably pass something like:
```ts
schema.parse({
  body: req.body,      // 🟦
  params: req.params,  // 🟩
  query: req.query,    // 🟨
});
```

---

## 📝 Register schema example
```ts
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters"),

    email: z.email("Must be a valid email"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    role: z
      .enum(["user", "admin"])
      .default("user"),
  }),
});
```

## 🔐 Password rules
```ts
password: z
  .string()
  .regex(/^[A-Za-z]+$/, "Password must contain letters only")

password: z
  .string()
  .regex(/^\d+$/, "Password must contain numbers only")
```

---

## 🧰 Zod methods

```ts
import { z } from "zod";
```

### 🔤 String
```ts
// ========================================
// STRING
// ========================================

const username = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must not exceed 20 characters")
  .regex(
    /^[A-Za-z0-9]+$/,
    "Username must contain letters and numbers only"
  );
```

### 🔢 Number
```ts
// ========================================
// NUMBER
// ========================================

const age = z
  .number()
  .min(18, "Age must be at least 18")
  .max(100, "Age must not exceed 100");
```

### ✅ Boolean
```ts
// ========================================
// BOOLEAN
// ========================================

const isActive = z.boolean();
```

### 📋 Array
```ts
// ========================================
// ARRAY
// ========================================

const tags = z
  .array(z.string())
  .min(1, "At least one tag is required")
  .max(5, "Maximum of 5 tags allowed");
```

### 📦 Object
```ts
// ========================================
// OBJECT
// ========================================

const user = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters"),

  age: z
    .number()
    .min(18, "Must be at least 18"),
});
```

### 🎯 Enum
```ts
// ========================================
// ENUM
// ========================================

const role = z.enum(
  ["admin", "user", "staff"],
  {
    error: "Role must be admin, user, or staff",
  }
);
```

### ⬇️ Min
```ts
// ========================================
// MIN
// ========================================

const password = z
  .string()
  .min(8, "Password must be at least 8 characters");
```

### ⬆️ Max
```ts
// ========================================
// MAX
// ========================================

const title = z
  .string()
  .max(100, "Title must not exceed 100 characters");
```

### 📏 Length
```ts
// ========================================
// LENGTH
// ========================================

const pin = z
  .string()
  .length(4, "PIN must be exactly 4 characters");
```

### 🔍 Regex
```ts
// ========================================
// REGEX
// ========================================

// numbers only
const numberPassword = z
  .string()
  .regex(
    /^\d+$/,
    "Password must contain numbers only"
  );

// letters only
const letterPassword = z
  .string()
  .regex(
    /^[A-Za-z]+$/,
    "Password must contain letters only"
  );

// must contain uppercase + number
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /[A-Z]/,
    "Password must contain an uppercase letter"
  )
  .regex(
    /[0-9]/,
    "Password must contain a number"
  );
```

### ❔ Optional
```ts
// ========================================
// OPTIONAL
// ========================================

const nickname = z
  .string()
  .min(2, "Nickname must be at least 2 characters")
  .optional();
```

---

## ✅❌ Quick guide with pass / fail examples

```ts
import { z } from "zod";
```
Most used first. ✅ = passes, ❌ = fails (with the real message).

---

## How it fits in a route
```ts
export const incidentBodySchema = z.object({
  title: z.string().min(1, "title is required"),
  severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
});

export const createIncidentSchema = z.object({
  body: incidentBodySchema,          // wrap it: body / params / query
});

router.post("/", authenticateToken, validateResource(createIncidentSchema), async (req, res) => { ... });
```
Wrong data → **400** `{ "error": "Validation failed", "details": [{ "path": "body.title", "message": "title is required" }] }`

---

## The 10 you need

**1. Required text**
```ts
title: z.string().min(1, "title is required"),
```
✅ `"Printer offline"` · ❌ `""` → `title is required`

**2. Optional**
```ts
description: z.string().optional(),
```
✅ missing is OK · in the route: `description ?? null`

**3. Default (ONE fallback value)**
```ts
severity: z.enum(["low", "medium", "high"]).default("low"),
is_pinned: z.boolean().default(false),
```
✅ missing → `"low"` · still write `severity ?? "low"` in the route

**4. Fixed choices**
```ts
status: z.enum(["open", "in_progress", "resolved"]),
```
✅ `"open"` · ❌ `"closed"` → `Invalid option: expected one of "open"|"in_progress"|"resolved"`

**5. Number**
```ts
score: z.number().int("score must be a whole number").min(0).max(100),
```
✅ `88` · ❌ `"88"` → `Invalid input: expected number, received string`
> Frontend: inputs give strings → send `Number(value)`

**6. True / false**
```ts
is_available: z.boolean(),
```
✅ `true` · ❌ `"true"` → `Invalid input: expected boolean, received string`
> Frontend: checkbox → `e.target.checked`

**7. Email**
```ts
email: z.email("Must be a valid email"),
```
✅ `"ana@company.com"` · ❌ `"abc"` → `Must be a valid email`

**8. Id in the URL**
```ts
params: z.object({ id: z.uuid("ID must be a valid id") }),              // UUID ids
params: z.object({ id: z.string().regex(/^\d+$/, "ID must be a number") }), // SERIAL ids
```
❌ `/api/incidents/abc` → `params.id: ID must be a valid id`

**9. Update schema (all fields optional)**
```ts
export const updateIncidentSchema = z.object({
  body: incidentBodySchema.partial(),
  params: z.object({ id: z.uuid("ID must be a valid id") }),
});
```
✅ `{ "status": "resolved" }` · `{}` also passes → check "No fields provided" in the route

**10. Pattern (ID numbers, phone, username)**
```ts
student_no: z.string().regex(/^\d{4}-\d{5}$/, "must look like 2024-00123"),
mobile: z.string().regex(/^09\d{9}$/, "must look like 09171234567"),
```
❌ `"12345"` → `must look like 2024-00123`
> `^`=start `$`=end `\d`=digit `{4}`=exactly 4

---

## Also good to know
| Need | Write | Example |
|---|---|---|
| max length | `z.string().max(150, "too long")` | match `VARCHAR(150)` |
| date | `z.iso.date()` | ✅ `"2026-10-15"` |
| date + time | `z.iso.datetime({ local: true })` | ✅ `"2026-10-01T14:30"` |
| list | `z.array(z.object({...})).min(1, "at least 1 item")` | ❌ `[]` → `at least 1 item` |
| can be null | `z.string().nullable()` | ✅ `null` |
| query `?page=2` | `z.string().regex(/^\d+$/)` → `Number(page)` in the route | query values are **strings** |
| query `?available=true` | `z.enum(["true", "false"])` → `=== "true"` in the route | not `z.boolean()` |
| 2 fields must match | check in the route: `if (password !== confirm_password)` | → 400 |
| TS type from a schema | `type X = z.infer<typeof xSchema>` | |

---

## Common mistakes
| ❌ Wrong | ✅ Right |
|---|---|
| `.default("low" "medium")` | `z.enum(["low", "medium"]).default("low")` |
| `is_pinned: z.string()` | `is_pinned: z.boolean().default(false)` |
| `z.string()` for a required field (accepts `""`) | `z.string().min(1, "... is required")` |
| `validateResource(incidentBodySchema)` | `validateResource(createIncidentSchema)` (the `{ body }` wrapper) |
| `error.errors` / `z.string().email()` (old v3) | `error.issues` / `z.email()` (v4) |
