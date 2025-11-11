import type { default_field } from "./default_field.type.js";

export type itemTypes_json = itemType[]

export type itemType = {
    fields: {
        [fieldID: string]: itemType_field
    }

} & default_field;


export type itemType_field = {
    type: "string" | "number" | "boolean" | "content" | "content_list"
    required: boolean
} | {
    type: "item" | "item_list"
    required: boolean
    id: string
}

