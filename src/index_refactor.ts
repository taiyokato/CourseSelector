import { ECourseLength, ICourse } from "./types";

const options = {
    dailyNoLessThanExclusive: 1,
    minCredits: 15,
    skipDays: [3],
    noLaterThanPeriodExclusive: 5,
}

let courses: ICourse[] = [];
let rawcourses: String[] = [];

export function addRawCourse(...rawcourse: String[])  {
    for (const rc of rawcourse) {
        rawcourses.push(rc);
    }
}

function parseCourses() {
    
    // Course name, credits, length, required, priority, time, ...time
    // Where time => 1-1, 2-3, or none. None will be treated as special like PE
    let priority = 1;
    for (const row of rawcourses) {
        const [name, credits, courselength, required, ...time] = row.split(',').map(x => { return x.trim()});
        
        const times = time.map(t => {
            const [d, p] = t.split('-').map(Number);
            return { day: d, period: p};
        });
        
        const course: ICourse = {
            name: name,
            credits: Number(credits),
            courseLength: Number(courselength),
            priority: priority,
            time: times,
            required: Boolean(Number(required)),
        }
        
        courses.push(course);
        priority++;
    }
}

function sortCoursesForPicking(a:ICourse, b:ICourse) {
    if (a.priority < b.priority) return -1;
    if (a.priority > b.priority) return 1;
    
    if (a.required) return -1;
    if (b.required) return 1;

    return 0;
}

