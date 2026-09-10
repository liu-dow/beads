"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import type { AccountUser } from "@/lib/auth/user";
import { accountAction } from "@/lib/auth/client";
import { AccountContext } from "@/hooks/use-account";
import Studio from "@/components/studio";
import type { Design } from "@/lib/design";

const guestUser:AccountUser={id:"guest",email:"",displayName:"Guest creator"};
const GUEST_ONLY = process.env.NEXT_PUBLIC_GUEST_ONLY !== "false";

export default function StudioGate({initialDesign}:{initialDesign?:Design}){
  const router=useRouter();
  const [user,setUser]=useState<AccountUser|null>(null),[loading,setLoading]=useState(true);
  const alive=useRef(true);
  useEffect(()=>{
    // First public release is guest-only; account infrastructure remains available for a later rollout.
    if (GUEST_ONLY) { setLoading(false); return; }
    alive.current=true;
    const timer=window.setTimeout(async()=>{
      try{
        const response=await fetch("/api/auth/session",{cache:"no-store",credentials:"same-origin",signal:AbortSignal.timeout(20000)});
        const data=await response.json() as {user:AccountUser|null};
        if(alive.current&&response.ok)setUser(data.user);
      }catch{/* The editor remains available as a local guest workspace. */}
      finally{if(alive.current)setLoading(false);}
    },0);
    return()=>{window.clearTimeout(timer);alive.current=false;};
  },[]);
  const userId=user?.id;
  const apiFetch:typeof fetch=useCallback(async(input,init)=>{
    const headers=new Headers(init?.headers);if(userId)headers.set("X-Bead-User",userId);
    const response=await fetch(input,{...init,headers,credentials:"same-origin",cache:"no-store"});
    const failure=response.status===409?await response.clone().json().catch(()=>({})) as {code?:string}:null;
    if(response.status===401||failure?.code==="ACCOUNT_CHANGED"){setUser(null);router.replace("/login");}
    return response;
  },[router,userId]);
  const signOut=useCallback(async()=>{await accountAction("logout",{});setUser(null);router.replace("/login");},[router]);
  const openLogin=useCallback(async()=>{router.push("/login");},[router]);
  if(loading)return <div className="account-screen"><div className="account-card account-loading" role="status"><LoaderCircle className="animate-spin"/><p>Opening studio…</p></div></div>;
  if(user)return <AccountContext.Provider value={{user,guest:false,apiFetch,signOut}}><Studio key={user.id} initialDesign={initialDesign}/></AccountContext.Provider>;
  return <AccountContext.Provider value={{user:guestUser,guest:true,apiFetch:async()=>Response.json({error:"Guest data is saved only on this device."},{status:403}),signOut:openLogin}}><Studio key="guest" initialDesign={initialDesign}/></AccountContext.Provider>;
}
