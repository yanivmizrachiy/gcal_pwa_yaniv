import type {
  CalendarEvent,
  FindEventsResponse,
  SelfTestResponse,
  ApiError,
  CommandRequest,
} from '@/types/calendar';

// Hebrew error messages
const ERROR_MESSAGES: Record<string, string> = {
  EXEC_URL_MISSING: 'כתובת EXEC_URL חסרה. אנא הגדר אותה דרך Issue: Set EXEC_URL',
  NETWORK_ERROR: 'שגיאת רשת. בדוק את החיבור לאינטרנט',
  TIMEOUT: 'הבקשה לקחה יותר מדי זמן',
  UNAUTHORIZED: 'אין הרשאה. ייתכן שצריך להתחבר מחדש',
  SERVER_ERROR: 'שגיאת שרת. נסה שוב מאוחר יותר',
  UNKNOWN_ERROR: 'שגיאה לא ידועה',
  PARSE_ERROR: 'שגיאה בפענוח התגובה',
};

/**
 * Resolve EXEC_URL from multiple sources:
 * 1. window.EXEC_URL (injected by gh-pages workflow)
 * 2. NEXT_PUBLIC_EXEC_URL env var
 * 3. localStorage override key 'EXEC_URL_OVERRIDE'
 */
export function getExecUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check window.EXEC_URL (injected)
  const windowUrl = (window as any).EXEC_URL;
  if (windowUrl && windowUrl !== '__EXEC_URL__' && windowUrl !== '') {
    return windowUrl;
  }

  // 2. Check env var
  const envUrl = process.env.NEXT_PUBLIC_EXEC_URL;
  if (envUrl && envUrl !== '__EXEC_URL__' && envUrl !== '') {
    return envUrl;
  }

  // 3. Check localStorage override
  try {
    const override = localStorage.getItem('EXEC_URL_OVERRIDE');
    if (override && override !== '' && override !== '__EXEC_URL__') {
      return override;
    }
  } catch (e) {
    console.warn('Cannot access localStorage:', e);
  }

  return null;
}

/**
 * Make a request to the GAS backend
 */
async function makeRequest<T>(
  url: string,
  params: Record<string, string> = {}
): Promise<T> {
  const execUrl = getExecUrl();
  if (!execUrl) {
    throw new Error(ERROR_MESSAGES.EXEC_URL_MISSING);
  }

  try {
    const urlObj = new URL(execUrl);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(urlObj.toString(), {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }
      if (response.status >= 500) {
        throw new Error(ERROR_MESSAGES.SERVER_ERROR);
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES.TIMEOUT);
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      throw error;
    }
    throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
  }
}

/**
 * Run self-test on the backend
 */
export async function selfTest(): Promise<SelfTestResponse> {
  return makeRequest<SelfTestResponse>('', { mode: 'selftest' });
}

/**
 * Fetch events (current implementation uses mode=events)
 */
export async function fetchEvents(): Promise<FindEventsResponse> {
  const response = await makeRequest<FindEventsResponse>('', { mode: 'events' });
  // Normalize response shape
  return {
    items: response.events || response.items || [],
    count: response.count || (response.events?.length ?? 0),
  };
}

/**
 * Generic command dispatcher (for future Stage 2)
 * Currently not fully implemented on backend
 */
export async function sendCommand(
  command: CommandRequest
): Promise<FindEventsResponse> {
  // For Stage 1, we'll use the existing endpoints
  if (command.action === 'findEvents') {
    return fetchEvents();
  }
  if (command.action === 'selfTest') {
    const result = await selfTest();
    return { items: [], count: 0, ...result };
  }

  // Placeholder for future CRUD operations
  throw new Error('פעולה זו טרם מוטמעת (Stage 2)');
}

/**
 * Map error to Hebrew message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check if it's one of our predefined messages
    if (Object.values(ERROR_MESSAGES).includes(error.message)) {
      return error.message;
    }
    // Return the error message if it's in Hebrew already
    if (/[\u0590-\u05FF]/.test(error.message)) {
      return error.message;
    }
    // Default translation
    return `${ERROR_MESSAGES.UNKNOWN_ERROR}: ${error.message}`;
  }
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Check if EXEC_URL is configured
 */
export function isExecUrlConfigured(): boolean {
  return getExecUrl() !== null;
}
