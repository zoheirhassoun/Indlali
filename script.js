document.addEventListener('DOMContentLoaded', function() {
  // Mobile navigation toggle
  const navToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      navLinks.classList.toggle('open');
    });
    // Optional: close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Active section highlighting
  function updateActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a[href^="#"]');
    
    let currentSection = '';
    const headerHeight = document.querySelector('header').offsetHeight;
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= headerHeight + 50 && rect.bottom >= headerHeight + 50) {
        currentSection = section.getAttribute('id');
      }
    });
    
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === `#${currentSection}`) {
        item.classList.add('active');
      }
    });
  }

  // Listen for scroll events
  window.addEventListener('scroll', updateActiveSection);
  // Initial call
  updateActiveSection();

  // Interactive legend functionality
  const legendItems = document.querySelectorAll('.legend-item');
  
  legendItems.forEach(item => {
    item.addEventListener('click', function() {
      const legendColor = this.querySelector('.legend-color');
      let regionType = '';
      
      // Determine region type from legend color class
      if (legendColor.classList.contains('legend-capital')) regionType = 'marker-capital';
      else if (legendColor.classList.contains('legend-holy')) regionType = 'marker-holy';
      else if (legendColor.classList.contains('legend-eastern')) regionType = 'marker-eastern';
      else if (legendColor.classList.contains('legend-western')) regionType = 'marker-western';
      else if (legendColor.classList.contains('legend-northern')) regionType = 'marker-northern';
      else if (legendColor.classList.contains('legend-southern')) regionType = 'marker-southern';
      else if (legendColor.classList.contains('legend-central')) regionType = 'marker-central';
      
      // Remove active class from all legend items
      legendItems.forEach(li => li.classList.remove('legend-active'));
      
      // Add active class to clicked item
      this.classList.add('legend-active');
      
      // Remove pulse from all markers
      cityMarkers.forEach(marker => marker.classList.remove('pulse', 'highlight'));
      
      // Add highlight to matching markers
      const matchingMarkers = document.querySelectorAll(`.${regionType}`);
      matchingMarkers.forEach(marker => {
        marker.classList.add('highlight');
        setTimeout(() => marker.classList.add('pulse'), 100);
      });
      
      // Clear highlight after 3 seconds
      setTimeout(() => {
        legendItems.forEach(li => li.classList.remove('legend-active'));
        cityMarkers.forEach(marker => marker.classList.remove('pulse', 'highlight'));
      }, 3000);
    });
  });
  
  // Interactive map with percentage indicators
  const cityMarkers = document.querySelectorAll('.city-marker');
  
  // Randomize percentages on page load
  cityMarkers.forEach(marker => {
    const percentageEl = marker.querySelector('.percentage');
    if (percentageEl) {
      // Generate a random percentage between 50% and 95%
      const randomPercentage = Math.floor(Math.random() * 46) + 50;
      percentageEl.textContent = `${randomPercentage}%`;
    }
  });
  
  // Add pulse animation to markers
  function addPulseEffect() {
    const randomIndex = Math.floor(Math.random() * cityMarkers.length);
    
    // Remove any existing pulse class
    cityMarkers.forEach(marker => {
      marker.classList.remove('pulse');
    });
    
    // Add pulse class to random marker
    cityMarkers[randomIndex].classList.add('pulse');
    
    // Schedule next pulse
    setTimeout(addPulseEffect, 3000);
  }
  
  // Start pulse animation after a delay
  setTimeout(addPulseEffect, 1000);
  
  // Add click event to markers
  cityMarkers.forEach(marker => {
    marker.addEventListener('click', function() {
      // Get current percentage
      const percentageEl = this.querySelector('.percentage');
      if (percentageEl) {
        // Generate a new random percentage
        const newPercentage = Math.floor(Math.random() * 46) + 50;
        
        // Animate the percentage change
        let currentValue = parseInt(percentageEl.textContent);
        const targetValue = newPercentage;
        const duration = 1000; // 1 second
        const interval = 50; // Update every 50ms
        const steps = duration / interval;
        const increment = (targetValue - currentValue) / steps;
        
        const animation = setInterval(() => {
          currentValue += increment;
          if ((increment > 0 && currentValue >= targetValue) ||
              (increment < 0 && currentValue <= targetValue)) {
            currentValue = targetValue;
            clearInterval(animation);
          }
          percentageEl.textContent = `${Math.round(currentValue)}%`;
        }, interval);
      }
    });
  });
});

// Enhanced pulse animation for colored markers
document.head.insertAdjacentHTML('beforeend', `
  <style>
    @keyframes pulse {
      0% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.1); }
      100% { transform: translate(-50%, -50%) scale(1); }
    }
    
    .city-marker.pulse .percentage {
      animation: pulse 1.5s ease-in-out;
      filter: brightness(1.2) saturate(1.3);
    }

    .city-marker.pulse .marker-glow {
      animation: pulse-glow 2s ease-in-out infinite;
      opacity: 0.8 !important;
    }
  </style>
`);