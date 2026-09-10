"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function PortfolioError({ reset }: { reset: () => void }) {
  return <main style={{padding:"80px 6%",textAlign:"center"}}><h1>The gallery could not load.</h1><p>Please try again in a moment.</p><Button onClick={reset}>Try again</Button><p><Link href="/">Return home</Link></p></main>;
}
