import { APIGatewayProxyResult } from 'aws-lambda';

export function handleError(error: any): APIGatewayProxyResult {
  console.error('Error:', error);

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'An error occurred';

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: { code, message, statusCode }
    })
  };
}
