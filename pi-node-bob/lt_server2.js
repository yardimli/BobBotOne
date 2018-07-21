import request from 'supertest';
import assert from 'assert';
import { Server as WebSocketServer } from 'ws';
import WebSocket from 'ws';
import net from 'net';

import createServer from './server';


const server = createServer({
  domain: 'codeplay.me',
  port: 80
});

