import { CATALOG_ROWS, type ColorFamily, type DurabilityMark } from "./bead-catalog-data";
import { MAX_COLORS, nextColorId, removeColor, type BeadColor, type Design, type Finish } from "./design";

export const CATALOG_SPEC = { brand:"MIYUKI", series:"Delica", sizeLabel:"11/0", diameter:1.6, hole:0.8, beadsPerGram:200 } as const;
export const COLOR_FAMILIES: {value:ColorFamily;label:string;hex:string}[] = [
  {value:"neutral",label:"Neutrals",hex:"#7f898e"},{value:"red",label:"Red",hex:"#c34c59"},
  {value:"orange",label:"Orange / brown",hex:"#d69154"},{value:"yellow",label:"Yellow / gold",hex:"#d9bc55"},
  {value:"green",label:"Green",hex:"#629b77"},{value:"aqua",label:"Aqua",hex:"#69bfc0"},
  {value:"blue",label:"Blue",hex:"#638dbd"},{value:"purple",label:"Purple",hex:"#a28bb9"},
  {value:"pink",label:"Pink",hex:"#d696ad"},
];
export const TREATMENTS = [
  {value:"matte",label:"Matte"},{value:"ab",label:"AB / iridescent"},{value:"luster",label:"Luster"},
  {value:"plated",label:"Metallic / plated"},{value:"silver-lined",label:"Silver-lined"},
] as const;
export type Treatment = typeof TREATMENTS[number]["value"];
export type CatalogBead = {
  id:string; code:string; name:string; officialName:string; hex:string; family:ColorFamily;
  finish:Finish; glass:"opaque"|"transparent"|"opal"|"coated"; treatments:Treatment[];
  durability:{light:DurabilityMark;rub:DurabilityMark;dry:DurabilityMark;nickel:boolean};
};
function describeSurface(name:string):Pick<CatalogBead,"finish"|"glass"|"treatments"> {
  const treatments:Treatment[]=[];
  if(/Matte/i.test(name))treatments.push("matte");
  if(/\bAB\b|Iris|Rainbow/i.test(name))treatments.push("ab");
  if(/Luster/i.test(name))treatments.push("luster");
  if(/Metallic|Plated|Galvanized|Gunmetal|Iris/i.test(name))treatments.push("plated");
  if(/Silver-Lined/i.test(name))treatments.push("silver-lined");
  const glass=/Opaque|Chalk|^Black$|^Matte Black$/i.test(name)?"opaque":/Opal/i.test(name)?"opal":/Transp|Crystal|Silver-Lined/i.test(name)?"transparent":"coated";
  const finish=treatments.includes("matte")?"matte":treatments.includes("plated")?"metal":glass==="transparent"?"glass":glass==="opal"||treatments.includes("luster")||treatments.includes("ab")?"pearl":"gloss";
  return {glass,finish,treatments};
}
export const BEAD_CATALOG:CatalogBead[]=CATALOG_ROWS.map(([code,name,officialName,hex,family,light,rub,dry,nickel])=>({
  id:`miyuki-delica-11-${code.toLowerCase()}`,code,name,officialName,hex,family,
  ...describeSurface(officialName),durability:{light,rub,dry,nickel:nickel==="N"},
}));
const byId=new Map(BEAD_CATALOG.map(b=>[b.id,b]));
export const catalogBead=(id?:string)=>id?byId.get(id):undefined;
export const catalogSku=(b:CatalogBead)=>`${CATALOG_SPEC.brand} ${CATALOG_SPEC.series} ${CATALOG_SPEC.sizeLabel} ${b.code}`;
export function linkedCatalogBead(p:BeadColor){
  const b=catalogBead(p.catalogId);
  return b&&p.sku===catalogSku(b)&&p.hex.toLowerCase()===b.hex.toLowerCase()&&p.finish===b.finish?b:undefined;
}
export function editMaterial(p:BeadColor,patch:Partial<BeadColor>):BeadColor {
  const next={...p,...patch};
  if(p.catalogId&&!linkedCatalogBead(next))next.catalogId=undefined;
  return next;
}
export function durabilityLevel(b:CatalogBead){
  const {light,rub,dry,nickel}=b.durability;
  return nickel||[light,rub,dry].includes("X")?"sensitive":[light,rub,dry].includes("-")?"care":"normal";
}
export const DURABILITY_LABELS={normal:"Good under normal use",care:"Check conditions of use",sensitive:"Extra care needed"};
export function normalizeBeadCode(value:string){
  const code=value.trim().toUpperCase().replace(/^MIYUKI\s*(DELICA)?\s*(11\/0)?\s*/,"").replace(/[\s-]/g,"");
  const match=code.match(/^(?:DB)?0*(\d+)([A-Z]?)$/);
  return match?`DB${match[1].padStart(4,"0")}${match[2]}`:null;
}
export type CatalogFilter={query?:string;family?:string;treatment?:string;glass?:string;durability?:string;scope?:"all"|"favorites"|"palette";favorites?:readonly string[];paletteIds?:readonly string[];sort?:"code"|"family"};
export function filterCatalog(filter:CatalogFilter):CatalogBead[]{
  const query=(filter.query??"").trim(),code=normalizeBeadCode(query),terms=query.toLowerCase().split(/\s+/).filter(Boolean);
  const result=BEAD_CATALOG.filter(b=>{
    const haystack=`${b.code} ${b.name} ${b.officialName} MIYUKI Delica 11/0 ${COLOR_FAMILIES.find(f=>f.value===b.family)?.label}`.toLowerCase();
    return (!query||(code?b.code===code:terms.every(term=>haystack.includes(term))))
      &&(!filter.family||filter.family==="all"||b.family===filter.family)
      &&(!filter.treatment||filter.treatment==="all"||b.treatments.includes(filter.treatment as Treatment))
      &&(!filter.glass||filter.glass==="all"||b.glass===filter.glass)
      &&(!filter.durability||filter.durability==="all"||durabilityLevel(b)===filter.durability)
      &&(filter.scope!=="favorites"||filter.favorites?.includes(b.id))
      &&(filter.scope!=="palette"||filter.paletteIds?.includes(b.id));
  });
  return result.sort((a,b)=>(filter.sort==="family"?COLOR_FAMILIES.findIndex(f=>f.value===a.family)-COLOR_FAMILIES.findIndex(f=>f.value===b.family):0)||a.code.localeCompare(b.code));
}
export function applyCatalogBeads(d:Design,ids:readonly string[],mode:"add"|"replace"="add",target=0,resize=false){
  const beads=[...new Set(ids)].map(id=>{const b=catalogBead(id);if(!b)throw new Error("This bead is not in the catalogue.");return b;});
  if(!beads.length)throw new Error("Select a bead first.");
  if(Math.abs(d.size-CATALOG_SPEC.diameter)>.001&&!resize)throw new Error("The selected bead size differs from the chart.");
  const base=resize&&d.size!==CATALOG_SPEC.diameter?{...d,size:CATALOG_SPEC.diameter}:d;
  const material=(b:CatalogBead,id:string):BeadColor=>({id,name:b.name,hex:b.hex,finish:b.finish,sku:catalogSku(b),catalogId:b.id,stock:0});
  if(mode==="replace"){
    if(beads.length!==1||!d.palette[target])throw new Error("Select a valid target colour to replace.");
    const b=beads[0],existing=d.palette.findIndex(p=>linkedCatalogBead(p)?.id===b.id);
    if(existing===target)return {design:base,selectedIndex:target,added:0};
    if(existing>=0)return {design:removeColor(base,target,existing),selectedIndex:existing>target?existing-1:existing,added:0};
    return {design:{...base,palette:base.palette.map((p,i)=>i===target?material(b,p.id):p)},selectedIndex:target,added:1};
  }
  const missing=beads.filter(b=>!d.palette.some(p=>linkedCatalogBead(p)?.id===b.id));
  if(d.palette.length+missing.length>MAX_COLORS)throw new Error(`This design supports up to ${MAX_COLORS} colours. Remove a colour before adding more.`);
  if(!missing.length)return {design:base,selectedIndex:d.palette.findIndex(p=>linkedCatalogBead(p)?.id===beads[0].id),added:0};
  const palette=[...base.palette];
  for(const b of missing)palette.push(material(b,nextColorId(palette)));
  return {design:{...base,palette},selectedIndex:palette.findIndex(p=>linkedCatalogBead(p)?.id===beads[0].id),added:missing.length};
}
