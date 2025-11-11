import type { NJS_CMS } from "./NJS_CMS.ts";
import type { itemType } from "../types/index.type";


export class NJS_CMS_ItemType<T extends itemType = itemType> {
    #cms: NJS_CMS;
    #raw: itemType;
    #isReadonly: boolean = false;
    constructor(cms: NJS_CMS, raw: itemType) {
        this.#cms = cms;
        this.#raw = raw;
    }



    checkField(fieldID: keyof T["fields"], value: any) {
        if (!(fieldID in this.#raw.fields)) return false;

        const { required, type } = this.#raw.fields[fieldID];

        // 必須チェック
        if (required && (value === null || value === undefined)) return false;

        // 型チェック
        if (required && (value !== null && value !== undefined)) switch (type) {
            case "string":
                if (typeof value !== "string") return false;
                break;

            case "number":
                if (typeof value !== "number") return false;
                break;

            case "boolean":
                if (typeof value !== "boolean") return false;
                break;

            case "content":
                if (typeof value !== "string" || !this.#cms.hasContent(value)) return false;
                break;

            case "content_list":
                if (!Array.isArray(value) || !value.every(v => typeof v === "string" && this.#cms.hasContent(v))) return false;
                break;

            case "item":
                if (typeof value !== "string" || !this.#cms.hasItem(this.#raw.id, value)) return false;
                break;

            case "item_list":
                if (!Array.isArray(value) || !value.every(v => typeof v === "string" && this.#cms.hasItem(this.#raw.id, v))) return false;
                break;

            default:
                return false;
        }
        return true;
    }

    checkListFieldappend(fieldID: keyof T["fields"], ...values: any[]) {
        if (!(fieldID in this.#raw.fields)) return false;

        const { type } = this.#raw.fields[fieldID];

        if  (values.some(v => typeof v !== "string")) return false;

        switch (type) {
            case "content_list":
                return !values.some(v => !this.#cms.hasContent(v));

            case "item_list":
                return !values.some(v => !this.#cms.hasItem(this.id, v));

            default:
                return false;
        }
    }

    get items() {
        return this.#cms.getItemsByType(this.#raw.id);
    }

//固有フィールド▲
//--------------------------------------------------------------
//デフォルトフィールド▼

    get cms() {
        return this.#cms;
    }

    get id() {
        return this.#raw.id;
    }

    get createdAt() {
        return this.#raw.createdAt;
    }

    get updatedAt() {
        return this.#raw.updatedAt;
    }

    get isDeleted() {
        return !this.#cms.hasItemType(this.#raw.id);
    }

    get isReadonly() {
        return this.#isReadonly;
    }

    get readonly(): NJS_CMS_ItemType<T> {
        if (this.#isReadonly) return this;
        const c = new NJS_CMS_ItemType(this.#cms, this.#raw);
        c.#isReadonly = true;
        return c;
    }

    toJSON() {
        return structuredClone(this.#raw);
    }

}
