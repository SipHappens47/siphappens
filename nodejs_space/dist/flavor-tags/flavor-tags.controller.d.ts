import { FlavorTagsService } from './flavor-tags.service';
export declare class FlavorTagsController {
    private flavorTagsService;
    constructor(flavorTagsService: FlavorTagsService);
    getAllFlavorTags(): Promise<{
        name: string;
        id: string;
    }[]>;
}
