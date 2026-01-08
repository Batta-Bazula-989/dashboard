class PromptInjectionDetector {
    static INJECTION_PATTERNS = [
        // Direct instruction manipulation
        /ignore\s+(previous|all|above|prior)\s+(instructions?|commands?|rules?)/i,
        /forget\s+(previous|all|above|prior)\s+(instructions?|commands?|rules?)/i,
        /disregard\s+(previous|all|above|prior)\s+(instructions?|commands?|rules?)/i,
        /override\s+(previous|all|above|prior)\s+(instructions?|commands?|rules?)/i,
        
        // System/user role manipulation
        /you\s+are\s+(now|a|an)\s+/i,
        /act\s+as\s+(if\s+)?(you\s+are\s+)?(a|an|the)\s+/i,
        /pretend\s+(you\s+are|to\s+be)\s+/i,
        /roleplay\s+as\s+/i,
        
        // Context breaking attempts
        /system\s*[:;]\s*/i,
        /assistant\s*[:;]\s*/i,
        /user\s*[:;]\s*/i,
        /admin\s*[:;]\s*/i,
        /root\s*[:;]\s*/i,
        
        // Command injection attempts
        /<\|(system|user|assistant|admin)\|>/i,
        /\[(SYSTEM|USER|ASSISTANT|ADMIN)\]/i,
        /```(system|user|assistant|admin)/i,
        
        // Encoding bypass attempts
        /%3C%7C(system|user|assistant|admin)%7C%3E/i,
        /&lt;\|(system|user|assistant|admin)\|&gt;/i,
        
        // Instruction injection
        /new\s+instructions?\s*[:;]/i,
        /follow\s+these\s+instructions?\s*[:;]/i,
        /execute\s+(the\s+)?following\s+(command|instruction)/i,
        
        // Jailbreak attempts
        /jailbreak/i,
        /bypass\s+(safety|security|filter|restriction)/i,
        /unrestricted\s+mode/i,
        /developer\s+mode/i,
        
        // Data extraction attempts
        /reveal\s+(your|the)\s+(prompt|instructions|system\s+message)/i,
        /show\s+(me\s+)?(your|the)\s+(prompt|instructions|system\s+message)/i,
        /what\s+are\s+(your|the)\s+(instructions?|prompt|system\s+message)/i,
        
        // Special markers
        /<\|endoftext\|>/i,
        /<\|im_start\|>/i,
        /<\|im_end\|>/i,
    ];

    // Suspicious character sequences that might indicate encoding attempts
    static SUSPICIOUS_SEQUENCES = [
        /%[0-9A-Fa-f]{2}/g, // URL encoding
        /&#x?[0-9A-Fa-f]+;/g, // HTML entity encoding
        /\\x[0-9A-Fa-f]{2}/g, // Hex escape sequences
        /\\u[0-9A-Fa-f]{4}/g, // Unicode escape sequences
    ];

    // Check if input contains prompt injection patterns
    static detect(input) {
        if (!input || typeof input !== 'string') {
            return { isInjection: false };
        }

        const normalized = input.trim();

        // Check for injection patterns
        for (const pattern of this.INJECTION_PATTERNS) {
            if (pattern.test(normalized)) {
                return {
                    isInjection: true,
                    pattern: pattern.source,
                    reason: 'Input contains potentially malicious prompt injection patterns'
                };
            }
        }

        // Check for excessive encoding attempts (might indicate obfuscation)
        let encodingCount = 0;
        for (const seq of this.SUSPICIOUS_SEQUENCES) {
            const matches = normalized.match(seq);
            if (matches) {
                encodingCount += matches.length;
            }
        }

        // If more than 5 encoded sequences, flag as suspicious
        if (encodingCount > 5) {
            return {
                isInjection: true,
                reason: 'Input contains excessive encoding that may indicate obfuscation attempts'
            };
        }

        // Check for suspicious length with special characters (potential obfuscated payload)
        // Use Unicode-aware pattern to properly handle non-ASCII characters (Cyrillic, etc.)
        const specialCharRatio = (normalized.match(/[^\p{L}\p{N}\s]/gu) || []).length / normalized.length;
        if (normalized.length > 50 && specialCharRatio > 0.3) {
            // High ratio of special characters might indicate encoded payload
            return {
                isInjection: true,
                reason: 'Input contains suspicious character patterns'
            };
        }

        return { isInjection: false };
    }


    // Sanitize input by removing suspicious patterns (defense-in-depth)
    static sanitize(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        let sanitized = input;

        // Remove common injection markers
        for (const pattern of this.INJECTION_PATTERNS) {
            sanitized = sanitized.replace(pattern, '');
        }

        // Remove excessive whitespace that might hide patterns
        sanitized = sanitized.replace(/\s{3,}/g, ' ');
        return sanitized.trim();
    }
}

window.PromptInjectionDetector = PromptInjectionDetector;



















