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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSpiritDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSpiritDto {
}
exports.CreateSpiritDto = CreateSpiritDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Glenfiddich 12 Year Old' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSpiritDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-distillery-id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSpiritDto.prototype, "distilleryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Whisky', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSpiritDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Single Malt', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSpiritDto.prototype, "style", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 40.0, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSpiritDto.prototype, "abv", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Speyside', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSpiritDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cloud-storage-path/bottle.jpg', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSpiritDto.prototype, "bottleImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['uuid1', 'uuid2'], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateSpiritDto.prototype, "flavorTagIds", void 0);
//# sourceMappingURL=create-spirit.dto.js.map