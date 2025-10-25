import type { content_data } from "./types/content.type.js";
import type { content_filter, item_filter, itemType_filter } from "./types/filter.type.js";
import type { itemType_field } from "./types/itemType.type.js";
import type { item_data } from "./types/item.type.js";
export declare class NJS_CMS {
    #private;
    constructor(rootDir: string);
    /**変更を保存 */
    save(): void;
    /**コンテンツを追加 */
    addContent(data: Buffer, name: string, mimeType?: string): `${string}-${string}-${string}-${string}-${string}`;
    updateContentById(id: string, data?: Buffer, name?: string, mimeType?: string): void;
    updateContent(contentData: content_data, data?: Buffer): boolean;
    /**コンテンツが存在するか */
    hasContent(id: string): boolean;
    /**コンテンツを1件取得 */
    findContent(filter: content_filter): content_data | undefined;
    /**コンテンツを取得 */
    getContents(filter: content_filter): content_data[];
    /**コンテンツを削除 */
    removeContent(id: string): boolean;
    /**コンテンツのパスを取得 */
    getContentPath(id: string): string;
    hasItemType(id: string): boolean;
    /**アイテムタイプを追加 */
    addItemType(fields: {
        [fieldID: string]: itemType_field;
    }): `${string}-${string}-${string}-${string}-${string}` | undefined;
    /**アイテムタイプを1件取得 */
    findItemType(filter: itemType_filter): import("./types/itemType.type.js").itemType | undefined;
    /**アイテムタイプを取得 */
    getItemTypes(filter: itemType_filter): import("./types/itemType.type.js").itemType[];
    /**アイテムが存在するか */
    hasItem(itemTypeId: string, id: string): boolean;
    /**アイテムを追加 */
    addItem(type: string, data: item_data["fields"]): `${string}-${string}-${string}-${string}-${string}` | undefined;
    /**アイテムを1件取得 */
    findItem(itemTypeId: string, filter: item_filter): item_data | undefined;
    getItems(itemTypeId: string, filter: item_filter): item_data[];
    addSystemEventListener(): void;
}
