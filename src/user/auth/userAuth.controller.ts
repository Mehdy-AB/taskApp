import { BadRequestException, Body, ConflictException, Controller, Get, HttpException, HttpStatus, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserAuthService } from './userAuth.service';
import { SendCodeDto, AuthDtoEmail, AuthDto, AuthDtoPhone, verifyCodeDto, UserDto, SendCodeDtoPhone, verifyCodeDtoPhone, reqRestPassword, restPassword } from './dto/create-auth.dto';
import { JwtRefreshGuard } from './guards/refresh.guard';
import { FastifyRequest } from 'fastify';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';


@Controller('user/auth')
export class UserAuthController {
  constructor(private readonly authService: UserAuthService) {}

  @Post('reqRestPassword')
  reqRestPassword(@Body() dto: reqRestPassword) {
    try{
      return this.authService.reqRestPassword(dto);
    }
    catch(e){
      throw new ConflictException(e.message);}
  }

  @Post('restPassword')
  restPassword(@Body() dto: restPassword) {
    try{
      return this.authService.restPassword(dto);
    }
    catch(e){
      throw new ConflictException(e.message);}
  }

  @Get('siret')
  async lookupSiret(@Query('siret') siret: string) {
    if (!siret || siret.length !== 14) {
      throw new HttpException('Invalid SIRET format', HttpStatus.BAD_REQUEST);
    }
    try {
      //if(!(await this.authService.checkCompany(siret)))throw new Error()
      const res = await fetch(`https://data.siren-api.fr/v3/etablissements/${siret}`, {
        headers: {
          'X-Client-Secret': process.env.SIREN_API_KEY,
        },
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = (await res.json()).etablissement;
      if (!data) {
        throw new NotFoundException();
      }
      return {
        nom:data.unite_legale.denomination,
        siret: data.siret,
        siren: data.siren,
        date_creation: data.date_creation,
        etat_administratif: data.etat_administratif,
        activite_principale: data.activite_principale,
        adresse: `${data.numero_voie ?? ''} ${data.type_voie ?? ''} ${data.libelle_voie ?? ''}, ${data.code_postal ?? ''} ${data.libelle_commune ?? ''}`.trim(),
      };
    } catch (err) {
      throw new HttpException('Erreur lors de la validation du SIRET ou API injoignable', HttpStatus.BAD_REQUEST);
    }
  }
  
  @Post('register')
  async create(@Req() req: FastifyRequest){
    const data: {
      json: string | null,
      files: {
        //id?: { filename: string, mimetype: string, buffer: Buffer },
        // address?: { filename: string, mimetype: string, buffer: Buffer },
        kbis?: { filename: string, mimetype: string, buffer: Buffer },
        [key: string]: { filename: string, mimetype: string, buffer: Buffer } | undefined
      }
    } = {
      json: null,
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
      } else if (part.type === 'field' && part.fieldname === 'data') {
        // Handle JSON field
        data.json = part.value as string;
      }
    }

    // Validate and parse JSON
    if (!data.json) {
      throw new BadRequestException('Missing JSON data');
    }

    let jsonData;
    try {
      jsonData = JSON.parse(data.json);
    } catch (e) {
      throw new BadRequestException('Invalid JSON format');
    }

    const dto = plainToInstance(UserDto, jsonData);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new BadRequestException(errors); // Return validation errors
    }

    // Check if required files exist BEFORE parsing JSON
    if ((
      // !data.files?.id || !data.files?.address || 
      !data.files?.kbis)&&dto.userType==='PROFESSIONAL') {
      throw new BadRequestException('Missing required files');
    }

    try{
      return this.authService.createUser(dto,data.files);}
    catch(e){
      throw new ConflictException(e.message);
    }
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@Req() request: any){
    const pyload = request.headers['pyload'];
   
    if (!pyload) throw new ConflictException('Missing token');
    try{
    const resp  =  this.authService.refreshToken(pyload);
    return resp;}
    catch(e){
      throw new ConflictException(e.message);
    }
  }
  
  @Post('email-code')
  sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendVerificationCode(dto.email);
  }

  @Post('send-phone-code')
  sendCodePhone(@Body() dto: SendCodeDtoPhone) {
    return this.authService.sendVerificationCodePhone(dto.phone);
  }

  @Post('verify-phone-code')
  verifyCodePhone(@Body() dto: verifyCodeDtoPhone) {
    try{
      return this.authService.verifyCode(dto.phone, dto.code,'registerPhone');
    }
    catch(e){
      throw new ConflictException(e.message);}
  }

  @Post('verify-email-code')
  verifyCode(@Body() dto: verifyCodeDto) {
    try{
      return this.authService.verifyCode(dto.email, dto.code,'registerEmail');
    }
    catch(e){
      throw new ConflictException(e.message);}
  }
  
  @Post('loginWithEmail')
  login(@Body() loginDto: AuthDtoEmail){
    try{
      return this.authService.loginWithEmail(loginDto);
    }
    catch(e){
      throw new ConflictException(e.message);}
    }

  // @Post('loginWithUserName')
  // loginWithUserName(@Body() loginDto: AuthDto){
  //   try{
  //     return this.authService.loginWithUserName(loginDto);
  //   }
  //   catch(e){
  //     throw new ConflictException(e.message);}
  // }

  @Post('loginWithPhone')
  loginWithPhone(@Body() loginDto: AuthDtoPhone){
    try{
      return this.authService.loginWithPhone(loginDto);
    }
    catch(e){
      throw new ConflictException(e.message);}
  }
}
