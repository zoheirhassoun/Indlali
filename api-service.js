// API Service for معين - المستشار العقاري الذكي
// Handles n8n webhook integration with fallback to mock responses

class ApiService {
    constructor() {
        this.retryCount = 0;
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.isOnline = true);
        window.addEventListener('offline', () => this.isOnline = false);
    }

    /**
     * Send consultation query to n8n webhook
     * @param {string} query - The user's real estate query
     * @returns {Promise<Object>} - Response from n8n or fallback
     */
    async sendConsultationQuery(query) {
        const startTime = Date.now();
        
        try {
            // Validate query
            if (!query || query.trim().length < 10) {
                throw new Error(CONFIG.ERROR_MESSAGES.QUERY_TOO_SHORT);
            }

            // Check if online
            if (!this.isOnline) {
                throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            }

            // Try n8n webhook first
            const response = await this.callN8nWebhook(query);
            
            // Calculate response time
            const responseTime = Date.now() - startTime;
            
            return {
                success: true,
                data: response,
                responseTime: responseTime,
                source: 'n8n'
            };

        } catch (error) {
            console.warn('n8n webhook failed:', error);
            console.log('Error details:', error.message);
            console.log('Error stack:', error.stack);
            
            // If fallback is enabled, use mock response
            if (CONFIG.ENABLE_FALLBACK) {
                console.log('Using fallback mock response');
                const fallbackResponse = this.generateFallbackResponse(query);
                const responseTime = Date.now() - startTime;
                
                return {
                    success: true,
                    data: fallbackResponse,
                    responseTime: responseTime,
                    source: 'fallback',
                    originalError: error.message
                };
            }
            
            throw error;
        }
    }

    /**
     * Call n8n webhook with retry mechanism
     * @param {string} query - The user's query
     * @returns {Promise<Object>} - Response from n8n
     */
    async callN8nWebhook(query) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

        try {
            console.log('Calling n8n webhook:', CONFIG.N8N_WEBHOOK_URL);
            console.log('Request payload:', { chatInput: query.trim() });
            console.log('Timeout set to:', CONFIG.API_TIMEOUT + 'ms');
            
            const startTime = Date.now();
            const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    chatInput: query.trim(),
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    language: navigator.language || 'ar'
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            const responseTime = Date.now() - startTime;
            console.log('n8n response received in:', responseTime + 'ms');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Debug logging
            console.log('n8n response:', data);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            // Validate response format according to architecture
            if (!data) {
                console.warn('Empty response from n8n:', data);
                throw new Error(CONFIG.ERROR_MESSAGES.INVALID_RESPONSE);
            }
            
            // Handle different response formats
            let answer = '';
            if (typeof data.text === 'string') {
                answer = data.text;
            } else if (typeof data.answer === 'string') {
                answer = data.answer;
            } else if (typeof data === 'string') {
                answer = data;
            } else {
                console.warn('Invalid response format from n8n:', data);
                throw new Error(CONFIG.ERROR_MESSAGES.INVALID_RESPONSE);
            }

            return {
                answer: answer,
                recommendations: data.recommendations || [],
                confidence: data.confidence || 0.8,
                model: data.model || 'gpt-4.1-mini'
            };

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR);
            }
            
            if (error.message.includes('Failed to fetch')) {
                throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            }
            
            throw error;
        }
    }

    /**
     * Generate fallback response when n8n is unavailable
     * @param {string} query - The user's query
     * @returns {Object} - Mock response
     */
    generateFallbackResponse(query) {
        const responses = {
            'منهجية': {
                answer: 'منهجية البحث العلمي هي الخطة التي يتبعها الباحث لجمع البيانات وتحليلها للوصول إلى نتائج دقيقة. يجب تحديد نوع المنهج (وصفي، تجريبي، إلخ) وتوضيح أدوات جمع البيانات وخطوات التحليل.',
                recommendations: [
                    'حدد نوع المنهج المناسب لموضوعك',
                    'استخدم أدوات جمع بيانات موثوقة',
                    'وضح خطوات التحليل بوضوح في البحث'
                ]
            },
            'خطة': {
                answer: 'خطة البحث العلمي تتضمن تحديد المشكلة، صياغة الفرضيات، تحديد الأهداف، واختيار المنهج وأدوات جمع البيانات. يجب أن تكون الخطة واضحة ومحددة زمنياً.',
                recommendations: [
                    'ابدأ بتحديد مشكلة البحث بدقة',
                    'ضع أهدافاً واضحة وقابلة للقياس',
                    'حدد جدولاً زمنياً لكل مرحلة'
                ]
            },
            'مراجع': {
                answer: 'توثيق المراجع في البحث العلمي يتم وفق أسلوب محدد (APA، MLA، إلخ). يجب ذكر جميع المصادر التي تم الاستعانة بها بدقة وشفافية.',
                recommendations: [
                    'استخدم أدوات إدارة المراجع مثل Mendeley أو Zotero',
                    'تأكد من توحيد أسلوب التوثيق في كامل البحث',
                    'راجع قائمة المراجع قبل التسليم'
                ]
            },
            'فرضية': {
                answer: 'الفرضية هي توقع علمي مبني على المعرفة السابقة، يتم اختبارها خلال البحث. يجب أن تكون الفرضية قابلة للاختبار والقياس.',
                recommendations: [
                    'صغ الفرضية بشكل واضح ومحدد',
                    'تأكد من إمكانية اختبار الفرضية عملياً',
                    'اربط الفرضية بأهداف البحث'
                ]
            },
            'نتائج': {
                answer: 'عرض النتائج في البحث العلمي يجب أن يكون موضوعياً ومرتكزاً على البيانات التي تم جمعها. استخدم الجداول والرسوم البيانية لتوضيح النتائج.',
                recommendations: [
                    'اعرض النتائج دون تحيز',
                    'استخدم وسائل إيضاح بصرية',
                    'اربط النتائج بأهداف البحث'
                ]
            }
        };

        // Find matching response
        for (const [key, response] of Object.entries(responses)) {
            if (query.includes(key)) {
                return {
                    ...response,
                    confidence: 0.7,
                    model: 'fallback'
                };
            }
        }

        // Default response
        return {
            answer: 'بناءً على استفسارك، نوصيك بمراجعة دليل مشروع التخرج أو التواصل مع مشرف أكاديمي مختص للحصول على استشارة مفصلة. هذه إجابة مبدئية ولا تغني عن الاستشارة العلمية المتخصصة.',
            recommendations: [
                'راجع دليل مشروع التخرج المرفق بالموقع',
                'استعن بمشرف أكاديمي أو خبير بحثي',
                'احرص على توثيق جميع مصادر المعلومات'
            ],
            confidence: 0.5,
            model: 'fallback'
        };
    }

    /**
     * Submit user rating to n8n (if available)
     * @param {Object} ratingData - Rating information
     * @returns {Promise<Object>} - Response from n8n
     */
    async submitRating(ratingData) {
        try {
            if (!this.isOnline) {
                console.log('Offline mode: Rating stored locally');
                return { success: true, source: 'local' };
            }

            const response = await fetch('https://tectec.app.n8n.cloud/webhook/consultation/rating', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ratingData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.warn('Rating submission failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if n8n webhook is available
     * @returns {Promise<boolean>} - True if available
     */
    async checkN8nHealth() {
        try {
            const response = await fetch('https://tectec.app.n8n.cloud/webhook/consultation/health', {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Create global instance
window.apiService = new ApiService();

// Also make apiService available as a const for compatibility
const apiService = window.apiService;

// Debug log to confirm loading
console.log('apiService loaded successfully:', window.apiService ? 'YES' : 'NO');

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
} 