import type { AccountUser } from "./user";
export async function accountAction(action: string, body: object) {
  const response = await fetch(`/api/auth/${action}`,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const data = await response.json() as { user?: AccountUser; message?: string; error?: string; code?: string };
  if (!response.ok) throw new Error(data.error || "The action could not be completed. Please try again.");
  return data;
}
