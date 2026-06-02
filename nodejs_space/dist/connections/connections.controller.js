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
exports.ConnectionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const connections_service_1 = require("./connections.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const send_connection_request_dto_1 = require("./dto/send-connection-request.dto");
let ConnectionsController = class ConnectionsController {
    constructor(connectionsService) {
        this.connectionsService = connectionsService;
    }
    async searchUsers(req, query) {
        return this.connectionsService.searchUsers(req.user.userId, query);
    }
    async sendRequest(req, dto) {
        return this.connectionsService.sendConnectionRequest(req.user.userId, dto.receiverEmail);
    }
    async sendRequestById(req, userId) {
        return this.connectionsService.sendConnectionRequestById(req.user.userId, userId);
    }
    async acceptRequest(req, connectionId) {
        return this.connectionsService.acceptConnectionRequest(req.user.userId, connectionId);
    }
    async removeConnection(req, connectionId) {
        return this.connectionsService.rejectConnectionRequest(req.user.userId, connectionId);
    }
    async getPendingRequests(req) {
        return this.connectionsService.getPendingRequests(req.user.userId);
    }
    async getConnections(req) {
        return this.connectionsService.getConnections(req.user.userId);
    }
    async muteConnection(req, userId) {
        return this.connectionsService.muteConnection(req.user.userId, userId);
    }
    async unmuteConnection(req, userId) {
        return this.connectionsService.unmuteConnection(req.user.userId, userId);
    }
    async getMuteStatus(req, userId) {
        const isMuted = await this.connectionsService.getMuteStatus(req.user.userId, userId);
        return { isMuted };
    }
};
exports.ConnectionsController = ConnectionsController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search users by name or email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of users matching search query' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Post)('send'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a connection request to another user by name or email' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Connection request sent' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_connection_request_dto_1.SendConnectionRequestDto]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "sendRequest", null);
__decorate([
    (0, common_1.Post)('send/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a connection request to another user by ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Connection request sent' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "sendRequestById", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept a connection request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Connection accepted' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "acceptRequest", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject or remove a connection' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Connection removed' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "removeConnection", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending connection requests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of pending requests' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all accepted connections (Fellow Sippers)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of connections' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getConnections", null);
__decorate([
    (0, common_1.Post)('mute/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Mute a connection (hide their posts from your feed)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Connection muted' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "muteConnection", null);
__decorate([
    (0, common_1.Post)('unmute/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Unmute a connection (show their posts in your feed again)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Connection unmuted' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "unmuteConnection", null);
__decorate([
    (0, common_1.Get)('mute-status/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get mute status for a specific user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mute status retrieved' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getMuteStatus", null);
exports.ConnectionsController = ConnectionsController = __decorate([
    (0, swagger_1.ApiTags)('Connections'),
    (0, common_1.Controller)('api/connections'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [connections_service_1.ConnectionsService])
], ConnectionsController);
//# sourceMappingURL=connections.controller.js.map