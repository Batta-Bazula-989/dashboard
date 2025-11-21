class FormBuilder {
    constructor() {
        this.maxCompetitors = 3;
        // Use server-side webhook proxy instead of hardcoded URL
        this.webhookUrl = '/api/webhook/submit';
        this.competitors = [{ id: 1, value: '' }];
        this.nextId = 2;
    }


    // Build the complete form HTML

    build(isHeader = false) {
        return `
            <div class="competitor-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="competitorInput">Brand Name</label>
                        <input
                            type="text"
                            id="competitorInput"
                            class="competitor-input"
                            placeholder="Enter brand name"
                            value="${this.competitors[0].value}"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="countrySelect">Country</label>
                        <select id="countrySelect" class="form-select">
                            <option value="UA">UA</option>
                            <option value="PL">PL</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="statusSelect">Status</label>
                        <select id="statusSelect" class="form-select">
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                        </select>
                    </div>
                    
                    <button type="button" class="add-competitor-btn" id="addCompetitorBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add
                    </button>
                    
                    <button type="button" class="run-analysis-btn" id="runAnalysisBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        Analyze
                    </button>
                </div>
                
                <div class="form-error" id="formError" style="display: none;"></div>
            </div>
        `;
    }

     // Build a single competitor input field

    buildCompetitorInput(competitor) {
        const isFirst = competitor.id === 1;
        return `
            <div class="competitor-input-group" data-competitor-id="${competitor.id}">
                <input
                    type="text"
                    class="competitor-input"
                    placeholder="Advertiser ${competitor.id}"
                    value="${competitor.value}"
                    data-competitor-id="${competitor.id}"
                />
                ${!isFirst ? `
                    <button type="button" class="remove-competitor-btn" data-competitor-id="${competitor.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                ` : ''}
            </div>
        `;
    }


    // Initialize form event listeners

    initEventListeners(container, onSuccess, onError) {
        const addBtn = container.querySelector('#addCompetitorBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addCompetitor(container));
        }

        const runBtn = container.querySelector('#runAnalysisBtn');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.submitForm(container, onSuccess, onError));
        }

        const competitorInput = container.querySelector('#competitorInput');
        if (competitorInput) {
            competitorInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitForm(container, onSuccess, onError);
                }
            });
        }
    }

    // Add a new competitor input

    addCompetitor(container) {
        if (this.competitors.length >= this.maxCompetitors) return;

        const newCompetitor = { id: this.nextId++, value: '' };
        this.competitors.push(newCompetitor);

        const list = container.querySelector('#competitorsList');
        // Parse HTML safely
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.buildCompetitorInput(newCompetitor), 'text/html');
        const inputElement = doc.body.firstChild;
        if (inputElement) {
            list.appendChild(inputElement.cloneNode(true));
        }

        this.updateHeader(container);
        this.attachRemoveListeners(container);

        const newInput = list.querySelector(`input[data-competitor-id="${newCompetitor.id}"]`);
        if (newInput) newInput.focus();
    }

    // Remove a competitor input

    removeCompetitor(container, id) {
        if (this.competitors.length <= 1) return;

        this.competitors = this.competitors.filter(c => c.id !== id);

        const group = container.querySelector(`.competitor-input-group[data-competitor-id="${id}"]`);
        if (group) group.remove();

        this.updateHeader(container);
    }

    // Attach remove listeners

    attachRemoveListeners(container) {
        const removeButtons = container.querySelectorAll('.remove-competitor-btn');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.competitorId);
                this.removeCompetitor(container, id);
            });
        });
    }

   // Update form header

    updateHeader(container) {
        const header = container.querySelector('.form-header');
        if (!header) return;

        // Clear existing content
        while (header.firstChild) {
            header.removeChild(header.firstChild);
        }

        const labelDiv = document.createElement('div');
        labelDiv.className = 'competitors-label';
        
        const span = document.createElement('span');
        span.textContent = `Advertisers (${this.competitors.length} added)`;
        labelDiv.appendChild(span);
        
        if (this.competitors.length < this.maxCompetitors) {
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'add-more-btn';
            addBtn.id = 'addCompetitorBtn';
            addBtn.textContent = '+ Add more';
            labelDiv.appendChild(addBtn);
        }
        
        header.appendChild(labelDiv);

        const addBtn = header.querySelector('#addCompetitorBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addCompetitor(container));
        }
    }

    // Validate form

    validateForm(competitorValues) {
        const validCompetitors = competitorValues.filter(v => v.trim() !== '');

        if (validCompetitors.length === 0) {
            return { valid: false, error: 'Please add at least one advertiser' };
        }

        return { valid: true, competitors: validCompetitors };
    }

    // Show form error

    showError(container, message) {
        const errorEl = container.querySelector('#formError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            setTimeout(() => errorEl.style.display = 'none', 4000);
        }
    }

    // Submit form to n8n webhook

    async submitForm(container, onSuccess, onError) {
        const competitorInput = container.querySelector('#competitorInput');
        const competitorValue = competitorInput ? competitorInput.value.trim() : '';
        const country = container.querySelector('#countrySelect').value;
        const status = container.querySelector('#statusSelect').value;

        if (!competitorValue) {
            this.showError(container, 'Please enter an advertiser name');
            return;
        }

        const runBtn = container.querySelector('#runAnalysisBtn');
        // Store original button state
        const originalBtnState = {
            disabled: runBtn.disabled,
            children: Array.from(runBtn.childNodes).map(n => n.cloneNode(true))
        };
        runBtn.disabled = true;
        
        // Clear button content
        while (runBtn.firstChild) {
            runBtn.removeChild(runBtn.firstChild);
        }
        
        // Add loading SVG
        const loadingSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        loadingSvg.setAttribute('width', '16');
        loadingSvg.setAttribute('height', '16');
        loadingSvg.setAttribute('viewBox', '0 0 24 24');
        loadingSvg.setAttribute('fill', 'none');
        loadingSvg.setAttribute('stroke', 'currentColor');
        loadingSvg.setAttribute('stroke-width', '2');
        loadingSvg.classList.add('spinning');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M21 12a9 9 0 1 1-6.219-8.56');
        loadingSvg.appendChild(path);
        runBtn.appendChild(loadingSvg);
        runBtn.appendChild(document.createTextNode(' Analyzing...'));

        const submission = {
            Country: country,
            Brand: competitorValue,
            Status: status,
            submittedAt: new Date().toISOString(),
            formMode: 'production'
        };

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submission)
            });

            if (response.ok) {
                this.resetForm(container);
                if (onSuccess) onSuccess(`Successfully submitted ${competitorValue} for analysis`);
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError(container, 'Failed to submit form. Please try again.');
            if (onError) onError('Failed to submit form');
        } finally {
            runBtn.disabled = originalBtnState.disabled;
            // Restore original button content
            while (runBtn.firstChild) {
                runBtn.removeChild(runBtn.firstChild);
            }
            originalBtnState.children.forEach(child => {
                runBtn.appendChild(child.cloneNode(true));
            });
        }
    }

    // Reset form to initial state

    resetForm(container) {
        const competitorInput = container.querySelector('#competitorInput');
        if (competitorInput) {
            competitorInput.value = '';
        }

        container.querySelector('#countrySelect').value = 'UA';
        container.querySelector('#statusSelect').value = 'active';
    }
}

window.FormBuilder = FormBuilder;