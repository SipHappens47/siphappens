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
exports.CompleteMultipartDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class PartInfo {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '"abc123etag"' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PartInfo.prototype, "ETag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PartInfo.prototype, "PartNumber", void 0);
class CompleteMultipartDto {
}
exports.CompleteMultipartDto = CompleteMultipartDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uploads/1234567890-large-video.mp4' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteMultipartDto.prototype, "cloud_storage_path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'abc123uploadid' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteMultipartDto.prototype, "uploadId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PartInfo] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PartInfo),
    __metadata("design:type", Array)
], CompleteMultipartDto.prototype, "parts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'large-video.mp4' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteMultipartDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'video/mp4' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteMultipartDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 104857600 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CompleteMultipartDto.prototype, "fileSize", void 0);
//# sourceMappingURL=complete-multipart.dto.js.map