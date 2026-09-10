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
  if (reason === "google_disabled") return "Google sign-in is being configured. Please use email for now.";
  if (reason === "google") return "Google sign-in is temporarily unavailable. Please use email or try again later.";
  return "This sign-in or verification link has expired. Please sign in again or resend the verification email.";
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
      if(data.configured===false){setConfigured(false);setError("Account services are being prepared. You can still use guest mode.");}
      else if(!response.ok)throw new Error(data.error||"Unable to connect to account services. Please try again.");
      else{setConfigured(true);setGoogleEnabled(data.googleEnabled===true);}
    }catch(e){if(alive.current)setError(e instanceof Error?e.message:"Account services are temporarily unavailable.");}
    finally{checking.current=false;if(alive.current)setLoading(false);}
  },[router]);
  useEffect(()=>{
    alive.current=true;const params=new URLSearchParams(window.location.search);
    if(params.has("auth_error"))window.history.replaceState(null,"",window.location.pathname);
    const timer=window.setTimeout(()=>void check(),0);
    return()=>{window.clearTimeout(timer);alive.current=false;};
  },[check]);
  if(loading)return <div className="account-screen"><div className="account-card account-loading" role="status"><LoaderCircle className="animate-spin"/><p>Checking your sign-in…</p></div></div>;
  return <AuthForm key={`${configured}:${error}`} onSignedIn={()=>router.replace("/studio")} onGuest={()=>router.push("/studio")} initialError={error} configured={configured} googleEnabled={googleEnabled} onRetry={()=>void check()}/>;
}

export function AuthForm({onSignedIn,onGuest,initialError="",configured=true,googleEnabled=false,onRetry}:{onSignedIn:(user:AccountUser)=>void;onGuest:()=>void;initialError?:string;configured?:boolean;googleEnabled?:boolean;onRetry?:()=>void}) {
  const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState(initialError),[message,setMessage]=useState("");
  const changeMode=(next:string)=>{setMode(next);setError("");setMessage("");setPassword("");};
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();if(busy)return;setBusy(true);setError("");setMessage("");
    try{const data=await accountAction(mode,{email,password,name});if(data.user)onSignedIn(data.user);else setMessage(data.message??"Done.");}
    catch(e){setError(e instanceof Error?e.message:"Action could not be completed.");}finally{setBusy(false);}
  };
  const isEmailOnly=mode==="forgot"||mode==="resend";
  return <div className="account-screen"><section className="account-card" aria-label="Bead Atelier account">
    <Link href="/" className="account-brand" aria-label="Back to Bead Atelier"><Gem size={32}/><span>BEAD<small>ATELIER</small></span></Link>
    <h1>{mode==="signup"?"Create your account":mode==="forgot"?"Reset your password":mode==="resend"?"Resend verification":"Sign in to Bead Atelier"}</h1>
    <p className="account-intro">{isEmailOnly?"Enter your email and we’ll send you a secure link.":"Save your work and continue creating on any device."}</p>
    {!isEmailOnly&&<Tabs value={mode} onValueChange={changeMode}><TabsList className="account-tabs"><TabsTrigger value="login">Sign in</TabsTrigger><TabsTrigger value="signup">Create account</TabsTrigger></TabsList></Tabs>}
    {!isEmailOnly&&googleEnabled&&<><Button variant="outline" className="account-google" disabled={!configured||busy} onClick={()=>{window.location.assign("/auth/google");}}><LogIn size={18}/>Continue with Google</Button><div className="account-divider"><span>or use email</span></div></>}
    <form onSubmit={submit}>
      {mode==="signup"&&<div className="account-field"><Label htmlFor="account-name">Display name</Label><Input id="account-name" autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)} required maxLength={80} disabled={busy}/></div>}
      <div className="account-field"><Label htmlFor="account-email">Email</Label><Input id="account-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} disabled={busy}/></div>
      {!isEmailOnly&&<div className="account-field"><Label htmlFor="account-password">Password</Label><Input id="account-password" type="password" autoComplete={mode==="signup"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode==="signup"?8:1} maxLength={128} required disabled={busy}/>{mode==="signup"&&<small>At least 8 characters</small>}</div>}
      {error&&<p className="account-error" role="alert">{error}</p>}
      {message&&<p className="account-success" role="status"><Mail size={18}/>{message}</p>}
      <Button type="submit" className="account-submit" disabled={busy||!configured}>{busy?<><LoaderCircle className="animate-spin"/>Working…</>:mode==="signup"?"Create account and verify email":mode==="forgot"?"Send reset link":mode==="resend"?"Send verification email":"Sign in"}</Button>
    </form>
    <div className="account-links">{isEmailOnly?<Button variant="ghost" onClick={()=>changeMode("login")} disabled={busy}><ArrowLeft size={16}/>Back to sign in</Button>:<><Button variant="ghost" onClick={()=>changeMode("forgot")} disabled={busy}>Forgot password</Button><Button variant="ghost" onClick={()=>changeMode("resend")} disabled={busy}>Resend verification email</Button></>}</div>
    {!isEmailOnly&&<><div className="account-divider"><span>Continue as a guest</span></div><Button type="button" variant="outline" className="account-guest" onClick={onGuest} disabled={busy}>Enter as guest</Button><p className="account-guest-note">Guest work is saved only in this browser.</p></>}
    {!configured&&<Button variant="outline" onClick={onRetry}>Retry connection</Button>}
    <p className="account-private">Your account designs and making progress are private by default.</p>
  </section></div>;
}
