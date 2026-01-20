document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initAnimations();
    
    // Tab switching functionality
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.workspace-section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and sections
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked button and corresponding section
            button.classList.add('active');
            const targetSection = document.querySelector(`#${button.dataset.tab}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Animate section transition
                animateSectionTransition(targetSection);
            }
        });
    });

    // File input handling
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const fileName = this.nextElementSibling;
            const section = this.closest('.workspace-section');
            const container = section.querySelector('.preview-box.original .image-container');
            
            if (this.files.length > 0) {
                fileName.textContent = this.files[0].name;
                fileName.classList.add('has-file');
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    container.innerHTML = `<img src="${e.target.result}" alt="Original image" class="preview-image">`;
                    animateImageAppearance(container.querySelector('img'));
                };
                reader.readAsDataURL(this.files[0]);
            } else {
                fileName.textContent = 'No file chosen';
                fileName.classList.remove('has-file');
                container.innerHTML = '<div class="placeholder">Upload an image</div>';
            }
        });
    });

    // Form submission handling
    const forms = document.querySelectorAll('.tool-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const section = this.closest('.workspace-section');
            const loadingOverlay = document.querySelector('.loading-overlay');
            const resultPreview = section.querySelector('.result-preview');
            
            // Show loading overlay with animation
            loadingOverlay.classList.remove('hidden');
            animateLoadingOverlay(loadingOverlay);
            
            const formData = new FormData(this);
            
            try {
                let endpoint;
                switch(section.id) {
                    case 'style-section':
                        endpoint = '/style_transformation';
                        break;
                    case 'caption-section':
                        endpoint = '/caption';
                        break;
                    case 'enhance-section':
                        endpoint = '/enhance_image';
                        break;
                }
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Handle success based on section type
                    if (section.id === 'caption-section') {
                        const captionContainer = section.querySelector('.caption-container');
                        if (captionContainer) {
                            // Create a paragraph element
                            const captionElement = document.createElement('p');
                            captionElement.className = 'caption-text';
                            
                            // Set the text content directly
                            captionElement.textContent = result.caption;
                            
                            // Clear the container and add the new element
                            captionContainer.innerHTML = '';
                            captionContainer.appendChild(captionElement);
                            
                            // Animate the appearance
                            animateCaptionAppearance(captionElement);
                        }
                    } else {
                        // For style transfer and enhancement
                        const processedContainer = section.querySelector('.preview-box.processed .image-container');
                        if (processedContainer && result.url) {
                            processedContainer.innerHTML = `<img src="${result.url}" alt="Processed image" class="preview-image">`;
                            animateImageAppearance(processedContainer.querySelector('img'));
                            
                            // Update comparison images if they exist
                            const comparisonOriginal = section.querySelector('.comparison-image.original-image');
                            const comparisonProcessed = section.querySelector('.comparison-image.processed-image');
                            
                            if (comparisonOriginal && comparisonProcessed) {
                                // Get the original image source
                                const originalImage = section.querySelector('.preview-box.original .image-container img');
                                if (originalImage) {
                                    comparisonOriginal.innerHTML = `<img src="${originalImage.src}" alt="Original image">`;
                                }
                                
                                // Set the processed image
                                comparisonProcessed.innerHTML = `<img src="${result.url}" alt="Processed image">`;
                            }
                            
                            // Add download button
                            const downloadSection = section.querySelector('.download-section');
                            if (downloadSection) {
                                downloadSection.innerHTML = `
                                    <button class="action-btn download-btn" onclick="downloadImage('${result.url}', 'processed_image.jpg')">
                                        <span class="btn-icon">⬇️</span>
                                        <span class="btn-text">Download Result</span>
                                    </button>
                                `;
                                animateDownloadButton(downloadSection.querySelector('.download-btn'));
                            }
                        }
                    }
                } else {
                    throw new Error(result.error || 'An error occurred during processing');
                }
            } catch (error) {
                console.error('Error:', error);
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = error.message || 'An error occurred during processing';
                
                if (section.id === 'caption-section') {
                    const captionContainer = section.querySelector('.caption-container');
                    if (captionContainer) {
                        captionContainer.innerHTML = '';
                        captionContainer.appendChild(errorMessage);
                        animateErrorAppearance(errorMessage);
                    }
                } else {
                    const processedContainer = section.querySelector('.preview-box.processed .image-container');
                    if (processedContainer) {
                        processedContainer.innerHTML = '';
                        processedContainer.appendChild(errorMessage);
                        animateErrorAppearance(errorMessage);
                    }
                }
            } finally {
                // Hide loading overlay with animation
                setTimeout(() => {
                    loadingOverlay.classList.add('hidden');
                }, 500);
            }
        });
    });
});

// Animation functions
function initAnimations() {
    // Animate title on page load
    anime({
        targets: '.main-title',
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 800,
        easing: 'easeOutExpo'
    });
    
    // Animate subtitle
    anime({
        targets: '.subtitle',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        delay: 300,
        easing: 'easeOutExpo'
    });
    
    // Animate navigation buttons
    anime({
        targets: '.nav-btn',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: anime.stagger(100, {start: 500}),
        easing: 'easeOutExpo'
    });
    
    // Animate active section
    const activeSection = document.querySelector('.workspace-section.active');
    if (activeSection) {
        animateSectionTransition(activeSection);
    }
    
    // Animate particles background
    animateParticlesBackground();
}

function animateSectionTransition(section) {
    // Fade in section content
    anime({
        targets: section.querySelectorAll('.section-header, .tool-form, .result-preview'),
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutExpo'
    });
}

function animateImageAppearance(image) {
    if (!image) return;
    
    // Fade in and scale up image
    anime({
        targets: image,
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 600,
        easing: 'easeOutExpo'
    });
}

function animateCaptionAppearance(caption) {
    if (!caption) return;
    
    // Store the original text
    const text = caption.textContent;
    
    // Clear the text
    caption.textContent = '';
    
    // Create a span for each character
    const characters = text.split('');
    characters.forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.opacity = '0';
        caption.appendChild(span);
    });
    
    // Animate each character
    anime({
        targets: caption.querySelectorAll('span'),
        opacity: [0, 1],
        easing: 'easeInOutExpo',
        duration: 1500,
        delay: anime.stagger(50, {start: 300}),
        complete: function() {
            // After animation, set the text directly
            caption.textContent = text;
        }
    });
}

function animateLoadingOverlay(overlay) {
    // Fade in loading overlay
    anime({
        targets: overlay,
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutExpo'
    });
    
    // Animate loading text
    anime({
        targets: '.loading-text',
        opacity: [0.5, 1],
        duration: 1000,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutQuad'
    });
}

function animateDownloadButton(button) {
    if (!button) return;
    
    // Pulse animation for download button
    anime({
        targets: button,
        scale: [0.95, 1.05, 1],
        duration: 800,
        easing: 'easeOutElastic(1, .5)'
    });
}

function animateErrorAppearance(errorElement) {
    if (!errorElement) return;
    
    // Shake and fade in error message
    anime({
        targets: errorElement,
        opacity: [0, 1],
        translateX: [-10, 10, -10, 10, 0],
        duration: 800,
        easing: 'easeOutExpo'
    });
}

function animateParticlesBackground() {
    // Subtle movement for particles background
    anime({
        targets: '.particles-background',
        backgroundPosition: ['0% 0%', '100% 100%'],
        duration: 20000,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutQuad'
    });
}

// Make downloadImage function available globally
window.downloadImage = async function(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Download failed:', error);
    }
};

function generateResultsHTML(results) {
    let html = '<h2>Results</h2>';
    
    if (results.style) {
        html += `
            <div class="result-item">
                <h3>Style Transformation</h3>
                ${results.style.error 
                    ? `<p class="error">Error: ${results.style.error}</p>`
                    : `<a href="${results.style}" target="_blank" class="btn">View Result</a>`}
            </div>`;
    }
    
    if (results.caption) {
        html += `
            <div class="result-item">
                <h3>Image Caption</h3>
                <p>${results.caption}</p>
            </div>`;
    }
    
    if (results.enhance) {
        html += `
            <div class="result-item">
                <h3>Image Enhancement</h3>
                ${results.enhance.error 
                    ? `<p class="error">Error: ${results.enhance.error}</p>`
                    : `<a href="${results.enhance}" target="_blank" class="btn">View Result</a>`}
            </div>`;
    }
    
    html += '<button onclick="location.href=\'/\'" class="btn">Upload New Image</button>';
    return html;
}