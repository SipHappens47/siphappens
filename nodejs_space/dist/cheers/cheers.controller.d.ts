import { CheersService } from './cheers.service';
export declare class CheersController {
    private cheersService;
    constructor(cheersService: CheersService);
    addCheer(req: any, pourId: string): Promise<{
        id: string;
        createdAt: Date;
    }>;
    removeCheer(req: any, pourId: string): Promise<{
        message: string;
    }>;
}
