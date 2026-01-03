class FormBuilder {
    constructor() {
        this.maxCompetitors = 3;
        this.webhookUrl = '/api/webhook/submit';
        this.competitors = [{ id: 1, value: '' }];
        this.nextId = 2;
    }

    build(isHeader = false) {
        return `
            <div class="competitor-form">
                <div class="form-grid">
                    <div class="form-group brand-name-group">
                        <label>Brand Name</label>
                        <div class="brand-name-inputs" id="brandNameInputs">
                            ${this.buildBrandNameInput(1, '', true)}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="countrySelect">Country</label>
                        <select id="countrySelect" class="form-select" required>
                            <option value="UA">UA</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="statusSelect">Status</label>
                        <select id="statusSelect" class="form-select" required>
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                        </select>
                    </div>
                    
                    <button type="button" class="add-competitor-btn" id="addCompetitorBtn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                    
                    <button type="button" class="run-analysis-btn" id="runAnalysisBtn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
                        </svg>
                        GO
                    </button>
                </div>
                
                <div class="form-error" id="formError" style="display: none;"></div>
            </div>
        `;
    }

    // Build a single brand name input field
    buildBrandNameInput(id, value = '', isLast = false) {
        const isFirst = id === 1;
        // Only show X button if it's not the first field AND it's the last field
        const showRemoveButton = !isFirst && isLast;
        // Sanitize value for HTML attribute (use escapeHTMLAttribute for attributes)
        const safeValue = typeof Sanitizer !== 'undefined' ? 
            Sanitizer.escapeHTMLAttribute(value) : 
            value.replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `
            <div class="brand-name-input-wrapper" data-brand-id="${id}">
                <div class="brand-name-input-row">
                    <input
                        type="text"
                        class="competitor-input brand-name-input"
                        data-brand-id="${id}"
                        placeholder="Enter brand name"
                        value="${safeValue}"
                        maxlength="55"
                        minlength="3"
                        pattern="[a-zA-Z0-9\\s\\-'.,&()]+"
                        title="Brand name: 3-55 characters, alphanumeric with spaces, hyphens, apostrophes, periods, commas, ampersands, and parentheses only"
                        autocomplete="off"
                        spellcheck="false"
                    />
                    ${showRemoveButton ? `
                        <button type="button" class="remove-brand-btn" data-brand-id="${id}" title="Remove">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    ` : ''}
                </div>
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
            // Initialize Add button state
            this.updateAddButtonState(container);
        }

        const runBtn = container.querySelector('#runAnalysisBtn');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.submitForm(container, onSuccess, onError));
        }

        // Handle brand name input changes
        this.attachBrandNameListeners(container);

        // Handle Enter key on brand name inputs using event delegation
        const inputsContainer = container.querySelector('#brandNameInputs');
        if (inputsContainer) {
            inputsContainer.removeEventListener('keypress', this._enterKeyHandler);
            this._enterKeyHandler = (e) => {
                if (e.target.classList.contains('brand-name-input') && e.key === 'Enter') {
                    this.submitForm(container, onSuccess, onError);
                }
            };
            inputsContainer.addEventListener('keypress', this._enterKeyHandler);
        }
    }

    // Attach listeners to brand name inputs
    attachBrandNameListeners(container) {
        // Use event delegation for input events
        const inputsContainer = container.querySelector('#brandNameInputs');
        if (inputsContainer) {
            // Remove old listener if exists and add new one
            inputsContainer.removeEventListener('input', this._brandInputHandler);
            inputsContainer.removeEventListener('blur', this._brandBlurHandler);
            inputsContainer.removeEventListener('invalid', this._brandInvalidHandler);
            
            this._brandInputHandler = (e) => {
                if (e.target.classList.contains('brand-name-input')) {
                    this.handleBrandNameInput(container, parseInt(e.target.dataset.brandId));
                    // Real-time validation feedback
                    this.validateBrandNameInput(e.target);
                }
            };
            
            this._brandBlurHandler = (e) => {
                if (e.target.classList.contains('brand-name-input')) {
                    this.validateBrandNameInput(e.target);
                }
            };
            
            this._brandInvalidHandler = (e) => {
                if (e.target.classList.contains('brand-name-input')) {
                    e.preventDefault();
                    this.validateBrandNameInput(e.target);
                }
            };
            
            inputsContainer.addEventListener('input', this._brandInputHandler);
            inputsContainer.addEventListener('blur', this._brandBlurHandler, true);
            inputsContainer.addEventListener('invalid', this._brandInvalidHandler, true);

            // Use event delegation for remove buttons
            inputsContainer.removeEventListener('click', this._removeButtonHandler);
            this._removeButtonHandler = (e) => {
                if (e.target.closest('.remove-brand-btn')) {
                    const btn = e.target.closest('.remove-brand-btn');
                    const id = parseInt(btn.dataset.brandId);
                    this.removeBrandNameField(container, id);
                }
            };
            inputsContainer.addEventListener('click', this._removeButtonHandler);
        }
    }

    // Validate a single brand name input field
    validateBrandNameInput(input) {
        if (!input || !window.InputValidator) {
            return;
        }

        const value = input.value;
        const validation = InputValidator.validateBrandName(value);

        // Remove existing error styling
        input.classList.remove('input-error');
        const wrapper = input.closest('.brand-name-input-wrapper');
        if (!wrapper) return;
        
        const existingError = wrapper.querySelector('.input-error-message');
        if (existingError) {
            existingError.remove();
        }

        // Show validation feedback
        if (!validation.valid && value.length > 0) {
            input.classList.add('input-error');
            const errorMsg = document.createElement('span');
            errorMsg.className = 'input-error-message';
            // Use textContent - CSS white-space: pre-line will handle line breaks
            errorMsg.textContent = validation.error;
            wrapper.appendChild(errorMsg);
        } else if (validation.valid && value.length > 0) {
            input.classList.add('input-valid');
        } else {
            input.classList.remove('input-valid');
        }

        // Update Add button state after validation
        this.updateAddButtonState(input.closest('.competitor-form') || input.closest('.form-section') || document);
    }

    // Check if any brand name field has validation errors
    hasValidationErrors(container) {
        if (!window.InputValidator) {
            return false;
        }

        const brandInputs = container.querySelectorAll('.brand-name-input');
        for (const input of brandInputs) {
            const value = input.value;
            // Only check non-empty values (empty is allowed until user starts typing)
            if (value.length > 0) {
                const validation = InputValidator.validateBrandName(value);
                if (!validation.valid) {
                    return true;
                }
            }
        }
        return false;
    }

    // Update Add button state based on validation errors
    updateAddButtonState(container) {
        const addBtn = container.querySelector('#addCompetitorBtn');
        if (!addBtn) return;

        const hasErrors = this.hasValidationErrors(container);
        const allBrandInputs = container.querySelectorAll('.brand-name-input');
        const maxReached = allBrandInputs.length >= this.maxCompetitors;

        // Disable if there are validation errors or max reached
        addBtn.disabled = hasErrors || maxReached;
        
        // Update visual state
        if (addBtn.disabled) {
            addBtn.style.opacity = '0.5';
            addBtn.style.cursor = 'not-allowed';
        } else {
            addBtn.style.opacity = '1';
            addBtn.style.cursor = 'pointer';
        }
    }

    // Handle brand name input changes - only update the value
    handleBrandNameInput(container, currentId) {
        const currentInput = container.querySelector(`.brand-name-input[data-brand-id="${currentId}"]`);
        if (!currentInput) return;

        const currentIndex = this.competitors.findIndex(c => c.id === currentId);
        
        // Update the competitor value
        if (currentIndex !== -1) {
            this.competitors[currentIndex].value = currentInput.value;
        }

        // If current field is empty, remove all subsequent fields
        if (currentInput.value.trim() === '') {
            this.removeSubsequentFields(container, currentId);
        }
    }

    // Remove subsequent brand name fields
    removeSubsequentFields(container, fromId) {
        const inputsContainer = container.querySelector('#brandNameInputs');
        if (!inputsContainer) return;

        // Remove all fields with id greater than fromId
        const fieldsToRemove = container.querySelectorAll(`.brand-name-input-wrapper[data-brand-id]`);
        fieldsToRemove.forEach(field => {
            const fieldId = parseInt(field.dataset.brandId);
            if (fieldId > fromId) {
                field.remove();
                // Remove from competitors array
                this.competitors = this.competitors.filter(c => c.id <= fromId);
            }
        });

        this.attachBrandNameListeners(container);
        // Update X buttons after removing subsequent fields
        this.updateRemoveButtons(container);
        // Update Add button state
        this.updateAddButtonState(container);
    }

    // Remove a specific brand name field
    removeBrandNameField(container, id) {
        if (id === 1) return;

        const field = container.querySelector(`.brand-name-input-wrapper[data-brand-id="${id}"]`);
        if (field) {
            field.remove();
            // Remove from competitors array
            this.competitors = this.competitors.filter(c => c.id !== id);
            // Remove all subsequent fields
            this.removeSubsequentFields(container, id - 1);
            // Update X buttons after removal
            this.updateRemoveButtons(container);
            // Update Add button state
            this.updateAddButtonState(container);
        }
    }

    // Update remove buttons - only show X on the last field
    updateRemoveButtons(container) {
        const allFields = container.querySelectorAll('.brand-name-input-wrapper');
        if (allFields.length === 0) return;

        // Find the last field (highest ID)
        let lastField = null;
        let maxId = 0;
        
        allFields.forEach(field => {
            const fieldId = parseInt(field.dataset.brandId);
            if (fieldId > maxId) {
                maxId = fieldId;
                lastField = field;
            }
        });

        // Remove all existing remove buttons
        const allRemoveButtons = container.querySelectorAll('.remove-brand-btn');
        allRemoveButtons.forEach(btn => btn.remove());

        // Add remove button only to the last field (if it's not the first field)
        if (lastField && maxId > 1) {
            const input = lastField.querySelector('.brand-name-input');
            if (input) {
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'remove-brand-btn';
                removeBtn.dataset.brandId = maxId;
                removeBtn.title = 'Remove';
                // Use DOMParser for safe SVG insertion instead of innerHTML
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
                    'image/svg+xml'
                );
                const svgElement = svgDoc.documentElement;
                if (svgElement && svgElement.tagName === 'svg') {
                    removeBtn.appendChild(svgElement);
                } else {
                    // Fallback to text if SVG parsing fails
                    removeBtn.textContent = '×';
                }
                lastField.appendChild(removeBtn);
                
                // Reattach listeners
                this.attachBrandNameListeners(container);
            }
        }
    }

    // Add a new competitor input (brand name field)
    addCompetitor(container) {
        // Find the last brand name field
        const allBrandInputs = container.querySelectorAll('.brand-name-input');
        if (allBrandInputs.length === 0) return;

        // Check if we've reached the maximum (check actual DOM elements)
        if (allBrandInputs.length >= this.maxCompetitors) {
            this.showError(container, `Maximum ${this.maxCompetitors} brand names allowed`);
            return;
        }

        // Check for validation errors - prevent adding new field if there are errors
        if (this.hasValidationErrors(container)) {
            this.showError(container, 'Please fix validation errors before adding another field');
            return;
        }

        // Get the last input field
        const lastInput = allBrandInputs[allBrandInputs.length - 1];
        const lastId = parseInt(lastInput.dataset.brandId);
        const lastValue = lastInput.value.trim();

        // Check if the previous field has data
        if (!lastValue) {
            this.showError(container, 'Please enter a brand name in the previous field first');
            return;
        }

        // Validate the last field before allowing a new one
        if (window.InputValidator) {
            const validation = InputValidator.validateBrandName(lastValue);
            if (!validation.valid) {
                this.showError(container, 'Please fix validation errors before adding another field');
                return;
            }
        }

        // Check if the next field already exists
        const nextId = lastId + 1;
        const nextFieldExists = container.querySelector(`.brand-name-input-wrapper[data-brand-id="${nextId}"]`);
        if (nextFieldExists) {
            return; // Field already exists
        }

        // Add the new field
        const inputsContainer = container.querySelector('#brandNameInputs');
        if (!inputsContainer) return;

        const newCompetitor = { id: nextId, value: '' };
        this.competitors.push(newCompetitor);
        
        // Update nextId if needed
        if (nextId >= this.nextId) {
            this.nextId = nextId + 1;
        }
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.buildBrandNameInput(nextId, '', true), 'text/html');
        const newField = doc.body.firstChild;
        if (newField) {
            inputsContainer.appendChild(newField.cloneNode(true));
            this.attachBrandNameListeners(container);
            
            // Update X buttons: remove from previous last field, add to new last field
            this.updateRemoveButtons(container);
            
            // Update Add button state
            this.updateAddButtonState(container);
            
            // Focus the new input
            const newInput = container.querySelector(`.brand-name-input[data-brand-id="${nextId}"]`);
            if (newInput) newInput.focus();
        }
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
            // textContent automatically escapes HTML, but we sanitize as defense-in-depth
            const safeMessage = window.Sanitizer ? 
                Sanitizer.removeControlCharacters(String(message)) : String(message);
            errorEl.textContent = safeMessage; // textContent automatically escapes HTML
            errorEl.style.display = 'block';
            setTimeout(() => errorEl.style.display = 'none', 4000);
        }
    }

    // Submit form to n8n webhook
    async submitForm(container, onSuccess, onError) {
        // Cache selectors to avoid repeated queries
        if (!container._cachedFormElements) {
            container._cachedFormElements = {
                countrySelect: container.querySelector('#countrySelect'),
                statusSelect: container.querySelector('#statusSelect'),
                runBtn: container.querySelector('#runAnalysisBtn')
            };
        }
        
        const { countrySelect, statusSelect, runBtn } = container._cachedFormElements;
        
        // Collect all brand name values
        const brandNameInputs = container.querySelectorAll('.brand-name-input');
        const brandNames = Array.from(brandNameInputs)
            .map(input => input.value.trim())
            .filter(value => value !== '');

        if (brandNames.length === 0) {
            this.showError(container, 'Please enter at least one brand name');
            return;
        }

        const country = countrySelect ? countrySelect.value : 'UA';
        const status = statusSelect ? statusSelect.value : 'active';
        
        // CLIENT-SIDE VALIDATION - Validate all inputs before submission
        if (window.InputValidator) {
            // Validate each brand name
            for (let i = 0; i < brandNames.length; i++) {
                const validation = InputValidator.validateBrandName(brandNames[i]);
                if (!validation.valid) {
                    this.showError(container, `Brand name ${i + 1}: ${validation.error}`);
                    // Highlight the invalid input
                    const input = brandNameInputs[i];
                    if (input) {
                        input.classList.add('input-error');
                        input.focus();
                    }
                    return;
                }
            }

            // Validate country
            const countryValidation = InputValidator.validateCountry(country);
            if (!countryValidation.valid) {
                this.showError(container, countryValidation.error);
                if (countrySelect) {
                    countrySelect.focus();
                    countrySelect.classList.add('input-error');
                }
                return;
            }

            // Validate status
            const statusValidation = InputValidator.validateStatus(status);
            if (!statusValidation.valid) {
                this.showError(container, statusValidation.error);
                if (statusSelect) {
                    statusSelect.focus();
                    statusSelect.classList.add('input-error');
                }
                return;
            }
        }
        
        // Use the first brand name for backward compatibility
        const competitorValue = brandNames[0];

        // Store original button state (runBtn already cached above)
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
        const loadingSvg = SvgHelper.create({
            width: 16,
            height: 16,
            children: [
                SvgHelper.path('M21 12a9 9 0 1 1-6.219-8.56')
            ]
        });
        loadingSvg.classList.add('spinning');
        runBtn.appendChild(loadingSvg);
        runBtn.appendChild(document.createTextNode(' Analyzing...'));

        // Sanitize all values before sending (defense-in-depth)
        const sanitizedBrands = brandNames.map(brand =>
            window.Sanitizer ?
                Sanitizer.removeControlCharacters(brand) : brand
        );
        const sanitizedCountry = window.Sanitizer ?
            Sanitizer.removeControlCharacters(country) : country;
        const sanitizedStatus = window.Sanitizer ?
            Sanitizer.removeControlCharacters(status) : status;

        const submission = {
            Country: sanitizedCountry,
            Brands: sanitizedBrands,
            Status: sanitizedStatus,
            submittedAt: new Date().toISOString()
        };

        // Sanitize for JSON (remove any problematic characters)
        const sanitizedSubmission = window.Sanitizer ? 
            Sanitizer.sanitizeForJSON(submission) : submission;

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitizedSubmission)
            });

            const responseData = await response.json().catch((error) => {
                console.error('Failed to parse response JSON:', error);
                return {};
            });

            if (response.ok) {
                this.resetForm(container);
                if (onSuccess) onSuccess(`Successfully submitted ${competitorValue} for analysis`);
            } else {
                // Show specific error message from server
                const errorMessage = responseData.error || `Submission failed (${response.status})`;
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            // Show more specific error message
            const errorMessage = error.message || 'Failed to submit form. Please try again.';
            this.showError(container, errorMessage);
            if (onError) onError(errorMessage);
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

    // Disable all form inputs and buttons
    disableForm(container) {
        // Disable all brand name inputs
        const brandInputs = container.querySelectorAll('.brand-name-input');
        brandInputs.forEach(input => {
            input.disabled = true;
        });

        // Disable country and status selects
        const countrySelect = container.querySelector('#countrySelect');
        if (countrySelect) countrySelect.disabled = true;

        const statusSelect = container.querySelector('#statusSelect');
        if (statusSelect) statusSelect.disabled = true;

        // Disable GO button
        const runBtn = container.querySelector('#runAnalysisBtn');
        if (runBtn) runBtn.disabled = true;

        // Disable Add button
        const addBtn = container.querySelector('#addCompetitorBtn');
        if (addBtn) addBtn.disabled = true;

        // Disable remove buttons
        const removeButtons = container.querySelectorAll('.remove-brand-btn');
        removeButtons.forEach(btn => {
            btn.disabled = true;
        });

        // Add visual indicator (opacity change)
        const formElement = container.querySelector('.competitor-form');
        if (formElement) {
            formElement.style.opacity = '0.6';
            formElement.style.pointerEvents = 'none';
        }
    }

    // Enable all form inputs and buttons
    enableForm(container) {
        // Enable all brand name inputs
        const brandInputs = container.querySelectorAll('.brand-name-input');
        brandInputs.forEach(input => {
            input.disabled = false;
        });

        // Enable country and status selects
        const countrySelect = container.querySelector('#countrySelect');
        if (countrySelect) countrySelect.disabled = false;

        const statusSelect = container.querySelector('#statusSelect');
        if (statusSelect) statusSelect.disabled = false;

        // Enable GO button
        const runBtn = container.querySelector('#runAnalysisBtn');
        if (runBtn) runBtn.disabled = false;

        // Enable Add button (but check validation state)
        const addBtn = container.querySelector('#addCompetitorBtn');
        if (addBtn) {
            // Update state based on validation
            this.updateAddButtonState(container);
        }

        // Enable remove buttons
        const removeButtons = container.querySelectorAll('.remove-brand-btn');
        removeButtons.forEach(btn => {
            btn.disabled = false;
        });

        // Remove visual indicator
        const formElement = container.querySelector('.competitor-form');
        if (formElement) {
            formElement.style.opacity = '1';
            formElement.style.pointerEvents = 'auto';
        }
    }

    // Reset form to initial state
    resetForm(container) {
        // Reset brand name inputs - keep only the first one
        const inputsContainer = container.querySelector('#brandNameInputs');
        if (inputsContainer) {
            // Remove all fields except the first
            const allFields = container.querySelectorAll('.brand-name-input-wrapper');
            allFields.forEach((field, index) => {
                if (index > 0) {
                    field.remove();
                } else {
                    const input = field.querySelector('.brand-name-input');
                    if (input) input.value = '';
                }
            });
        }

        // Reset competitors array to only the first one
        this.competitors = [{ id: 1, value: '' }];
        this.nextId = 2;

        // Reset other form fields
        if (container._cachedFormElements) {
            const { countrySelect, statusSelect } = container._cachedFormElements;
            if (countrySelect) countrySelect.value = 'UA';
            if (statusSelect) statusSelect.value = 'active';
        } else {
            const countrySelect = container.querySelector('#countrySelect');
            if (countrySelect) countrySelect.value = 'UA';
            const statusSelect = container.querySelector('#statusSelect');
            if (statusSelect) statusSelect.value = 'active';
        }

        // Reattach listeners
        this.attachBrandNameListeners(container);
        // Update X buttons (should be none since only first field remains)
        this.updateRemoveButtons(container);
        // Update Add button state
        this.updateAddButtonState(container);
    }
}

window.FormBuilder = FormBuilder;