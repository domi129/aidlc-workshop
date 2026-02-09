"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
const authHandler_1 = require("./handlers/authHandler");
const orderHandler_1 = require("./handlers/orderHandler");
const menuHandler_1 = require("./handlers/menuHandler");
const tableHandler_1 = require("./handlers/tableHandler");
const mockHandlers_1 = require("./handlers/mockHandlers");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Serve static files from public directory
app.use(express_1.default.static(path.join(__dirname, '../public')));
const USE_MOCK = process.env.USE_MOCK === 'true';
console.log(`🔧 Mock Mode: ${USE_MOCK ? 'ENABLED' : 'DISABLED'}`);
// Select handlers based on mock mode
const selectedAuthHandler = USE_MOCK ? mockHandlers_1.mockAuthHandler : authHandler_1.authHandler;
const selectedOrderHandler = USE_MOCK ? mockHandlers_1.mockOrderHandler : orderHandler_1.orderHandler;
const selectedMenuHandler = USE_MOCK ? mockHandlers_1.mockMenuHandler : menuHandler_1.menuHandler;
const selectedTableHandler = USE_MOCK ? mockHandlers_1.mockTableHandler : tableHandler_1.tableHandler;
// Helper function to convert Express request to Lambda event
function createLambdaEvent(req) {
    // Convert params to proper format
    const pathParameters = {};
    Object.entries(req.params).forEach(([key, value]) => {
        pathParameters[key] = String(value);
    });
    return {
        httpMethod: req.method,
        path: req.path,
        pathParameters: Object.keys(pathParameters).length > 0 ? pathParameters : null,
        queryStringParameters: req.query,
        headers: req.headers,
        body: req.body ? JSON.stringify(req.body) : null,
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {},
        resource: ''
    };
}
// Helper function to send Lambda response
function sendLambdaResponse(res, lambdaResponse) {
    res.status(lambdaResponse.statusCode);
    if (lambdaResponse.headers) {
        Object.entries(lambdaResponse.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
    }
    const body = lambdaResponse.body ? JSON.parse(lambdaResponse.body) : {};
    res.json(body);
}
// Auth routes
app.post('/auth/login', async (req, res) => {
    const event = createLambdaEvent(req);
    const response = await selectedAuthHandler(event);
    sendLambdaResponse(res, response);
});
app.post('/auth/refresh', async (req, res) => {
    const event = createLambdaEvent(req);
    const response = await selectedAuthHandler(event);
    sendLambdaResponse(res, response);
});
// Order routes
app.get('/orders', async (req, res) => {
    const event = createLambdaEvent(req);
    const response = await selectedOrderHandler(event);
    sendLambdaResponse(res, response);
});
app.patch('/orders/:orderId/status', async (req, res) => {
    const event = createLambdaEvent(req);
    event.pathParameters = { orderId: String(req.params.orderId) };
    const response = await selectedOrderHandler(event);
    sendLambdaResponse(res, response);
});
app.delete('/orders/:orderId', async (req, res) => {
    const event = createLambdaEvent(req);
    event.pathParameters = { orderId: String(req.params.orderId) };
    const response = await selectedOrderHandler(event);
    sendLambdaResponse(res, response);
});
// Menu routes
app.get('/menus', async (req, res) => {
    const event = createLambdaEvent(req);
    const response = await selectedMenuHandler(event);
    sendLambdaResponse(res, response);
});
app.post('/menus', async (req, res) => {
    const event = createLambdaEvent(req);
    const response = await selectedMenuHandler(event);
    sendLambdaResponse(res, response);
});
app.put('/menus/:menuId', async (req, res) => {
    const event = createLambdaEvent(req);
    event.pathParameters = { menuId: String(req.params.menuId) };
    const response = await selectedMenuHandler(event);
    sendLambdaResponse(res, response);
});
app.delete('/menus/:menuId', async (req, res) => {
    const event = createLambdaEvent(req);
    event.pathParameters = { menuId: String(req.params.menuId) };
    const response = await selectedMenuHandler(event);
    sendLambdaResponse(res, response);
});
app.post('/menus/upload-url', async (req, res) => {
    const event = createLambdaEvent(req);
    const response = await selectedMenuHandler(event);
    sendLambdaResponse(res, response);
});
// Table routes
app.post('/tables/:tableId/complete', async (req, res) => {
    const event = createLambdaEvent(req);
    event.pathParameters = { tableId: String(req.params.tableId) };
    const response = await selectedTableHandler(event);
    sendLambdaResponse(res, response);
});
app.get('/tables/:tableId/history', async (req, res) => {
    const event = createLambdaEvent(req);
    event.pathParameters = { tableId: String(req.params.tableId) };
    const response = await selectedTableHandler(event);
    sendLambdaResponse(res, response);
});
// Health check
app.get('/health', (req, res) => {
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
