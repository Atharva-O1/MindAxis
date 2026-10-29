import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Auto-detects the right host for the local backend instead of hardcoding an
// IP that breaks every time you switch networks:
// - Web: the browser's own hostname is always correct (localhost, an IP,
//   whatever you actually opened the page as).
// - Native (Expo Go / dev client): `Constants.expoConfig.hostUri` is the
//   address the device used to load the JS bundle from Metro in the first
//   place — since that connection already works, the backend (same
//   machine, different port) is reachable at the same host.
// Only falls back to `localhost` if neither is available.
function getDevServerHost(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return '192.168.29.6';
}

const HOST = getDevServerHost();

function getApiBaseUrl(): string {
  // If running in browser on localhost/127.0.0.1, always connect to local backend directly
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://${HOST}:8000`;
}

function getChatWsUrl(): string {
  // If running in browser on localhost/127.0.0.1, always connect to local WebSocket directly
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'ws://localhost:8000/ws/chat';
    }
  }
  return process.env.EXPO_PUBLIC_CHAT_WS_URL ?? `ws://${HOST}:8000/ws/chat`;
}

export const API_BASE_URL = getApiBaseUrl();
export const CHAT_WS_URL = getChatWsUrl();

