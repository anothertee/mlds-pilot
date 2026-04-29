import { logger } from '@/lib/logger';

export async function POST(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const allowedOrigins = [
    'https://mlds-pilot.vercel.app',
    'https://www.movementlanguage.site',
    'https://movementlanguage.site',
    'http://localhost:3000',
  ];

  const isAllowedOrigin =
    allowedOrigins.some((o) => origin === o || referer?.startsWith(o));

  if (!isAllowedOrigin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { password } = await request.json();

    if (password !== process.env.FACILITATOR_PASSWORD) {
      logger.warn('facilitator-auth', 'Invalid facilitator password attempt');
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    logger.success('facilitator-auth', 'Facilitator authenticated');
    return Response.json({ success: true });
  } catch (error) {
    logger.error('facilitator-auth', 'Unexpected error', {
      message: error.message,
    });
    return Response.json({ error: error.message }, { status: 500 });
  }
}