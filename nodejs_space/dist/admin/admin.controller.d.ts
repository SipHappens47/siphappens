import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getUnverifiedDistilleries(req: any): Promise<{
        region: string | null;
        country: string | null;
        bio: string | null;
        logo: string | null;
        name: string;
        id: string;
        createdat: Date;
        spirittypes: string | null;
        owner: {
            email: string;
            name: string;
            id: string;
        } | null;
    }[]>;
    verifyDistillery(id: string, req: any): Promise<{
        name: string;
        id: string;
        verified: boolean;
    }>;
    rejectDistillery(id: string, req: any): Promise<{
        name: string;
        id: string;
        verified: boolean;
    }>;
}
