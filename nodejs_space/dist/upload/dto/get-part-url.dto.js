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
exports.GetPartUrlDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GetPartUrlDto {
}
exports.GetPartUrlDto = GetPartUrlDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uploads/1234567890-large-video.mp4' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetPartUrlDto.prototype, "cloud_storage_path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'abc123uploadid' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetPartUrlDto.prototype, "uploadId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetPartUrlDto.prototype, "partNumber", void 0);
//# sourceMappingURL=get-part-url.dto.js.map