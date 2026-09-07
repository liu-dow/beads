import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
export const designs=sqliteTable("designs",{
 id:text("id").primaryKey(),title:text("title").notNull(),author:text("author").notNull(),data:text("data").notNull(),beadCount:integer("bead_count").notNull(),createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull(),
},t=>[index("idx_designs_updated_at").on(t.updatedAt)]);
export const exports=sqliteTable("exports",{id:text("id").primaryKey(),designId:text("design_id"),format:text("format").notNull(),createdAt:text("created_at").notNull()});
export const makingProgress=sqliteTable("making_progress",{
 designId:text("design_id").notNull(),signature:text("signature").notNull(),data:text("data").notNull(),updatedAt:text("updated_at").notNull(),
},t=>[primaryKey({columns:[t.designId,t.signature]})]);
