export const CONFIG = {
    API_URL: import.meta.env.VITE_API_URL || '',
    SALINA_API_URL: import.meta.env.VITE_SALINA_API_URL || '',
    AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL || '',
    isDevelopment: import.meta.env.MODE === 'development',
    ACCESS_SECRET: import.meta.env.VITE_APP_API_ACCESS_TOKEN_SECRET || '',
    BASENAME: import.meta.env.VITE_APP_BASENAME,
    GOOGLE_CLIENT_ID: import.meta.env.VITE_APP_GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: import.meta.env.VITE_APP_GOOGLE_CLIENT_SECRET,
    RECAPTCHA_SITE_KEY: import.meta.env.VITE_APP_RECAPTCHA_SITE_KEY || '',
    RECAPTCHA_SECRET: import.meta.env.VITE_APP_RECAPTCHA_SECRET || '',
    DATE_ADD_HOUR: 8,
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '',
    BUBOY_API_URL: import.meta.env.VITE_AGENT_BUBOY_API_URL || '',
    BEBOT_API_URL: import.meta.env.VITE_BEBOT_API_URL || '',
    BEBOT_LLM_API_URL: import.meta.env.VITE_BEBOT_LLM_API_URL || '',
    WS_URL: import.meta.env.VITE_WS_BASE_URL || 'wss://dl-staging.salina.page/v1',
    WS_LLM_URL:
      import.meta.env.VITE_WS_LLM_BASE_URL || 'ws://app-staging.salina.app/v1',
    BUBOY_LLM_API_URL:
      import.meta.env.VITE_BUBOY_LLM_API_URL || 'https://llm-staging.buboy.ai/v1',
  };
  