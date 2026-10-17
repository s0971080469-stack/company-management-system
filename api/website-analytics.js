import { handleAnalytics } from '../server/websiteAnalytics.js';

export function GET(request) {
  return handleAnalytics(request);
}
