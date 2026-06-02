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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const upload_service_1 = require("./upload.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const presigned_upload_dto_1 = require("./dto/presigned-upload.dto");
const complete_upload_dto_1 = require("./dto/complete-upload.dto");
const initiate_multipart_dto_1 = require("./dto/initiate-multipart.dto");
const get_part_url_dto_1 = require("./dto/get-part-url.dto");
const complete_multipart_dto_1 = require("./dto/complete-multipart.dto");
let UploadController = class UploadController {
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    async getPresignedUrl(req, dto) {
        try {
            console.log('Controller: Received presigned URL request, userId:', req?.user?.userId, 'dto:', dto);
            const result = await this.uploadService.generatePresignedUrl(req.user.userId, dto);
            console.log('Controller: Presigned URL generated successfully');
            return result;
        }
        catch (error) {
            console.error('Controller: Error generating presigned URL:', error);
            throw error;
        }
    }
    async completeUpload(req, dto) {
        return this.uploadService.completeUpload(req.user.userId, dto);
    }
    async initiateMultipart(req, dto) {
        return this.uploadService.initiateMultipart(req.user.userId, dto);
    }
    async getPartUrl(req, dto) {
        return this.uploadService.getPartUrl(req.user.userId, dto);
    }
    async completeMultipart(req, dto) {
        return this.uploadService.completeMultipart(req.user.userId, dto);
    }
    async getFileUrl(req, id, mode = 'view') {
        return this.uploadService.getFileUrl(req.user.userId, id, mode);
    }
    async deleteFile(req, id) {
        return this.uploadService.deleteFile(req.user.userId, id);
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('presigned'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate presigned URL for single-part upload (<= 100MB)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Presigned URL generated' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, presigned_upload_dto_1.PresignedUploadDto]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getPresignedUrl", null);
__decorate([
    (0, common_1.Post)('complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete upload and save file metadata to database' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'File upload completed' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, complete_upload_dto_1.CompleteUploadDto]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "completeUpload", null);
__decorate([
    (0, common_1.Post)('multipart/initiate'),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate multipart upload (>100MB)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Multipart upload initiated' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, initiate_multipart_dto_1.InitiateMultipartDto]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "initiateMultipart", null);
__decorate([
    (0, common_1.Post)('multipart/part'),
    (0, swagger_1.ApiOperation)({ summary: 'Get presigned URL for uploading a part' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Presigned URL for part generated' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_part_url_dto_1.GetPartUrlDto]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getPartUrl", null);
__decorate([
    (0, common_1.Post)('multipart/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete multipart upload' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Multipart upload completed' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, complete_multipart_dto_1.CompleteMultipartDto]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "completeMultipart", null);
__decorate([
    (0, common_1.Get)('files/:id/url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get file URL (public or signed)' }),
    (0, swagger_1.ApiQuery)({ name: 'mode', enum: ['view', 'download'], required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File URL retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('mode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getFileUrl", null);
__decorate([
    (0, common_1.Delete)('files/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete file from S3 and database' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File deleted' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "deleteFile", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('File Upload'),
    (0, common_1.Controller)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map