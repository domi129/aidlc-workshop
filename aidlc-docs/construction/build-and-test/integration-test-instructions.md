# Integration Test Instructions - Admin Unit

## Purpose

Test Admin API integration with AWS services (DynamoDB, S3, API Gateway) to ensure end-to-end functionality.

---

## Test Environment Setup

### 1. Prerequisites

- AWS account with deployed resources
- API Gateway endpoint URL
- DynamoDB tables created and populated with test data
- S3 bucket created
- Valid admin credentials in database

### 2. Test Data Setup

**Create Test Admin**:
```bash
aws dynamodb put-item \
  --table-name Admins \
  --item '{
    "adminId": {"S": "test-admin-001"},
    "storeId": {"S": "test-store-001"},
    "username": {"S": "testadmin"},
    "passwordHash": {"S": "$2b$10$..."},
    "role": {"S": "Admin"},
    "createdAt": {"N": "1707494400000"}
  }' \
  --region ap-northeast-2
```

**Create Test Store**:
```bash
aws dynamodb put-item \
  --table-name Stores \
  --item '{
    "storeId": {"S": "test-store-001"},
    "storeName": {"S": "Test Restaurant"},
    "createdAt": {"N": "1707494400000"}
  }' \
  --region ap-northeast-2
```

**Create Test Orders**:
```bash
aws dynamodb put-item \
  --table-name Orders \
  --item '{
    "orderId": {"S": "test-order-001"},
    "storeId": {"S": "test-store-001"},
    "tableId": {"S": "test-table-001"},
    "sessionId": {"S": "test-session-001"},
    "orderNumber": {"N": "1"},
    "items": {"L": [...]},
    "totalAmount": {"N": "25000"},
    "status": {"S": "PENDING"},
    "createdAt": {"N": "1707494400000"}
  }' \
  --region ap-northeast-2
```

---

## Integration Test Scenarios

### Scenario 1: Complete Authentication Flow

**Test**: Login → Get Orders → Logout

**Steps**:
```bash
# 1. Login
TOKEN=$(curl -s -X POST https://your-api-gateway-url/prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testadmin",
    "password": "testpassword",
    "storeId": "test-store-001"
  }' | jq -r '.token')

echo "Token: $TOKEN"

# 2. Get Orders (verify token works)
curl -X GET https://your-api-gateway-url/prod/orders \
  -H "Authorization: Bearer $TOKEN"

# 3. Verify token expiration (wait 16 hours or test with expired token)
```

**Expected Results**:
- ✅ Login returns valid JWT token
- ✅ Token works for authenticated endpoints
- ✅ Expired token returns 401

---

### Scenario 2: Order Lifecycle Management

**Test**: Create Order (Customer) → View Order (Admin) → Update Status → Complete

**Steps**:
```bash
# Assume order created by Customer Unit
ORDER_ID="test-order-001"

# 1. Admin views order
curl -X GET https://your-api-gateway-url/prod/orders \
  -H "Authorization: Bearer $TOKEN"

# 2. Update to PREPARING
curl -X PATCH https://your-api-gateway-url/prod/orders/$ORDER_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "PREPARING"}'

# 3. Update to COMPLETED
curl -X PATCH https://your-api-gateway-url/prod/orders/$ORDER_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'

# 4. Verify order status in DynamoDB
aws dynamodb get-item \
  --table-name Orders \
  --key '{"orderId": {"S": "'$ORDER_ID'"}}' \
  --region ap-northeast-2
```

**Expected Results**:
- ✅ Order visible in admin dashboard
- ✅ Status transitions: PENDING → PREPARING → COMPLETED
- ✅ Invalid transitions rejected (e.g., PENDING → COMPLETED)
- ✅ DynamoDB reflects updated status

---

### Scenario 3: Table Session Management

**Test**: Complete Session → Verify History → Verify Table Reset

**Steps**:
```bash
TABLE_ID="test-table-001"
SESSION_ID="test-session-001"

# 1. Complete table session
curl -X POST https://your-api-gateway-url/prod/tables/$TABLE_ID/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "'$SESSION_ID'"}'

# 2. Verify orders moved to history
curl -X GET "https://your-api-gateway-url/prod/tables/$TABLE_ID/history?page=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN"

# 3. Verify OrderHistory in DynamoDB
aws dynamodb query \
  --table-name OrderHistory \
  --index-name tableId-archivedAt-index \
  --key-condition-expression "tableId = :tableId" \
  --expression-attribute-values '{":tableId": {"S": "'$TABLE_ID'"}}' \
  --region ap-northeast-2

# 4. Verify orders removed from Orders table
aws dynamodb query \
  --table-name Orders \
  --index-name tableId-sessionId-index \
  --key-condition-expression "tableId = :tableId AND sessionId = :sessionId" \
  --expression-attribute-values '{
    ":tableId": {"S": "'$TABLE_ID'"},
    ":sessionId": {"S": "'$SESSION_ID'"}
  }' \
  --region ap-northeast-2
```

