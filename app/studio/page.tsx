import StudioGate from "@/components/studio-gate";
import { notFound } from "next/navigation";
import { publicWork, remixWork, colorwayId } from "@/lib/portfolio";
export const dynamic="force-dynamic";
export const metadata={title:"Design studio | Bead Atelier",robots:{index:false,follow:true}};
export default async function StudioPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams,slug=params.design,palette=colorwayId(params.palette);
  if(slug!==undefined){const work=typeof slug==="string"?publicWork(slug):undefined;if(!work)notFound();return <StudioGate key={`${work.slug}:${palette}`} initialDesign={remixWork(work,palette)}/>;}
  return <StudioGate key="default"/>;
}
