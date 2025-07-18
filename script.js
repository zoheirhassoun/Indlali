// Check if scripts are loaded
console.log('script.js loaded');

// Wait for CONFIG and apiService to be available
function waitForScripts() {
    if (typeof CONFIG !== 'undefined' && typeof apiService !== 'undefined') {
        console.log('CONFIG available:', true);
        console.log('apiService available:', true);
        initializeApp();
    } else {
        console.log('Waiting for scripts to load...');
        setTimeout(waitForScripts, 100);
    }
}

// Initialize app when scripts are ready
function initializeApp() {
    console.log('Initializing app...');
    
    // DOM Elements
    const submitQueryBtn = document.getElementById('submit-query');
    const legalQueryTextarea = document.getElementById('legal-query');
    const resultContent = document.getElementById('result-content');
    const ratingSection = document.getElementById('rating-section');
    const positiveRatingBtn = document.getElementById('positive-rating');
    const negativeRatingBtn = document.getElementById('negative-rating');
    const commentSection = document.getElementById('comment-section');
    const userCommentTextarea = document.getElementById('user-comment');
    const submitRatingBtn = document.getElementById('submit-rating');

    // Hide loading state when page is ready
    function hideLoadingState() {
        const loadingElement = document.getElementById('initial-loading');
        const placeholderElement = document.getElementById('placeholder-text');
        
        if (typeof CONFIG !== 'undefined' && typeof apiService !== 'undefined') {
            console.log('All scripts loaded successfully');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            if (placeholderElement) {
                placeholderElement.style.display = 'block';
            }
        } else {
            console.log('Scripts not ready yet, retrying...');
            setTimeout(hideLoadingState, 500);
        }
    }

    // Start checking when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideLoadingState);
    } else {
        hideLoadingState();
    }

    // Analytics tracking
    let sessionData = {
        queryCount: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        averageResponseTime: 0,
        totalResponseTime: 0,
        n8nUsage: 0,
        fallbackUsage: 0
    };

    // Legal Consultation Submission
    submitQueryBtn.addEventListener('click', async () => {
        // Check if CONFIG is available
        if (typeof CONFIG === 'undefined') {
            resultContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>خطأ في تحميل الإعدادات. يرجى تحديث الصفحة.</p>
                </div>
            `;
            return;
        }
        
        const query = legalQueryTextarea.value.trim();
        
        if (!query) {
            alert(CONFIG.ERROR_MESSAGES.QUERY_EMPTY);
            return;
        }
        
        if (query.length < 10) {
            alert(CONFIG.ERROR_MESSAGES.QUERY_TOO_SHORT);
            return;
        }
        
        // Show loading state
        submitQueryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
        submitQueryBtn.disabled = true;
        
        try {
            // Check if apiService is available
            if (typeof apiService === 'undefined') {
                resultContent.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>خطأ في تحميل خدمة API. يرجى تحديث الصفحة.</p>
                    </div>
                `;
                return;
            }
            
            // Use API service to send query
            const result = await apiService.sendConsultationQuery(query);
            
            // Update result content
            resultContent.innerHTML = `
                <div class="legal-response">
                    <h4>الإجابة العلمية:</h4>
                    <p>${result.data.answer}</p>
                    ${result.data.recommendations && result.data.recommendations.length > 0 ? `
                        <h4>التوصيات:</h4>
                        <ul>
                            ${result.data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${result.source === 'fallback' ? `
                        <div class="fallback-notice">
                            <i class="fas fa-info-circle"></i>
                            <small>تم استخدام الإجابة الإحتياطية التجريبية</small>
                        </div>
                    ` : ''}
                </div>
            `;
            showAnswerActions(true);
            
            // Update time
            const actualTime = (result.responseTime / 1000).toFixed(1);
            document.querySelector('.time').textContent = `الوقت: ${actualTime} ثانية`;
            
            // Show rating section
            ratingSection.style.display = 'block';
            
            // Track analytics
            sessionData.queryCount++;
            sessionData.totalResponseTime += parseFloat(actualTime);
            sessionData.averageResponseTime = sessionData.totalResponseTime / sessionData.queryCount;
            
            if (result.source === 'n8n') {
                sessionData.n8nUsage++;
            } else {
                sessionData.fallbackUsage++;
            }
            
            // Log to console for analytics
            console.log('Query submitted:', {
                query: query,
                responseTime: actualTime,
                source: result.source,
                sessionData: sessionData
            });
            
        } catch (error) {
            resultContent.innerHTML = `<p class="error">${error.message}</p>`;
            console.error('Error processing query:', error);
        } finally {
            // Reset button state
            submitQueryBtn.innerHTML = '<i class="fas fa-search"></i> أرسل استشارتك';
            submitQueryBtn.disabled = false;
        }
    });

    // Rating System
    positiveRatingBtn.addEventListener('click', () => {
        selectRating('positive');
    });

    negativeRatingBtn.addEventListener('click', () => {
        selectRating('negative');
    });

    function selectRating(type) {
        // Remove previous selection
        positiveRatingBtn.classList.remove('selected');
        negativeRatingBtn.classList.remove('selected');
        
        // Add selection to clicked button
        if (type === 'positive') {
            positiveRatingBtn.classList.add('selected');
        } else {
            negativeRatingBtn.classList.add('selected');
        }
        
        // Show comment section
        commentSection.style.display = 'block';
    }

    // Submit Rating
    submitRatingBtn.addEventListener('click', async () => {
        // Check if CONFIG is available
        if (typeof CONFIG === 'undefined') {
            alert('خطأ في تحميل الإعدادات. يرجى تحديث الصفحة.');
            return;
        }
        
        const selectedRating = positiveRatingBtn.classList.contains('selected') ? 'positive' : 
                              negativeRatingBtn.classList.contains('selected') ? 'negative' : null;
        
        if (!selectedRating) {
            alert(CONFIG.ERROR_MESSAGES.RATING_REQUIRED);
            return;
        }
        
        const comment = userCommentTextarea.value.trim();
        
        // Show loading state
        submitRatingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
        submitRatingBtn.disabled = true;
        
        try {
            // Prepare rating data
            const ratingData = {
                rating: selectedRating,
                comment: comment,
                timestamp: new Date().toISOString(),
                sessionId: sessionData.queryCount,
                userAgent: navigator.userAgent,
                language: navigator.language || 'ar'
            };
            
            // Check if apiService is available for rating
            if (typeof apiService === 'undefined') {
                alert('خطأ في تحميل خدمة API. يرجى تحديث الصفحة.');
                return;
            }
            
            // Submit rating via API service
            const result = await apiService.submitRating(ratingData);
            
            // Track rating locally
            if (selectedRating === 'positive') {
                sessionData.positiveRatings++;
            } else {
                sessionData.negativeRatings++;
            }
            
            // Calculate satisfaction rate
            const totalRatings = sessionData.positiveRatings + sessionData.negativeRatings;
            const satisfactionRate = totalRatings > 0 ? (sessionData.positiveRatings / totalRatings * 100).toFixed(1) : 0;
            
            // Log rating submission
            console.log('Rating submitted:', {
                rating: selectedRating,
                satisfactionRate: satisfactionRate,
                result: result,
                sessionData: sessionData
            });
            
            // Show success message
            alert('شكراً لك! تم إرسال تقييمك بنجاح.');
            
            // Reset rating section
            resetRatingSection();
            
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('حدث خطأ في إرسال التقييم. يرجى المحاولة مرة أخرى.');
        } finally {
            // Reset button state
            submitRatingBtn.innerHTML = 'إرسال التقييم';
            submitRatingBtn.disabled = false;
        }
        
        // Check if we're meeting MVP success criteria
        checkMVPSuccess();
    });

    function resetRatingSection() {
        positiveRatingBtn.classList.remove('selected');
        negativeRatingBtn.classList.remove('selected');
        commentSection.style.display = 'none';
        userCommentTextarea.value = '';
        ratingSection.style.display = 'none';
    }

    function checkMVPSuccess() {
        const totalRatings = sessionData.positiveRatings + sessionData.negativeRatings;
        const satisfactionRate = totalRatings > 0 ? (sessionData.positiveRatings / totalRatings * 100) : 0;
        
        console.log('MVP Success Check:', {
            totalQueries: sessionData.queryCount,
            satisfactionRate: satisfactionRate + '%',
            averageResponseTime: sessionData.averageResponseTime.toFixed(1) + 's',
            targetQueries: 100,
            targetSatisfaction: 80,
            targetResponseTime: 3
        });
        
        // Log success criteria status
        if (sessionData.queryCount >= 100) {
            console.log('✅ Target queries achieved: 100+');
        }
        
        if (satisfactionRate >= 80) {
            console.log('✅ Target satisfaction achieved: 80%+');
        }
        
        if (sessionData.averageResponseTime <= 3) {
            console.log('✅ Target response time achieved: ≤3s');
        }
    }

    // Form validation
    legalQueryTextarea.addEventListener('input', () => {
        const query = legalQueryTextarea.value.trim();
        submitQueryBtn.disabled = query.length < 10;
        
        if (query.length < 10) {
            submitQueryBtn.style.opacity = '0.6';
        } else {
            submitQueryBtn.style.opacity = '1';
        }
    });

    // Auto-save form data
    legalQueryTextarea.addEventListener('input', () => {
        localStorage.setItem('legalQuery', legalQueryTextarea.value);
    });

    // Restore form data on page load
    window.addEventListener('load', () => {
        const savedQuery = localStorage.getItem('legalQuery');
        if (savedQuery) {
            legalQueryTextarea.value = savedQuery;
        }
        
        // Initialize analytics
        console.log('معين - المستشار العقاري الذكي');
        console.log('MVP Version - Analytics initialized');
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading animation for page load
    window.addEventListener('load', () => {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    });

    // Track page views for analytics
    window.addEventListener('load', () => {
        console.log('Page view tracked:', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            language: navigator.language
        });
    });

    // Sliding Gallery Logic
    const galleryTrack = document.querySelector('.gallery-track');
    const galleryImgs = document.querySelectorAll('.gallery-img');
    const prevBtn = document.querySelector('.gallery-btn.prev');
    const nextBtn = document.querySelector('.gallery-btn.next');
    const dots = document.querySelectorAll('.gallery-dots .dot');
    let currentIndex = 0;
    let galleryInterval;

    function updateGallery(index) {
        if (!galleryTrack) return;
        currentIndex = (index + galleryImgs.length) % galleryImgs.length;
        galleryTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    }

    function nextImage() {
        updateGallery(currentIndex + 1);
    }
    function prevImage() {
        updateGallery(currentIndex - 1);
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', nextImage);
        prevBtn.addEventListener('click', prevImage);
    }
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => updateGallery(i));
    });

    function startGalleryAutoSlide() {
        galleryInterval = setInterval(nextImage, 4000);
    }
    function stopGalleryAutoSlide() {
        clearInterval(galleryInterval);
    }
    if (galleryTrack) {
        galleryTrack.addEventListener('mouseenter', stopGalleryAutoSlide);
        galleryTrack.addEventListener('mouseleave', startGalleryAutoSlide);
        startGalleryAutoSlide();
        updateGallery(0);
    }

    // Hero background sliding gallery
    const heroSection = document.querySelector('.hero');
    const heroBackgrounds = [
        'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1500&q=80',
        'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=1500&q=80',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1500&q=80',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1500&q=80'
    ];
    // ألوان تدرج متغيرة
    const heroGradients = [
        'rgba(0, 64, 32, 0.45), rgba(0, 64, 32, 0.45)', // أخضر داكن شفاف
        'rgba(45, 108, 223, 0.45), rgba(30, 188, 138, 0.45)', // أزرق-أخضر شفاف
        'rgba(241, 90, 41, 0.32), rgba(45, 108, 223, 0.38)', // برتقالي-أزرق شفاف
        'rgba(30, 188, 138, 0.38), rgba(241, 90, 41, 0.32)' // أخضر-برتقالي شفاف
    ];
    const heroFeatureTexts = [
        'ذكاء اصطناعي للإجابة على استفساراتك البحثية',
        'مواقع داعمة',
        'تحليلات خريطة الاستخدام'
    ];
    const heroFeatureIcons = [
        '<i class="fas fa-brain"></i>',
        '<i class="fas fa-network-wired"></i>',
        '<i class="fas fa-map-marker-alt"></i>'
    ];
    let heroBgIndex = 0;
    const heroFeatureDynamic = document.getElementById('hero-feature-dynamic');
    function setHeroBg(index) {
        if (heroSection) {
            const grad = heroGradients[index % heroGradients.length];
            heroSection.style.backgroundImage = `linear-gradient(${grad}), url('${heroBackgrounds[index]}')`;
        }
        if (heroFeatureDynamic) {
            heroFeatureDynamic.innerHTML = heroFeatureIcons[index % heroFeatureIcons.length] + ' ' + heroFeatureTexts[index % heroFeatureTexts.length];
        }
    }
    setHeroBg(heroBgIndex);
    setInterval(() => {
        heroBgIndex = (heroBgIndex + 1) % heroBackgrounds.length;
        setHeroBg(heroBgIndex);
    }, 4000);

    console.log('معين - المستشار العقاري الذكي (MVP) - تم تحميل الموقع بنجاح!');

    // نسخ وتحميل الإجابة
    const answerActions = document.getElementById('answer-actions');
    const copyAnswerBtn = document.getElementById('copy-answer-btn');
    const downloadAnswerBtn = document.getElementById('download-answer-btn');

    function getCurrentAnswerText() {
        const answerBox = document.querySelector('.legal-response');
        return answerBox ? answerBox.innerText : '';
    }

    if (copyAnswerBtn) {
        copyAnswerBtn.addEventListener('click', () => {
            const text = getCurrentAnswerText();
            if (text) {
                navigator.clipboard.writeText(text);
                copyAnswerBtn.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
                setTimeout(() => {
                    copyAnswerBtn.innerHTML = '<i class="fas fa-copy"></i> نسخ الإجابة';
                }, 1200);
            }
        });
    }
    if (downloadAnswerBtn) {
        downloadAnswerBtn.addEventListener('click', () => {
            const text = getCurrentAnswerText();
            if (text) {
                const win = window.open('', '', 'width=800,height=600');
                win.document.write('<html><head><title>الإجابة العلمية</title><meta charset="utf-8"></head><body style="font-family:Cairo,Arial,sans-serif;direction:rtl;padding:32px;"><h2>الإجابة العلمية</h2><pre style="font-size:1.1rem;white-space:pre-wrap;">' + text + '</pre></body></html>');
                win.document.close();
                win.print();
            }
        });
    }
    // أظهر أزرار النسخ/التحميل عند وجود إجابة
    function showAnswerActions(show) {
        if (answerActions) answerActions.style.display = show ? 'flex' : 'none';
    }
}

// Start waiting for scripts
waitForScripts(); 