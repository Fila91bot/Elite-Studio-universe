enum AppView {
    CODE,
    // IMAGE,
    // VIDEO,
    // Other existing enums...
}

interface CodeAnalysisFeature {
    // Define properties for code analysis features
    analysisType: string;
    sourceCode: string;
    parameters: any;
}

interface CodeAnalysisResult {
    // Define properties for analysis results
    success: boolean;
    messages: string[];
    warnings?: string[];
}
