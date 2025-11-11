import type { default_field } from "./default_field.type.js"
import type { itemType, itemType_field } from "./itemType.type.js";

export type items_json<T extends itemType = itemType> = {
    [itemTypeID: string]: item_data<T>[];
}


export type item_fields<T extends itemType["fields"] = itemType["fields"]> = {
    [fieldID in keyof T]: 
        T[fieldID]["type"] extends "string" ?  string :
        T[fieldID]["type"] extends "number" ? number :
        T[fieldID]["type"] extends "boolean" ? boolean :
        T[fieldID]["type"] extends "content" ? string :
        T[fieldID]["type"] extends "content_list" ? string[] :
        T[fieldID]["type"] extends "item" ? string :
        T[fieldID]["type"] extends "item_list" ? string[] :
        string | number | boolean | string[];
}

export type item_data<T extends itemType> = {
    fields: item_fields<T["fields"]>;

} & default_field;






const test: item_fields = {
    first: "",
    second: [""],
    test: "hello"
};