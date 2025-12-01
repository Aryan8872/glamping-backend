// src/middlewares/validate.js
export default function validate(schema, options = { in: 'query' }) {
  return (req, res, next) => {
    try {
      const target = options.in === 'body' ? req.body : req.query;
      const parsed = schema.parse(target);
      // attach validated (parsed) data to req.validated for downstream use
      req.validated = parsed;
      return next();
    } catch (e) {
      const issues = e?.errors ?? [{ message: e.message }];
      return res.status(400).json({ message: 'Validation error', issues });
    }
  };
}
