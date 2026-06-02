export declare class DistillerySignupData {
    distilleryName: string;
    region?: string;
    country?: string;
    bio?: string;
    logo?: string;
    heroImage?: string;
    spiritTypes?: string;
}
export declare class SignupDto {
    email: string;
    password: string;
    name: string;
    ageVerified: boolean;
    ageVerificationTimestamp?: string;
    isDistilleryAccount?: boolean;
    distilleryData?: DistillerySignupData;
}
