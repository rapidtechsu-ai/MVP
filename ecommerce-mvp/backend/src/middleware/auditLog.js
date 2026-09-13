/**
 * auditLog
 * ---------------------------------------------------------------
 * Wraps a route handler to record a before/after snapshot in the
 * AuditLog table after a successful mutation (Section 9: "Log
 * login, failed login, permission changes, FX/markup changes,
 * order overrides, cancellations, cash edits and supplier-payment
 * edits").
 *
 * Usage:
 *   router.post('/exchange-rates', requireRole('PRICING'),
 *     auditLog({ entity: 'ExchangeRate', action: 'CREATE' }),
 *     async (req, res) => { ... })
 *
 * The wrapped middleware runs BEFORE the route handler to capture
 * res.json output via monkey-patching res.json, so it can log the
 * actual persisted result without every route needing to remember
 * to call it manually.
 * ---------------------------------------------------------------
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function auditLog({ entity, action, getEntityId, getBefore }) {
  return async function (req, res, next) {
    let before = null;

    try {
      if (getBefore) {
        before = await getBefore(req);
      }
    } catch {
      // Non-fatal — audit logging should never block the actual request.
      before = null;
    }

    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Only log on success responses (2xx); errors are handled by the
      // route itself and don't represent a completed state change.
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = getEntityId ? getEntityId(req, body) : body?.id || req.params?.id || 'unknown';
        const actor = req.user?.email || req.customer?.mobile || 'unknown';

        prisma.auditLog
          .create({
            data: {
              actor,
              entity,
              entityId: String(entityId),
              action,
              beforeJson: before,
              afterJson: body,
            },
          })
          .catch((err) => console.error('[audit] failed to write log:', err.message));
      }

      return originalJson(body);
    };

    next();
  };
}

module.exports = auditLog;
