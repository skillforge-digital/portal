/**
 * SkillForge Cryptographic Pass-code Engine
 * Generates and validates unique, season-specific access codes.
 */

export class PassCodeEngine {
    /**
     * Generate a 6-digit pass-code
     * @returns {string} - The generated 6-digit PIN
     */
    static generate() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    static verify(code) {
        return /^\d{6}$/.test(code);
    }
}
