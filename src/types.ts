export enum ECourseLength {
    FULL,
    FIRST,
    SECOND,
}

export interface ICourse {
    name: String;
    credits: number;
    time: {
        day: number;
        period: number;        
    }[];
    courseLength: ECourseLength;
    priority: number;
    required: boolean;
}