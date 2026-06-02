"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const Papa = require("papaparse");
let SeedService = SeedService_1 = class SeedService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SeedService_1.name);
    }
    async autoImportFromPublicDatasets() {
        this.logger.log('Starting auto-import from public datasets');
        const results = {
            connecticut: 0,
            iowa: 0,
            totalImported: 0,
            totalDuplicates: 0,
        };
        try {
            this.logger.log('Fetching Connecticut dataset...');
            const ctData = await this.fetchConnecticutData();
            const ctResult = await this.importSpirits(ctData);
            results.connecticut = ctResult.imported;
            results.totalDuplicates += ctResult.duplicates;
            this.logger.log('Fetching Iowa dataset...');
            const iowaData = await this.fetchIowaData();
            const iowaResult = await this.importSpirits(iowaData);
            results.iowa = iowaResult.imported;
            results.totalDuplicates += iowaResult.duplicates;
            results.totalImported = results.connecticut + results.iowa;
            this.logger.log(`Auto-import complete: ${results.totalImported} spirits imported, ${results.totalDuplicates} duplicates skipped`);
            return results;
        }
        catch (error) {
            this.logger.error('Auto-import error:', error?.message ?? error);
            throw error;
        }
    }
    async importFromUploadedCsv(buffer) {
        this.logger.log('Parsing uploaded CSV...');
        const csvText = buffer.toString('utf-8');
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const spirits = this.mapGenericCsvToSpirits(results.data);
                        const importResult = await this.importSpirits(spirits);
                        resolve({
                            totalImported: importResult.imported,
                            imported: importResult.imported,
                            duplicates: importResult.duplicates,
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(error);
                },
            });
        });
    }
    async fetchConnecticutData() {
        try {
            const response = await fetch('https://data.ct.gov/api/views/u6ds-fzyp/rows.csv?accessType=DOWNLOAD');
            if (!response.ok) {
                throw new Error(`Connecticut API returned ${response.status}`);
            }
            const csvText = await response.text();
            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const spirits = this.mapConnecticutData(results.data);
                        this.logger.log(`Parsed ${spirits.length} spirits from Connecticut dataset`);
                        resolve(spirits);
                    },
                    error: (error) => reject(error),
                });
            });
        }
        catch (error) {
            this.logger.error('Connecticut fetch error:', error?.message);
            throw new Error(`Failed to fetch Connecticut data: ${error?.message}`);
        }
    }
    async fetchIowaData() {
        try {
            const response = await fetch('https://data.iowa.gov/api/views/gckp-fe7r/rows.csv?accessType=DOWNLOAD');
            if (!response.ok) {
                throw new Error(`Iowa API returned ${response.status}`);
            }
            const csvText = await response.text();
            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const spirits = this.mapIowaData(results.data);
                        this.logger.log(`Parsed ${spirits.length} spirits from Iowa dataset`);
                        resolve(spirits);
                    },
                    error: (error) => reject(error),
                });
            });
        }
        catch (error) {
            this.logger.error('Iowa fetch error:', error?.message);
            throw new Error(`Failed to fetch Iowa data: ${error?.message}`);
        }
    }
    mapConnecticutData(rows) {
        const spirits = [];
        for (const row of rows) {
            const name = row['Brand Name'] || row['Brand'] || row['Item Description'];
            if (!name || name.trim() === '')
                continue;
            const category = this.extractCategory(row['Type'] || row['Category'] || '');
            const abv = this.parseABV(row['Proof'] || row['ABV'] || '');
            const cleanName = this.cleanString(name);
            if (!cleanName)
                continue;
            spirits.push({
                name: cleanName,
                distilleryName: this.cleanString(row['Vendor'] || row['Supplier'] || ''),
                category,
                style: this.cleanString(row['Style'] || ''),
                abv,
                region: this.cleanString(row['Origin'] || row['Country'] || ''),
                bottleImage: undefined,
            });
        }
        return spirits;
    }
    mapIowaData(rows) {
        const spirits = [];
        for (const row of rows) {
            const name = row['Item Description'] || row['Item'] || row['Brand Name'];
            if (!name || name.trim() === '')
                continue;
            const category = this.extractCategory(row['Category Name'] || row['Category'] || row['Type'] || '');
            const abv = this.parseABV(row['Proof'] || row['Bottle Volume (ml)'] || '');
            const cleanName = this.cleanString(name);
            if (!cleanName)
                continue;
            spirits.push({
                name: cleanName,
                distilleryName: this.cleanString(row['Vendor Name'] || row['Vendor'] || ''),
                category,
                style: this.cleanString(row['Category Name'] || ''),
                abv,
                region: '',
                bottleImage: undefined,
            });
        }
        return spirits;
    }
    mapGenericCsvToSpirits(rows) {
        const spirits = [];
        for (const row of rows) {
            const name = row['name'] || row['Name'] || row['Spirit Name'] || row['spirit_name'] ||
                row['Brand Name'] || row['brand_name'] || row['Item Description'] || row['item'];
            if (!name || name.trim() === '')
                continue;
            const category = this.extractCategory(row['category'] || row['Category'] || row['Type'] || row['type'] ||
                row['Category Name'] || row['category_name'] || '');
            const abv = this.parseABV(row['abv'] || row['ABV'] || row['Proof'] || row['proof'] ||
                row['alcohol_content'] || row['Alcohol Content'] || '');
            const cleanName = this.cleanString(name);
            if (!cleanName)
                continue;
            spirits.push({
                name: cleanName,
                distilleryName: this.cleanString(row['distillery'] || row['Distillery'] || row['distillery_name'] || row['Vendor'] ||
                    row['vendor'] || row['Supplier'] || row['Brand'] || ''),
                category,
                style: this.cleanString(row['style'] || row['Style'] || row['Sub-Category'] || row['subcategory'] || ''),
                abv,
                region: this.cleanString(row['region'] || row['Region'] || row['Country'] || row['country'] ||
                    row['Origin'] || row['origin'] || ''),
                bottleImage: undefined,
            });
        }
        return spirits;
    }
    async importSpirits(spirits) {
        let imported = 0;
        let duplicates = 0;
        for (const spirit of spirits) {
            try {
                const existing = await this.prisma.spirit.findFirst({
                    where: { name: { equals: spirit.name, mode: 'insensitive' } },
                });
                if (existing) {
                    duplicates++;
                    continue;
                }
                let distilleryId;
                if (spirit.distilleryName && spirit.distilleryName.trim() !== '') {
                    let distillery = await this.prisma.distillery.findFirst({
                        where: { name: spirit.distilleryName },
                    });
                    if (!distillery) {
                        distillery = await this.prisma.distillery.create({
                            data: {
                                name: spirit.distilleryName,
                                country: spirit.region,
                                isclaimed: false,
                            },
                        });
                    }
                    distilleryId = distillery.id;
                }
                await this.prisma.spirit.create({
                    data: {
                        name: spirit.name,
                        distilleryid: distilleryId,
                        category: spirit.category,
                        style: spirit.style,
                        abv: spirit.abv ? spirit.abv.toString() : null,
                        region: spirit.region,
                        bottleimage: spirit.bottleImage,
                    },
                });
                imported++;
                if (imported % 100 === 0) {
                    this.logger.log(`Imported ${imported} spirits so far...`);
                }
            }
            catch (error) {
                this.logger.warn(`Failed to import spirit ${spirit.name}:`, error?.message);
            }
        }
        return { imported, duplicates };
    }
    extractCategory(input) {
        if (!input || input.trim() === '')
            return undefined;
        const normalized = input.toLowerCase();
        if (normalized.includes('whiskey') || normalized.includes('whisky') || normalized.includes('bourbon') || normalized.includes('scotch') || normalized.includes('rye')) {
            return 'Whiskey';
        }
        if (normalized.includes('vodka'))
            return 'Vodka';
        if (normalized.includes('gin'))
            return 'Gin';
        if (normalized.includes('rum'))
            return 'Rum';
        if (normalized.includes('tequila'))
            return 'Tequila';
        if (normalized.includes('mezcal'))
            return 'Mezcal';
        if (normalized.includes('brandy') || normalized.includes('cognac'))
            return 'Brandy';
        if (normalized.includes('liqueur'))
            return 'Liqueur';
        if (normalized.includes('amaro') || normalized.includes('bitter'))
            return 'Amaro';
        return this.cleanString(input);
    }
    parseABV(input) {
        if (!input || input.trim() === '')
            return undefined;
        const match = input.match(/([0-9]+\.?[0-9]*)/);
        if (!match)
            return undefined;
        let value = parseFloat(match[1]);
        if (input.toLowerCase().includes('proof') || value > 100) {
            value = value / 2;
        }
        return value > 0 && value <= 100 ? value : undefined;
    }
    cleanString(input) {
        if (!input || input.trim() === '')
            return undefined;
        return input.trim();
    }
    async getDatabaseStats() {
        const totalSpirits = await this.prisma.spirit.count();
        const totalDistilleries = await this.prisma.distillery.count();
        const spiritsWithImages = await this.prisma.spirit.count({
            where: { bottleimage: { not: null } },
        });
        return {
            totalSpirits,
            totalDistilleries,
            spiritsWithImages,
            spiritsWithoutImages: totalSpirits - spiritsWithImages,
        };
    }
    async seedTestDistilleries() {
        const { seedTestDistilleries } = await Promise.resolve().then(() => require('../distilleries/seed-test-distilleries'));
        const count = await seedTestDistilleries();
        return { count };
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SeedService);
//# sourceMappingURL=seed.service.js.map