import path from "path";
import fs from "fs";
import mime from "mime-types";
class NJS_CMS_Content {
    #cms;
    #data;
    constructor(cms, data) {
        this.#cms = cms;
        this.#data = data;
    }
    get id() {
        return this.#data.id;
    }
    get name() {
        return this.#data.name;
    }
    set name(value) {
        if (typeof value == "string")
            this.#data.name = value;
    }
    get mimeType() {
        return this.#data.mimeType;
    }
    set mimeType(value) {
        if (typeof value == "string" && Object.values(mime.types).includes(value)) {
            this.#data.mimeType = value;
            this.#data.updatedAt = Date.now();
        }
    }
    get createdAt() {
        return this.#data.createdAt;
    }
    get updatedAt() {
        return this.#data.updatedAt;
    }
    get filePath() {
        return this.#cms.getContentPath(this.#data.id);
    }
    get isDeleted() {
        return !this.#cms.hasContent(this.#data.id);
    }
    toJSON() {
        return structuredClone(this.#data);
    }
}
export class NJS_CMS {
    static #useRootDir = [];
    #rootDir;
    #tree;
    #contents;
    #tempContents = [];
    #itemTypes;
    #items;
    constructor(rootDir) {
        if (NJS_CMS.#useRootDir.includes(rootDir))
            throw new Error("This rootDir is already in use.");
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
        //メタデータ読み込み
        const metaPath = path.join(this.#rootDir, "contents.json");
        this.#contents = this.#loadJSON(metaPath) ?? [];
        const itemTypes_Path = path.join(this.#rootDir, "itemTypes.json");
        this.#itemTypes = this.#loadJSON(itemTypes_Path) ?? [];
        const items_Path = path.join(this.#rootDir, "items.json");
        this.#items = this.#loadJSON(items_Path) ?? {};
    }
    #loadJSON(filePath) {
        try {
            return require(filePath);
        }
        catch {
            return null;
        }
    }
    //生データ取得▼
    #raw_findContent(filter) {
        return this.#contents.find((data) => filter(data));
    }
    #raw_getContents(filter) {
        return this.#contents.filter((data) => filter(data));
    }
    #raw_findItemType(filter) {
        return this.#itemTypes.find((data) => filter(data));
    }
    #raw_getItemTypes(filter) {
        return this.#itemTypes.filter((data) => filter(data));
    }
    #raw_findItem(itemTypeID, filter) {
        return this.#items[itemTypeID]?.find((data) => filter(data));
    }
    #raw_getItems(itemTypeID, filter) {
        return this.#items[itemTypeID]?.filter((data) => filter(data));
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
    addContent(data, name, mimeType) {
        const now = Date.now();
        const id = crypto.randomUUID();
        const filePath = path.join(this.#tree.contentsBuffer, id);
        //ファイル保存
        fs.writeFileSync(filePath, data);
        //一時保存リストに追加
        this.#tempContents.push(id);
        //メタデータ保存
        this.#contents.push({
            id,
            createdAt: now,
            updatedAt: now,
            mimeType: (mimeType ?? mime.lookup(name)) || "application/octet-stream",
            name
        });
        return id;
    }
    updateContentById(id, data, name, mimeType) {
    }
    updateContent(contentData, data) {
        const { id, mimeType, name } = contentData;
        const content = this.#raw_findContent((data) => data.id === id);
        if (!content)
            return false;
        const now = Date.now();
        //必要な要素を上書き
        content.name = name;
        content.mimeType = mimeType;
        content.updatedAt = now;
        if (data) {
            const filePath = path.join(this.#tree.contentsBuffer, id);
            //ファイル保存
            fs.writeFileSync(filePath, data);
            //一時保存リストに追加
            if (!this.#tempContents.includes(id))
                this.#tempContents.push(id);
        }
        return true;
    }
    /**コンテンツが存在するか */
    hasContent(id) {
        return this.#contents.some((data) => data.id === id);
    }
    /**コンテンツを1件取得 */
    findContent(filter) {
        return structuredClone(this.#raw_findContent((data) => filter(structuredClone(data))));
    }
    /**コンテンツを取得 */
    getContents(filter) {
        return structuredClone(this.#raw_getContents((data) => filter(structuredClone(data))));
    }
    /**コンテンツを削除 */
    removeContent(id) {
        const index = this.#contents.findIndex((data) => data.id === id);
        if (index === -1)
            return false;
        this.#contents.splice(index, 1);
        //ファイル削除
        const filePath = this.getContentPath(id);
        if (fs.existsSync(filePath))
            fs.rmSync(filePath);
        //一時保存リストにあれば削除
        if (this.#tempContents.includes(id)) {
            const tempIndex = this.#tempContents.indexOf(id);
            this.#tempContents.splice(tempIndex, 1);
            //ファイル削除
            const filePath = this.getContentPath(id);
            if (fs.existsSync(filePath))
                fs.rmSync(filePath);
        }
        return true;
    }
    /**コンテンツのパスを取得 */
    getContentPath(id) {
        if (this.#tempContents.includes(id)) {
            return path.join(this.#tree.contentsBuffer, id);
        }
        else {
            return path.join(this.#tree.contents, id);
        }
    }
    hasItemType(id) {
        return this.#itemTypes.some((data) => data.id === id);
    }
    /**アイテムタイプを追加 */
    addItemType(fields) {
        const id = crypto.randomUUID();
        const now = Date.now();
        const hasErrorFieldType = Object.values(fields).some((fieldData) => {
            const { type, required } = fieldData;
            if (typeof required !== "boolean")
                return true;
            switch (type) {
                case "string":
                case "number":
                case "boolean":
                case "content":
                case "content_list":
                    return false;
                case "item":
                case "item_list":
                    if (this.hasItemType(fieldData.id))
                        return false;
                default:
                    return true;
            }
        });
        if (hasErrorFieldType)
            return;
        this.#itemTypes.push({
            id,
            createdAt: now,
            updatedAt: now,
            fields: structuredClone(fields)
        });
        return id;
    }
    /**アイテムタイプを1件取得 */
    findItemType(filter) {
        return structuredClone(this.#raw_findItemType(filter));
    }
    /**アイテムタイプを取得 */
    getItemTypes(filter) {
        return structuredClone(this.#raw_getItemTypes(filter));
    }
    /**アイテムが存在するか */
    hasItem(itemTypeId, id) {
        return this.#items[itemTypeId]?.some((data) => data.id === id);
    }
    /**アイテムを追加 */
    addItem(type, data) {
        data = structuredClone(data);
        const typeData = this.findItemType((t) => t.id === type);
        if (!typeData)
            return;
        const id = crypto.randomUUID();
        const now = Date.now();
        const newItem = {
            id,
            createdAt: now,
            updatedAt: now,
            fields: {}
        };
        let err = false;
        Object.entries(typeData.fields).forEach(([fieldID, fieldData]) => {
            if (err)
                return;
            const { type, required } = fieldData;
            const value = data[fieldID];
            if (required && !value)
                return err = true;
            const fieldValue = (() => {
                switch (type) {
                    case "string":
                        if (typeof value !== "string")
                            return err = true;
                        return value;
                    case "number":
                        if (typeof value !== "number")
                            return err = true;
                        return value;
                    case "boolean":
                        if (typeof value !== "boolean")
                            return err = true;
                        return value;
                    case "content":
                        if (typeof value !== "string")
                            return err = true;
                        if (!this.hasContent(value))
                            return err = true;
                        return value;
                    case "content_list":
                        if (!Array.isArray(value))
                            return err = true;
                        if (!value.every((v) => typeof v === "string" && this.hasContent(v)))
                            return err = true;
                        return value;
                    case "item":
                        if (typeof value !== "string")
                            return err = true;
                        if (!this.hasItem(fieldData.id, value))
                            return err = true;
                        return value;
                    case "item_list":
                        if (!Array.isArray(value))
                            return err = true;
                        if (!value.every((v) => typeof v === "string" && this.hasItem(fieldData.id, v)))
                            return err = true;
                        return value;
                }
            })();
            newItem.fields[fieldID] = fieldValue;
        });
        if (err)
            return;
        const items = this.#items[type] ?? [];
        items.push(newItem);
        this.#items[type] = items;
        return id;
    }
    /**アイテムを1件取得 */
    findItem(itemTypeId, filter) {
        return structuredClone(this.#raw_findItem(itemTypeId, filter));
    }
    getItems(itemTypeId, filter) {
        return structuredClone(this.#raw_getItems(itemTypeId, filter) ?? []);
    }
    addSystemEventListener() { }
}
