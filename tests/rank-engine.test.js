import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js', () => ({
  onAuthStateChanged: vi.fn(),
  signInAnonymously: vi.fn(),
}));

vi.mock('https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  increment: vi.fn(),
  serverTimestamp: vi.fn(),
  addDoc: vi.fn(),
  collection: vi.fn(),
}));

// Mock BroadcastChannel
global.BroadcastChannel = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  onmessage: vi.fn(),
  close: vi.fn(),
}));

describe('RankEngine Progression Logic', () => {
  let traineeData;
  let trackingData;

  beforeEach(() => {
    traineeData = {
      level: 0,
      onboardingComplete: true,
      completedLessons: [],
      examScores: {},
      averageScore: 0
    };
    trackingData = {
      academyLoginDays: 1
    };
  });

  // Helper to simulate the logic from initRankEngine
  const calculateNextLevel = (trainee, tracking) => {
    const currentLevel = trainee.level || 0;
    const loginDays = tracking.academyLoginDays || 0;
    const examScores = trainee.examScores || {};
    const avgScore = trainee.averageScore || 0;

    if (currentLevel === 0 && trainee.onboardingComplete && loginDays >= 1) return 1;
    if (currentLevel === 1 && (examScores.module1 || 0) >= 70) return 2;
    if (currentLevel === 2 && avgScore >= 80 && loginDays >= 7) return 3;
    if (currentLevel === 3 && avgScore >= 90 && loginDays >= 30) return 4;
    if (currentLevel === 4 && avgScore >= 95 && loginDays >= 90) return 5;
    return currentLevel;
  };

  it('should promote Tier 0 to Tier 1 when onboarding is complete and 1 day login', () => {
    expect(calculateNextLevel(traineeData, trackingData)).toBe(1);
  });

  it('should not promote Tier 0 if onboarding is incomplete', () => {
    traineeData.onboardingComplete = false;
    expect(calculateNextLevel(traineeData, trackingData)).toBe(0);
  });

  it('should promote Tier 1 to Tier 2 when Module 1 exam score >= 70', () => {
    traineeData.level = 1;
    traineeData.examScores.module1 = 75;
    expect(calculateNextLevel(traineeData, trackingData)).toBe(2);
  });

  it('should promote Tier 2 to Tier 3 when Avg >= 80 and 7 days login', () => {
    traineeData.level = 2;
    traineeData.averageScore = 85;
    trackingData.academyLoginDays = 8;
    expect(calculateNextLevel(traineeData, trackingData)).toBe(3);
  });

  it('should not level hop', () => {
    traineeData.level = 0;
    traineeData.averageScore = 100;
    trackingData.academyLoginDays = 100;
    // Should still only go to Tier 1 because currentLevel check prevents hopping in one pass
    expect(calculateNextLevel(traineeData, trackingData)).toBe(1);
  });
});