import { default_field } from "./default_field.type.js"

export type items_json = {
    [itemTypeID: string]: item_data[];
}

export type item_data = {
    fields: {
        [fieldID: string]: string | number | boolean | string[]
    }

} & default_field;