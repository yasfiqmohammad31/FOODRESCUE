import { Hono } from "hono";
import { db } from "../../db/mock-db";
import type { Env } from "../../types";

export const impactRouter = new Hono<{ Bindings: Env }>();

// GET /impact/me
impactRouter.get("/me", (c) => {
  const userId = c.req.query("userId") || "usr-cns-001";
  const stats = db.impactStats[userId] || {
    userId,
    portionsSaved: 0,
    co2eSavedKg: 0,
    treesEquivalent: 0,
    moneySavedRp: 0,
    updatedAt: new Date().toISOString(),
  };

  const badges = [
    {
      id: "bdg-01",
      name: "First Rescue",
      description: "Menyelamatkan porsi makanan surplus pertamamu.",
      earnedAt: stats.portionsSaved >= 1 ? new Date().toISOString() : null,
      progress: Math.min(100, Math.round((stats.portionsSaved / 1) * 100)),
    },
    {
      id: "bdg-02",
      name: "Rescue Regular",
      description: "Telah menyelamatkan 10 porsi makanan dari pembuangan.",
      earnedAt: stats.portionsSaved >= 10 ? new Date().toISOString() : null,
      progress: Math.min(100, Math.round((stats.portionsSaved / 10) * 100)),
    },
    {
      id: "bdg-03",
      name: "Carbon Warrior",
      description: "Mencegah minimal 50 kg emisi CO2e ke atmosfer.",
      earnedAt: stats.co2eSavedKg >= 50 ? new Date().toISOString() : null,
      progress: Math.min(100, Math.round((stats.co2eSavedKg / 50) * 100)),
    },
  ];

  return c.json({
    success: true,
    stats,
    badges,
  });
});
