import { Hono } from "hono";
import { db } from "../../db/mock-db";
import type { Env } from "../../types";

export const impactRouter = new Hono<{ Bindings: Env }>();

// GET /impact/me
impactRouter.get("/me", (c) => {
  const userId = c.req.query("userId") || "usr-cns-001";
  const stats = db.impactStats[userId] || {
    userId,
    portionsSaved: 14,
    co2eSavedKg: 35.0,
    treesEquivalent: 2.1,
    moneySavedRp: 320000,
    updatedAt: new Date().toISOString(),
  };

  const badges = [
    {
      id: "bdg-01",
      name: "First Rescue",
      description: "Menyelamatkan porsi makanan surplus pertamamu.",
      earnedAt: "2026-08-05T12:00:00Z",
    },
    {
      id: "bdg-02",
      name: "Rescue Regular",
      description: "Telah menyelamatkan 10 porsi makanan dari pembuangan.",
      earnedAt: "2026-08-22T19:30:00Z",
    },
    {
      id: "bdg-03",
      name: "Carbon Warrior",
      description: "Mencegah minimal 50 kg emisi CO2e ke atmosfer.",
      progress: Math.min(100, Math.round((stats.co2eSavedKg / 50) * 100)),
    },
  ];

  return c.json({
    success: true,
    stats,
    badges,
  });
});
