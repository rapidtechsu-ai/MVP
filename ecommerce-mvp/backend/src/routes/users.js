const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireRole = require('../middleware/requireRole');
const auditLog = require('../middleware/auditLog');
const { hashPassword } = require('../services/authService');

const prisma = new PrismaClient();

// Everything in this file manages staff accounts and permissions — the
// entire route group is restricted to the superuser role. Only a
// SYSTEM_ADMIN can create, edit, or deactivate other staff accounts.
router.use(requireRole('SYSTEM_ADMIN'));

function toSafeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function countActiveSuperusers(excludeId) {
  return prisma.user.count({
    where: {
      role: 'SYSTEM_ADMIN',
      active: true,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
}

// GET /admin/users — list all staff accounts
router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(users.map(toSafeUser));
  } catch (err) {
    next(err);
  }
});

// POST /admin/users — create a new staff account
router.post(
  '/',
  auditLog({ entity: 'User', action: 'CREATE', getEntityId: (req, body) => body.id }),
  async (req, res, next) => {
    try {
      const { name, email, password, role, mfaEnabled } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'name, email, password, and role are required.' });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: { name, email, passwordHash, role, mfaEnabled: !!mfaEnabled },
      });

      res.status(201).json(toSafeUser(user));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /admin/users/:id — update name/role/active/mfaEnabled
// Blocks any change that would leave zero active superusers, so the
// system can never be locked out of full administrative access.
router.put(
  '/:id',
  auditLog({
    entity: 'User',
    action: 'UPDATE',
    getEntityId: (req) => req.params.id,
    getBefore: async (req) => {
      const u = await prisma.user.findUnique({ where: { id: req.params.id } });
      return u ? toSafeUser(u) : null;
    },
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, role, active, mfaEnabled } = req.body;

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return res.status(404).json({ error: 'User not found.' });

      const isDemotingFromSuperuser = target.role === 'SYSTEM_ADMIN' && role && role !== 'SYSTEM_ADMIN';
      const isDeactivatingSuperuser = target.role === 'SYSTEM_ADMIN' && active === false;

      if (isDemotingFromSuperuser || isDeactivatingSuperuser) {
        const remaining = await countActiveSuperusers(id);
        if (remaining === 0) {
          return res.status(400).json({
            error: 'Cannot remove the last superuser. At least one active SYSTEM_ADMIN must always exist.',
          });
        }
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(role !== undefined && { role }),
          ...(active !== undefined && { active }),
          ...(mfaEnabled !== undefined && { mfaEnabled }),
        },
      });

      res.json(toSafeUser(updated));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /admin/users/:id/reset-password — admin-assisted password reset
// (no self-service "forgot password" flow exists yet, so this is how a
// locked-out staff member gets back in).
router.put(
  '/:id/reset-password',
  auditLog({ entity: 'User', action: 'PASSWORD_RESET', getEntityId: (req) => req.params.id }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'newPassword must be at least 8 characters.' });
      }

      const passwordHash = await hashPassword(newPassword);
      const updated = await prisma.user.update({ where: { id }, data: { passwordHash } });

      res.json(toSafeUser(updated));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
