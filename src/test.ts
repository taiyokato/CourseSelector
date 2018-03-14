import { courseCombinations, addRawCourse } from "./index_refactor";

// 講義名、単位数、期間(0:全学期 1:前半 2: 後半)、必修?(0: yes 1: no)、曜日時限(曜日-コマ) 複数OK。体育など特殊なものには曜日時限指定しない
// Course name, credits, length, required, time, ...time
// 優先度は以下のリストの順番に準ずる
const rawcourses:String[] = [
    "研究会, 4, 0, 1, 5-3,5-4",
    // "体育２, 1,0, 1",
    // "体育３, 1,0, 1",
    "デザイン観察基礎, 2, 1, 0, 1-2, 1-3",
    "心身ウェルネス, 2, 2, 0,1-2",
    "大規模データ処理論, 2, 0, 0, 1-1",
    "行政法, 2,0, 0, 1-6",
    "論理学,2,0,0,2-3",
    "憲法統治, 2, 0, 0, 1-5",
    "憲法人権, 2, 0, 0, 2-3",
    "労働法,2,0,0,2-2",
    "立法技術論,2,0,0,2-1",
    "プログラミング方法論,2,0,0,4-5",
    "囲碁,2,0,0,3-3",
    "ロシア語ベーシック１A, 2, 0, 0, 2-3, 4-3"
];

const opt = {
    // 一日にn授業以下なら切り捨てる
    dailyNoLessThanExclusive: 1,
    // 欲しい最低限の単位数。絶対にこれ以上になるとは限らない
    minCredits: 17,
    // 飛ばす曜日
    skipDays: [4],
    // nコマ以降の授業を切り捨てる。
    noLaterThanPeriodExclusive: 5,
}

addRawCourse(...rawcourses);
courseCombinations(opt);