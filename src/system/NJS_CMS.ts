import path from "path";
import fs from "fs";
import mime from "mime-types";

import type { content_data, contents_json } from "../types/content.type.ts";
import type { content_filter, item_filter, itemType_filter } from "../types/filter.type.ts";
import type { itemType, itemTypes_json } from "../types/itemType.type.ts";
import type { item_data, items_json } from "../types/item.type.ts";
import type { NJS_CMS_EventCallback, NJS_CMS_SystemEventCallback} from "./CMS_EventEmitter.ts"

import { NJS_CMS_EventEmitter } from "./CMS_EventEmitter.ts";
import { NJS_CMS_Content } from "./Content.ts";
import { NJS_CMS_ItemType } from "./ItemType.ts";
import { NJS_CMS_Item } from "./Item.ts";






export class NJS_CMS {
    static #useRootDir: string[] = [];

    #systemEventEmitter: NJS_CMS_EventEmitter = new NJS_CMS_EventEmitter();

    #rootDir: string;
    #tree: {
        contents: string;
        contentsBuffer: string;
    };

    #contents: NJS_CMS_Content[];
    #tempContents: string[] = [];

    #itemTypes: NJS_CMS_ItemType[];

    #items: {[itemTypeID: string]: NJS_CMS_Item[]} = {};
    constructor(rootDir: string) {
        if (NJS_CMS.#useRootDir.includes(rootDir)) throw new Error("This rootDir is already in use.");
        NJS_CMS.#useRootDir.push(rootDir);

        this.#rootDir = rootDir;

        //ディレクトリ構成
        this.#tree = {
            contents: path.join(this.#rootDir, "contents"),
            contentsBuffer: path.join(this.#rootDir, "contents_buffer")
        };

        //ディレクトリ作成
        Object.values(this.#tree).forEach(dir => {
            fs.mkdirSync(dir, { recursive: true });
        });

        //一時ファイルを削除
        fs.readdirSync(this.#tree.contentsBuffer).forEach(file => {
            fs.rmSync(path.join(this.#tree.contentsBuffer, file));
        });

        //読み込み
        const metaPath = path.join(this.#rootDir, "contents.json");
        this.#contents = (this.#loadJSON<contents_json>(metaPath) ?? []).map(data => new NJS_CMS_Content(this, this.#systemEventEmitter, data));//マッピング

        const itemTypes_Path = path.join(this.#rootDir, "itemTypes.json");
        this.#itemTypes = (this.#loadJSON<itemTypes_json>(itemTypes_Path) ?? []).map(data => new NJS_CMS_ItemType(this, data));//マッピング

        const items_Path = path.join(this.#rootDir, "items.json");
        Object.entries(this.#loadJSON<items_json>(items_Path) ?? {}).forEach(([itemTypeID, itemList]) => {
            const itemType = this.#itemTypes.find(t => t.id === itemTypeID);
            if (!itemType) return;
            this.#items[itemTypeID] = itemList.map(data => new NJS_CMS_Item(this, this.#systemEventEmitter, itemType, data));
        })

    }



    addSystemEventListener(callback: NJS_CMS_SystemEventCallback) {
        this.#systemEventEmitter.onBefore(callback);
    }

    removeSystemEventListener(callback: NJS_CMS_SystemEventCallback) {
        this.#systemEventEmitter.removeBeforeListener(callback);
    }


    addEventListener(callback: NJS_CMS_EventCallback) {
        this.#systemEventEmitter.on(callback);
    }

    removeEventListener(callback: NJS_CMS_EventCallback) {
        this.#systemEventEmitter.removeListener(callback);
    }



    #loadJSON<jsonType>(filePath: string) {
        try {
            const json = fs.readFileSync(filePath, "utf-8");
            return JSON.parse(json) as jsonType;
        } catch {
            return null;
        }
    }



    #raw_getItemsbyType(itemTypeID: string) {
        return this.#items[itemTypeID];
    }
    //生データ取得▲


    /**変更を保存 */
    save() {
        //一時保存リストのファイルを移動
        this.#tempContents.forEach(id => {
            const oldPath = path.join(this.#tree.contentsBuffer, id);
            const newPath = path.join(this.#tree.contents, id);
            fs.renameSync(oldPath, newPath);
        });
        //一時保存リストをクリア
        this.#tempContents = [];

        //メタデータ保存
        const metaPath = path.join(this.#rootDir, "contents.json");
        fs.writeFileSync(metaPath, JSON.stringify(this.#contents, null, 0), "utf-8");

        const itemTypes_Path = path.join(this.#rootDir, "itemTypes.json");
        fs.writeFileSync(itemTypes_Path, JSON.stringify(this.#itemTypes, null, 0), "utf-8");

        const items_Path = path.join(this.#rootDir, "items.json");
        fs.writeFileSync(items_Path, JSON.stringify(this.#items, null, 0), "utf-8");
        
        console.log("save completed");
    }


    /**コンテンツを追加 */
    addContent(data: Buffer, name: string, mimeType?: string) {
        const now = Date.now();
        const id = crypto.randomUUID();
        const filePath = path.join(this.#tree.contentsBuffer, id);
        //ファイル保存
        fs.writeFileSync(filePath, data);
        //一時保存リストに追加
        this.#tempContents.push(id);

        const newContent: NJS_CMS_Content = new NJS_CMS_Content(this, this.#systemEventEmitter, {
            id,
            createdAt: now,
            updatedAt: now,
            mimeType: (mimeType ?? mime.lookup(name)) || "application/octet-stream",
            name
        });

        //メタデータ保存
        this.#contents.push(newContent);

        return newContent;
    }

    updateContentById(id: string, data?: Buffer, name?: string, mimeType?: string) {
        
    }

    updateContent(contentData: content_data, data?: Buffer) {
        const { id, mimeType, name } = contentData;
        const content = this.findContent((data) => data.id === id);
        if (!content) return false;
        //必要な要素を上書き
        content.name = name;
        content.mimeType = mimeType;

        if (data) {
            const filePath = path.join(this.#tree.contentsBuffer, id);
            //ファイル保存
            fs.writeFileSync(filePath, data);
            //一時保存リストに追加
            if (!this.#tempContents.includes(id)) this.#tempContents.push(id);
        }
        return true;
    }


    /**コンテンツが存在するか */
    hasContent(id: string) {
        return this.#contents.some((data) => data.id === id);
    }


    /**コンテンツを1件取得 */
    findContent(filter: content_filter) {
        return this.#contents.find((data) => filter(data.readonly));
    }


    /**コンテンツを取得 */
    getContents(filter: content_filter) {
        return this.#contents.filter((data) => filter(data.readonly));
    }


    /**コンテンツを削除 */
    removeContent(id: string) {
        const index = this.#contents.findIndex((data) => data.id === id);
        if (index === -1) return false;
        this.#contents.splice(index, 1);
        //ファイル削除
        const filePath = this.getContentPath(id);
        if (fs.existsSync(filePath)) fs.rmSync(filePath);
        //一時保存リストにあれば削除
        if (this.#tempContents.includes(id)) {
            const tempIndex = this.#tempContents.indexOf(id);
            this.#tempContents.splice(tempIndex, 1);
            //ファイル削除
            const filePath = this.getContentPath(id);
            if (fs.existsSync(filePath)) fs.rmSync(filePath);
        }
        return true;
    }


    /**コンテンツのパスを取得 */
    getContentPath(id: string) {
        if (this.#tempContents.includes(id)) {
            return path.join(this.#tree.contentsBuffer, id);
        } else {
            return path.join(this.#tree.contents, id);
        }
    }



    hasItemType(id: string) {
        return this.#itemTypes.some((data) => data.id === id);
    }

    /**アイテムタイプを追加 */
    addItemType<T extends itemType = itemType>(fields: T["fields"]) {
        const id = crypto.randomUUID();
        const now = Date.now();

        const hasErrorFieldType = Object.values(fields).some(( fieldData ) => {
            const { type, required } = fieldData;
            if (typeof required !== "boolean") return true;
            switch (type) {
                case "string":
                case "number":
                case "boolean":
                case "content":
                case "content_list":
                    return false;

                case "item":
                case "item_list":
                    if (this.hasItemType(fieldData.id)) return false;

                default:
                    return true;//不正な型
            }
        });
        if (hasErrorFieldType) return;

        const itemType = new NJS_CMS_ItemType(this, {
            id,
            createdAt: now,
            updatedAt: now,
            fields: structuredClone(fields)
        });


        this.#itemTypes.push(itemType);

        return id;
    }

    /**アイテムタイプを1件取得 */
    findItemType(filter: itemType_filter) {
        return this.#itemTypes.find((data) => filter(data.readonly));
    }

    /**アイテムタイプを取得 */
    getItemTypes(filter: itemType_filter) {
        return this.#itemTypes.filter((data) => filter(data.readonly));
    }





    /**アイテムが存在するか */
    hasItem(itemTypeId: string, id: string) {
        return this.#items[itemTypeId]?.some((data) => data.id === id);
    }

    /**アイテムを追加 */
    addItem<T extends itemType = itemType>(type: string, data: item_data<T>["fields"]) {
        data = structuredClone(data);
        const typeData = this.findItemType((t) => t.id === type);
        if (!typeData) return;
        const id = crypto.randomUUID();
        const now = Date.now();

        const newItem: item_data<T> = {
            id,
            createdAt: now,
            updatedAt: now,
            fields: {
                ...data
            }
        };

        const success = Object.entries(data).every(([fieldID, value]) => typeData.checkField(fieldID, value));

        if (!success) return;

        const item = new NJS_CMS_Item<T>(this, this.#systemEventEmitter, typeData, newItem);

        const items = this.#items[type] ?? [];
        items.push(item);
        this.#items[type] = items;
        return id;
    }


    /**アイテムを1件取得 */
    findItem<T extends itemType = itemType>(itemTypeId: string, filter: item_filter<T>) {
        return this.#items[itemTypeId]?.find((data) => filter(data.readonly));

    }


    getItems<T extends itemType = itemType>(itemTypeId: string, filter: item_filter<T>) {
        return this.#items[itemTypeId]?.filter((data) => filter(data.readonly)) || [];

    }

    getItemsByType(itemTypeId: string) {
        return this.#items[itemTypeId] || [];

    }


}