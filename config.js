// Configuration for معين - المستشار العقاري الذكي
window.CONFIG = {
    // n8n Webhook Configuration
    N8N_WEBHOOK_URL: 'https://tectec.app.n8n.cloud/webhook/de59295e-acda-4cfb-b178-3e8ba6dcc17f/chat',
    
    // API Configuration
    API_TIMEOUT: 30000, // 30 seconds timeout for OpenAI processing
    MAX_RETRIES: 3,
    
    // Response Configuration
    MAX_RESPONSE_TIME: 3000, // 3 seconds target as per PRD
    
    // Fallback Configuration
    ENABLE_FALLBACK: true, // Enable mock responses if n8n is unavailable
    
    // Analytics Configuration
    ENABLE_ANALYTICS: true,
    
    // Development Configuration
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // Error Messages (Arabic)
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'حدث خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
        TIMEOUT_ERROR: 'انتهت مهلة الاستجابة. يرجى المحاولة مرة أخرى.',
        SERVER_ERROR: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
        INVALID_RESPONSE: 'استجابة غير صحيحة من الخادم. يرجى المحاولة مرة أخرى.',
        QUERY_TOO_SHORT: 'يرجى كتابة استفسار أكثر تفصيلاً (10 أحرف على الأقل)',
        QUERY_EMPTY: 'يرجى كتابة استفسارك العقاري',
        RATING_REQUIRED: 'يرجى اختيار تقييم أولاً'
    }
};

// Also make CONFIG available as a const for compatibility
const CONFIG = window.CONFIG;

// Debug log to confirm loading
console.log('CONFIG loaded successfully:', window.CONFIG ? 'YES' : 'NO');

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 