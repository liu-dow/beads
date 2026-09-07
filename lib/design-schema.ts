import { z } from "zod";
import { linkedCatalogBead } from "./bead-catalog";

export const designSchema=z.object({
  id:z.string().max(80),title:z.string().trim().min(1).max(100),author:z.string().trim().min(1).max(80),description:z.string().max(1000),
  rows:z.number().int().min(8).max(40),cols:z.number().int().min(48).max(160),size:z.number().min(1).max(3),
  cells:z.array(z.number().int().min(0).max(63)).max(6400),
  palette:z.array(z.object({id:z.string().min(1).max(4),name:z.string().trim().min(1).max(40),hex:z.string().regex(/^#[0-9a-fA-F]{6}$/),finish:z.enum(["matte","gloss","metal","pearl","glass"]),sku:z.string().max(80).optional(),stock:z.number().int().min(0).max(1000000).optional(),catalogId:z.string().max(80).optional()}).refine(p=>!p.catalogId||!!linkedCatalogBead(p),"Catalog material does not match its source")).min(1).max(64),
  fit:z.object({wrist:z.number().min(80).max(350),clasp:z.number().min(0).max(100),ease:z.number().min(0).max(50),allowance:z.number().min(0).max(50)}).optional(),
  createdAt:z.string().max(40),updatedAt:z.string().max(40),
}).refine(d=>d.cells.length===d.rows*d.cols,"Invalid grid size")
  .refine(d=>d.cells.every(c=>c<d.palette.length),"Unknown color")
  .refine(d=>new Set(d.palette.map(p=>p.id)).size===d.palette.length,"Duplicate color ID");
