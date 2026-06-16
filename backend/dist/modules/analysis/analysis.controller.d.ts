import { AnalysisService } from './analysis.service';
import { AnalyzeDto } from './dto/analyze.dto';
export declare class AnalysisController {
    private readonly analysisService;
    constructor(analysisService: AnalysisService);
    analyze(userId: string, dto: AnalyzeDto): Promise<{
        code: number;
        message: string;
        data: {
            id: any;
            tensionScore: any;
            emotion: any;
            recoveryLevel: any;
            durationLevel: any;
            stateCode: any;
            stateLabel: any;
            summary: any;
            evidence: any;
            suggestion: any;
            confidence: any;
            aiProvider: any;
            createdAt: any;
            scoreStress: any;
            scoreEmotion: any;
            scoreComposite: any;
            xValue: any;
            yValue: any;
            engineVersion: any;
        };
    }>;
    getTrend(userId: string, days?: number): Promise<{
        code: number;
        message: string;
        data: {
            days: number;
            summary: {
                totalRecords: any;
                avgTensionScore: number;
            };
            items: any;
        };
    }>;
    getContinuity(userId: string): Promise<{
        code: number;
        message: string;
        data: {
            currentStreak: number;
            longestStreak: number;
            totalDays: number;
            totalRecords: number;
            voiceCount: number;
            textCount: number;
            latestDelta: any;
            timeline: any;
        };
    }>;
    getReview(userId: string, days?: number): Promise<{
        code: number;
        message: string;
        data: {
            days: number;
            summary: {
                recordCount: number;
                recordDays: number;
                currentStreak: number;
            };
            states: never[];
            tension: {
                avg: number;
                max: number;
                min: number;
                latest: number;
            };
            emotion: {
                positive: number;
                neutral: number;
                negative: number;
            };
            recovery: {
                high: number;
                medium: number;
                low: number;
            };
            highlights: never[];
            reviewSummary: string;
            dominantState?: undefined;
            dominantStateCode?: undefined;
            stateDistribution?: undefined;
            mainStressFactors?: undefined;
            mainRecoveryFactors?: undefined;
        } | {
            days: number;
            summary: {
                recordCount: number;
                recordDays: number;
                currentStreak: number;
            };
            dominantState: string;
            dominantStateCode: string;
            stateDistribution: {
                state: string;
                days: number;
            }[];
            states: {
                code: string;
                label: string;
                count: number;
            }[];
            tension: {
                avg: number;
                max: number;
                min: number;
                latest: any;
            };
            emotion: {
                positive: number;
                neutral: number;
                negative: number;
            };
            recovery: {
                high: number;
                medium: number;
                low: number;
            };
            mainStressFactors: string[];
            mainRecoveryFactors: string[];
            highlights: string[];
            reviewSummary: string;
        };
    }>;
    getTasks(userId: string, analysisId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            analysisId: string;
            tasks: {
                answered: boolean;
                taskValue: string | null;
                code: string;
                type: "question";
                title: string;
                required: boolean;
            }[];
            rulesHit: string[];
        };
    }>;
    submitTask(userId: string, dto: {
        analysisId: string;
        taskCode: string;
        value: string | null;
    }): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            id: string;
            taskCode: string;
            taskValue: string | null;
        };
    }>;
    submitFeedback(userId: string, dto: {
        analysisId: string;
        feedbackScore: number;
        correctedState: string | null;
    }): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            id: string;
            feedbackScore: number | undefined;
        };
    }>;
    getTrajectory(userId: string): Promise<{
        code: number;
        message: string;
        data: {
            currentTrajectory: string;
            riskLevel: string;
            fromState: null;
            toState: null;
            days: number;
            confidence: number;
        } | {
            currentTrajectory: string;
            riskLevel: string;
            fromState: string;
            toState: string;
            days: number;
            confidence: number;
        };
    }>;
    getMapperStats(): Promise<{
        code: number;
        message: string;
        data: {
            total: number;
            llmCount: number;
            fallbackCount: number;
            avgLatencyMs: number;
            provider: string;
            model: string;
        };
    }>;
    getCalibration(): Promise<{
        code: number;
        message: string;
        data: {
            totalFeedbacks: number;
            accuracyRate: null;
            confusionMatrix: never[];
        } | {
            totalFeedbacks: number;
            accuracyRate: number;
            confusionMatrix: {
                predicted: string;
                corrected: Record<string, number>;
            }[];
        };
    }>;
    getDebugLatest(limit?: number): Promise<{
        code: number;
        message: string;
        data: {
            id: string;
            content: any;
            mapperType: string;
            provider: string | undefined;
            model: string | undefined;
            ruleX: any;
            ruleY: any;
            ruleStateCode: any;
            llmX: any;
            llmY: any;
            llmStateCode: any;
            llmReason: any;
            fallback: any;
            latency: any;
            x: number | undefined;
            y: number | undefined;
            stateCode: string;
            stateName: string | undefined;
            scoreStress: number | undefined;
            scoreEmotion: number | undefined;
            scoreComposite: number | undefined;
            summary: string | undefined;
            suggestion: string;
            createdAt: Date;
        }[];
    }>;
    getLatest(userId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            id: any;
            tensionScore: any;
            emotion: any;
            recoveryLevel: any;
            durationLevel: any;
            stateCode: any;
            stateLabel: any;
            summary: any;
            evidence: any;
            suggestion: any;
            confidence: any;
            aiProvider: any;
            createdAt: any;
            scoreStress: any;
            scoreEmotion: any;
            scoreComposite: any;
            xValue: any;
            yValue: any;
            engineVersion: any;
        };
    }>;
    private formatV02;
    private valenceToEmotion;
    private numToRecovery;
    private numToDuration;
}
