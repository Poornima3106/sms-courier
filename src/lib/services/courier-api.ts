import crypto from 'node:crypto';
import { getCleanCarrierAwb, getTrackCourierSlug } from '@/lib/utils/format';

export interface LiveCheckpoint {
  time: string;
  date: string;
  location: string;
  activity: string;
  courierName: string;
  state: string;
}

export interface TrackingStatusResponse {
  courier: string;
  awbNo: string;
  rawAwbNo?: string;
  currentStatus: string;
  shipmentState?: string;
  location?: string;
  latestActivity?: string;
  lastUpdated: string;
  checkpoints: LiveCheckpoint[];
  liveFetched: boolean;
  rawDetails?: any;
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function hexToBinary(hex: string): string {
  return Buffer.from(hex, 'hex').reduce(
    (acc, byte) => acc + byte.toString(2).padStart(8, '0'),
    ''
  );
}

function solveChallenge(challenge: string, difficulty: number): { challenge: string; nonce: number; hash: string } {
  const target = '0'.repeat(difficulty);
  let nonce = 0;
  // Cap iterations so serverless functions never hang
  const maxIterations = 250000;
  while (nonce < maxIterations) {
    const hash = crypto
      .createHash('sha256')
      .update(challenge + nonce)
      .digest('hex');
    if (hexToBinary(hash).startsWith(target)) {
      return { challenge, nonce, hash };
    }
    nonce++;
  }
  const fallbackHash = crypto.createHash('sha256').update(challenge + '0').digest('hex');
  return { challenge, nonce: 0, hash: fallbackHash };
}

function reverseStr(s: string): string {
  return s.split('').reverse().join('');
}

export async function fetchLiveCourierTracking(
  courier: string,
  awbNo: string
): Promise<TrackingStatusResponse> {
  const cleanAwb = getCleanCarrierAwb(courier, awbNo);
  const slug = getTrackCourierSlug(courier, cleanAwb);

  if (!cleanAwb) {
    return {
      courier,
      awbNo,
      currentStatus: 'Pending',
      lastUpdated: new Date().toISOString(),
      checkpoints: [],
      liveFetched: false,
    };
  }

  try {
    const pageUrl = `https://trackcourier.io/track-and-trace/${slug}/${encodeURIComponent(cleanAwb)}`;
    const pageRes = await fetch(pageUrl, {
      headers: { 'User-Agent': BROWSER_UA },
      cache: 'no-store',
    });

    if (!pageRes.ok) {
      throw new Error(`Tracking page status ${pageRes.status}`);
    }

    const rawCookies = pageRes.headers.getSetCookie
      ? pageRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')
      : (pageRes.headers.get('set-cookie') || '').split(';')[0];

    const html = await pageRes.text();

    // Extract dynamic token parts from pageController script
    const p1Match = html.match(/atob\(ctrl\.btoc\("([^"]+)"\)\)/);
    const btocMatches = [...html.matchAll(/ctrl\.[a-z0-9_]+\s*=\s*ctrl\.btoc\("([^"]+)"\);/gi)];
    const p1 = p1Match ? Buffer.from(reverseStr(p1Match[1]), 'base64').toString('utf8') : '';
    const p2 = btocMatches[0]?.[1] ? reverseStr(btocMatches[0][1]) : '';
    const p3 = btocMatches[1]?.[1] ? reverseStr(btocMatches[1][1]) : '';
    const token = `${p1}${p2}${p3}`;

    if (!token) {
      throw new Error('Could not extract tracking session token');
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const chRes = await fetch('https://trackcourier.io/get-challenge', {
        headers: {
          'User-Agent': BROWSER_UA,
          Referer: pageUrl,
          ...(rawCookies ? { Cookie: rawCookies } : {}),
        },
        cache: 'no-store',
      });

      if (!chRes.ok) break;
      const { challenge, difficulty } = await chRes.json();
      const powPayload = solveChallenge(challenge, Number(difficulty) || 10);

      const apiUrl = `https://trackcourier.io/api/v1/get_checkpoints_table/${token}/${slug}/${encodeURIComponent(cleanAwb)}`;
      const apiRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'User-Agent': BROWSER_UA,
          'Content-Type': 'application/json',
          Referer: pageUrl,
          ...(rawCookies ? { Cookie: rawCookies } : {}),
        },
        body: JSON.stringify(powPayload),
        cache: 'no-store',
      });

      if (!apiRes.ok) break;
      const data = await apiRes.json();

      if (data?.is_pending) {
        await new Promise((r) => setTimeout(r, Math.min((data.retry_after_seconds || 2) * 1000, 2500)));
        continue;
      }

      const rawCheckpoints: any[] = Array.isArray(data?.Checkpoints) ? data.Checkpoints : [];
      const checkpoints: LiveCheckpoint[] = rawCheckpoints.map((cp) => ({
        time: cp.Time || '',
        date: cp.Date || '',
        location: cp.Location || '',
        activity: cp.Activity || '',
        courierName: cp.CourierName || courier,
        state: cp.CheckpointState || data.ShipmentState || 'intransit',
      }));

      const latest = checkpoints[0];
      const mostRecentStatus =
        data?.MostRecentStatus && data.MostRecentStatus !== 'Pending'
          ? data.MostRecentStatus
          : checkpoints.length > 0
          ? 'In Transit'
          : 'Dispatched';

      return {
        courier,
        awbNo: cleanAwb,
        rawAwbNo: awbNo,
        currentStatus: mostRecentStatus,
        shipmentState: data?.ShipmentState || 'intransit',
        location: latest?.location || undefined,
        latestActivity: latest?.activity || undefined,
        lastUpdated: latest ? `${latest.date} ${latest.time}`.trim() : new Date().toISOString(),
        checkpoints,
        liveFetched: checkpoints.length > 0,
        rawDetails: data,
      };
    }
  } catch (err) {
    console.warn('Live courier fetch fallback:', err);
  }

  return {
    courier,
    awbNo: cleanAwb,
    rawAwbNo: awbNo,
    currentStatus: 'Dispatched',
    location: 'Origin Hub - Pollachi',
    lastUpdated: new Date().toISOString(),
    checkpoints: [],
    liveFetched: false,
  };
}
