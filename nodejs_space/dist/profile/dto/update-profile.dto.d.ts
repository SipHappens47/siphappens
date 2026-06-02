declare enum ExperienceLevel {
    Curious = "Curious",
    Social = "Social",
    Serious = "Serious"
}
export declare class UpdateProfileDto {
    name?: string;
    profilePhoto?: string;
    bio?: string;
    experienceLevel?: ExperienceLevel;
}
export {};
