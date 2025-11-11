import path from "path";
import { NJS_CMS } from "../src/index.ts";
import type { default_field } from "../src/index.ts";

const __dirname = import.meta.dirname;

const CMS_RootDir = path.join(__dirname, "data");

const cms = new NJS_CMS(CMS_RootDir);



type resultDataType = {
    name: string;
    resultData: any;
    runTime: number;
};



const result: resultDataType[] = [];

function runTest(testName: string, testFunc: () => any) {
    const startTime = process.hrtime.bigint();
    const resultData = testFunc();
    const runTime = Number(process.hrtime.bigint() - startTime) / 1_000_000;

    result.push({
        name: testName,
        resultData,
        runTime,
    });
}






//テスト▼


type typeData = {
    fields: {
        second: {
            "type": "number"
            "required": true
        }
    }
} & default_field

const id = cms.addItemType<typeData>(
    {
        second: {
            required: true,
            type: "number"
        }
    }
);




const itemId = cms.addItem<typeData>(id!, {
    second: 0,
});

const newType = cms.findItemType((itemType) => itemType.id === id)
console.log(id);
console.log(newType);

console.log(itemId)
//テスト▲



process.on("exit", () => {
    cms.save();
});