"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountAction } from "@/lib/auth/client";

export default function ResetPassword(){
  const [password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  return <div className="account-screen"><section className="account-card"><h1>{done?"Password updated":"Set a new password"}</h1>{done?<><p className="account-success" role="status">Use your new password the next time you sign in.</p><Link href="/login">Back to sign in</Link></>:<form onSubmit={async e=>{e.preventDefault();if(busy)return;if(password!==confirm){setError("The passwords do not match.");return;}setBusy(true);setError("");try{await accountAction("reset",{password});setDone(true);}catch(e){setError(e instanceof Error?e.message:"The change could not be saved.");}finally{setBusy(false);}}}><div className="account-field"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/><small>At least 8 characters</small></div><div className="account-field"><Label htmlFor="confirm-password">ConfirmPassword</Label><Input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>{error&&<p className="account-error" role="alert">{error}</p>}<Button className="account-submit" disabled={busy}>{busy?"Updating…":"Update password"}</Button><Link className="account-back" href="/login">Back to sign in</Link></form>}</section></div>;
}
