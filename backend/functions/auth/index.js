const DynamoDBClient = require('../../shared/utils/dynamodbClient');
const JWTUtils = require('../../shared/utils/jwtUtils');
const ResponseUtils = require('../../shared/utils/responseUtils');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  const path = event.path || event.rawPath;
  const method = event.httpMethod || event.requestContext?.http?.method;

  try {
    if (path.includes('/auth/table-login') && method === 'POST') {
      return await handleTableLogin(event);
    } else if (path.includes('/auth/refresh') && method === 'POST') {
      return await handleRefreshToken(event);
    } else {
      return ResponseUtils.error('Not Found', 404);
    }
  } catch (error) {
    console.error('Error:', error);
    return ResponseUtils.error(error.message || 'Internal Server Error', 500);
  }
};

async function handleTableLogin(event) {
  const body = JSON.parse(event.body);
  const { storeId, tableNumber, tablePassword } = body;

  if (!storeId || !tableNumber || !tablePassword) {
    return ResponseUtils.error('Missing required fields', 400);
  }

  // Find table by storeId and tableNumber
  const tables = await DynamoDBClient.query(
    'storeId = :storeId',
    { ':storeId': storeId },
    'storeId-index'
  );

  const table = tables.find(t => t.tableNumber === tableNumber && t.PK.startsWith('TABLE#'));

  if (!table) {
    return ResponseUtils.error('Table not found', 404);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(tablePassword, table.tablePassword);
  if (!isPasswordValid) {
    return ResponseUtils.error('Invalid password', 401);
  }

  // Generate session ID
  const sessionId = `session-${Date.now()}`;

  // Update table with new session
  await DynamoDBClient.update(
    table.PK,
    'METADATA',
    'SET sessionId = :sessionId, sessionStartedAt = :startedAt',
    {
      ':sessionId': sessionId,
      ':startedAt': new Date().toISOString()
    }
  );

  // Generate tokens
  const payload = {
    tableId: table.PK.replace('TABLE#', ''),
    storeId,
    sessionId
  };

  const accessToken = JWTUtils.generateAccessToken(payload);
  const refreshToken = JWTUtils.generateRefreshToken(payload);

  return ResponseUtils.success({
    accessToken,
    refreshToken,
    tableId: payload.tableId,
    storeId,
    tableNumber,
    sessionId
  });
}

async function handleRefreshToken(event) {
  const body = JSON.parse(event.body);
  const { refreshToken } = body;

  if (!refreshToken) {
    return ResponseUtils.error('Missing refresh token', 400);
  }

  try {
    const decoded = JWTUtils.verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      return ResponseUtils.error('Invalid token type', 401);
    }

    const payload = {
      tableId: decoded.tableId,
      storeId: decoded.storeId,
      sessionId: decoded.sessionId
    };

    const newAccessToken = JWTUtils.generateAccessToken(payload);
    const newRefreshToken = JWTUtils.generateRefreshToken(payload);

    return ResponseUtils.success({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return ResponseUtils.error('Invalid or expired token', 401);
  }
}
