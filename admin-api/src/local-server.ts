import express, { Request, Response } from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as path from 'path';
import { authHandler } from './handlers/authHandler';
import { orderHandler } from './handlers/orderHandler';
import { menuHandler } from './handlers/menuHandler';
import { tableHandler } from './handlers/tableHandler';
import {
  mockAuthHandler,
  mockOrderHandler,
  mockMenuHandler,
  mockTableHandler
} from './handlers/mockHandlers';

const app = express();

// CORS middleware - Allow all origins for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

const USE_MOCK = process.env.USE_MOCK === 'true';

console.log(`🔧 Mock Mode: ${USE_MOCK ? 'ENABLED' : 'DISABLED'}`);

// Select handlers based on mock mode
const selectedAuthHandler = USE_MOCK ? mockAuthHandler : authHandler;
const selectedOrderHandler = USE_MOCK ? mockOrderHandler : orderHandler;
const selectedMenuHandler = USE_MOCK ? mockMenuHandler : menuHandler;
const selectedTableHandler = USE_MOCK ? mockTableHandler : tableHandler;

// Helper function to convert Express request to Lambda event
function createLambdaEvent(req: Request): APIGatewayProxyEvent {
  // Convert params to proper format
  const pathParameters: { [name: string]: string } = {};
  Object.entries(req.params).forEach(([key, value]) => {
    pathParameters[key] = String(value);
  });

  return {
    httpMethod: req.method,
    path: req.path,
    pathParameters: Object.keys(pathParameters).length > 0 ? pathParameters : null,
    queryStringParameters: req.query as any,
    headers: req.headers as any,
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  };
}

// Helper function to send Lambda response
function sendLambdaResponse(res: Response, lambdaResponse: any) {
  res.status(lambdaResponse.statusCode);
  
  if (lambdaResponse.headers) {
    Object.entries(lambdaResponse.headers).forEach(([key, value]) => {
      res.setHeader(key, value as string);
    });
  }
  
  const body = lambdaResponse.body ? JSON.parse(lambdaResponse.body) : {};
  res.json(body);
}

// Auth routes
app.post('/auth/login', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  const response = await selectedAuthHandler(event);
  sendLambdaResponse(res, response);
});

app.post('/auth/refresh', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  const response = await selectedAuthHandler(event);
  sendLambdaResponse(res, response);
});

// Order routes
app.get('/orders', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  const response = await selectedOrderHandler(event);
  sendLambdaResponse(res, response);
});

app.patch('/orders/:orderId/status', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  event.pathParameters = { orderId: String(req.params.orderId) };
  const response = await selectedOrderHandler(event);
  sendLambdaResponse(res, response);
});

app.delete('/orders/:orderId', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  event.pathParameters = { orderId: String(req.params.orderId) };
  const response = await selectedOrderHandler(event);
  sendLambdaResponse(res, response);
});

// Menu routes
app.get('/menus', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  const response = await selectedMenuHandler(event);
  sendLambdaResponse(res, response);
});

app.post('/menus', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  const response = await selectedMenuHandler(event);
  sendLambdaResponse(res, response);
});

app.put('/menus/:menuId', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  event.pathParameters = { menuId: String(req.params.menuId) };
  const response = await selectedMenuHandler(event);
  sendLambdaResponse(res, response);
});

app.delete('/menus/:menuId', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  event.pathParameters = { menuId: String(req.params.menuId) };
  const response = await selectedMenuHandler(event);
  sendLambdaResponse(res, response);
});

app.post('/menus/upload-url', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  const response = await selectedMenuHandler(event);
  sendLambdaResponse(res, response);
});

// Table routes
app.post('/tables/:tableId/complete', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  event.pathParameters = { tableId: String(req.params.tableId) };
  const response = await selectedTableHandler(event);
  sendLambdaResponse(res, response);
});

app.get('/tables/:tableId/history', async (req: Request, res: Response) => {
  const event = createLambdaEvent(req);
  event.pathParameters = { tableId: String(req.params.tableId) };
  const response = await selectedTableHandler(event);
  sendLambdaResponse(res, response);
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Admin API is running' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Admin API running on http://localhost:${PORT}`);
  console.log(`🔧 Mock Mode: ${USE_MOCK ? 'ENABLED ✅' : 'DISABLED (using real AWS)'}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST   /auth/login`);
  console.log(`   POST   /auth/refresh`);
  console.log(`   GET    /orders`);
  console.log(`   PATCH  /orders/:orderId/status`);
  console.log(`   DELETE /orders/:orderId`);
  console.log(`   GET    /menus`);
  console.log(`   POST   /menus`);
  console.log(`   PUT    /menus/:menuId`);
  console.log(`   DELETE /menus/:menuId`);
  console.log(`   POST   /menus/upload-url`);
  console.log(`   POST   /tables/:tableId/complete`);
  console.log(`   GET    /tables/:tableId/history`);
  console.log(`   GET    /health`);
  if (USE_MOCK) {
    console.log(``);
    console.log(`📝 Mock Test Credentials:`);
    console.log(`   Username: admin1`);
    console.log(`   Password: password123 (any password works in mock mode)`);
    console.log(`   StoreId: store-001`);
  }
});
