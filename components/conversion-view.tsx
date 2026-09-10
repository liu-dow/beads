"use client";
import { useEffect, useRef } from "react";
import { trackConversion, type ConversionEvent } from "@/lib/conversion-events";
export function ConversionView({ event, design }: { event: ConversionEvent; design?: string }) {
  const sent = useRef(false);
  useEffect(() => { if (!sent.current) { sent.current = true; trackConversion(event, { design }); } }, [event, design]);
  return null;
}
