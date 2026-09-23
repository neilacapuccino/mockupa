// event routes - PUBLIC list (optionalAuth), register / cancel with rules
import { Router } from "express";
import { JwtPayload } from "jsonwebtoken";
import { pool } from "./db";
import { Event } from "./types";
import { validateResource } from "./validate";
import { createEventSchema, eventIdSchema } from "./schemas";
import { authenticateToken, optionalAuth } from "./authMiddleware";

const router = Router();


// the SELECT every route below uses. For each event it adds:
//   registered_count -> how many signed up          (COUNT)
//   seats_left       -> capacity minus that
//   is_past          -> did it already start?       (compare with NOW())
//   is_registered    -> did the user in $1 sign up? (false for guests: $1 is null)
// BOOL_OR = "true if at least one row is true"
const EVENT_SELECT = `
  SELECT e.*,
         COUNT(r.id)::int AS registered_count,
         (e.capacity - COUNT(r.id))::int AS seats_left,
         (e.starts_at < NOW()) AS is_past,
         COALESCE(BOOL_OR(r.user_id = $1), false) AS is_registered
  FROM events e
  LEFT JOIN registrations r ON r.event_id = e.id`;

// helper: ONE event (as seen by this user)
const findEvent = async (eventId: string, userId: string | null) => {
  const result = await pool.query(
    `${EVENT_SELECT}
     WHERE e.id = $2
     GROUP BY e.id`,
    [userId, eventId]
  );

  return result.rows[0];
};

// read the user id IF someone is logged in (optionalAuth may leave req.user empty)
const getUserId = (user: unknown): string | null => {
  return user ? (user as JwtPayload).userId : null;
};


// ========================================
// GET ALL EVENTS                    (PUBLIC - token optional)
// GET /api/events
//
// Guests:     every event, is_registered is always false
// Logged in:  same list, but is_registered shows YOUR sign-ups
//
// Response 200:
// [ { "id": "...", "title": "React Workshop", "venue": "Room 301", "starts_at": "...",
//     "capacity": 30, "registered_count": 0, "seats_left": 30, "is_past": false, "is_registered": false } ]
// ========================================

router.get("/", optionalAuth, async (req, res) => {
  const userId = getUserId(req.user);

  try {
    const result = await pool.query(
      `${EVENT_SELECT}
       GROUP BY e.id
       ORDER BY e.starts_at ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// MY EVENTS                         (needs token)
// GET /api/events/mine
//
// Response 200: same shape as GET /api/events, only the ones you signed up for
// ========================================

router.get("/mine", authenticateToken, async (req, res) => {
  const userId = getUserId(req.user);

  try {
    const result = await pool.query(
      `${EVENT_SELECT}
       WHERE e.id IN (SELECT event_id FROM registrations WHERE user_id = $1)
       GROUP BY e.id
       ORDER BY e.starts_at ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});


// ========================================
// CREATE AN EVENT                   (needs token)
// POST /api/events
//
// Body JSON: { "title": "Git Basics", "venue": "Lab 1", "starts_at": "2026-10-01T14:30", "capacity": 25 }
//
// Response 201: { ...the new event (same shape as the list) }
// Response 400: { "error": "The event must be in the future" }
// ========================================

router.post(
  "/",
  authenticateToken,
  validateResource(createEventSchema),
  async (req, res) => {
    const userId = getUserId(req.user);
    const { title, venue, starts_at, capacity }: Event = req.body;

    // CONDITION: no events in the past
    if (new Date(starts_at) < new Date()) {
      return res.status(400).json({
        error: "The event must be in the future",
      });
    }

    try {
      const result = await pool.query(
        `INSERT INTO events (title, venue, starts_at, capacity, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [title, venue, starts_at, capacity, userId]
      );

      res.status(201).json(await findEvent(result.rows[0].id, userId));
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


// ========================================
// REGISTER FOR AN EVENT             (needs token)
// POST /api/events/:id/register
//
// RULES (checked in this order):
//   event doesn't exist      -> 404
//   event already started    -> 400
//   you already signed up    -> 409
//   no seats left            -> 409
//
// Response 201: { ...the event, now with is_registered: true }
// ========================================

router.post(
  "/:id/register",
  authenticateToken,
  validateResource(eventIdSchema),
  async (req, res) => {
    const userId = getUserId(req.user);
    const id = req.params.id as string;

    try {
      const event = await findEvent(id, userId);

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
        });
      }

      if (event.is_past) {
        return res.status(400).json({
          error: "This event already started",
        });
      }

      if (event.is_registered) {
        return res.status(409).json({
          error: "You are already registered",
        });
      }

      if (event.seats_left <= 0) {
        return res.status(409).json({
          error: "Sorry, this event is full",
        });
      }

      await pool.query(
        `INSERT INTO registrations (event_id, user_id)
         VALUES ($1, $2)`,
        [id, userId]
      );

      res.status(201).json(await findEvent(id, userId));
    } catch (error: any) {
      // two clicks at the same time -> the UNIQUE (event_id, user_id) catches it
      if (error.code === "23505") {
        return res.status(409).json({
          error: "You are already registered",
        });
      }

      res.status(500).json({
        error: error.message,
      });
    }
  }
);


// ========================================
// CANCEL MY REGISTRATION            (needs token)
// DELETE /api/events/:id/register
//
// Response 200: { ...the event, now with is_registered: false }
// Response 400: { "error": "You can't cancel a past event" }
// Response 404: { "error": "You are not registered for this event" }
// ========================================

router.delete(
  "/:id/register",
  authenticateToken,
  validateResource(eventIdSchema),
  async (req, res) => {
    const userId = getUserId(req.user);
    const id = req.params.id as string;

    try {
      const event = await findEvent(id, userId);

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
        });
      }

      if (event.is_past) {
        return res.status(400).json({
          error: "You can't cancel a past event",
        });
      }

      const result = await pool.query(
        `DELETE FROM registrations
         WHERE event_id = $1 AND user_id = $2
         RETURNING *`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "You are not registered for this event",
        });
      }

      res.json(await findEvent(id, userId));
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);


export default router;
