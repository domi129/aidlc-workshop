# Build Instructions - Admin Unit

## Prerequisites

### Required Tools
- **Node.js**: 18.x LTS
- **npm**: 9.x
- **TypeScript**: 5.3.0
- **AWS CLI**: 2.x (configured with credentials)

### Required AWS Resources
- DynamoDB tables (7 tables)
- S3 bucket for menu images
- SSM Parameter Store (JWT secret)
- IAM roles for Lambda functions

### Environment Variables
```bash
JWT_SECRET=<from-ssm-parameter-store>
DYNAMODB_REGION=ap-northeast-2
S3_BUCKET=table-order-menu-images-<account-id>
S3_REGION=ap-northeast-2
NODE_ENV=production
```

---

## Build Steps

### 1. Install Dependencies

```bash
cd admin-api
npm install
```

**Expected Output**:
```
added 150 packages in 15s
```

**Verify Installation**:
```bash
npm list --depth=0
```

Should show:
- aws-sdk@^2.1500.0
- bcrypt@^5.1.1
- jsonwebtoken@^9.0.2
- uuid@^9.0.1
- typescript@^5.3.0
- eslint@^8.56.0
- prettier@^3.1.0

---

### 2. Configure Environment

Create `.env` file (for local testing):
```bash
cat > .env << EOF
JWT_SECRET=your-local-jwt-secret-min-32-chars
DYNAMODB_REGION=ap-northeast-2
S3_BUCKET=table-order-menu-images-123456789012
S3_REGION=ap-northeast-2
NODE_ENV=development
EOF
```

**Note**: For production, use AWS SSM Parameter Store.

---

### 3. Lint Code

```bash
npm run lint
```

**Expected Output**:
```
✔ No linting errors found
```

**If Errors Found**:
```bash
npm run lint -- --fix
```

---

### 4. Build TypeScript

```bash
npm run build
```

**Expected Output**:
```
Compiled successfully.
dist/
├── handlers/
├── services/
├── repositories/
├── middleware/
├── utils/
└── index.js
```

**Verify Build**:
```bash
ls -la dist/
```

Should contain compiled JavaScript files.

---

### 5. Create Deployment Package

```bash
# Remove old package
rm -f deployment-package.zip

# Create new package
zip -r deployment-package.zip dist/ node_modules/ package.json

# Verify package
unzip -l deployment-package.zip | head -20
```

**Expected Package Size**: 15-25 MB

---

### 6. Deploy to AWS Lambda

```bash
# Deploy Admin API Lambda
aws lambda update-function-code \
  --function-name table-order-admin-api \
  --zip-file fileb://deployment-package.zip \
  --region ap-northeast-2

# Wait for deployment to complete
aws lambda wait function-updated \
  --function-name table-order-admin-api \
  --region ap-northeast-2

# Verify deployment
aws lambda get-function \
  --function-name table-order-admin-api \
  --region ap-northeast-2 \
  --query 'Configuration.[FunctionName,Runtime,LastModified]'
```

**Expected Output**:
```json
[
  "table-order-admin-api",
  "nodejs18.x",
  "2026-02-09T14:30:00.000+0000"
]
```

---

### 7. Update Lambda Environment Variables

```bash
aws lambda update-function-configuration \
  --function-name table-order-admin-api \
  --environment Variables="{
    JWT_SECRET=$(aws ssm get-parameter --name /table-order/jwt-secret --with-decryption --query Parameter.Value --output text),
    DYNAMODB_REGION=ap-northeast-2,
    S3_BUCKET=table-order-menu-images-$(aws sts get-caller-identity --query Account --output text),
    S3_REGION=ap-northeast-2,
    NODE_ENV=production
  }" \
  --region ap-northeast-2
```

---

### 8. Verify Build Success

**Check Lambda Function**:
```bash
aws lambda invoke \
  --function-name table-order-admin-api \
  --payload '{"httpMethod":"GET","path":"/health"}' \
  --region ap-northeast-2 \
  response.json

cat response.json
```

**Expected**: Function executes without errors (even if route not found).

---

## Build Artifacts

### Generated Files
- `dist/` - Compiled JavaScript
- `deployment-package.zip` - Lambda deployment package
- `node_modules/` - Dependencies

### Artifact Locations
- **Local**: `./admin-api/dist/`
- **Lambda**: Deployed to AWS Lambda function
- **Package**: `./admin-api/deployment-package.zip`

---

## Troubleshooting

### Build Fails with "Cannot find module"
**Cause**: Missing dependencies
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Build Fails with TypeScript Errors
**Cause**: Type errors in code
**Solution**:
1. Review error messages
2. Fix type issues in source files
3. Run `npm run build` again

### Deployment Fails with "ResourceNotFoundException"
**Cause**: Lambda function doesn't exist
**Solution**:
1. Create Lambda function first via AWS Console or CloudFormation
2. Then deploy code with `update-function-code`

### Lambda Invocation Fails
**Cause**: Missing environment variables or IAM permissions
**Solution**:
1. Verify environment variables are set
2. Check IAM role has DynamoDB and S3 permissions
3. Review CloudWatch Logs for detailed errors

---

## Build Verification Checklist

- [ ] Dependencies installed successfully
- [ ] Code lints without errors
- [ ] TypeScript compiles successfully
- [ ] Deployment package created
- [ ] Lambda function updated
- [ ] Environment variables configured
- [ ] Lambda function invokes successfully
- [ ] CloudWatch Logs show no errors

---

## Next Steps

After successful build:
1. Proceed to Unit Test Execution
2. Run Integration Tests
3. Verify API Gateway integration
4. Test end-to-end workflows

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Build Instructions 완료
