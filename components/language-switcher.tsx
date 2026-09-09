"use client";
import { useEffect, useState } from "react";
const languages = [["en","English"],["zh-CN","简体中文"],["ja","日本語"],["de","Deutsch"],["fr","Français"]] as const;
export function LanguageSwitcher(){const [value,setValue]=useState("en");useEffect(()=>{const saved=localStorage.getItem("bead-atelier-language");if(saved&&languages.some(([code])=>code===saved))setValue(saved)},[]);return <label className="language-switcher"><span className="sr-only">Language</span><select aria-label="Language" value={value} onChange={e=>{setValue(e.target.value);localStorage.setItem("bead-atelier-language",e.target.value);document.documentElement.lang=e.target.value}}>{languages.map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label>}
