import { z } from 'zod';
export const schemas = {
  pages: {
    home: z.object({
      "hero": z.object({
        "title": z.string(),
        "subtitle": z.string()
      }),
      "search": z.object({
        "placeholder": z.string()
      }),
      "empty": z.object({
        "title": z.string(),
        "subtitle": z.string()
      }),
      "fab": z.object({
        "label": z.string()
      })
    }),
    admin: z.object({
      "login": z.object({
        "title": z.string(),
        "subtitle": z.string()
      }),
      "dashboard": z.object({
        "title": z.string(),
        "subtitle": z.string(),
        "addButton": z.string(),
        "logoutButton": z.string()
      }),
      "stats": z.object({
        "total": z.string(),
        "available": z.string(),
        "outOfStock": z.string(),
        "categories": z.string()
      }),
      "form": z.object({
        "addTitle": z.string(),
        "editTitle": z.string(),
        "saveButton": z.string(),
        "addButton": z.string()
      }),
      "delete": z.object({
        "title": z.string(),
        "subtitle": z.string(),
        "confirm": z.string(),
        "cancel": z.string()
      }),
      "empty": z.object({
        "message": z.string()
      })
    })
  }
};
export type Schemas = typeof schemas;