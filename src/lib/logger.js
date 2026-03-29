const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
};

const COLORS = {
  INFO: '#4B9CD3',
  WARN: '#E3A857',
  ERROR: '#E35757',
  SUCCESS: '#4CAF50',
};

function log(level, context, message, data = null) {
  if (process.env.NODE_ENV === 'production') return;

  const timestamp = new Date().toISOString();
  const style = `color: ${COLORS[level]}; font-weight: bold`;

  if (data) {
    console.groupCollapsed(`%c[${level}] [${context}] ${message}`, style);
    console.log('timestamp:', timestamp);
    console.log('data:', data);
    console.groupEnd();
  } else {
    console.log(`%c[${level}] [${context}] ${message}`, style, `— ${timestamp}`);
  }
}

export const logger = {
  info: (context, message, data) => log(LOG_LEVELS.INFO, context, message, data),
  warn: (context, message, data) => log(LOG_LEVELS.WARN, context, message, data),
  error: (context, message, data) => log(LOG_LEVELS.ERROR, context, message, data),
  success: (context, message, data) => log(LOG_LEVELS.SUCCESS, context, message, data),
};