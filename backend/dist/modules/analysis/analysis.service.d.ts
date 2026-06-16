import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StateAnalysis } from './entities/state-analysis.entity';
import { DiaryEntry } from '../diary/entities/diary-entry.entity';
import { TaskResponse } from './entities/task-response.entity';
import { StateFeedback } from './entities/state-feedback.entity';
export declare class AnalysisService {
    private readonly analysisRepo;
    private readonly diaryRepo;
    private readonly taskResponseRepo;
    private readonly feedbackRepo;
    private readonly config;
    constructor(analysisRepo: Repository<StateAnalysis>, diaryRepo: Repository<DiaryEntry>, taskResponseRepo: Repository<TaskResponse>, feedbackRepo: Repository<StateFeedback>, config: ConfigService);
    analyze(userId: string, diaryId: string): Promise<StateAnalysis>;
    getTrend(userId: string, days?: number): Promise<{
        days: number;
        summary: {
            totalRecords: any;
            avgTensionScore: number;
        };
        items: any;
    }>;
    getContinuity(userId: string): Promise<{
        currentStreak: number;
        longestStreak: number;
        totalDays: number;
        totalRecords: number;
        voiceCount: number;
        textCount: number;
        latestDelta: any;
        timeline: any;
    }>;
    getReview(userId: string, days?: number): Promise<{
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
    }>;
    submitTaskResponse(userId: string, analysisId: string, taskCode: string, value: string | number | null): Promise<TaskResponse>;
    submitFeedback(userId: string, analysisId: string, feedbackScore: number, correctedState: string | null): Promise<StateFeedback>;
    getTrajectory(userId: string): Promise<{
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
    }>;
    getCalibration(): Promise<{
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
    }>;
    getTaskResponses(analysisId: string): Promise<Map<string, string | null>>;
    getDebugLatest(limit?: number): Promise<{
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
    }[]>;
    getMapperStats(): Promise<{
        total: number;
        llmCount: number;
        fallbackCount: number;
        avgLatencyMs: number;
        provider: string;
        model: string;
    }>;
    findById(id: string): Promise<StateAnalysis | null>;
    getLatest(userId: string): Promise<StateAnalysis | null>;
}
