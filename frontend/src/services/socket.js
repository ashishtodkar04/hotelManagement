import { io } from 'socket.io-client';
import { getApiUrl } from './api';

const URL = getApiUrl();

export const socket = io(URL, {
  withCredentials: true,
  autoConnect: false // Connect manually when needed
});

export default socket;
