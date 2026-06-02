import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { AuthDtoEmail,AuthDtoPhone,AuthDto, UserDto, reqRestPassword, restPassword } from './dto/create-auth.dto';
import { hash } from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { isEmail } from 'class-validator';
import * as fs from 'fs';
import * as path from 'path';
  type myFile={
            filename: string;
            mimetype: string;
            buffer: Buffer;
  }
@Injectable()
export class UserAuthService {
  constructor( private jwt: JwtService,private prisma :PrismaService) {}
  private readonly ERROR_MESSAGES = {
    INVALID_CREDENTIALS: 'Identifiants invalides',
    EMAIL_IN_USE: 'Cet email est déjà utilisé',
    PHONE_IN_USE: 'Ce numéro de téléphone est déjà utilisé',
    COMPANY_IN_USE: 'Cette entreprise est déjà enregistrée',
    VERIFICATION_CODE_EXPIRED: 'Le code de vérification a expiré',
    VERIFICATION_CODE_NOT_FOUND: 'Aucun code de vérification trouvé pour cet email',
    TOKEN_EXPIRED: 'Le jeton a expiré',
    INVALID_EMAIL: 'Email invalide',
    INVALID_PHONE: 'Numéro de téléphone invalide',
    COMPANY_INVALID: 'Informations entreprise invalides',
    USERNAME_REQUIRED: 'Un nom d\'utilisateur est requis',
    FAILED_SEND_CODE: 'Échec de l\'envoi du code de vérification',
    FAILED_VERIFY_CODE: 'Échec de la vérification du code',
    FAILED_CREATE_USER: 'Échec de la création de l\'utilisateur',
    WAIT_BEFORE_NEW_CODE: 'Veuillez patienter avant de demander un nouveau code'
  };

  private loadTemplate(filename: string): string {
      const filePath = path.join(process.cwd(), 'src', 'templates', filename);
      return fs.readFileSync(filePath, { encoding: 'utf-8' });
  }

  private async sendRawEmail(to: string, subject: string, htmlBody: string) {
    const oAuth2Client = await this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
    // Construction de l’enveloppe MIME avec en-têtes + corps HTML
    const mimeLines = [
      `From: "Votre App" <${process.env.GMAIL_SENDER}>`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      htmlBody,
    ];
    const mimeMessage = mimeLines.join('\r\n');

    // Encodage base64url (= Base64 + remplacements + suppression des '=' finaux)
    const encodedMessage = Buffer.from(mimeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
    } catch (error) {
      console.error('Erreur lors de l’envoi d’email :', error);
      throw new ConflictException('Une erreur est survenue lors de l’envoi de l’email');
    }
  }

  private async sendVerificationEmail(recipientEmail: string, code: string) {
    // Charge et remplace le placeholder {{CODE}} dans le template
    let htmlTemplate = this.loadTemplate('verification-email.html');
    htmlTemplate = htmlTemplate.replace(/{{CODE}}/g, code);
    htmlTemplate = htmlTemplate.replace(/{{FRONTEND_LINK}}/g, process.env.FRONT_END_URL);
    const subject = 'Vérification de votre adresse email';
    await this.sendRawEmail(recipientEmail, subject, htmlTemplate);
  }

