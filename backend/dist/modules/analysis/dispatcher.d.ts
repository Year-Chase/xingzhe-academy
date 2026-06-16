import { TaskDefinition } from './dispatcher-task-defs';
export declare function dispatch(params: {
    stateCode: string;
    scoreStress: number;
    scoreEmotion: number;
    currentStreak: number;
}): {
    tasks: TaskDefinition[];
    rulesHit: string[];
};
