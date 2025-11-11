export type NJS_CMS_Event = "add" | "update" | "delete";

export type NJS_CMS_EventData = {
    type: "content"
    event: NJS_CMS_Event
    id: string

} | {
    type: "itemType"
    event: NJS_CMS_Event
    id: string

} | {
    type: "item"
    event: NJS_CMS_Event
    id: string
    typeID: string

}


export type SystemEventData = {
    preventDefault: boolean
}



export type NJS_CMS_EventCallback = (data: NJS_CMS_EventData) => void;

export type NJS_CMS_SystemEventCallback = (data: NJS_CMS_EventData, system: SystemEventData) => void;


export class NJS_CMS_EventEmitter {
    #callbacks: NJS_CMS_EventCallback[] = [];
    #systemCallbacks: NJS_CMS_SystemEventCallback[] = [];

    emit(data: NJS_CMS_EventData) {
        const systemData: SystemEventData = { preventDefault: false };
        this.#systemCallbacks.forEach(cb => cb(data, systemData));

        Object.freeze(data);
        if (!systemData.preventDefault) this.#callbacks.forEach(cb => cb(data));
    }


    onBefore(callback: NJS_CMS_SystemEventCallback) {
        this.#systemCallbacks.push(callback);
    }

    removeBeforeListener(callback: NJS_CMS_SystemEventCallback) {
        this.#systemCallbacks.splice(this.#systemCallbacks.indexOf(callback), 1);
    }


    on(callback: NJS_CMS_EventCallback) {
        this.#callbacks.push(callback);
    }

    removeListener(callback: NJS_CMS_EventCallback) {
        this.#callbacks.splice(this.#callbacks.indexOf(callback), 1);
    }
}