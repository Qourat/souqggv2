import "server-only";

import { getSessionUser, requireAdmin, requireUser } from "@/shared/auth/session";

export const authController = {
  getSessionUser,
  requireUser,
  requireAdmin,
};
