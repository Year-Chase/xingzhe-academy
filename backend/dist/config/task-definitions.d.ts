export interface TaskOption {
    text: string;
    value: any;
}
export interface TaskDefinition {
    taskCode: string;
    uiType: string;
    title: string;
    options: TaskOption[];
    config?: Record<string, any>;
    biMapping: {
        targetVariable: string;
    };
}
export declare const BUILT_IN_TASKS: Record<string, TaskDefinition>;
export declare function buildTasksForSession(stateCode: string, scoreStress: number, scoreEmotion: number, currentStreak: number): TaskDefinition[];
