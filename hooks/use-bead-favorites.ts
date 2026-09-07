"use client";
import { useMemo, useSyncExternalStore } from "react";
import { catalogBead } from "@/lib/bead-catalog";

const KEY="bead-atelier:catalog-favorites:v1",EVENT="bead-atelier:catalog-favorites";
function snapshot(){try{return localStorage.getItem(KEY)||"[]";}catch{return "[]";}}
function subscribe(listener:()=>void){window.addEventListener("storage",listener);window.addEventListener(EVENT,listener);return()=>{window.removeEventListener("storage",listener);window.removeEventListener(EVENT,listener);};}
function parse(raw:string):string[]{try{const list:unknown=JSON.parse(raw);return Array.isArray(list)?[...new Set(list.filter((id):id is string=>typeof id==="string"&&!!catalogBead(id)))]:[];}catch{return [];}}
export function useBeadFavorites(){
  const raw=useSyncExternalStore(subscribe,snapshot,()=>"[]");
  const favorites=useMemo(()=>parse(raw),[raw]);
  const toggle=(id:string)=>{
    if(!catalogBead(id))return false;
    const current=parse(snapshot()),next=current.includes(id)?current.filter(v=>v!==id):[...current,id];
    try{localStorage.setItem(KEY,JSON.stringify(next));window.dispatchEvent(new Event(EVENT));return true;}catch{return false;}
  };
  return {favorites,toggle};
}
