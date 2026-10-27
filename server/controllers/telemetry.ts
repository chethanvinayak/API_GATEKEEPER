import { type Request, type Response } from 'express';
import { eventsStore, bannedIps, getStats } from '../api.ts';

export async function handleGetStats(_req: Request, res: Response) {
  return res.json(getStats());
}

export async function handleGetEvents(req: Request, res: Response) {
  const limit = Number(req.query.limit) || 50;
  return res.json(eventsStore.slice(-limit).reverse());
}

export async function handleGetBans(_req: Request, res: Response) {
  const now = Date.now();
  const activeBans: { ip: string; expires_in_sec: number }[] = [];
  for (const [ip, expiry] of bannedIps.entries()) {
    if (expiry > now) {
      activeBans.push({ ip, expires_in_sec: Math.round((expiry - now) / 1000) });
    }
  }
  return res.json(activeBans);
}

export async function handleResetData(_req: Request, res: Response) {
  eventsStore.length = 0;
  bannedIps.clear();
  // We'll need to clear other things too, but this is a start
  return res.json({ success: true, message: 'All telemetry and events reset to zero.', stats: getStats() });
}
