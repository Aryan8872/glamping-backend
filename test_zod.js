import { z, ZodError } from "zod";

const schema = z.object({
  name: z.string(),
});

try {
  schema.parse({});
} catch (err) {
  console.log("err.errors:", err.errors);
  console.log("err.issues:", err.issues);
  console.log("err.flatten:", typeof err.flatten);
  console.log("err.format:", typeof err.format);
}
