/**
 * SkillForge Staff Seed Data
 * This file contains the pre-generated role codes and their associated cumulative roles.
 * Use this to populate the 'role_codes' collection in Firestore.
 */

export const STAFF_SEED_DATA = [
    // Executive Directors
    {
        code: "SKF-DIR-1010",
        name: "Blessing Emmanuel . E",
        position: "Managing Director / Discord Dev Specialist (Dev & Tech Unit)",
        roles: ["Director", "Specialist"],
        used: false
    },
    {
        code: "SKF-DIR-1020",
        name: "Innocent Oluwaseun",
        position: "Business & Development Director / HOU (Digital Innovation Unit)",
        roles: ["Director", "Specialist", "HOD"],
        used: false
    },
    {
        code: "SKF-DIR-2026-FINAL",
        name: "Executive Director",
        position: "Master Command Director",
        roles: ["Director"],
        used: false
    },

    // Digital Innovation Unit
    {
        code: "SKF-DMT-214",
        name: "Ogunsola Iyanuoluwa",
        position: "Social Media Handler (Digital Innovation Unit)",
        roles: ["Digital Marketing"],
        used: false
    },
    {
        code: "SKF-DMT-221",
        name: "Richard Famuyiwa O",
        position: "Social Media Handler (Digital Innovation Unit)",
        roles: ["Digital Marketing"],
        used: false
    },
    {
        code: "SKF-DMT-233",
        name: "Aina Samuel . O",
        position: "A.I Content Generation (Digital Innovation Unit)",
        roles: ["Digital Marketing"],
        used: false
    },
    {
        code: "SKF-DMT-241",
        name: "Faith Eniola",
        position: "Social Media & Global Support (Digital Innovation Unit)",
        roles: ["Digital Marketing"],
        used: false
    },

    // Development & Tech Unit
    {
        code: "SKF-HSPEC-514",
        name: "Emmanuel Umoh",
        position: "Website Dev & Design / HOU (Dev & Tech Unit)",
        roles: ["HOD", "Specialist"],
        used: false
    },
    {
        code: "SKF-SPEC-521",
        name: "Gbonjubola Olatoye",
        position: "Discord Dev & Community Manager (Dev & Tech Unit)",
        roles: ["Specialist", "Community Manager"],
        used: false
    },
    {
        code: "SKF-SPEC-528",
        name: "Gabriel Odusanya",
        position: "Cybersecurity (Dev & Tech Unit)",
        roles: ["Specialist"],
        used: false
    },

    // Creative Media Unit
    {
        code: "SKF-SPEC-542",
        name: "Excellent J Akinwumi",
        position: "Graphic Design (Creative Media Unit)",
        roles: ["Specialist"],
        used: false
    },

    // Trading Unit
    {
        code: "SKF-SPEC-549",
        name: "O J . Alonge",
        position: "Founder & CEO / Synthetic Indices (Trading Unit)",
        roles: ["Director", "Specialist"],
        used: false
    },
    {
        code: "SKF-HSPEC-556",
        name: "T. G Adeyeri",
        position: "Chief Trading Officer (CTO) / HOU (Trading Unit)",
        roles: ["Director", "HOD", "Specialist"],
        used: false
    },

    // Support & Community
    {
        code: "SKF-SPEC-535",
        name: "Eziukwu Perpetual N",
        position: "A.I Creation & Support Team",
        roles: ["Specialist", "Support Team"],
        used: false
    },
    {
        code: "SKF-CM-888",
        name: "Ajayi Opemipo",
        position: "Community Manager",
        roles: ["Community Manager", "Support Team"],
        used: false
    }
];
