import type { ApiErrorResponse } from '@datalink/shared'
import type { Context } from 'hono'
import { StatusCodes } from 'http-status-codes'

export const validationHook = (result: any, c: Context) => {
  if (!result.success) {
    const flattenedErrors = result.error.flatten()

    return c.json<ApiErrorResponse>(
      {
        ok: false,
        error: flattenedErrors.formErrors || 'Validation failed',
        details: flattenedErrors.fieldErrors,
      },
      StatusCodes.BAD_REQUEST,
    )
  }
}
