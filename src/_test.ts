import path from "path";
import { NJS_CMS } from "./index.js";

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


//テスト▲






cms.save();