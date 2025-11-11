import mime from "mime-types";

import { NJS_CMS } from "./NJS_CMS.ts";
import type { content_data } from "../types/index.type.ts";
import { NJS_CMS_EventEmitter } from "./CMS_EventEmitter.ts";




export type NJS_CMS_Content_UpdateSequence = {
    
}


export class NJS_CMS_Content_UpdateRequest {
    #data?: Buffer;
    get data() {
        return this.#data;
    }
    
    set data(value: Buffer | undefined) {
        if (Buffer.isBuffer(value)) this.#data = value;
    }

    #name?: string;

    get name() {
        return this.#name;
    }

    set name(value: string | undefined) {
        if (typeof value == "string") this.#name = value;
    }
}



export class NJS_CMS_Content {
    #cms: NJS_CMS;
    #emitter: NJS_CMS_EventEmitter;
    #raw: content_data;
    #isReadonly: boolean = false;
    constructor(cms: NJS_CMS, emitter: NJS_CMS_EventEmitter, raw: content_data) {
        this.#cms = cms;
        this.#emitter = emitter;
        this.#raw = raw;
    }


    get name() {
        return this.#raw.name;
    }

    set name(value: string) {
        if (this.#isReadonly) return;
        if (typeof value == "string") this.#raw.name = value;
    }


    get mimeType() {
        return this.#raw.mimeType;
    }

    set mimeType(value: string) {
        if (this.#isReadonly) return;
        if (typeof value == "string" && Object.values(mime.types).includes(value)) {
            this.#raw.mimeType = value;
            this.#raw.updatedAt = Date.now();
        }
    }

    get file() {
        return this.#cms.getContentPath(this.#raw.id);
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
        return !this.#cms.hasContent(this.#raw.id);
    }

    get isReadonly() {
        return this.#isReadonly;
    }

    get readonly() {
        const c = new NJS_CMS_Content(this.#cms, this.#emitter, this.#raw);
        c.#isReadonly = true;
        return c;
    }

    toJSON() {
        return structuredClone(this.#raw);
    }

}