  async reqRestPassword(data:reqRestPassword){
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new BadRequestException(this.ERROR_MESSAGES.INVALID_EMAIL);
    }
    try {
      // Check if there is a recent reset token for this email (not expired)
      const existingReq = await this.prisma.reqRestPassword.findUnique({
      where: { email: data.email },
      });

      let token: string;
      const now = new Date();

      if (
      existingReq &&
      existingReq.token &&
      existingReq.createdAt &&
      (now.getTime() - new Date(existingReq.createdAt).getTime()) / 1000 < 1800 // 30 min
      ) {
      // Reuse the same token if not expired
      token = existingReq.token;
      } else {
      // Generate new token and save it
      token = await this.jwt.signAsync(
        { userId: user.id, email: user.email },
        {
        expiresIn: '1h',
        secret: process.env.JWT_SECRET_RESET_PASSWORD,
        }
      );
      await this.prisma.reqRestPassword.upsert({
        where: { email: user.email },
        update: { token },
        create: { email: user.email, token },
      });
      }

      let htmlTemplate = this.loadTemplate('reqRestPassword.html');
      htmlTemplate = htmlTemplate.replace(
      /{{RESET_LINK}}/g,
      `${process.env.FRONT_END_URL}/api/auth/reset-password?token=${token}`
      );
      htmlTemplate = htmlTemplate.replace(/{{FRONTEND_LINK}}/g, process.env.FRONT_END_URL);

      const subject = 'Vérification de votre adresse email';
      await this.sendRawEmail(data.email, subject, htmlTemplate);
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation du mot de passe :', error);
      throw new BadRequestException("Erreur lors de l'envoi de l'email de réinitialisation");
    }
  }

  async restPassword(data:restPassword){
    const { token, password } = data;

    // Verify the reset token
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(token, {
      secret: process.env.JWT_SECRET_RESET_PASSWORD,
      });
      // Check if token is expired
      const decoded: any = await this.jwt.decode(token);
      if (!decoded || decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error(this.ERROR_MESSAGES.TOKEN_EXPIRED+'dd');
      }
    } catch (error) {
     
      throw new BadRequestException(this.ERROR_MESSAGES.TOKEN_EXPIRED);
    }

    // Find the reset request in DB
    const resetReq = await this.prisma.reqRestPassword.findUnique({
      where: { email: payload.email },
    });
    if (!resetReq) {
      throw new BadRequestException(this.ERROR_MESSAGES.TOKEN_EXPIRED);
    }

    // Update user password
    const hashedPassword = await hash(password, 10);
    await this.prisma.user.update({
      where: { email: payload.email },
      data: {
        password: hashedPassword,
        passwordVersion: new Date(),
      },
    });

    // Delete the reset token from DB
    await this.prisma.reqRestPassword.deleteMany({
      where: { email: payload.email },
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }
  
  // async loginWithUserName(dto: AuthDto) {
  //   try {
  //     const user = await this.findUserByUserName(dto.identifier);
  //     if (!(user && await compare(dto.password, user.password))) {
  //       throw new UnauthorizedException(this.ERROR_MESSAGES.INVALID_CREDENTIALS);
  //     }

  //     const { password,passwordVersion,email, ...userInfo } = user;

  //     const payload = {
  //       id: user.id,
  //       username: user.username,
  //       email: user.email,
  //       passwordversion: passwordVersion,
  //     };

  //     return {
  //       user: userInfo,
  //       backendToken: {
  //         accessToken: await this.jwt.signAsync(payload, {
  //           expiresIn: '60d',
  //           secret: process.env.JWT_SECRET_ACCESS,
  //         }),
  //         refreshToken: await this.jwt.signAsync(payload, {
  //           expiresIn: '60d',
  //           secret: process.env.JWT_SECRET_REFRESH,
  //         }),
  //       },
  //     };
  //   } catch (error) {
  //     throw new UnauthorizedException(
  //       error.message || this.ERROR_MESSAGES.INVALID_CREDENTIALS
  //     );
  //   }
  // }

  // async checkUserName(username: string) {
  //   try {
  //     const user = await this.findUserByUserName(username);
  //     return !user;
  //   } catch (error) {
  //     return true;
  //   }
  // }

  // async checkCompany(siret: string) {
  //   try {
  //     const company = await this.prisma.company.findUnique({where:{siret}});
  //     return !company;
  //   } catch (error) {
  //     return true;
  //   }
  // }

  async loginWithEmail(dto: AuthDtoEmail) {
    try {
      const user = await this.findUserByEmail(dto.identifier);

      if (!(user && await compare(dto.password, user.password))) {
        throw new UnauthorizedException(this.ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const { password,passwordVersion,email, ...userInfo } = user;

      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordversion: user.passwordVersion,
      };

      return {
        user: userInfo,
        backendToken: {
          accessToken: await this.jwt.signAsync(payload, {
            expiresIn: '60d',
            secret: process.env.JWT_SECRET_ACCESS,
          }),
          refreshToken: await this.jwt.signAsync(payload, {
            expiresIn: '60d',
            secret: process.env.JWT_SECRET_REFRESH,
          }),
        },
      };
    } catch (error) {
      throw new UnauthorizedException(
        error.message || this.ERROR_MESSAGES.INVALID_CREDENTIALS
      );
    }
  }

  async loginWithPhone(dto: AuthDtoPhone) {
    try {
      const user = await this.findUserByPhone(dto.identifier);

      if (!(user && await compare(dto.password, user.password))) {
        throw new UnauthorizedException(this.ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const { password,passwordVersion,email, ...userInfo } = user;

      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordversion: passwordVersion,
      };

      return {
        user: userInfo,
        backendToken: {
          accessToken: await this.jwt.signAsync(payload, {
            expiresIn: '60d',
            secret: process.env.JWT_SECRET_ACCESS,
          }),
          refreshToken: await this.jwt.signAsync(payload, {
            expiresIn: '60d',
            secret: process.env.JWT_SECRET_REFRESH,
          }),
        },
      };
    } catch (error) {
      throw new UnauthorizedException(
        error.message || this.ERROR_MESSAGES.INVALID_CREDENTIALS
      );
    }
  }
  
  async refreshToken(oldpayload: any) {
    const payload = {
      id: oldpayload.id,
      username: oldpayload.username,
      email: oldpayload.email,
      passwordversion: oldpayload.passwordversion,
    };

    return {
      accessToken: await this.jwt.signAsync(payload, {
        expiresIn: '60d',
        secret: process.env.JWT_SECRET_ACCESS,
      }),
      refreshToken: await this.jwt.signAsync(payload, {
        expiresIn: '60d',
        secret: process.env.JWT_SECRET_REFRESH,
      }),
    };
  }
  
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  }

  private async getOAuth2Client() {
    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground',
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    return oAuth2Client;
  }

  // Store the code in the database with expiration time (5 minutes)
  private async storeVerificationCode(email: string, code: string,type:'registerEmail'|'registerPhone') {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5); // Code expires after 5 minutes

    await this.prisma.verificationCode.upsert({
      create: {
        email,
        code,
        type:type,
        expiresAt: expirationTime,
      },
      update: {
        code,
        expiresAt: expirationTime,
      },
      where: {
        email_type_code:{email,type,code}
      },
    });
  }

   private async sendVerificationPhone(phone: string, code: string) {
    try {
      return;
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  // Main method to generate code, store it, and send email
  async sendVerificationCode(email: string) {
    try {
      const existingEmail= await this.prisma.user.findUnique({
        where: { email },
        select:{username:true}
      });

      if (existingEmail) {
        throw new BadRequestException(this.ERROR_MESSAGES.EMAIL_IN_USE);
      }
      const existingCode= await this.prisma.verificationCode.findFirst({
        where: { email,type:'registerEmail' },
        select:{createdAt:true}
      });

      if (existingCode?.createdAt) {
        const min = 15; 
        const now = new Date();
        const createdAt = new Date(existingCode.createdAt);
        const diffInSeconds = (now.getTime() - createdAt.getTime()) / 1000;
        if (diffInSeconds  < min) {
          return { message: this.ERROR_MESSAGES.WAIT_BEFORE_NEW_CODE };
        }
      }

      const code = this.generateCode();
      await this.storeVerificationCode(email, code,'registerEmail');
      await this.sendVerificationEmail(email, code);
      return { message: 'Verification code sent to your phone' };
    }catch (error) {
      console.error(this.ERROR_MESSAGES.FAILED_SEND_CODE,error)
      throw new BadRequestException(this.ERROR_MESSAGES.FAILED_SEND_CODE);
    }
  }

  async sendVerificationCodePhone(phone: string) {
    try {
      const existingphone= await this.prisma.user.findUnique({
        where: { phone },
        select:{username:true}
      });

      if (existingphone) {
        throw new BadRequestException(this.ERROR_MESSAGES.PHONE_IN_USE);
      }
      const existingCode= await this.prisma.verificationCode.findFirst({
        where: { email:phone,type:'registerPhone' },
        select:{createdAt:true}
      });

      if (existingCode?.createdAt) {
        const min = 15;
        const now = new Date();
        const createdAt = new Date(existingCode.createdAt);
        const diffInSeconds = (now.getTime() - createdAt.getTime()) / 1000;
        if (diffInSeconds  < min) {
          return { message: this.ERROR_MESSAGES.WAIT_BEFORE_NEW_CODE };
        }
      }

      const code = this.generateCode();
      await this.storeVerificationCode(phone, code,'registerPhone');
      await this.sendVerificationPhone(phone, code);
      return { message: 'Verification code sent to your email' };
    }catch (error) {
      throw new BadRequestException(error.message||this.ERROR_MESSAGES.FAILED_SEND_CODE);
    }
  }


  async verifyCode(email: string, inputCode: string,type:'registerEmail'|'registerPhone') {
    if(!isEmail(email)){
      const CodeToken = await this.jwt.signAsync(
        { value:email },
        {
          expiresIn: '30m',
          secret: process.env.JWT_SECRET_REGISTER_PHONE,
        },
      );

     return {token:CodeToken};
    }
    try{
      const verificationRecord = await this.prisma.verificationCode.findFirst({
        where: { email:email ,type:type ,code:inputCode}
      });
      await this.prisma.verificationCode.deleteMany({
        where: { email: email,type:type ,code:inputCode},
      });

      if (!verificationRecord) {
        throw new BadRequestException(this.ERROR_MESSAGES.VERIFICATION_CODE_NOT_FOUND);
      }

      if (new Date() > new Date(verificationRecord.expiresAt)) {
        throw new BadRequestException(this.ERROR_MESSAGES.VERIFICATION_CODE_EXPIRED);
      }

      const CodeToken = await this.jwt.signAsync(
        { value:email },
        {
          expiresIn: '30m',
          secret: process.env.JWT_SECRET_REGISTER_EMAIL,
        },
      );

    return {token:CodeToken};
  }catch(e){
    console.error('Error verifying code:', e);
    throw new BadRequestException(e.message||this.ERROR_MESSAGES.FAILED_VERIFY_CODE);
  }
  }

  async findUserById(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      select:{
        id:true,
        password:true,
        passwordVersion:true,
        email:true,
        username:true,
        image:{select:{url:true}}
      }
    });
  }

  // async findUserByUserName(username: string) {
  //   return this.prisma.user.findUnique({
  //     where: {
  //       username,
  //     },
  //     select:{
  //       id:true,
  //       password:true,
  //       passwordVersion:true,
  //       email:true,
  //       username:true,
  //       image:{select:{url:true}}
  //     }
  //   });
  // }

  async findUserByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: {
        phone,
      },
      select:{
        id:true,
        password:true,
        passwordVersion:true,
        email:true,
        username:true,
        image:{select:{url:true}}
      }
    });
  }

