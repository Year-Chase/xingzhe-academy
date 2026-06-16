import { CoordinateResult } from '../../config/llm-mapper.config';
type LlmMapperMeta = {
    localHour?: number;
    isNight?: boolean;
    q1Val?: number | null;
    q2Val?: string | number | null;
};
export declare function llmToCoordinate(content: string, meta?: LlmMapperMeta): Promise<{
    result: CoordinateResult | null;
    latency: number;
    fallback: boolean;
    error?: string;
}>;
export {};
