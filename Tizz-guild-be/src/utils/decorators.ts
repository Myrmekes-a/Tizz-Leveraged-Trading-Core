import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiCommonResponses() {
  return applyDecorators(
    ApiResponse({ status: 200, description: 'Successful operation.' }),
    ApiResponse({ status: 401, description: 'Unauthorized access.' }),
    ApiResponse({ status: 404, description: 'Resource not found.' }),
    ApiResponse({ status: 500, description: 'Internal server error.' }),
  );
}
