"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gem, LoaderCircle, LogIn, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AccountUser } from "@/lib/auth/user";
import { accountAction } from "@/lib/auth/client";

function authErrorMessage(reason: string | null) {
  if (!reason) return "";
  if (reason === "google_disabled") return "Google 登录正在配置中，请先使用邮箱登录。";
  if (reason === "google") return "Google 登录暂时不可用，请使用邮箱登录或稍后重试。";
  return "登录或验证链接已失效，请重新登录，或重新发送验证邮件。";
}

export default function AccountGate() {
  const router=useRouter();
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(()=>authErrorMessage(typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("auth_error")));
  const [configured,setConfigured]=useState(true),[googleEnabled,setGoogleEnabled]=useState(false);
  const alive=useRef(true),checking=useRef(false);
  const check=useCallback(async()=>{
    if(checking.current)return;checking.current=true;
    try{
      const response=await fetch("/api/auth/session",{cache:"no-store",credentials:"same-origin",signal:AbortSignal.timeout(20000)});
      const data=await response.json() as {user:AccountUser|null;configured?:boolean;googleEnabled?:boolean;error?:string};
      if(!alive.current)return;
      if(data.user){router.replace("/studio");return;}
      if(data.configured===false){setConfigured(false);setError("账户服务正在准备中，你仍可使用游客模式。");}
      else if(!response.ok)throw new Error(data.error||"无法连接账户服务，请重试。");
      else{setConfigured(true);setGoogleEnabled(data.googleEnabled===true);}
    }catch(e){if(alive.current)setError(e instanceof Error?e.message:"账户服务暂时无法连接。");}
    finally{checking.current=false;if(alive.current)setLoading(false);}
  },[router]);
  useEffect(()=>{
    alive.current=true;const params=new URLSearchParams(window.location.search);
    if(params.has("auth_error"))window.history.replaceState(null,"",window.location.pathname);
    const timer=window.setTimeout(()=>void check(),0);
    return()=>{window.clearTimeout(timer);alive.current=false;};
  },[check]);
  if(loading)return <div className="account-screen"><div className="account-card account-loading" role="status"><LoaderCircle className="animate-spin"/><p>正在检查登录状态…</p></div></div>;
  return <AuthForm key={`${configured}:${error}`} onSignedIn={()=>router.replace("/studio")} onGuest={()=>router.push("/studio")} initialError={error} configured={configured} googleEnabled={googleEnabled} onRetry={()=>void check()}/>;
}

export function AuthForm({onSignedIn,onGuest,initialError="",configured=true,googleEnabled=false,onRetry}:{onSignedIn:(user:AccountUser)=>void;onGuest:()=>void;initialError?:string;configured?:boolean;googleEnabled?:boolean;onRetry?:()=>void}) {
  const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState(initialError),[message,setMessage]=useState("");
  const changeMode=(next:string)=>{setMode(next);setError("");setMessage("");setPassword("");};
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();if(busy)return;setBusy(true);setError("");setMessage("");
    try{const data=await accountAction(mode,{email,password,name});if(data.user)onSignedIn(data.user);else setMessage(data.message??"操作已完成。");}
    catch(e){setError(e instanceof Error?e.message:"操作未完成。");}finally{setBusy(false);}
  };
  const isEmailOnly=mode==="forgot"||mode==="resend";
  return <div className="account-screen"><section className="account-card" aria-label="珠序账户">
    <Link href="/" className="account-brand" aria-label="返回珠序首頁"><Gem size={32}/><span>珠序<small>BEAD ATELIER</small></span></Link>
    <h1>{mode==="signup"?"创建你的创作账户":mode==="forgot"?"找回密码":mode==="resend"?"重新发送验证邮件":"登录珠序"}</h1>
    <p className="account-intro">{isEmailOnly?"输入注册邮箱，我们会发送操作链接。":"登录后保存作品，并在不同设备上继续创作。"}</p>
    {!isEmailOnly&&<Tabs value={mode} onValueChange={changeMode}><TabsList className="account-tabs"><TabsTrigger value="login">登录</TabsTrigger><TabsTrigger value="signup">注册</TabsTrigger></TabsList></Tabs>}
    {!isEmailOnly&&googleEnabled&&<><Button variant="outline" className="account-google" disabled={!configured||busy} onClick={()=>{window.location.assign("/auth/google");}}><LogIn size={18}/>使用 Google 继续</Button><div className="account-divider"><span>或使用邮箱</span></div></>}
    <form onSubmit={submit}>
      {mode==="signup"&&<div className="account-field"><Label htmlFor="account-name">显示名称</Label><Input id="account-name" autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)} required maxLength={80} disabled={busy}/></div>}
      <div className="account-field"><Label htmlFor="account-email">邮箱</Label><Input id="account-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} disabled={busy}/></div>
      {!isEmailOnly&&<div className="account-field"><Label htmlFor="account-password">密码</Label><Input id="account-password" type="password" autoComplete={mode==="signup"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode==="signup"?8:1} maxLength={128} required disabled={busy}/>{mode==="signup"&&<small>至少 8 个字符</small>}</div>}
      {error&&<p className="account-error" role="alert">{error}</p>}
      {message&&<p className="account-success" role="status"><Mail size={18}/>{message}</p>}
      <Button type="submit" className="account-submit" disabled={busy||!configured}>{busy?<><LoaderCircle className="animate-spin"/>正在处理…</>:mode==="signup"?"注册并验证邮箱":mode==="forgot"?"发送重置链接":mode==="resend"?"发送验证邮件":"登录"}</Button>
    </form>
    <div className="account-links">{isEmailOnly?<Button variant="ghost" onClick={()=>changeMode("login")} disabled={busy}><ArrowLeft size={16}/>返回登录</Button>:<><Button variant="ghost" onClick={()=>changeMode("forgot")} disabled={busy}>忘记密码</Button><Button variant="ghost" onClick={()=>changeMode("resend")} disabled={busy}>没收到验证邮件</Button></>}</div>
    {!isEmailOnly&&<><div className="account-divider"><span>暂时不登录</span></div><Button type="button" variant="outline" className="account-guest" onClick={onGuest} disabled={busy}>进入游客工作台</Button><p className="account-guest-note">游客作品仅保存在当前浏览器。</p></>}
    {!configured&&<Button variant="outline" onClick={onRetry}>重试连接</Button>}
    <p className="account-private">账户作品和制作进度默认仅自己可见。</p>
  </section></div>;
}
