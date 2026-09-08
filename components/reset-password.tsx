"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountAction } from "@/lib/auth/client";

export default function ResetPassword(){
  const [password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  return <div className="account-screen"><section className="account-card"><h1>{done?"密码已更新":"设置新密码"}</h1>{done?<><p className="account-success" role="status">下次可以使用新密码登录。</p><Link href="/login">返回登录</Link></>:<form onSubmit={async e=>{e.preventDefault();if(busy)return;if(password!==confirm){setError("两次输入的密码不一致。");return;}setBusy(true);setError("");try{await accountAction("reset",{password});setDone(true);}catch(e){setError(e instanceof Error?e.message:"修改未完成。");}finally{setBusy(false);}}}><div className="account-field"><Label htmlFor="new-password">新密码</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/><small>至少 8 个字符</small></div><div className="account-field"><Label htmlFor="confirm-password">确认密码</Label><Input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>{error&&<p className="account-error" role="alert">{error}</p>}<Button className="account-submit" disabled={busy}>{busy?"正在更新…":"更新密码"}</Button><Link className="account-back" href="/login">返回登录</Link></form>}</section></div>;
}
