import type { NJS_CMS } from "./NJS_CMS.ts";
import type { item_data, itemType} from "../types/index.type.ts";
import { NJS_CMS_ItemType } from "./ItemType.ts";
import { NJS_CMS_EventEmitter } from "./CMS_EventEmitter.ts";


export class NJS_CMS_Item <T extends itemType = itemType> {
    #cms: NJS_CMS;
    #emitter: NJS_CMS_EventEmitter;
    #type: NJS_CMS_ItemType<T>;
    #raw: item_data<T>;
    #isReadonly: boolean = false;
    constructor(cms: NJS_CMS, emitter: NJS_CMS_EventEmitter, type: NJS_CMS_ItemType<T>, data: item_data<T>) {
        this.#cms = cms;
        this.#emitter = emitter;
        this.#type = type;
        this.#raw = data;
    }



    setField(fieldID: keyof T["fields"], value: any) {
        const isValid = this.#type.checkField(fieldID, value);

        if (!isValid) return false;

        this.#raw.fields[fieldID] = value;
        this.#raw.updatedAt = Date.now();

        return true;


    }

    appendToField(fieldID: keyof T["fields"], ...values: any[]) {
        
        const isValid = this.#type.checkListFieldappend(fieldID, ...values);
        
        if (!isValid) return false;

        const currentValue = this.#raw.fields[fieldID] ?? (this.#raw.fields[fieldID] = []);

        if (!Array.isArray(currentValue)) return false;

        currentValue.push(...values);
    }


    get type() {
        return this.#type;
    }

//固有フィールド▲
//--------------------------------------------------------------
//デフォルトフィールド▼

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
        return !this.#cms.hasItem(this.#type.id, this.#raw.id);
    }

    get isReadonly() {
        return this.#isReadonly;
    }

    get readonly() {
        const c = new NJS_CMS_Item(this.#cms, this.#emitter, this.#type, this.#raw);
        c.#isReadonly = true;
        return c;
    }

    toJSON() {
        return structuredClone(this.#raw);
    }

}