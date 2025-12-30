class CardBuilder {
    constructor(onShowFullAnalysis) {
        this.onShowFullAnalysis = onShowFullAnalysis;
    }

build(entry) {
    const card = document.createElement('div');
    card.className = 'card';

    // ✅ Store matching_key in dataset for efficient video analysis matching
    if (entry.matching_key) {
        card.dataset.matchingKey = entry.matching_key;
    }

    card.appendChild(this.buildHeader(entry));
    card.appendChild(this.buildDivider());

    // Store body or ad_text for matching - prefer text_for_analysis, then ad_text, fallback to body
    const textToDisplay = entry.text_for_analysis || entry.ad_data?.ad_text || entry.body || '';
    if (textToDisplay) {
        card.appendChild(this.buildAdText(textToDisplay));
    }

    // Priority: video first, then cards carousel, then images carousel, then single card/image
    if (entry.ad_data?.videos?.[0]?.video_preview_image_url) {
        card.appendChild(this.buildVideoThumbnail(entry.ad_data.videos[0]));
    } else if (entry.ad_data?.cards && entry.ad_data.cards.length > 1) {
        card.appendChild(this.buildCardsCarousel(entry.ad_data.cards));
    } else if (entry.ad_data?.cards?.[0]) {
        card.appendChild(this.buildSingleCard(entry.ad_data.cards[0]));
    } else if (entry.ad_data?.images && entry.ad_data.images.length > 1) {
        card.appendChild(this.buildImageCarousel(entry.ad_data.images));
    } else if (entry.ad_data?.images?.[0]) {
        card.appendChild(this.buildSingleImage(entry.ad_data.images[0]));
    }

    if (entry.ai_analysis) {
        card.appendChild(
            AnalysisSections.createTextAnalysis(
                entry.ai_analysis,
                this.onShowFullAnalysis,
                entry.competitor_name
            )
        );
    }

    return card;
}

    buildHeader(entry) {
        const header = document.createElement('div');
        header.className = 'card-header';

        // Avatar
        const img = document.createElement('img');
        img.className = 'avatar';
        img.src = URLValidator.sanitizeImageURL(entry.ad_data?.page_profile_picture_url);
        img.alt = 'Profile';
        header.appendChild(img);

        // Content wrapper (name + social icons + date)
        const contentWrap = document.createElement('div');
        contentWrap.className = 'header-content';

        // Name row
        const nameRow = document.createElement('div');
        nameRow.className = 'name-row';
        
        const nameLink = this.buildNameLink(entry);
        nameRow.appendChild(nameLink);
        
        contentWrap.appendChild(nameRow);
        
        // Social icons row (where red line is drawn)
        const platforms = entry.ad_data?.platforms || [];
        if (platforms.length > 0) {
            const socialIconsRow = this.buildSocialIconsRow(platforms);
            contentWrap.appendChild(socialIconsRow);
        }
        
        // Date below social icons
        const meta = this.buildMeta(entry.ad_data?.ad_started);
        contentWrap.appendChild(meta);

        header.appendChild(contentWrap);
        
        // View Profile link on the right
        const viewProfileLink = this.buildViewProfileLink(entry.ad_data?.page_profile_uri);
        header.appendChild(viewProfileLink);
        
        return header;
    }

    buildSocialIconsRow(platforms) {
        const row = document.createElement('div');
        row.className = 'social-icons-row';

        platforms.forEach(platform => {
            const icon = this.buildSingleSocialIcon(platform);
            row.appendChild(icon);
        });

        return row;
    }

    buildSocialIconsGrid(platforms) {
        const grid = document.createElement('div');
        grid.className = 'social-icons-grid';

        platforms.forEach(platform => {
            const icon = this.buildSingleSocialIcon(platform);
            grid.appendChild(icon);
        });

        return grid;
    }

    buildSingleSocialIcon(platform) {
        const icon = document.createElement('span');
        icon.className = 'social-icon';

        // Normalize to lowercase before getting icon
        const platformLower = String(platform).toLowerCase();
        const iconSvg = PlatformIcons.getIcon(platformLower);

        if (iconSvg && iconSvg.startsWith('<svg')) {
            // Use innerHTML for simpler, more reliable SVG insertion
            icon.innerHTML = iconSvg;

            // Ensure fill attributes are preserved on all SVG elements
            const svgElement = icon.querySelector('svg');
            if (svgElement) {
                const fillElements = svgElement.querySelectorAll('path, rect');
                fillElements.forEach(element => {
                    const fillAttr = element.getAttribute('fill');
                    if (fillAttr) {
                        element.style.setProperty('fill', fillAttr, 'important');
                    }
                });
            } else {
                // If no SVG found after innerHTML, use text fallback
                icon.textContent = platform.substring(0, 1).toUpperCase();
            }
        } else {
            // Fallback: Show first letter
            icon.textContent = platform.substring(0, 1).toUpperCase();
        }

        // Always set title for tooltip
        icon.title = Sanitizer.escapeHTML(platform.toUpperCase());

        return icon;
    }

    buildNameLink(entry) {
        const link = document.createElement('a');
        link.href = URLValidator.sanitizeLinkURL(entry.ad_data?.page_profile_uri);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = Sanitizer.escapeHTML(entry.competitor_name || 'Unknown competitor');
        return link;
    }

buildPlatformBadges(platforms) {
    const badges = document.createElement('div');
    badges.className = 'badges';

    (platforms || []).forEach(platform => {
        const badge = document.createElement('span');
        badge.className = 'badge platform-badge';

        // ✅ Normalize to lowercase before getting icon
        const platformLower = String(platform).toLowerCase();
        const icon = PlatformIcons.getIcon(platformLower); // ✅ Correct method name

        if (icon && icon.startsWith('<svg')) {
            // Parse SVG safely using DOMParser instead of innerHTML
            try {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(icon, 'image/svg+xml');
                
                // Check for parsing errors
                const parserError = svgDoc.querySelector('parsererror');
                if (parserError) {
                    console.warn('SVG parsing error for platform:', platform, parserError.textContent);
                    badge.textContent = platform.substring(0, 2).toUpperCase();
                } else {
                    const svgElement = svgDoc.documentElement;
                    if (svgElement && svgElement.tagName === 'svg') {
                        // Preserve fill attributes on paths (important for colored icons)
                        const paths = svgElement.querySelectorAll('path');
                        paths.forEach(path => {
                            const fillAttr = path.getAttribute('fill');
                            if (fillAttr) {
                                // Set via inline style with !important to override any CSS
                                path.style.setProperty('fill', fillAttr, 'important');
                                // Also keep the attribute for fallback
                                path.setAttribute('fill', fillAttr);
                            }
                        });
                        
                        // Preserve fill on rect elements too
                        const rects = svgElement.querySelectorAll('rect');
                        rects.forEach(rect => {
                            const fillAttr = rect.getAttribute('fill');
                            if (fillAttr) {
                                rect.style.setProperty('fill', fillAttr, 'important');
                                rect.setAttribute('fill', fillAttr);
                            }
                        });
                        
                        badge.appendChild(svgElement);
                    } else {
                        // If parsing fails, use textContent fallback
                        badge.textContent = platform.substring(0, 2).toUpperCase();
                    }
                }
            } catch (e) {
                console.warn('SVG parsing exception for platform:', platform, e);
                // If parsing fails, use textContent fallback
                badge.textContent = platform.substring(0, 2).toUpperCase();
            }
            badge.title = Sanitizer.escapeHTML(platform); // Original case for tooltip
        } else {
            // Fallback: Show first 2 letters (FB, IG, etc.)
            badge.textContent = platform.substring(0, 2).toUpperCase();
            badge.title = Sanitizer.escapeHTML(platform);
        }

        badges.appendChild(badge);
    });

    return badges;
}

    buildViewProfileLink(uri) {
        const link = document.createElement('a');
        link.className = 'view-profile-link';
        link.href = URLValidator.sanitizeLinkURL(uri);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'View Profile ';
        const arrow = document.createElement('span');
        arrow.textContent = '↗';
        link.appendChild(arrow);
        return link;
    }

    buildMeta(date) {
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = date || 'N/A';
        return meta;
    }

    buildDivider() {
        const divider = document.createElement('div');
        divider.className = 'content-divider';
        return divider;
    }

    buildAdText(text) {
        const ad = document.createElement('div');
        ad.className = 'ad-text';
        ad.textContent = text;
        return ad;
    }

    buildVideoThumbnail(video) {
        const videoElement = document.createElement('video');
        videoElement.className = 'video-thumb';
        videoElement.controls = true;
        videoElement.preload = 'metadata';
        
        // Set poster image (thumbnail)
        if (video.video_preview_image_url) {
            const posterUrl = URLValidator.sanitizeImageURL(video.video_preview_image_url);
            if (posterUrl) {
                videoElement.poster = posterUrl;
            }
        }
        
        // Add video source
        const source = document.createElement('source');
        const videoUrl = URLValidator.sanitizeImageURL(
            video.video_sd_url || video.video_hd_url || video.video_preview_image_url
        );
        if (videoUrl) {
            source.src = videoUrl;
            source.type = 'video/mp4';
        }
        
        videoElement.appendChild(source);
        
        // Fallback text
        const fallback = document.createTextNode('Your browser doesn\'t support video playback.');
        videoElement.appendChild(fallback);
        
        return videoElement;
    }

    buildImageCarousel(images) {
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'image-carousel-container';
        
        const carousel = document.createElement('div');
        carousel.className = 'image-carousel';
        
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'carousel-images';
        
        images.forEach((image, index) => {
            const img = document.createElement('img');
            img.className = 'carousel-image';
            img.src = URLValidator.sanitizeImageURL(image.resized_image_url || image.original_image_url);
            img.alt = `Image ${index + 1}`;
            img.loading = 'lazy';
            
            // Show first image by default
            if (index === 0) {
                img.classList.add('active');
            } else {
                img.style.display = 'none';
            }
            
            imageWrapper.appendChild(img);
        });
        
        carousel.appendChild(imageWrapper);
        
        // Navigation buttons (only show if more than 1 image)
        if (images.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'carousel-btn carousel-btn-prev';
            prevBtn.textContent = '‹';
            prevBtn.setAttribute('aria-label', 'Previous image');
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'carousel-btn carousel-btn-next';
            nextBtn.textContent = '›';
            nextBtn.setAttribute('aria-label', 'Next image');
            
            // Indicators
            const indicators = document.createElement('div');
            indicators.className = 'carousel-indicators';
            
            images.forEach((_, index) => {
                const indicator = document.createElement('button');
                indicator.className = 'carousel-indicator';
                if (index === 0) indicator.classList.add('active');
                indicator.setAttribute('aria-label', `Go to image ${index + 1}`);
                indicator.addEventListener('click', () => this.goToImage(carousel, index));
                indicators.appendChild(indicator);
            });
            
            carousel.appendChild(prevBtn);
            carousel.appendChild(nextBtn);
            carousel.appendChild(indicators);
            
            // Store current index on carousel element
            carousel.dataset.currentIndex = '0';
            
            // Navigation handlers with cleanup tracking
            const self = this;
            const prevHandler = () => {
                const currentIndex = parseInt(carousel.dataset.currentIndex || '0');
                const newIndex = (currentIndex - 1 + images.length) % images.length;
                carousel.dataset.currentIndex = newIndex.toString();
                self.goToImage(carousel, newIndex);
            };
            const nextHandler = () => {
                const currentIndex = parseInt(carousel.dataset.currentIndex || '0');
                const newIndex = (currentIndex + 1) % images.length;
                carousel.dataset.currentIndex = newIndex.toString();
                self.goToImage(carousel, newIndex);
            };
            
            prevBtn.addEventListener('click', prevHandler);
            nextBtn.addEventListener('click', nextHandler);
            
            // Touch/swipe support
            let touchStartX = 0;
            let touchEndX = 0;
            
            const touchStartHandler = (e) => {
                touchStartX = e.changedTouches[0].screenX;
            };
            const touchEndHandler = (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const currentIndex = parseInt(carousel.dataset.currentIndex || '0');
                self.handleSwipe(carousel, touchStartX, touchEndX, images.length, () => {
                    const newIndex = (currentIndex - 1 + images.length) % images.length;
                    carousel.dataset.currentIndex = newIndex.toString();
                    self.goToImage(carousel, newIndex);
                }, () => {
                    const newIndex = (currentIndex + 1) % images.length;
                    carousel.dataset.currentIndex = newIndex.toString();
                    self.goToImage(carousel, newIndex);
                });
            };
            
            carousel.addEventListener('touchstart', touchStartHandler, { passive: true });
            carousel.addEventListener('touchend', touchEndHandler, { passive: true });
            
            // Store cleanup function on carousel element for later removal
            carousel._carouselCleanup = () => {
                prevBtn.removeEventListener('click', prevHandler);
                nextBtn.removeEventListener('click', nextHandler);
                carousel.removeEventListener('touchstart', touchStartHandler);
                carousel.removeEventListener('touchend', touchEndHandler);
                // Clean up indicator listeners
                indicators.querySelectorAll('.carousel-indicator').forEach(indicator => {
                    indicator.replaceWith(indicator.cloneNode(true)); // Remove all listeners
                });
            };
        }
        
        carouselContainer.appendChild(carousel);
        return carouselContainer;
    }

    buildSingleImage(image) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'single-image-container';
        
        const img = document.createElement('img');
        img.className = 'single-image';
        img.src = URLValidator.sanitizeImageURL(image.resized_image_url || image.original_image_url);
        img.alt = 'Ad image';
        img.loading = 'lazy';
        
        imgContainer.appendChild(img);
        return imgContainer;
    }

    buildCardsCarousel(cards) {
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'image-carousel-container';
        
        const carousel = document.createElement('div');
        carousel.className = 'image-carousel';
        
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'carousel-images';
        
        cards.forEach((card, index) => {
            const cardItem = document.createElement('div');
            cardItem.className = 'carousel-card-item';
            
            // Create link if link_url exists
            const hasLink = card.link_url && card.link_url.trim() !== '' && card.link_url !== 'empty';
            const wrapper = hasLink ? document.createElement('a') : document.createElement('div');
            
            if (hasLink) {
                wrapper.href = URLValidator.sanitizeLinkURL(card.link_url);
                wrapper.target = '_blank';
                wrapper.rel = 'noopener noreferrer';
                wrapper.className = 'carousel-card-link';
            }
            
            const img = document.createElement('img');
            img.className = 'carousel-image';
            img.src = URLValidator.sanitizeImageURL(card.resized_image_url || card.original_image_url);
            img.alt = Sanitizer.escapeHTML(card.title || card.body || `Card ${index + 1}`);
            img.loading = 'lazy';
            
            // Show first image by default
            if (index === 0) {
                img.classList.add('active');
                cardItem.classList.add('active');
            } else {
                img.style.display = 'none';
                cardItem.style.display = 'none';
            }
            
            wrapper.appendChild(img);
            cardItem.appendChild(wrapper);
            imageWrapper.appendChild(cardItem);
        });
        
        carousel.appendChild(imageWrapper);
        
        // Navigation buttons (only show if more than 1 card)
        if (cards.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'carousel-btn carousel-btn-prev';
            prevBtn.textContent = '‹';
            prevBtn.setAttribute('aria-label', 'Previous card');
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'carousel-btn carousel-btn-next';
            nextBtn.textContent = '›';
            nextBtn.setAttribute('aria-label', 'Next card');
            
            // Indicators
            const indicators = document.createElement('div');
            indicators.className = 'carousel-indicators';
            
            cards.forEach((_, index) => {
                const indicator = document.createElement('button');
                indicator.className = 'carousel-indicator';
                if (index === 0) indicator.classList.add('active');
                indicator.setAttribute('aria-label', `Go to card ${index + 1}`);
                indicator.addEventListener('click', () => this.goToCard(carousel, index));
                indicators.appendChild(indicator);
            });
            
            carousel.appendChild(prevBtn);
            carousel.appendChild(nextBtn);
            carousel.appendChild(indicators);
            
            // Store current index on carousel element
            carousel.dataset.currentIndex = '0';
            
            // Navigation handlers with cleanup tracking
            const self = this;
            const prevHandler = () => {
                const currentIndex = parseInt(carousel.dataset.currentIndex || '0');
                const newIndex = (currentIndex - 1 + cards.length) % cards.length;
                carousel.dataset.currentIndex = newIndex.toString();
                self.goToCard(carousel, newIndex);
            };
            const nextHandler = () => {
                const currentIndex = parseInt(carousel.dataset.currentIndex || '0');
                const newIndex = (currentIndex + 1) % cards.length;
                carousel.dataset.currentIndex = newIndex.toString();
                self.goToCard(carousel, newIndex);
            };
            
            prevBtn.addEventListener('click', prevHandler);
            nextBtn.addEventListener('click', nextHandler);
            
            // Touch/swipe support
            let touchStartX = 0;
            let touchEndX = 0;
            
            const touchStartHandler = (e) => {
                touchStartX = e.changedTouches[0].screenX;
            };
            const touchEndHandler = (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const currentIndex = parseInt(carousel.dataset.currentIndex || '0');
                self.handleSwipe(carousel, touchStartX, touchEndX, cards.length, () => {
                    const newIndex = (currentIndex - 1 + cards.length) % cards.length;
                    carousel.dataset.currentIndex = newIndex.toString();
                    self.goToCard(carousel, newIndex);
                }, () => {
                    const newIndex = (currentIndex + 1) % cards.length;
                    carousel.dataset.currentIndex = newIndex.toString();
                    self.goToCard(carousel, newIndex);
                });
            };
            
            carousel.addEventListener('touchstart', touchStartHandler, { passive: true });
            carousel.addEventListener('touchend', touchEndHandler, { passive: true });
            
            // Store cleanup function on carousel element for later removal
            carousel._carouselCleanup = () => {
                prevBtn.removeEventListener('click', prevHandler);
                nextBtn.removeEventListener('click', nextHandler);
                carousel.removeEventListener('touchstart', touchStartHandler);
                carousel.removeEventListener('touchend', touchEndHandler);
                // Clean up indicator listeners
                indicators.querySelectorAll('.carousel-indicator').forEach(indicator => {
                    indicator.replaceWith(indicator.cloneNode(true)); // Remove all listeners
                });
            };
        }
        
        carouselContainer.appendChild(carousel);
        return carouselContainer;
    }

    buildSingleCard(card) {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'single-image-container';
        
        // Create link if link_url exists
        const hasLink = card.link_url && card.link_url.trim() !== '' && card.link_url !== 'empty';
        const wrapper = hasLink ? document.createElement('a') : document.createElement('div');
        
        if (hasLink) {
            wrapper.href = URLValidator.sanitizeLinkURL(card.link_url);
            wrapper.target = '_blank';
            wrapper.rel = 'noopener noreferrer';
            wrapper.className = 'single-card-link';
        }
        
        const img = document.createElement('img');
        img.className = 'single-image';
        img.src = URLValidator.sanitizeImageURL(card.resized_image_url || card.original_image_url);
        img.alt = Sanitizer.escapeHTML(card.title || card.body || 'Ad card');
        img.loading = 'lazy';
        
        wrapper.appendChild(img);
        cardContainer.appendChild(wrapper);
        return cardContainer;
    }

    goToCard(carousel, index) {
        // Cache selectors on carousel element to avoid repeated queries
        if (!carousel._cachedCardItems) {
            carousel._cachedCardItems = carousel.querySelectorAll('.carousel-card-item');
            carousel._cachedIndicators = carousel.querySelectorAll('.carousel-indicator');
        }
        
        const cardItems = carousel._cachedCardItems;
        const indicators = carousel._cachedIndicators;
        
        // Update current index
        carousel.dataset.currentIndex = index.toString();
        
        cardItems.forEach((item, i) => {
            if (i === index) {
                item.style.display = 'block';
                item.classList.add('active');
                // Cache image selector per item
                if (!item._cachedImage) {
                    item._cachedImage = item.querySelector('.carousel-image');
                }
                const img = item._cachedImage;
                if (img) {
                    img.style.display = 'block';
                    img.classList.add('active');
                }
            } else {
                item.style.display = 'none';
                item.classList.remove('active');
                // Cache image selector per item
                if (!item._cachedImage) {
                    item._cachedImage = item.querySelector('.carousel-image');
                }
                const img = item._cachedImage;
                if (img) {
                    img.style.display = 'none';
                    img.classList.remove('active');
                }
            }
        });
        
        indicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    goToImage(carousel, index) {
        // Cache selectors on carousel element to avoid repeated queries
        if (!carousel._cachedImages) {
            carousel._cachedImages = carousel.querySelectorAll('.carousel-image');
            carousel._cachedIndicators = carousel.querySelectorAll('.carousel-indicator');
        }
        
        const images = carousel._cachedImages;
        const indicators = carousel._cachedIndicators;
        
        // Update current index
        carousel.dataset.currentIndex = index.toString();
        
        images.forEach((img, i) => {
            if (i === index) {
                img.style.display = 'block';
                img.classList.add('active');
            } else {
                img.style.display = 'none';
                img.classList.remove('active');
            }
        });
        
        indicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    handleSwipe(carousel, startX, endX, totalImages, onPrev, onNext) {
        const swipeThreshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                onNext();
            } else {
                onPrev();
            }
        }
    }
}

window.CardBuilder = CardBuilder;