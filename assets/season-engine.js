/**
 * SkillForge Season Transition Engine (v1.0.0)
 * Handles archiving of trainee generations and season resets.
 */

import { db } from './firebase-config.js';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, serverTimestamp, query, where } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';

export class SeasonEngine {
    constructor(directorUid) {
        this.directorUid = directorUid;
    }

    /**
     * Archives the current season and prepares for a new one.
     * @param {string} seasonName e.g., "Season 2026-A"
     */
    async startNewSeason(seasonName) {
        void(`[SeasonEngine] Initiating transition to: ${seasonName}`);
        
        try {
            // 1. Snapshot the current trainee registry
            const traineesSnap = await getDocs(collection(db, 'trainees'));
            const archiveId = `archive_${Date.now()}`;
            
            const batch = writeBatch(db);
            
            // 2. Move data to archive collection
            for (const traineeDoc of traineesSnap.docs) {
                const data = traineeDoc.data();
                // Store in archive
                const archiveRef = doc(db, 'seasons', seasonName, 'trainees', traineeDoc.id);
                batch.set(archiveRef, {
                    ...data,
                    archived_at: serverTimestamp()
                });

                // 3. Prepare trainee for new season
                // We DON'T delete them (continuity), we just reset season-specific flags
                const traineeRef = doc(db, 'trainees', traineeDoc.id);
                batch.update(traineeRef, {
                    lastSeason: seasonName,
                    currentSeason: null, // Reset for new registration
                    track: 'Alumni', // Move to Alumni status until re-registered
                    status: 'graduated',
                    registryUpdated: serverTimestamp()
                });
            }

            // 4. Update System Config
            const configRef = doc(db, 'system', 'config');
            batch.set(configRef, {
                activeSeason: seasonName,
                registrationOpen: true,
                reg_start: serverTimestamp(),
                reg_end: null, // Director will set this manually
                updatedBy: this.directorUid,
                lastTransition: serverTimestamp()
            }, { merge: true });

            await batch.commit();
            void("[SeasonEngine] Season transition successful.");
            return { success: true, archived: traineesSnap.size };
        } catch (err) {
            void("[SeasonEngine] Transition failed:", err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Updates registration dates on the landing page.
     */
    async updateRegistrationDates(startDate, endDate) {
        const configRef = doc(db, 'system', 'config');
        await setDoc(configRef, {
            reg_start: startDate,
            reg_end: endDate
        }, { merge: true });
    }
}
