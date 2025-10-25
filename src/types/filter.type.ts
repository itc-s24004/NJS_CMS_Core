import { content_data } from "./content.type.js";
import { item_data } from "./item.type.js";
import { itemType } from "./itemType.type.js";

export type content_filter = (data: content_data) => boolean;

export type itemType_filter = (data: itemType) => boolean;

export type item_filter = (data: item_data) => boolean;