async createUser(data: UserDto, files: { kbis?: myFile; 
  //id?: myFile; address?: myFile 
}) {
    try {
      const { emailtoken,
       // phonetoken,
          phone,
          userType, ...userWithoutCode } = data;

      // Verify email token
      if ((await this.jwt.decode(emailtoken)).exp < Math.floor(Date.now() / 1000)) {
        throw new Error(this.ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      const payloadEmail = await this.jwt.verifyAsync(emailtoken, {
        secret: process.env.JWT_SECRET_REGISTER_EMAIL,
      });
      const { value: email } = payloadEmail;
      if (!email) throw new BadRequestException(this.ERROR_MESSAGES.INVALID_EMAIL);

      // // Verify phone token
      // if ((await this.jwt.decode(phonetoken)).exp < Math.floor(Date.now() / 1000)) {
      //   throw new Error(this.ERROR_MESSAGES.TOKEN_EXPIRED);
      // }
      // const payloadPhone = await this.jwt.verifyAsync(phonetoken, {
      //   secret: process.env.JWT_SECRET_REGISTER_PHONE,
      // });
      // const { value: phone } = payloadPhone;
      // if (!phone) throw new BadRequestException(this.ERROR_MESSAGES.INVALID_PHONE);

      // Check if email/phone already exists
      const userEmail = await this.prisma.user.findUnique({ where: { email } });
      if (userEmail) throw new BadRequestException(this.ERROR_MESSAGES.EMAIL_IN_USE);
      
      const userPhone = await this.prisma.user.findUnique({ where: { phone } });
      if (userPhone) throw new BadRequestException(this.ERROR_MESSAGES.PHONE_IN_USE);

      const user = {
        ...userWithoutCode,
        phone,
        email,
        password: await hash(data.password, 10),
        passwordVersion: new Date()
      };

      if (userType === 'PROFESSIONAL') {
        if (!data.company) throw new BadRequestException(this.ERROR_MESSAGES.COMPANY_INVALID);

        const res = await fetch(`https://data.siren-api.fr/v3/etablissements/${data.company.siret}`, {
          headers: {
            'X-Client-Secret': process.env.SIREN_API_KEY,
          },
        });

        if (!res.ok) {
          throw new Error(this.ERROR_MESSAGES.COMPANY_INVALID);
        }

        const siret = (await res.json()).etablissement;
        const newUser= await this.prisma.user.create({
          data: {
            ...user,
            email,
            company: { create: { siret: data.company.siret,name:siret.unite_legale.denomination,address:`${siret.numero_voie ?? ''} ${siret.type_voie ?? ''} ${siret.libelle_voie ?? ''}, ${siret.code_postal ?? ''} ${siret.libelle_commune ?? ''}`.trim()
              ,code_commun:siret.code_postal,siren:siret.unite_legale.siren } },
            userType: 'Waiting',
            files: {
              createMany: {
                data: [
                  { content: files.kbis.buffer, name: 'kbis' },
                  //{ content: files.id.buffer, name: 'id' },
                  //{ content: files.address.buffer, name: 'address' }
                ]
              }
            }
          },
          select: { username: true,passwordVersion:true, email:true,id:true,image:{select:{url:true}}}
        });
        const payload = {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          passwordversion: newUser.passwordVersion,
        };
        return{
          user: newUser,
          backendToken: {
            accessToken: await this.jwt.signAsync(payload, {
              expiresIn: '60d',
              secret: process.env.JWT_SECRET_ACCESS,
            }),
            refreshToken: await this.jwt.signAsync(payload, {
              expiresIn: '60d',
              secret: process.env.JWT_SECRET_REFRESH,
            }),
          },
        }
      } else {
        const { company, ...userWithoutCompany } = user;
        const newUser= await this.prisma.user.create({
          data: { ...userWithoutCompany, userType },
          select: { username: true,passwordVersion:true, email:true,id:true,image:{select:{url:true}}}
        });
        const payload = {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          passwordversion: newUser.passwordVersion,
        };
        return{
          user: newUser,
          backendToken: {
            accessToken: await this.jwt.signAsync(payload, {
              expiresIn: '60d',
              secret: process.env.JWT_SECRET_ACCESS,
            }),
            refreshToken: await this.jwt.signAsync(payload, {
              expiresIn: '60d',
              secret: process.env.JWT_SECRET_REFRESH,
            }),
          },
        }
      }
    } catch (error) {
      console.log(error)
      throw new BadRequestException(
        error.message || this.ERROR_MESSAGES.FAILED_CREATE_USER
      );
    }
  }
}
