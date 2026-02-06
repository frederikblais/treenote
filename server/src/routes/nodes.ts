import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { nodes } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

export const nodesRouter = Router();
nodesRouter.use(authMiddleware);

// GET /api/nodes — full tree (flat, no content)
nodesRouter.get("/", async (req, res) => {
  const userId = req.user!.userId;
  const result = await db
    .select({
      id: nodes.id,
      parentId: nodes.parentId,
      name: nodes.name,
      type: nodes.type,
      sortOrder: nodes.sortOrder,
      createdAt: nodes.createdAt,
      updatedAt: nodes.updatedAt,
    })
    .from(nodes)
    .where(eq(nodes.userId, userId))
    .orderBy(nodes.sortOrder);
  res.json(result);
});

// GET /api/nodes/:id — single node with content
nodesRouter.get("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  const result = await db
    .select()
    .from(nodes)
    .where(and(eq(nodes.id, id), eq(nodes.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  res.json(result[0]);
});

const createSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["folder", "note"]),
  parentId: z.number().nullable().optional(),
  content: z.string().optional(),
});

// POST /api/nodes — create node
nodesRouter.post("/", async (req, res) => {
  const userId = req.user!.userId;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { name, type, parentId, content } = parsed.data;

  // Get max sort order for siblings
  const siblings = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${nodes.sortOrder}), -1)` })
    .from(nodes)
    .where(
      and(
        eq(nodes.userId, userId),
        parentId
          ? eq(nodes.parentId, parentId)
          : sql`${nodes.parentId} IS NULL`
      )
    );

  const sortOrder = (siblings[0]?.maxOrder ?? -1) + 1;

  const result = await db
    .insert(nodes)
    .values({
      userId,
      parentId: parentId ?? null,
      name,
      type,
      content: content ?? "",
      sortOrder,
    })
    .returning();

  res.status(201).json(result[0]);
});

const reorderSchema = z.object({
  nodeId: z.number(),
  parentId: z.number().nullable(),
  sortOrder: z.number(),
});

// PATCH /api/nodes/reorder — move/reorder a node (must be before /:id)
nodesRouter.patch("/reorder", async (req, res) => {
  const userId = req.user!.userId;
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { nodeId, parentId, sortOrder } = parsed.data;

  // Shift siblings at the target position
  await db.run(sql`
    UPDATE nodes
    SET sort_order = sort_order + 1
    WHERE user_id = ${userId}
      AND ${parentId ? sql`parent_id = ${parentId}` : sql`parent_id IS NULL`}
      AND sort_order >= ${sortOrder}
      AND id != ${nodeId}
  `);

  const result = await db
    .update(nodes)
    .set({
      parentId: parentId,
      sortOrder: sortOrder,
      updatedAt: sql`datetime('now')`,
    })
    .where(and(eq(nodes.id, nodeId), eq(nodes.userId, userId)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  res.json(result[0]);
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  parentId: z.number().nullable().optional(),
  sortOrder: z.number().optional(),
});

// PATCH /api/nodes/:id — update node
nodesRouter.patch("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  updates.updatedAt = sql`datetime('now')`;

  const result = await db
    .update(nodes)
    .set(updates)
    .where(and(eq(nodes.id, id), eq(nodes.userId, userId)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  res.json(result[0]);
});

// DELETE /api/nodes/:id — delete node + children (recursive)
nodesRouter.delete("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);

  // Verify ownership
  const node = await db
    .select({ id: nodes.id })
    .from(nodes)
    .where(and(eq(nodes.id, id), eq(nodes.userId, userId)))
    .limit(1);

  if (node.length === 0) {
    res.status(404).json({ error: "Node not found" });
    return;
  }

  // Recursive delete using CTE
  await db.run(sql`
    WITH RECURSIVE descendants(id) AS (
      SELECT id FROM nodes WHERE id = ${id}
      UNION ALL
      SELECT n.id FROM nodes n JOIN descendants d ON n.parent_id = d.id
    )
    DELETE FROM nodes WHERE id IN (SELECT id FROM descendants)
  `);

  res.json({ success: true });
});

