export declare class StateFeedback {
    id: string;
    analysisId: string;
    userId: string;
    predictedState: string;
    feedbackScore?: number;
    correctedState?: string | null;
    createdAt: Date;
}
