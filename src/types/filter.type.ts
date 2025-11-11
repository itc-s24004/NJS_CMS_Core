import type { NJS_CMS_Content } from "../system/Content.ts";
import { NJS_CMS_Item } from "../system/Item.ts";
import type { NJS_CMS_ItemType } from "../system/ItemType.ts";
import type { itemType } from "./itemType.type.ts";

export type content_filter = (data: NJS_CMS_Content) => boolean;

export type itemType_filter<T extends itemType = itemType> = (data: NJS_CMS_ItemType<T>) => boolean;

export type item_filter<T extends itemType = itemType> = (data: NJS_CMS_Item<T>) => boolean;