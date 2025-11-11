import type { default_field } from "./default_field.type.js"

export type contents_json = content_data[]

export type content_data = {
    mimeType: string
    name: string

} & default_field;