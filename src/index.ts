import { ECourseLength, ICourse } from "./types";
const options = {
    dailyNoLessThanExclusive: 1,
    minCredits: 20,
    skipDays: [3,4],
    noLaterThanPeriodExclusive: 5,
}

const rawcourses:String[] = [
    "大規模データ処理論, 2, 0, 0, 4, 1-1",
    "憲法人権, 2, 0, 0, 8, 2-3",
    "憲法統治, 2, 0, 0, 7, 1-5",
    "行政法, 2,0, 0, 5,1-6",
    "研究会, 4, 0, 1, 1, 5-3,5-4",
    "体育2, 1,0, 1, 2",
    "体育3, 1,0, 1, 3",
    "立法技術論,2,0,0, 10,2-1",
    "囲碁,2,0,0,12,3-3",
    "論理学,2,0,0,6,2-3",
    "労働法,2,0,0,9,2-2",
    "プログラミング方法論,2,0,0,11,4-5",
    "ロシア語ベーシック１A, 2, 0, 0, 13, 2-3, 4-3"
];

let courses: ICourse[] = [];

function parseCourses(): void {
    // Course name, credits, length, required, priority, time, ...time
    // Where time => 1-1, 2-3, or none. None will be treated as special like PE
    for (const row of rawcourses) {
        const [name, credits, courselength, required, priority, ...time] = row.split(',').map(x => { return x.trim()});
        
        const times = time.map(t => {
            const [d, p] = t.split('-').map(Number);
            return { day: d, period: p};
        });
        
        const course: ICourse = {
            name: name,
            credits: Number(credits),
            courseLength: Number(courselength),
            priority: Number(priority),
            time: times,
            required: Boolean(Number(required)),
        }
        
        courses.push(course);
    }
}

function sortCourses(a:ICourse, b:ICourse) {
    if (a.priority < b.priority) return -1;
    if (a.priority > b.priority) return 1;
    
    
    if (a.required === b.required) return 0;
    if (a.required) return -1;
    return 1;
}

function debug(list: ICourse[]) {
    list.map(l => {
        console.log(l.name);        
    });
}

function arrayEqual(a: any[], b: any[]):boolean {
    // prevcount !== coursecounts
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

function courseCombinations(courses: ICourse[]) {
    
    parseCourses();
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
    }, []).sort(sortCourses);
    
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
    
    // checkTable(table);

    selected = selected.sort(sortCourses);
        
    // pretty(table, 4);
    prettyPriority(selected);
    
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

function checkTable(table: any) {
    
    
    for (let x = 0; x < table.length; x++) {
        const element = table[x];
        let line = [];
        for (let y = 0; y < element.length; y++) {
            if (element[y].full)
            line.push(element[y].full.name.charAt(0));
            else line.push('　');
        }
        console.log(line.join('|'));
    }
}

function readTable(table: any, day: number, period: number) {
    return table[day][period];
}

function _calcWritePad(pl: number[], name: String, day: number | String, period: number | String, length: String, priority: number) {
    pl[0] = Math.max(pl[0], name.length);
    pl[1] = Math.max(pl[1], `${day}`.length);
    pl[2] = Math.max(pl[2], `${period}`.length);
    pl[3] = Math.max(pl[3], length.length);
    
    return [name, day, period, length, priority];
}

function prettyPriority(selected: ICourse[]) {
    
    const d2d = ['M', 'Tu', 'W', 'Th', 'F', '*'];
    const len = ['Full', 'First', 'Second'];
    
    let credits = 0;
    
    console.log(`Name Priority Day Period Length`);
    for (const c of selected) {
        if (c.time.length === 0) {
            console.log(`${c.name} ${c.priority} Any-Any ${len[c.courseLength]}`);
        }
        for (const t of c.time) {
            console.log(`${c.name} ${c.priority} ${d2d[t.day-1]}-${t.period} ${len[c.courseLength]}`);
        }
        credits += c.credits;
    }
    console.log(`Total of ${credits} credits`);
    
}

function pretty(table: any, padmin: number = 4) {
    
    const defPadLen = Math.max(4, padmin);
    const pl = Array(4).fill(defPadLen); //Name - Day - Period - Length
    
    
    const outputs = [];
    
    // outputs.push(['Courses', '', '', '']);
    outputs.push(['Name','Day','Period','Length', 'Priority']);
    
    for (let x = 0; x < table.length - 1; x++) {
        const days = table[x];
        for (let y = 0; y < days.length; y++) {
            const p = days[y];
            if (p.full) {
                outputs.push(_calcWritePad(pl, p.full.name, x, y, 'Full', p.full.priority));
            }
            if (p.first) {
                outputs.push(_calcWritePad(pl, p.first.name, x, y, 'First', p.first.priority));
            }
            if (p.second) {
                outputs.push(_calcWritePad(pl, p.second.name, x, y, 'Second', p.second.priority));
            }
        }
    }
    for (let i = 0; i < table[table.length-1].length; i++) {
        const p = table[table.length-1][i];
        let clname = '';
        switch(p.courseLength) {
            case 0:
            clname = 'Full';
            break;
            case 1:
            clname = 'First';
            break;
            case 2:
            clname = 'Second';
            break;
        }
        outputs.push(_calcWritePad(pl, p.name, 'Any', 'Any', clname, p.priority));
    }
    const pads = [(pl[0] + defPadLen), (pl[1] + defPadLen), (pl[2] + defPadLen), (pl[3] + defPadLen)];
    
    for (let o = 0; o < outputs.length; o++) {
        const r = outputs[o];
        const weave = r.reduce((p, c,i ) => {
            p += (c + '　'.repeat(pads[i] - `${c}`.length));
            return p;
        }, '');
        console.log(weave);
    }
    
}

courseCombinations(courses);