export declare function getLLMConfig(): {
    enabled: boolean;
    provider: string;
    model: string;
    apiKey: string;
    baseURL: string;
    timeout: number;
    maxTokens: number;
    temperature: number;
};
export interface CoordinateResult {
    x: number;
    y: number;
    isEntertainment: boolean;
    durationLevel: string;
    reason: string;
}
