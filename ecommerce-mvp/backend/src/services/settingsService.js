/**
 * Settings Service
 * ---------------------------------------------------------------
 * Generic key-value config store so operational values (OTP
 * threshold, expiry, attempt limits, etc.) are editable from the
 * dashboard rather than hardcoded or env-only (NFR-012).
 * ---------------------------------------------------------------
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fallback defaults used only if the setting has never been saved yet.
const DEFAULTS = {
  otp_threshold_sdg: '1000000',
  otp_expiry_minutes: '5',
  otp_max_attempts: '3',
};

async function getSetting(key, fallback) {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (row) return row.value;
  return fallback !== undefined ? fallback : DEFAULTS[key];
}

async function setSetting(key, value, updatedBy) {
  return prisma.setting.upsert({
    where: { key },
    update: { value: String(value), updatedBy },
    create: { key, value: String(value), updatedBy },
  });
}

async function getAllSettings() {
  const rows = await prisma.setting.findMany();
  const map = { ...DEFAULTS };
  rows.forEach((r) => { map[r.key] = r.value; });
  return map;
}

async function getOtpThresholdSdg() {
  const value = await getSetting('otp_threshold_sdg');
  return Number(value);
}

async function getOtpExpiryMinutes() {
  const value = await getSetting('otp_expiry_minutes');
  return Number(value);
}

async function getOtpMaxAttempts() {
  const value = await getSetting('otp_max_attempts');
  return Number(value);
}

module.exports = {
  getSetting,
  setSetting,
  getAllSettings,
  getOtpThresholdSdg,
  getOtpExpiryMinutes,
  getOtpMaxAttempts,
  DEFAULTS,
};
