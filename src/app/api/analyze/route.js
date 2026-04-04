import { GoogleAuth } from 'google-auth-library';
import { logger } from '@/lib/logger';

const VIDEO_INTELLIGENCE_URL =
  'https://videointelligence.googleapis.com/v1/videos:annotate';

async function getAuthToken() {
  const credentials = JSON.parse(
    Buffer.from(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
      'base64'
    ).toString('utf8')
  );

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

export async function POST(request) {
  try {
    const { gcsUri, submissionId } = await request.json();

    if (!gcsUri || !submissionId) {
      return Response.json(
        { error: 'gcsUri and submissionId are required' },
        { status: 400 }
      );
    }

    logger.info('analyze', 'Video Intelligence request started', {
      submissionId,
      gcsUri,
    });

    const token = await getAuthToken();

    const requestBody = {
      inputUri: gcsUri,
      features: ['LABEL_DETECTION'],
      videoContext: {
        labelDetectionConfig: {
          labelDetectionMode: 'SHOT_AND_FRAME_MODE',
          stationaryCamera: false,
          frameConfidenceThreshold: 0.3,
          videoConfidenceThreshold: 0.3,
        },
      },
    };

    const response = await fetch(VIDEO_INTELLIGENCE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('analyze', 'Video Intelligence API error', error);
      return Response.json(
        { error: error.error?.message || 'Video Intelligence API failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    logger.info('analyze', 'Video Intelligence operation started', {
      operationName: data.name,
    });

    return Response.json({
      operationName: data.name,
      submissionId,
    });
  } catch (error) {
    logger.error('analyze', 'Unexpected error', { message: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }
}