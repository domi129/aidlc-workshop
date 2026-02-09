# Table Order Admin API

Admin Unit for Table Order Service - Serverless API built with AWS Lambda, API Gateway, and DynamoDB.

## Project Structure

```
admin-api/
├── src/
│   ├── handlers/          # API route handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Data access layer
│   ├── middleware/        # Auth and RBAC
│   ├── utils/             # Utilities
│   └── index.ts           # Main Lambda handler
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js 18.x
- AWS CLI configured
- DynamoDB tables created
- S3 bucket created
- SSM parameter for JWT secret

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Deploy

```bash
# Create deployment package
zip -r deployment-package.zip dist/ node_modules/ package.json

# Deploy to Lambda
aws lambda update-function-code \
  --function-name table-order-admin-api \
  --zip-file fileb://deployment-package.zip \
  --region ap-northeast-2
```

## Environment Variables

Set these in Lambda configuration:

- `JWT_SECRET`: JWT signing secret (from SSM)
- `DYNAMODB_REGION`: ap-northeast-2
- `S3_BUCKET`: table-order-menu-images-{account-id}
- `S3_REGION`: ap-northeast-2
- `NODE_ENV`: production

## API Endpoints

### Authentication
- `POST /auth/login` - Admin login
- `POST /auth/refresh` - Refresh JWT token

### Orders
- `GET /orders` - Get all orders for store
- `PATCH /orders/{orderId}/status` - Update order status
- `DELETE /orders/{orderId}` - Delete order (PENDING only)

### Tables
- `POST /tables/{tableId}/complete` - Complete table session
- `GET /tables/{tableId}/history` - Get order history

### Menus
- `GET /menus` - Get all menus
- `POST /menus` - Create menu
- `PUT /menus/{menuId}` - Update menu
- `DELETE /menus/{menuId}` - Delete menu
- `POST /menus/upload-url` - Generate S3 upload URL

## Development

```bash
# Lint
npm run lint

# Format
npm run format
```

## Architecture

- **Runtime**: Node.js 18.x
- **Language**: TypeScript
- **Compute**: AWS Lambda (256MB)
- **API**: API Gateway REST API
- **Database**: DynamoDB (On-demand)
- **Storage**: S3 (menu images)
- **Auth**: JWT + bcrypt

## Security

- JWT token authentication
- RBAC (Admin, Manager, Viewer roles)
- Presigned URLs for S3 access
- At-rest and in-transit encryption

## License

MIT
