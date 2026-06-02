import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateContactDto, filterDto } from './dto/ghost.dto';
import * as fs from 'fs';
import * as path from 'path';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { isNumberString } from 'class-validator';

@Injectable()
export class GhostService {
 
  constructor( private prisma : PrismaService){}
  

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
  public async sendContactDetailsEmail(
    recipientEmail: string,
    contact: CreateContactDto,
  ) {
    try {
      let htmlTemplate = this.loadTemplate('send-contact-details.html');
      htmlTemplate = htmlTemplate
        .replace(/{{CONTACT_NAME}}/g, contact.name)
        .replace(/{{CONTACT_EMAIL}}/g, contact.email)
        .replace(/{{CONTACT_PHONE}}/g, contact.phone)
        .replace(/{{CONTACT_SUBJECT}}/g, contact.subject??'')
        .replace(/{{CONTACT_MESSAGE}}/g, contact.message);

      const subject = `Nouvelle demande de contact : ${contact.subject}`;
      htmlTemplate = htmlTemplate.replace(/{{FRONTEND_LINK}}/g, process.env.FRONT_END_URL);
      
      await this.sendRawEmail(recipientEmail, subject, htmlTemplate);
    } catch (error) {
      console.error('Erreur lors de l’envoi des coordonnées de contact :', error);
      throw new ConflictException('Une erreur est survenue lors de l’envoi des coordonnées de contact');
    }
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
  
  async sendContactEmail(data: CreateContactDto,userId:number) {
    try {
      const userEmail = await this.prisma.user.findUnique({where:{id:userId},select:{email:true}})
      return await this.sendContactDetailsEmail(userEmail.email,data)
    } catch (error) {
      console.error('Erreur lors de l’envoi de l’e-mail :', error);
      throw new Error('Impossible d’envoyer le message.');
    }
  }

  async getAllCategories() {
    return await this.prisma.category.findMany({
      include: {
        types: {
          orderBy: { id: 'asc' }
        }
      },
    });
  }

  async getCategoryByname(name: string) {
    const category = await this.prisma.type.findMany({
      where: { category:{name} },
      orderBy: { id: 'asc' },
    });
    if (!category) {
      throw new NotFoundException(`Category with ${name} not found`);
    }
    return category;
  }

  async getCategoryId(id: number) {
    const category = await this.prisma.type.findMany({
      where: { categoryId:id },
      orderBy: { id: 'asc' },
    });
    if (!category) {
      throw new NotFoundException(`Category with ${id} not found`);
    }
    return category;
  }

  async gettypeByName(name: string) {
    const types = await this.prisma.brand.findMany({
      where: {types:{name}},
      orderBy: { id: 'asc' },
    });
    if (!types) {
      throw new NotFoundException(`Types with category name ${name} not found`);
    }
    return types;
  }

  async gettypeAndCategoryByName(name: string) {
    const types = await this.prisma.type.findUnique({
      where: {name},
      select:{id:true,categoryId:true}
    });
    if (!types) {
      throw new NotFoundException(`Types with category name ${name} not found`);
    }
    return types;
  }

  async gettypeById(id: number) {
    const types = await this.prisma.brand.findMany({
      where: { typeId:id },
      orderBy: { id: 'asc' },
    });
    if (!types) {
      throw new NotFoundException(`Types with category id ${id} not found`);
    }
    return types;
  }

  async getBrandById(ids: number[]) {
    const brands = await this.prisma.brand.findMany({
      where: { id: { in: ids } },
      orderBy: { id: 'asc' },
      select:{
        id:true,
        name:true,
        models:{
          select:{
            id:true,
            name:true
          }
        }
      }
    });
    if (!brands) {
      throw new NotFoundException(`Brands with type id ${ids} not found`);
    }
    return brands;
  }

  async getBrandByName(name: string[]) {
    const brands = await this.prisma.brand.findMany({
      where: { name: { in: name } },
      select:{
        id:true,
        name:true,
        models:{
          select:{
            id:true,
            name:true
          }
        }
      }
    });
    if (!brands) {
      throw new NotFoundException(`Brands with type name ${name}} not found`);
    }
    return brands;
  }

  async getattributesType(typeId: number) {
    const attributes=await this.prisma.attribute.findMany({
      where: { typeCategory:  { some:{id:typeId} } },
      include:{
        options:true,
      },    
      orderBy: { id: 'asc' },  
    });
    const result = {
      title: 'Critères',
      data:attributes
    };
    return result;
  }

  //? this function is not used in the controller
  async getModels(id: number) {
    const models = await this.prisma.model.findMany({
      where: { brandId: id },
    });
    if (!models) {
      throw new NotFoundException(`Models with brand id ${id} not found`);
    }
    return models;
  }

  async getLocationbyName(name: string) {
    try {
      if(isNumberString(name)){
        const cities = await this.prisma.city.findMany({
          where: { code_postal: { startsWith: name, mode: 'insensitive' } },
          take:8
        });
        return { regions:[], departments:[],cities }; 
      }
      const regions = await this.prisma.region.findMany({
        where: { name: { startsWith:name,mode:'insensitive' } },take:8
      });
      const departments = await this.prisma.department.findMany({
        where: { name: { startsWith: name, mode: 'insensitive' } },take:8
      });
      const cities = await this.prisma.city.findMany({
        where: { name: { startsWith: name, mode: 'insensitive' } },take:8
      });
      return { regions, departments, cities }; 
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch cities');
    }
  }

  async getRegion(){
    try {
      return await this.prisma.region.findMany();
    }catch (error) {
      throw new InternalServerErrorException('Failed to fetch regions');
    }
  }

  async getDepartment(regionId: number) {
    try {
      const departments = await this.prisma.department.findMany({
        where: { regionId },
      });
      return departments;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch cities');
    }
  }

  async getCity(departmentId: number) {
    try {
      return await this.prisma.city.findMany({
        where: {departmentId},
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch cities');
    }
  }

  async getOneCity(id: number) {
    try {
      return await this.prisma.city.findUnique({
        where: {id},
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch cities');
    }
  }

  async getUser(id:number){
    try {
      const {showPhone,showFullName,fullName,phone,...user} =await this.prisma.user.findUnique({
        where:{id},
        select:{
          id:true,
          adresse:true,
          fullName:true,
          username:true,
          bio:true,
          phone:true,
          activeAt:true,
          image:true,
          userType:true,
          createdAt:true,
          showPhone:true,
          showSendEmailMessages:true,
          showSendMessages:true,
          showFullName:true,
          company:{
            select:{
              name:true,
              address:true,
              code_commun:true,
              horaire:true,
              instagram:true,
              facebook:true,
              twitter:true,
              linkedin:true,
              website:true,
              cover:{select:{url:true}},
              gallery:{select:{url:true}},
              service:{select:{name:true}},
              createdAt:true,
              siren:true,
            }
          },
          followers:{select:{followerId:true}},
          _count:{
            select:{
              followers:true,
              following:true
            }
          },
        },
      });
      return {
        ...user,
        ...(showFullName ? { fullName } : {}),
        ...(showPhone ? { phone } : {})
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async getFollowers(userId: number,take: number, skip: number) {
    try {
      const followers = await this.prisma.follower.findMany({
        where: { followingId: userId },
        include: {
          follower: {select:{id:true,fullName:true,image:true}},
        },
        take,
        skip,
      });
      return followers;
    } catch (error) {
      throw new BadRequestException('Failed to fetch followers');
    }
  }

  async getFollowing(userId: number,take: number, skip: number) {
    try {
      const following = await this.prisma.follower.findMany({
        where: { followerId: userId },
        include: {
          following: {select:{id:true,fullName:true,image:true}},
        },
        take,
        skip,
      });
      return following;
    } catch (error) {
      throw new BadRequestException('Failed to fetch following');
    }
  }

  async getAdsByUserId(filter:filterDto,userId: number,take: number, skip: number) {
    try {
      const where = this.buildWhereClause(filter);
  
      // Order by
      let orderBy: any = {};
      switch (filter.tri) {
        case 'plus recent':
          orderBy = { createdAt: 'desc' };
          break;
        case 'plus ancien':
          orderBy = { createdAt: 'asc' };
          break;
        case 'plus cher':
          orderBy = { price: 'desc' };
          break;
        case 'moins cher':
          orderBy = { price: 'asc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
        where.userId = userId;
        where.status = { not: "Brouillon" };
      const ads = await this.prisma.ad.findMany({
        where,
        select: {
          id:true,
          title: true,
          createdAt: true,
          price: true,
          favoritesBy:{select:{id:true}},
          media: { select: { media: { select: { url: true } } },orderBy: { position: 'asc' } },
          attributes: {
        select: {
          attribute: { 
            select: { name: true, id: true, unit: true, type: true },
          },
          value: true,
          option: { select: { value: true } },
        },
          },
          brand: { select: { name: true } },
          model: { select: { name: true } },
          region: { select: { name: true } },
          department: { select: { name: true } },
          user: {
        select: { username: true, userType: true, image: { select: { url: true } } },
          },
        },
        take,
        skip,
      });
      return ads;
    } catch (error) {
      throw new BadRequestException('Failed to fetch ads');
    }
  }

  async getAdById(id: number) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id ,status: { not: 'Brouillon' } },
      });

      if (!ad) {
        return ad;
      }

      const updatedAd = await this.prisma.ad.update({
        where: { id },
        data: {
          views: { increment: 1 },
        },
        select: {
          id:true,
          title:true,
          description:true,
          price:true,
          video:{select:{url:true}},
          createdAt:true,
          _count:{select:{favoritesBy:true}},
          media: { select: { media: { select: { url: true } } },orderBy: { position: 'asc' } },
          favoritesBy:{select:{id:true}},
          attributes: {
            select: {
              attribute: { 
                select: { name: true, id: true, unit: true, type: true },
              },
              value: true,
              option: { select: { value: true } },
            },
              },
          historique:{select: { media: { select: { url: true } } } },
          brand: { select: { name: true } },
          model: { select: { name: true } },
          region: { select: { name: true } },
          department: { select: { name: true } },
          city: { select: { name: true,code_postal:true } },
          user: {
             select: {id:true, username: true,fullName:true,activeAt:true,createdAt:true,phone:true, userType: true, image: { select: { url: true } },
                      _count:{select:{followers:true,following:true,ads:true}}},
          },
          notifications:true,
          contactEmail:true,
          contactMessage:true,
          phoneNumber:true,
          fullName: true,
        },
      });

      return updatedAd;
    } catch (error) {
      throw new BadRequestException('Failed to fetch or update ad');
    }
  }
async dernieres(take:number) {
    try {
      const ads = await this.prisma.ad.findMany({
        where: { status: 'Active' },
        select: {
          id:true,
          title: true,
          createdAt: true,
          price: true,
          favoritesBy:{select:{id:true}},
          media: { select: { media: { select: { url: true } } },orderBy: { position: 'asc' } },
          attributes: {
            select: {
              attribute: { 
                select: { name: true, id: true, unit: true, type: true },
              },
              value: true,
              option: { select: { value: true } },
            },
              },
          brand: { select: { name: true } },
          model: { select: { name: true } },
          region: { select: { name: true } },
          department: { select: { name: true } },
          user: {
             select: {id:true, username: true, userType: true, image: { select: { url: true } } },
          },
        },
        orderBy:{updatedAt:'desc'},
        take,
      });
      return ads;
    } catch (error) {
      throw new BadRequestException('Failed to fetch ads');
    }
  }
async populaires(take:number) {
    try {
      const ads = await this.prisma.ad.findMany({
        where: { status: 'Active' },
        select: {
          id:true,
          title: true,
          createdAt: true,
          price: true,
          favoritesBy:{select:{id:true}},
          media: { select: { media: { select: { url: true } } },orderBy: { position: 'asc' } },
          attributes: {
            select: {
              attribute: { 
                select: { name: true, id: true, unit: true, type: true },
              },
              value: true,
              option: { select: { value: true } },
            },
              },
          brand: { select: { name: true } },
          model: { select: { name: true } },
          region: { select: { name: true } },
          department: { select: { name: true } },
          user: {
             select: {id:true, username: true, userType: true, image: { select: { url: true } } },
          },
        },
        orderBy:{views:'desc'},
        take,
      });
      return ads;
    } catch (error) {
      throw new BadRequestException('Failed to fetch ads');
    }
  }  
async getimmo(take:number) {
    try {
      const ads = await this.prisma.ad.findMany({
        where: { status: 'Active',categoryId:2 },
        select: {
          id:true,
          title: true,
          createdAt: true,
          price: true,
          favoritesBy:{select:{id:true}},
          media: { select: { media: { select: { url: true } } },orderBy: { position: 'asc' } },
          attributes: {
            select: {
              attribute: { 
                select: { name: true, id: true, unit: true, type: true },
              },
              value: true,
              option: { select: { value: true } },
            },
              },
          brand: { select: { name: true } },
          model: { select: { name: true } },
          region: { select: { name: true } },
          department: { select: { name: true } },
          user: {
             select: {id:true, username: true, userType: true, image: { select: { url: true } } },
          },
        },
        orderBy:{updatedAt:'desc'},
        take,
      });
      return ads;
    } catch (error) {
      throw new BadRequestException('Failed to fetch ads');
    }
  }

  async getvehicules(take:number) {
    try {
      const ads = await this.prisma.ad.findMany({
        where: { status: 'Active' ,categoryId:1},
        select: {
          id:true,
          title: true,
          createdAt: true,
          price: true,
          favoritesBy:{select:{id:true}},
          media: { select: { media: { select: { url: true } } },orderBy: { position: 'asc' } },
          attributes: {
            select: {
              attribute: { 
                select: { name: true, id: true, unit: true, type: true },
              },
              value: true,
              option: { select: { value: true } },
            },
              },
          brand: { select: { name: true } },
          model: { select: { name: true } },
          region: { select: { name: true } },
          department: { select: { name: true } },
          user: {
             select: {id:true, username: true, userType: true, image: { select: { url: true } } },
          },
        },
        orderBy:{updatedAt:'desc'},
        take,
      });
      return ads;
    } catch (error) {
      throw new BadRequestException('Failed to fetch ads');
    }
  }
 async getAdsByIds(ids:number[]) {
    try {
      const ads = await this.prisma.ad.findMany({
        where:{id :{in:ids}},
        select: {
          id:true,
          title: true,
          createdAt: true,
          price: true,
          favoritesBy:{select:{id:true}},
          media: { select: { media: { select: { url: true } } },orderBy: { position: 'asc' } },
          attributes: {
            select: {
              attribute: { 
                select: { name: true, id: true, unit: true, type: true },
              },
              value: true,
              option: { select: { value: true } },
            },
              },
          brand: { select: { name: true } },
          model: { select: { name: true } },
          region: { select: { name: true } },
          department: { select: { name: true } },
          user: {
             select: {id:true, username: true, userType: true, image: { select: { url: true } } },
          },
        }
      });
      return ads;
    } catch (error) {
      throw new BadRequestException('Failed to fetch ads');
    }
  }  

  async getAdsByFilter(filter: filterDto, take: number, skip: number) {
    try {
      const where = this.buildWhereClause(filter);
  
      // Order by
      let orderBy: any = {};
      switch (filter.tri) {
        case 'plus recent':
          orderBy = { createdAt: 'desc' };
          break;
        case 'plus ancien':
          orderBy = { createdAt: 'asc' };
          break;
        case 'plus cher':
          orderBy = { price: 'desc' };
          break;
        case 'moins cher':
          orderBy = { price: 'asc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
  
      const ads = await this.prisma.ad.findMany({
        where,
        select: {
          id:true,
          title: true,
          createdAt: true,
          price: true,
          favoritesBy:{select:{id:true}},
          media: { select: { media: { select: { url: true } } },orderBy: { position: 'asc' } },
          attributes: {
            select: {
              attribute: { 
                select: { name: true, id: true, unit: true, type: true },
              },
              value: true,
              option: { select: { value: true } },
            },
              },
          brand: { select: { name: true } },
          model: { select: { name: true } },
          region: { select: { name: true } },
          department: { select: { name: true } },
          user: {
             select: {id:true, username: true, userType: true, image: { select: { url: true } } },
          },
        },
        take,
        skip,
        orderBy,
      });
      return ads;
    } catch (error) {
      throw new BadRequestException('Failed to fetch ads');
    }
  }  


async FF(take:number) {
    try {
      const ads = await this.prisma.ad.findMany({
        where: { status: 'Active' },
        select: {
          id:true,
          title: true,
          createdAt: true,
          price: true,
          favoritesBy:{select:{id:true}},
          media: { select: { media: { select: { url: true } } },orderBy: { position: 'asc' }  },
          attributes: {
            select: {
              attribute: { 
                select: { name: true, id: true, unit: true, type: true },
              },
              value: true,
              option: { select: { value: true } },
            },
              },
          brand: { select: { name: true } },
          model: { select: { name: true } },
          region: { select: { name: true } },
          department: { select: { name: true } },
          user: {
             select: {id:true, username: true, userType: true, image: { select: { url: true } } },
          },
        },
        orderBy:{views:'desc'},
        take,
      });
      return ads;
    } catch (error) {
      throw new BadRequestException('Failed to fetch ads');
    }
  }  
  
  private buildWhereClause(filter: filterDto) {
    const { search, minPrice, maxPrice, locationIds, type, attributes,typeAd } = filter;
    
      const where: any = {
        status: 'Active',
      };
  
      // Category filtering
      const brandIds = new Set<number>();
      const modelIds = new Set<number>();
  
      if(filter.type){
        where.typeId = type.id;
        if (type.brand) {
        for (const brand of type.brand) {
           brandIds.add(brand.id);
            if (brand.modeles) {
              brand.modeles.forEach((m) => modelIds.add(m));
            }
         }
      }
      
      if(typeAd && typeAd!=='tout'){
       where.user={userType:filter.typeAd==='Professionnels'?'PROFESSIONAL':{not:'PROFESSIONAL'}} 
      }
  
      if (modelIds.size > 0) where.modelId = { in: Array.from(modelIds) };
      else if (brandIds.size > 0) where.brandId = { in: Array.from(brandIds) };
      }
  
  
      // Search
      if (search) {
        where.title = { contains: search, mode: "insensitive" };
      }
  
      // Price
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }
  
      // Locations
      const regionIds: number[] = [];
      const cityIds: number[] = [];
      const departmentIds: number[] = [];
  
      if (locationIds && locationIds.length > 0) {
        for (const loc of locationIds) {
          if (loc.type === 'region') regionIds.push(loc.id!);
          else if (loc.type === 'city') cityIds.push(loc.id!);
          else if (loc.type === 'department') departmentIds.push(loc.id!);
        }
  
        const locationOr: any[] = [];
        if (regionIds.length) locationOr.push({ regionId: { in: regionIds } });
        if (cityIds.length) locationOr.push({ cityId: { in: cityIds } });
        if (departmentIds.length) locationOr.push({ departmentId: { in: departmentIds } });
        if (locationOr.length) where.OR = locationOr;
      }
  
      // Attributes
      if (attributes && attributes.length > 0) {
        where.attributes = {
          some: {
            AND: attributes.map((attr) => {
              if (Array.isArray(attr.value)) {
                return {
                  attributeId: attr.attributeId,
                  value: { in: attr.value },
                };
              } else {
                return {
                  value: {
                    gte: attr.value.min,
                    lte: attr.value.max,
                  },
                };
              }
            }),
          },
        };
      }
      return where;
    }
}