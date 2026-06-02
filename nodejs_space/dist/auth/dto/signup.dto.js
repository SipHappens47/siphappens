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
exports.SignupDto = exports.DistillerySignupData = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class DistillerySignupData {
}
exports.DistillerySignupData = DistillerySignupData;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9 Orphans Distilleries' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DistillerySignupData.prototype, "distilleryName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Western Cape', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DistillerySignupData.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'South Africa', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DistillerySignupData.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Craft distillery...', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DistillerySignupData.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'file-id-logo', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DistillerySignupData.prototype, "logo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'file-id-hero', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DistillerySignupData.prototype, "heroImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Whisky,Gin,Rum', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DistillerySignupData.prototype, "spiritTypes", void 0);
class SignupDto {
}
exports.SignupDto = SignupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SignupDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123', minLength: 8 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], SignupDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SignupDto.prototype, "ageVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-26T10:00:00Z', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "ageVerificationTimestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SignupDto.prototype, "isDistilleryAccount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: DistillerySignupData, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DistillerySignupData),
    __metadata("design:type", DistillerySignupData)
], SignupDto.prototype, "distilleryData", void 0);
//# sourceMappingURL=signup.dto.js.map