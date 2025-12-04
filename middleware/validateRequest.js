import { ZodError } from "zod";

/**
 * Middleware to validate request data against a Zod schema.
 * @param {import("zod").ZodSchema} schema - The Zod schema to validate against.
 * @param {"body" | "query" | "params"} source - The part of the request to validate (default: "body").
 */
export const validateRequest =
  (schema, source = "body") =>
  (req, res, next) => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);

      // Attach validated data to the request object for downstream use
      req.validated = { ...req.validated, ...validatedData };

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        }));

        return res.status(400).json({
          message: "Validation Error",
          errors: errorMessages,
        });
      }
      next(error);
    }
  };