function arrayEqual(a: any[], b: any[]):boolean {
    // prevcount !== coursecounts
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

export function courseCombinations(option?: any) {
    if (option) {
        Object.assign(options, option);
    }
    parseCourses();
    //courses: ICourse[]
    const table = createTable();
    
    const days:any = {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        other: []
    }
    
    // Separate courses by its day
    // If a course have different periods, make a separate record
    // Remove here if course period is later than specified.
    for (const c of courses) {
        if (c.time.length === 0) {
            days.other.push(c);
            continue;
        }
        // Check OK first. If OK, then add to days
        const pcheck = c.time.every(p => {
            return p.period < options.noLaterThanPeriodExclusive;
        });
        if (!(c.required || pcheck)) continue;
        for (const t of c.time) {
            switch (t.day) {
                case 1: days.mon.push(c); break;
                case 2: days.tue.push(c); break;
                case 3: days.wed.push(c); break;
                case 4: days.thu.push(c); break;
                case 5: days.fri.push(c); break;
            }
        }
    }
    
    let prevcount = ['mon', 'tue', 'wed', 'thu', 'fri'].map((v) => {
        const day = days[v];
        return day.length;
    });
    let coursecounts = prevcount;
    
    do
    {
        prevcount = coursecounts;
                
        // Check for days not satisfying the dailyNoLessThan
        ['mon', 'tue', 'wed', 'thu', 'fri'].forEach((v, i) => {
            const day:ICourse[] = days[v];
            // Calculate required courses in this day
            const reqcourses = day.filter(d => {
                return d.required;
            });
            
            
            if (day.length < (options.dailyNoLessThanExclusive - reqcourses.length)) {
                options.skipDays.push(i + 1);
            }
        });
        
        options.skipDays = options.skipDays.reduce((p, r) => {
            if (!p.includes(r)) p.push(r);
            return p;
        }, []);
        
        // Remove courses that fall under the skipDays
        ['mon', 'tue', 'wed', 'thu', 'fri'].forEach((v, i) => {
            const day = days[v];
            // Check if skipDays has current day of week
            // If yes, go in and delete the course from days
            if (options.skipDays.includes(i+1)) {
                // Check for any courses with other days
                
                
                for (const c of day) {
                    // Obtain the days of this course
                    // console.log('timeday', c.time);
                    
                    let dow = '';
                    
                    // go through that day and find the course
                    for (const td of c.time) {
                        switch (td.day) {
                            case 1: dow = 'mon'; break;
                            case 2: dow = 'tue';  break;
                            case 3: dow = 'wed';  break;
                            case 4: dow = 'thu';  break;
                            case 5: dow = 'fri';  break;
                        }
                        
                        // Remove the course with same priority id
                        days[dow] = days[dow].filter((sc: ICourse) => {
                            return sc.priority !== c.priority;
                        });
                    }
                }
            }
        });
        
        
        coursecounts = ['mon', 'tue', 'wed', 'thu', 'fri'].map((v) => {
            const day = days[v];
            return day.length;
        });
        // console.log(prevcount, coursecounts);
        
    } while(!arrayEqual(prevcount, coursecounts));
    
    
    
    
    let catalog: ICourse[] = [];
    // Put back days to courses
    ['mon', 'tue', 'wed', 'thu', 'fri', 'other'].forEach((v, i) => {
        const day = days[v];
        for (const c of day) {
            catalog.push(c);   
        }
    });
    catalog = catalog.reduce((p: ICourse[], cc: ICourse) => {
        const check = p.some((per) => {
            return per.name === cc.name;
        });
        if (!check) {
            p.push(cc);
        }
        return p;
    }, []).sort(sortCoursesForPicking);
    
    let selected: ICourse[] = [];//catalog.sort(sortCourses);
    let credits: number = 0;
    
    while (catalog.length > 0 && credits < options.minCredits) {
        const c:ICourse = catalog.shift();
        const write = writeTable(table, c);
        
        if (write) {
            selected.push(c);
            credits += c.credits;
        }
    }
    
    pretty(table, 4, credits);
    
}

function createTable() {
    let table = Array(8);
    
    for (let days = 0; days < table.length - 1; days++) {
        table[days] = Array(7);
        for (let periods = 0; periods < table[days].length; periods++) {
            table[days][periods] = {
                full: null,
                first: null,
                second: null,
            }
        }
    }
    table[table.length - 1] = []; 
    return table;
}

function writeTable(table: any, course: ICourse) {
    
    if (course.time.length === 0) {
        table[table.length - 1].push(course);
        return true;
    }
    
    const noconflict: boolean = course.time.every((t) => {
        
        const cell = table[t.day][t.period];
        
        switch (course.courseLength) {
            case 0:
            if (cell['full'] && cell['full'].priority < course.priority) return false;
            cell['full'] = course;
            break;
            case 1:
            if (!cell['full'] && cell['first'] && cell['first'].priority < course.priority) return false;
            cell['first'] = course;
            break;
            case 2:
            if (!cell['full'] && cell['second'] && cell['second'].priority < course.priority) return false;
            cell['second'] = course;
            break;
        }
        return true;
    });
    return noconflict;
}

function _calcWritePad(pl: number[], name: String, day: number | String, period: number | String, length: String) {
    pl[0] = Math.max(pl[0], name.length);
    pl[1] = Math.max(pl[1], `${day}`.length);
    pl[2] = Math.max(pl[2], `${period}`.length);
    pl[3] = Math.max(pl[3], length.length);
    // pl[4] =Math.max(pl[4], `${priority}`.length);
    
    return [name, day, period, length];
}

function pretty(table: any, padmin: number = 4, creditcount: number) {
    
    const defPadLen = Math.max(4, padmin);
    const pl = Array(4).fill(defPadLen); //Name - Day - Period - Length
    
    
    const outputs = [];
    
    
    // outputs.push(['Courses', '', '', '']);
    outputs.push(['講義名','日','コマ','期間']);
    
    for (let x = 0; x < table.length - 1; x++) {
        const days = table[x];
        for (let y = 0; y < days.length; y++) {
            const p = days[y];
            if (p.full) {
                // credits += p.full.credits;
                outputs.push(_calcWritePad(pl, p.full.name, num2day(x), y, '全学期'));
            }
            if (p.first) {
                // credits += p.first.credits;
                outputs.push(_calcWritePad(pl, p.first.name, num2day(x), y, '前半'));
            }
            if (p.second) {
                // credits += p.second.credits;
                outputs.push(_calcWritePad(pl, p.second.name, num2day(x), y, '後半'));
            }
        }
    }


    for (let i = 0; i < table[table.length-1].length; i++) {
        const p:ICourse = table[table.length-1][i];
        let clname = '';
        switch(p.courseLength) {
            case 0:
            clname = '全学期';
            break;
            case 1:
            clname = '前半';
            break;
            case 2:
            clname = '後半';
            break;
        }
        
        outputs.push(_calcWritePad(pl, p.name, '他', '他', clname));
    }
    const pads = [(pl[0] + defPadLen), (pl[1] + defPadLen), (pl[2] + defPadLen), (pl[3] + defPadLen)];
    
    for (let o = 0; o < outputs.length; o++) {
        const r = outputs[o];
        const weave = r.reduce((p, c,i ) => {
            p += (`${c}`.padStart(pads[i], '　'));
            return p;
        }, '');
        console.log(weave);
    }
    console.log(`単位合計: ${creditcount}`);

}

function num2day(num: number): String {
    switch (num) {
        case 1: return '月';
        case 2: return '火';
        case 3: return '水';
        case 4: return '木';
        case 5: return '金';
    }
    return '他';
}