**Expected Results**:
- ✅ Session completion succeeds
- ✅ Orders moved from Orders to OrderHistory
- ✅ Table currentSessionId reset to null
- ✅ History API returns archived orders

---

### Scenario 4: Menu Management with S3 Integration

**Test**: Create Menu → Upload Image → Verify Image Access

**Steps**:
```bash
# 1. Create menu
MENU_RESPONSE=$(curl -s -X POST https://your-api-gateway-url/prod/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menuName": "Test Menu",
    "price": 10000,
    "description": "Test description",
    "category": "MAIN"
  }')

MENU_ID=$(echo $MENU_RESPONSE | jq -r '.menuId')
echo "Menu ID: $MENU_ID"

# 2. Generate upload URL
UPLOAD_RESPONSE=$(curl -s -X POST https://your-api-gateway-url/prod/menus/upload-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test-image.jpg"}')

UPLOAD_URL=$(echo $UPLOAD_RESPONSE | jq -r '.uploadUrl')
IMAGE_URL=$(echo $UPLOAD_RESPONSE | jq -r '.imageUrl')

echo "Upload URL: $UPLOAD_URL"
echo "Image URL: $IMAGE_URL"

# 3. Upload image to S3
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test-image.jpg

# 4. Update menu with image URL
curl -X PUT https://your-api-gateway-url/prod/menus/$MENU_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "'$IMAGE_URL'"
  }'

# 5. Verify image in S3
aws s3 ls s3://table-order-menu-images-<account-id>/menus/test-store-001/
```

**Expected Results**:
- ✅ Menu created in DynamoDB
- ✅ Presigned URL generated
- ✅ Image uploaded to S3
- ✅ Menu updated with image URL
- ✅ Image accessible via URL

---

### Scenario 5: RBAC Authorization

**Test**: Different roles have different permissions

**Steps**:
```bash
# 1. Login as Admin
ADMIN_TOKEN=$(curl -s -X POST https://your-api-gateway-url/prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "pass", "storeId": "test-store-001"}' \
  | jq -r '.token')

# 2. Login as Manager
MANAGER_TOKEN=$(curl -s -X POST https://your-api-gateway-url/prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "manager", "password": "pass", "storeId": "test-store-001"}' \
  | jq -r '.token')

# 3. Admin can delete order
curl -X DELETE https://your-api-gateway-url/prod/orders/$ORDER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: 200 OK

# 4. Manager cannot delete order
curl -X DELETE https://your-api-gateway-url/prod/orders/$ORDER_ID \
  -H "Authorization: Bearer $MANAGER_TOKEN"
# Expected: 403 Forbidden

# 5. Manager can update order status
curl -X PATCH https://your-api-gateway-url/prod/orders/$ORDER_ID/status \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "PREPARING"}'
# Expected: 200 OK
```

**Expected Results**:
- ✅ Admin role can perform all actions
- ✅ Manager role can update status but not delete
- ✅ Unauthorized actions return 403 Forbidden

---

## Integration Test Checklist

### API Gateway Integration
- [ ] All routes accessible via API Gateway
- [ ] JWT Authorizer validates tokens
- [ ] CORS headers present
- [ ] Error responses formatted correctly

### DynamoDB Integration
- [ ] Orders CRUD operations work
- [ ] GSI queries return correct results
- [ ] TTL works for AdminSessions and OrderHistory
- [ ] Transactions work (if used)

### S3 Integration
- [ ] Presigned URLs generated correctly
- [ ] Image upload succeeds
- [ ] Images accessible via URLs
- [ ] Bucket permissions correct

### Authentication & Authorization
- [ ] JWT tokens issued correctly
- [ ] Token expiration enforced
- [ ] RBAC permissions enforced
- [ ] Invalid tokens rejected

### Business Logic
- [ ] Order state transitions validated
- [ ] Table session completion works
- [ ] Order history archival works
- [ ] Menu management works

---

## Cleanup Test Data

```bash
# Delete test orders
aws dynamodb delete-item \
  --table-name Orders \
  --key '{"orderId": {"S": "test-order-001"}}' \
  --region ap-northeast-2

# Delete test admin
aws dynamodb delete-item \
  --table-name Admins \
  --key '{"adminId": {"S": "test-admin-001"}}' \
  --region ap-northeast-2

# Delete test images
aws s3 rm s3://table-order-menu-images-<account-id>/menus/test-store-001/ --recursive
```

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Integration Test Instructions 완료
