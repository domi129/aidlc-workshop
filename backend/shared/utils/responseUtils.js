class ResponseUtils {
  static success(data, statusCode = 200) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(data)
    };
  }

  static error(message, statusCode = 500) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: {
          message,
          statusCode,
          timestamp: new Date().toISOString()
        }
      })
    };
  }
}

module.exports = ResponseUtils;
