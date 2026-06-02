import {  BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { FastifyRequest } from 'fastify';
import { ChangeAccountDto, CreateAdsDto, filterDto,messageDto,RepportDto,SendUpdateEmailDto,SendUpdatePhoneDto,Update2FADto,UpdateAdsDto, UpdateCompanyDto, UpdateEmailDto, UpdateNotificationsDto, UpdatePasswordDto, UpdatePhoneDto, UpdateUserDto, verifyCode } from './dto/create-user.dto';
import { JwtGuard } from './auth/guards/jwt.guard';




@Controller('user')
@UseGuards(JwtGuard)
export class userController {
  constructor(private readonly usersService: UserService) {}

  @Get('signature')
  getSignature() {
    return  this.usersService.getSignature();
  }

  @Post('createAd')
  async createAd(
    @Body() dto: CreateAdsDto,
    @Req() req: FastifyRequest,
  ) {
    const userId = +req['userid'];
    return  this.usersService.createAd(dto, userId);
  }

  @Put('updateAd/:id')
  async updateAd(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdsDto,
    @Req() req: FastifyRequest,
  ) {
    const userId = +req['userid'];
    return  this.usersService.updateAd(id, dto, userId);
  }

  @Delete('deleteAd/:id')
  async deleteAd(@Param('id', ParseIntPipe) id: number, @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return  this.usersService.deleteAd(id, userId);
  }
  @Put('renouvelerAd/:id')
  async renouvelerAd(@Param('id', ParseIntPipe) id: number, @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return  this.usersService.renouvelerAd(id, userId);
  }
  @Put('pauseAd/:id')
  async pauseAd(@Param('id', ParseIntPipe) id: number, @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return  this.usersService.pauseAd(id, userId);
  }
  @Put('playAd/:id')
  async playAd(@Param('id', ParseIntPipe) id: number, @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return  this.usersService.playAd(id, userId);
  }

  @Post('myAds')
  async getAdsByUser(@Req() req: FastifyRequest,@Body() filter:filterDto,@Query('take',ParseIntPipe) take: number, @Query('skip',ParseIntPipe) skip: number) {
    const userId = +req['userid'];
    return  this.usersService.getAdsByUserId(userId,take,skip,filter);
  }
  
  @Get('getUserType')
  async getUserType( @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return  this.usersService.getUserType(userId);
  }

  @Get('myAd/:id')
  async getAdById(@Param('id', ParseIntPipe) id: number, @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return  this.usersService.getAdById(id, userId);
  }

  @Post('follow/:id')
  async followUser(@Param('id', ParseIntPipe) followUserId: number, @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return  this.usersService.followUser(userId, followUserId);
  }

  @Delete('unfollow/:id')
  async unfollowUser(@Param('id', ParseIntPipe) followUserId: number, @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return  this.usersService.unfollowUser(userId, followUserId);
  }

  @Post('send-message')
  async sendMessage(
    @Body() body: messageDto,
    @Req() req: FastifyRequest,
  ) {
    const senderId = +req['userid'];
    if(senderId===body.reciverId)return;
    const { reciverId,adId, content } = body;
    return  this.usersService.sendMessage(senderId, reciverId,adId??null, content);
  }

  @Get('get-message')
  async getMessage(
    @Req() req: FastifyRequest,
    @Query('take',ParseIntPipe) take: number,
    @Query('skip',ParseIntPipe) skip: number,
    @Query('conversationId',ParseIntPipe) conversationId: number,
  ) {
    const userId = +req['userid'];
    return  this.usersService.getMessages(userId, conversationId,take, skip);
  }

  @Get('get-conversations')
  async getConversations(
    @Req() req: FastifyRequest,
    @Query('take',ParseIntPipe) take: number,
    @Query('skip',ParseIntPipe) skip: number,
  ) {
    const userId = +req['userid'];
    return  this.usersService.getConversations(userId,take,skip);
  }

  @Get('getOneConversation')
  async getOneConversation(
    @Req() req: FastifyRequest,
    @Query('id',ParseIntPipe) id: number,
  ) {
    const userId = +req['userid'];
    return  this.usersService.getOneConversation(userId,id);
  }

  @Get('getConversationsCount')
  async getConversationsCount(
    @Req() req: FastifyRequest,
  ) {
    const userId = +req['userid'];
    return  this.usersService.getConversationsCount(userId);
  }

  @Post('favorite/:id')
  async favoriteAd(@Param('id', ParseIntPipe) adId: number, @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return  this.usersService.favoriteAd(userId, adId);
  }

  @Delete('unfavorite/:id')
  async unfavoriteAd(@Param('id', ParseIntPipe) adId: number, @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return  this.usersService.unfavoriteAd(userId, adId);
  }
  @Get('favorites')
  async getFavoriteAds(@Req() req: FastifyRequest,@Query('take',ParseIntPipe) take: number, @Query('skip',ParseIntPipe) skip: number) { 
    const userId = +req['userid'];
    return await this.usersService.getFavoriteAds(userId,take,skip);
  }

  @Post('report-ad')
  async reportAd(
    @Body() data: RepportDto,
    @Req() req: FastifyRequest,
  ) {
    const userId = +req['userid'];
    return await this.usersService.repportAd(userId, data);
  }

  @Post('settings/change-account-securite')
  async changeAccountSecurite(@Body() body: ChangeAccountDto,@Req() req: FastifyRequest,) {
    const userId = +req['userid'];
    await this.usersService.sendAccountChangeCode(body,userId);
    return { success: true, message: 'Code de vérification envoyé pour changement de compte.' };
  }

  @Post('settings/verifyCode')
  async verifyCode(@Body() body: verifyCode) {
    return await this.usersService.verifyCode(body.email,body.input);
  }

  @Put('settings/notifications')
  async updateNotifications(
    @Req() req: FastifyRequest,
    @Body() dto: UpdateNotificationsDto,
  ) {
    const userId = +req['userid'];

    return await this.usersService.updateNotificationSettings(userId, dto);
  }

  @Put('settings/updatePassword')
  async changePassword(
    @Req() req: FastifyRequest,
    @Body() body: UpdatePasswordDto
  ) {
    const userId = +req['userid'];
    return await this.usersService.updatePassword(userId, body);
  }

  @Put('settings/updateSecurity2FASettings')
  async update2FA(
    @Req() req: FastifyRequest,
    @Body() body: Update2FADto
  ) {
    const userId = +req['userid'];
    return await this.usersService.update2FA(userId, body._2fa,body.token);
  }

  @Put('settings/sendupdateEmail')
  async sendUpdateEmail(
    @Body() body: SendUpdateEmailDto
  ) {
    return await this.usersService.sendUpdateEmail( body.email,body.token);
  }

  @Put('settings/sendUpdatePhone')
  async sendUpdatePhone(
    @Body() body: SendUpdatePhoneDto
  ) {
    return await this.usersService.sendUpdatePhone( body.phone,body.token);
  }

  @Put('settings/updateEmail')
  async UpdateEmail(
    @Req() req: FastifyRequest,
    @Body() body: UpdateEmailDto
  ) {
    const userId = +req['userid'];
    return await this.usersService.updateEmail( userId,body);
  }

  @Put('settings/UpdatePhone')
  async UpdatePhone(
    @Req() req: FastifyRequest,
    @Body() body: UpdatePhoneDto
  ) {
    const userId = +req['userid'];
    return await this.usersService.updatePhone( userId,body);
  }

  @Get("myProfileSettings")
  async getMyProfileSettings(@Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return await this.usersService.getMyProfileSettings(userId);
  }

  @Get("getProServices")
  async getProServices() {
    return await this.usersService.getProServices();
  }

  @Post("update")
  async updateProfile(@Req() req: FastifyRequest, @Body() dto: UpdateUserDto) {
    const userId = +req['userid'];
    return await this.usersService.updateProfile(userId, dto);
  }

  @Put('settings/company')
  async updateCompany(@Body() dto: UpdateCompanyDto, @Req() req: FastifyRequest) {
    const userId = +req['userid'];
    return await this.usersService.updateCompany(userId, dto);
  }

  @Put('settings/reqProCompte')
  async reqProCompte(@Req() req: FastifyRequest) {
    const userId = +req['userid'];
    const data: {
          siret: string | null,
          files: {
            //id?: { filename: string, mimetype: string, buffer: Buffer },
            // address?: { filename: string, mimetype: string, buffer: Buffer },
            kbis?: { filename: string, mimetype: string, buffer: Buffer },
            [key: string]: { filename: string, mimetype: string, buffer: Buffer } | undefined
          }
        } = {
          siret: null,
          files: {}
        };
    
        // Process multipart/form-data
        const parts = req.parts();
    
        for await (const part of parts) {
          if (part.type === 'file') {
            // Handle file part
            const buffer = await part.toBuffer();
            data.files[part.fieldname] = { // Store in data.files instead of separate variable
              filename: part.filename,
              mimetype: part.mimetype,
              buffer: buffer
            };
          } else if (part.type === 'field' && part.fieldname === 'siret') {
            // Handle JSON field
            data.siret = part.value as string;
          }
        }
    
        // Validate and parse JSON
        if (!data.siret) {
          throw new BadRequestException('Missing siret data');
        }
    
        // Check if required files exist BEFORE parsing JSON
        if ((
          // !data.files?.id || !data.files?.address || 
          !data.files?.kbis)) {
          throw new BadRequestException('Missing required files');
        }
    return await this.usersService.reqProCompte(userId, data.siret,data.files);
  }

  @Post('filters/save')
  async saveFilter(
    @Req() req: FastifyRequest,
    @Body() filter: filterDto,
    @Query('notify') notify: string
  ) {
    const userId = +req['userid'];
    return await this.usersService.saveFilter(userId, filter,(notify==='true')?true:false);
  }
  
  @Get('filters')
  async getUserFilters(
    @Req() req: FastifyRequest,
    @Query('take', ParseIntPipe) take: number,
    @Query('skip', ParseIntPipe) skip: number
  ) {
    const userId = +req['userid'];
    return await this.usersService.getUserFilters(userId, skip, take);
  }

  @Put('filters/:id/notify')
  async updateFilterNotify(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: FastifyRequest,
    @Body('notify') notify: boolean
  ) {
    const userId = +req['userid'];
    return await this.usersService.updateFilterNotify(userId, id, notify);
  }

  @Delete('filters/:id')
  async deleteFilter(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: FastifyRequest
  ) {
    const userId = +req['userid'];
    return await this.usersService.deleteFilter(userId, id);
  }
}
