import { isAdmin } from "../../../src/auth.js";
import { SetupError } from "../../../src/db.js";
import { json } from "../../../src/util.js";

// Tutte le chiamate /api/admin/* richiedono l'accesso al pannello.
export async function onRequest({ request, env, next }) {
  if (!(await isAdmin(request, env))) return json({ error: "Sessione scaduta: accedi di nuovo." }, 401);
  try {
    return await next();
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof SetupError ? err.message : "Errore imprevisto, riprova." }, err instanceof SetupError ? 503 : 500);
  }
}
