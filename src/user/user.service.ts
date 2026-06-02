import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AdAttributeDto, AdAttributeFilterDto, ChangeAccountDto, CreateAdsDto, filterDto, locations, RepportDto, type, UpdateAdsDto, UpdateCompanyDto, UpdateEmailDto, UpdateNotificationsDto, UpdatePasswordDto, UpdatePhoneDto, UpdateUserDto } from './dto/create-user.dto';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { CloudinaryService } from '../lib/cloudinary.provider';
import { PrismaService } from '../prisma.service';
import { hash } from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { JwtService } from '@nestjs/jwt';
import { AnyNaptrRecord } from 'dns';

type myFile={
            filename: string;
            mimetype: string;
            buffer: Buffer;
  }
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cloudinaryService: CloudinaryService,
  ) { }

  private loadTemplate(filename: string): string {
    const filePath = path.join(process.cwd(), 'src', 'templates', filename);
    return fs.readFileSync(filePath, { encoding: 'utf-8' });
  }

  private async verifyJwtToken(token:string):Promise<string>{
    if ((await this.jwt.decode(token)).exp < Math.floor(Date.now() / 1000)) {
            throw new UnauthorizedException();
          }
          const payload = await this.jwt.verifyAsync(token, {
            secret: process.env.JWT_SECRET_SETTING,
          });
          const { value } = payload;
    return value;
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  }

  async getSignature() {
    try {
      const signature = this.cloudinaryService.getSignature();
      return signature;
    }catch (error) {
      throw new BadRequestException('Failed to get signature');
    }
  }

  async getUserType(userId:number) {
    try {
      return (await this.prisma.user.findUnique({where:{id:userId},select:{userType:true}})).userType;
    }catch (error) {
      throw new BadRequestException('Failed to get signature');
    }
  }

  async createAd(data: CreateAdsDto, userId: number) {
    try {
      console.log('Creating ad with data:', data.images);
      const type = this.prisma.type.findUnique({where:{id:data.typeId},select:{includeBrands:true,attributes:true}})
      if(!type)throw new Error()
      // Validate CreateAdsDto data with type
      const typeData = await type;
      if (!typeData) throw new BadRequestException('Type not found');
      // Validate brand
      if (typeData.includeBrands && !data.brandId && !data.modelId){
        throw new BadRequestException('Brand is required for this type');
      }

      // Validate attributes
      if (typeData.attributes && typeData.attributes.length > 0) {
        const requiredAttributes = typeData.attributes.filter(attr => attr.required);
        for (const attr of requiredAttributes) {
          const userAttr = data.attributes.find(a => a.attributeId === attr.id);
          if (!userAttr) {
            throw new BadRequestException(`Attribute "${attr.name}" is required`);
          }
          // If attribute type is NUMBER, validate min/max
          if (attr.type === 'NUMBER') {
            if (typeof userAttr.value !== 'number') {
              throw new BadRequestException(`Attribute "${attr.name}" must be a number`);
            }
            if (attr.min && userAttr.value < attr.min) {
              throw new BadRequestException(`Attribute "${attr.name}" must be at least ${attr.min}`);
            }
            if (attr.max && userAttr.value > attr.max) {
              throw new BadRequestException(`Attribute "${attr.name}" must be at most ${attr.max}`);
            }
          }
        }
      }

      const userType = (await this.prisma.user.findUnique({where:{id:userId},select:{userType:true}})).userType;
      if(userType!=='PROFESSIONAL'&&(data.images.length>10||data.refresh===true))throw new Error()
      
      const { department } = await this.prisma.city.findUnique({
        where: { id: data.locationId },
        select: {
          department: {
            select: {
              regionId: true,
              id: true,
            },
          },
        },
      });
      if (!department) {
        throw new BadRequestException('Department not found');
      }
      const regionId = department.regionId;
      const departmentId = department.id;

      const ad = await this.prisma.ad.create({
        select:{
          id:true,
          price:true,
          title:true,
          description:true,
          media:{select:{media:{select:{url:true}}},orderBy: { position: 'asc' }  },
          city:{select:{name:true}},
          department:{select:{name:true,id:true}},
          region:{select:{name:true,id:true}},
          category:{select:{name:true}},
          type:{select:{name:true}},
          brand:{select:{name:true}},
          model:{select:{name:true}},
          attributes:{select:{attribute:{select:{name:true,unit:true}},value:true,option:{select:{value:true}}}}
        },
        data: {
          notifications: data.notifications,
          contactEmail: data.contactEmail,
          contactMessage: data.contactMessage,
          refresh:data.refresh,
          phoneNumber: data.phoneNumber,
          fullName: data.fullName,
          title: data.title,
          description: data.description,
          price: data.price,
          status: data.status,
          video: data.video ? {
            connectOrCreate: {
              where: { url: data.video },
              create: {
                url: data.video,
                type: 'VIDEO',
              },
            },
          } : undefined,
          user: { connect: { id: userId } },
          city: { connect: { id: data.locationId } },
          category: { connect: { id: data.categoryId } },
          type: { connect: { id: data.typeId } },
          brand: data.brandId ? { connect: { id: data.brandId } } : undefined,
          model: data.modelId ? { connect: { id: data.modelId } } : undefined,
          region: { connect: { id: regionId } },
          department: { connect: { id: departmentId } },
          historique: data.historique ? {
            create: data.historique.map((url, index) => ({
              position: index,
              media: {
                connectOrCreate: {
                  where: { url },
                  create: {
                    url,
                    type: 'IMAGE',
                  },
                },
              },
            })),
          } : undefined,
          media: {
            create: data.images.map((url, index) => ({
              position: index,
              media: {
                connectOrCreate: {
                  where: { url },
                  create: {
                    url,
                    type: 'IMAGE',
                  },
                },
              },
            })),
          },
          attributes: data.attributes.length > 0 ? {
            create: await Promise.all(
              data.attributes.map(async (attr) => {
                const attribute = await this.prisma.attribute.findUnique({
                  where: { id: attr.attributeId },
                  select: { type: true },
                });
                if (attribute.type === 'SELECT') {
                  // Only connect if attr.value is a number (single option id)
                  if (typeof attr.value === 'number') {
                    return {
                      attribute: { connect: { id: attr.attributeId } },
                      option: { connect: { id: attr.value } },
                    };
                  } else {
                    // Ignore invalid values for SELECT type
                    return null;
                  }
                } else {
                  // Only assign value if it's a primitive (number or string)
                  if (typeof attr.value === 'number' || typeof attr.value === 'string') {
                    return {
                      attribute: { connect: { id: attr.attributeId } },
                      value: attr.value,
                    };
                  } else {
                    // Ignore invalid values for non-SELECT type
                    return null;
                  }
                }
              })
            ).then(results => results.filter(Boolean)),
          } : undefined,
        },
      });
      this.checkNewAdsAgainstSearches(data, ad).catch(error => {
        console.error('Error checking searches:', error);
      });
      return { message: 'Ad created successfully', ad };
      
    } catch (error) {
      console.error('Error creating ad:', error);
      throw new BadRequestException('Failed to create ad');
    }
    
  }

  async updateAd(id: number, data: UpdateAdsDto, userId: number) {
    try {
      const userType = (await this.prisma.user.findUnique({where:{id:userId},select:{userType:true}})).userType;
      if(userType!=='PROFESSIONAL'&&(data.images.length>10||data.refresh===true))throw new Error()
      const {
        attributes,
        images,
        historique,
        brandId,
        modelId,
        locationId,
        categoryId,
        typeId,
        ...rest
      } = data;

      const { department } = await this.prisma.city.findUnique({
        where: { id: data.locationId },
        select: {
          department: {
            select: {
              regionId: true,
              id: true,
            },
          },
        },
      });
      if (!department) {
        throw new BadRequestException('Department not found');
      }
      const regionId = department.regionId;
      const departmentId = department.id;

      const updateData: any = {
        ...rest,
      };
      if (brandId) {
        updateData.brand = { connect: { id: brandId } };
      }
      if (modelId) {
        updateData.model = { connect: { id: modelId } };
      }
      if (locationId) {
        updateData.city = { connect: { id: locationId } };
      }
      if (regionId) {
        updateData.region = { connect: { id: regionId } };
      }
      if (departmentId) {
        updateData.department = { connect: { id: departmentId } };
      }
      if (data.video) {
        updateData.video = {
            connectOrCreate: {
              where: { url: data.video },
              create: {
                url: data.video,
                type: 'VIDEO',
              },
            },
          };
      }
      if (attributes&&data.attributes.length > 0) {
        updateData.attributes =  {
            deleteMany: {},
            create: await Promise.all(
              data.attributes.map(async (attr) => {
                const attribute = await this.prisma.attribute.findUnique({
                  where: { id: attr.attributeId },
                  select: { type: true },
                });
                return {
                  attribute: { connect: { id: attr.attributeId } },
                  ...(attribute.type === 'SELECT'
                    ? { option: { connect: { id: attr.value } } }
                    : { value: attr.value }),
                };
              })
            ),
          } 
      }

      if (images) {
        updateData.media = {
          deleteMany: {}, // remove old images
          create: images.map((item, index) => ({
            position: index,
            media: {
              connectOrCreate: {
                where: { url: item },
                create: {
                  url: item,
                  type: 'IMAGE',
                },
              },
            },
          })),
        };
      }

      if (historique) {
        updateData.historique = {
          deleteMany: {}, // remove old images
          create: historique.map((item, index) => ({
            position: index,
            media: {
              connectOrCreate: {
                where: { url: item },
                create: {
                  url: item,
                  type: 'IMAGE',
                },
              },
            },
          })),
        };
      }
      const ad = await this.prisma.ad.update({
        where: { id, userId },
        data: { ...updateData,updatedAt:new Date() },
      });

      return { message: 'Ad updated successfully', ad };
    } catch (error) {
      console.error('Error updating ad:', error);
      throw new BadRequestException('Failed to update ad');
    }
  }

  async deleteAd(id: number, userId: number) {
    try {
      await this.prisma.ad.delete({
        where: { id, userId }
      });
      return { message: 'Ad deleted successfully' };
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw new BadRequestException('Failed to delete ad');
    }
  }

  async renouvelerAd(id: number, userId: number) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id, userId },
        select: { id: true, createdAt: true,user:{select:{userType:true}} },
      });
      if (!ad) {
        throw new NotFoundException('Ad not found');
      }
      const createdAtTime = new Date(ad.createdAt).getTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const sevenDays = (ad.user.userType=='PROFESSIONAL'?3:5) * oneDay;
      if ( now - createdAtTime < sevenDays) throw new BadRequestException('cannot renew the Ad ');
      await this.prisma.ad.updateMany({
        where: { id, userId },
        data: { createdAt: new Date(), updatedAt: new Date(),status: 'Active' }
      });
      return { message: 'Ad deleted successfully' };
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw new BadRequestException('Failed to delete ad');
    }
  }

  async pauseAd(id: number, userId: number) {
    try {
      await this.prisma.ad.updateMany({
        where: { id, userId },
        data: { status: 'Brouillon' }
      });
      return { message: 'Ad paused successfully' };
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw new BadRequestException('Failed to delete ad');
    }
  }

  async playAd(id: number, userId: number) {
    try {
      await this.prisma.ad.updateMany({
        where: { id, userId },
        data: { status: 'Active' }
      });
      return { message: 'Ad played successfully' };
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw new BadRequestException('Failed to delete ad');
    }
  }

  async getAdsByUserId(userId: number, take: number, skip: number, filter: filterDto) {
    try {
      const where = this.buildWhereClause(filter);
      where.status = undefined;
      // Order by
      let orderBy: any = { createdAt: 'desc' };
      switch (filter?.tri) {
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

      const ads = await this.prisma.ad.findMany({
        where,
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          views: true,
          status: true,
          _count: { select: { favoritesBy: true, conversation: true } },
          price: true,
          media: {
            select: { 
              media: { select: { url: true } }, 
              position: true 
            },
            orderBy: { position: 'asc' } 
          },
          attributes: {
        select: {
          attribute: {
            select: { name: true, id: true, unit: true, type: true },
          },
          value: true,
          option: { select: { value: true } },
        },
          },
        },
        take,
        skip,
        orderBy
      });
      return ads;
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw new BadRequestException('Failed to fetch ads');
    }
  }

  async getAdById(id: number, userId: number) {
    try {
      const ad = await this.prisma.ad.findFirst({
        where: { id, userId },
        select: {
          user:{select:{userType:true}},
          id: true,
          title: true,
          description: true,
          price: true,
          status: true,
          views: true,
          createdAt: true,
          updatedAt: true,
          brandId: true,
          modelId: true,
          regionId: true,
          departmentId: true,
          cityId: true,
          typeId: true,
          categoryId: true,
          category: { select: { name: true } },
          type: { select: { name: true } },
          _count: { select: { favoritesBy: true } },
          video: { select: { url: true, id: true } },
          media: { select: { media: { select: { url: true, id: true } } },orderBy: { position: 'asc' }  },
          favoritesBy: { select: { id: true } },
          historique:{select: { media: { select: { url: true } } } },
          attributes: {
            select: {
              attribute: {
                select: { id: true, name: true },
              },
              value: true,
              option: { select: { id: true } },
            },
          },
          notifications: true,
          contactEmail: true,
          contactMessage: true,
          refresh:true,
          phoneNumber: true,
          fullName: true,
        },
      });

      const brands = await this.prisma.brand.findMany({
        where: { typeId: ad.typeId },
      });
      let modeles = [];
      if (ad.brandId) 
        modeles = await this.prisma.model.findMany({
          where: { brandId: ad.brandId },
        });

      const attributes=await this.prisma.attribute.findMany({
        where: { typeCategory:  { some:{id:ad.typeId} } },
        include:{
          options:true,
        },    
        orderBy: { id: 'asc' },  
      });
      const regions = await this.prisma.region.findMany({});
      const departments = await this.prisma.department.findMany({
        where: { regionId: ad.regionId },
      });
      const cities = await this.prisma.city.findMany({
        where: { departmentId: ad.departmentId },
      });
      return { ad:{...ad,brandId:ad.brandId??undefined,modelId:ad.modelId??undefined}, brands, modeles, attributes: { title: 'Critères', data: attributes }, regions, departments, cities };
    } catch (error) {
      console.error('Error fetching ad by ID:', error);
      throw new BadRequestException('Failed to fetch ad');
    }
  }

  async followUser(userId: number, followUserId: number) {
    if (userId === followUserId) return;
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: followUserId },
        select: { id: true },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      const follow = await this.prisma.follower.create({
        data: {
          following: { connect: { id: followUserId } },
          follower: { connect: { id: userId } },
        },
      });
      return { message: 'Followed successfully', follow };
    } catch (error) {
      console.error('Error following user:', error);
      throw new BadRequestException('Failed to follow user');
    }
  }

  async unfollowUser(userId: number, followUserId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: followUserId },
        select: { id: true },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      await this.prisma.follower.deleteMany({
        where: {
          followerId: userId,
          followingId: followUserId,
        },
      });
      return { message: 'Unfollowed successfully' };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw new BadRequestException('Failed to unfollow user');
    }
  }

  async sendMessage(senderId: number, receiverId: number, adId: number | null, content: string) {
    try {
      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          senderId,
          receiverId,
          adId, // this can be null or number
        },
      });

      const message = await this.prisma.message.create({
        data: {
          sender: { connect: { id: senderId } },
          conversation: existingConversation
            ? { connect: { id: existingConversation.id } }
            : {
                create: {
                  adId,
                  receiverId,
                  senderId,
                },
              },
          content,
        },
        select: {
          conversation: {
            select: {
              sender: true,
              receiver: true,
            },
          },
        },
      });
      // Send notification if last activity was more than 24h ago
      if(existingConversation){
        if ( existingConversation.activeAt && (Date.now() - new Date(existingConversation.activeAt).getTime() > 24 * 60 * 60 * 1000)) {
          await this.sendUserMessageNotification(
            message.conversation.receiver.email,
            message.conversation.sender.username,
            content
          );
        }
      }else await this.sendUserMessageNotification(
            message.conversation.receiver.email,
            message.conversation.sender.username,
            content
          );
      
      return { message: 'Message sent successfully' };
    } catch (error) {
      //console.log('Error sending message:', error);
      throw new BadRequestException('Failed to send message');
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

  async favoriteAd(userId: number, adId: number) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id: adId },
        select: { id: true },
      });
      if (!ad) {
        throw new BadRequestException('Ad not found');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          favoritesAd: {
            connect: { id: adId },
          },
        },
      });
      return { message: 'Ad favorited successfully' };
    } catch (error) {
      console.error('Error favoriting ad:', error);
      throw new BadRequestException('Failed to favorite ad');
    }
  }
  async unfavoriteAd(userId: number, adId: number) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          favoritesAd: {
            disconnect: { id: adId },
          },
        },
      });
      return { message: 'Ad unfavorited successfully' };
    } catch (error) {
      console.error('Error unfavoriting ad:', error);
      throw new BadRequestException('Failed to unfavorite ad');
    }
  }
  async getFavoriteAds(userId: number, take: number, skip: number) {
    try {
      const favorites = await this.prisma.ad.findMany({
        where: { status: 'Active',favoritesBy: { some: { id: userId } } },
        select: {
              id: true,
              title: true,
              createdAt: true,
              price: true,
              favoritesBy: { select: { id: true } },
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
                select: { id: true, username: true, userType: true, image: { select: { url: true } } },
              },
            },
        take,
        skip,
      });
      return favorites;
    } catch (error) {
      console.error('Error fetching favorite ads:', error);
      throw new BadRequestException('Failed to fetch favorite ads');
    }
  }

  async getMessages(userId: number, conversationId: number, take: number, skip: number) {
    try {
      const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId, OR: [{ receiverId: userId }, { senderId: userId }] }, select: { id: true, receiverId: true, senderId: true } })
      if (!conversation) throw new NotFoundException('Conversation not found');

      const messages = await this.prisma.message.findMany({
        where: {
          conversationId,
        },
        include: { conversation: true },
        orderBy: { sentAt: 'desc' },
        take: take + 1,
        skip,
      });

      return {
        messages: messages.slice(0, take).reverse(),
        nextPage: (messages.length > take) ? skip + take + 1 : null,
        currentPage: skip,
      };
    } catch (error) {
      throw new BadRequestException(`Error getting messages: ${error.message}`);
    }
  }

  async getConversationsCount(userId: number) {
    try {
      const myconversation= await this.prisma.conversation.findMany({
        where:{OR: [{ senderId: userId }, { receiverId: userId }]},
        select:{id:true,
                messages: {
                  select: {
                    read: true,
                    senderId:true,
                  },
                  orderBy: { sentAt: 'desc' },
                  take: 1
                },
              },
        orderBy: { activeAt: 'desc' },
        take:10
      })
      const unreadConversationIds = myconversation
        .filter(conv => conv.messages.length > 0 && conv.messages[0].read === false && conv.messages[0].senderId !== userId)
        .map(conv => conv.id);
      return unreadConversationIds;
    } catch (error) {
      throw new BadRequestException(`Error getting contacts: ${error.message}`);
    }
  }

  async getConversations(userId: number, take: number, skip: number) {
    try {
      const contactUsers = await this.prisma.conversation.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        select: {
          id: true,
          activeAt: true,
          sender: {
            select: { id: true, activeAt: true, image: { select: { url: true } }, fullName: true,userType:true, createdAt: true, _count: { select: { followers: true, following: true, ads: true } }, username: true, isOnline: true },
          },
          receiver: {
            select: { id: true, activeAt: true, image: { select: { url: true } }, fullName: true,userType:true, createdAt: true, _count: { select: { followers: true, following: true, ads: true } }, username: true, isOnline: true },
          },
          messages: {
            select: {
              id: true,
              content: true,
              sentAt: true,
              read: true,
              senderId: true,
            },
            orderBy: { sentAt: 'desc' },
            take: 1
          },
          ad: {
            select: {
              id: true,
              title: true,
              price: true,
              media: {
                select: {
                  media: {
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
        skip,
        take: take + 1,
        orderBy: { activeAt: 'desc' },
      });
      const conversation = contactUsers.map((conversation) => {
        return conversation.sender.id === userId
          ? { id: conversation.id, user: conversation.receiver, ad: conversation.ad, lastMessage: conversation.messages, time: conversation.activeAt }
          : { id: conversation.id, user: conversation.sender, ad: conversation.ad, lastMessage: conversation.messages, time: conversation.activeAt };
      });
      return {
        data: conversation.slice(0, take),
        nextPage: (conversation.length > take) ? skip + take : null,
        currentPage: skip,
      };
    } catch (error) {
      throw new BadRequestException(`Error getting contacts: ${error.message}`);
    }
  }

  async getOneConversation(userId: number, id:number) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { OR: [{ senderId: userId }, { receiverId: userId }],id },
        select: {
          id: true,
          activeAt: true,
          sender: {
            select: { id: true, activeAt: true, image: { select: { url: true } }, fullName: true,userType:true, createdAt: true, _count: { select: { followers: true, following: true, ads: true } }, username: true, isOnline: true },
          },
          receiver: {
            select: { id: true, activeAt: true, image: { select: { url: true } }, fullName: true,userType:true, createdAt: true, _count: { select: { followers: true, following: true, ads: true } }, username: true, isOnline: true },
          },
          messages: {
            select: {
              id: true,
              content: true,
              sentAt: true,
              read: true,
              senderId: true,
            },
            orderBy: { sentAt: 'desc' },
            take: 1
          },
          ad: {
            select: {
              id: true,
              title: true,
              price: true,
              media: {
                select: {
                  media: {
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      });
      return conversation.sender.id === userId
          ? { id: conversation.id, user: conversation.receiver, ad: conversation.ad, lastMessage: conversation.messages, time: conversation.activeAt }
          : { id: conversation.id, user: conversation.sender, ad: conversation.ad, lastMessage: conversation.messages, time: conversation.activeAt };
    } catch (error) {
      throw new BadRequestException(`Error getting contacts: ${error.message}`);
    }
  }

  async repportAd(userId: number, repport: RepportDto) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id: repport.adId },
        select: { id: true, title: true, userId: true },
      });
      if (!ad) {
        throw new NotFoundException('Ad not found');
      }
      const report = await this.prisma.rapports.create({
        data: {
          adId: ad.id,
          userId,
          type: repport.reason,
          content: repport.message,
        },
      });
      return { message: 'Ad reported successfully', report };
    } catch (error) {
      console.error('Error reporting ad:', error);
      throw new BadRequestException('Failed to report ad');
    }
  }
  private buildWhereClause(filter: filterDto) {
    const { search, minPrice, maxPrice, locationIds, type, attributes, typeAd } = filter;

    const where: any = {
      status: { not: 'Brouillon' },
    };

    // Category filtering
    const brandIds = new Set<number>();
    const modelIds = new Set<number>();

    if(typeAd && typeAd!=='tout'){
       where.user={userType:typeAd==='Professionnels'?'PROFESSIONAL':{not:'PROFESSIONAL'}} 
    }

    if (filter?.type) {
      where.typeId = type?.id;
      if (type?.brand) {
        for (const brand of type?.brand) {
          brandIds.add(brand.id);
          if (brand.modeles) {
            brand.modeles.forEach((m) => modelIds.add(m));
          }
        }
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

      if (regionIds.length || cityIds.length || departmentIds.length) {
        where.OR = [];
        if (regionIds.length) where.OR.push({ regionId: { in: regionIds } });
        if (cityIds.length) where.OR.push({ cityId: { in: cityIds } });
        if (departmentIds.length) where.OR.push({ departmentId: { in: departmentIds } });
      }
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
  
  // 2. Update user profile
  async updateProfile(userId: number, dto: UpdateUserDto) {

    // Remove image from dto to avoid type conflict
    const { image, ...restDto } = dto;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
      ...(image
        ? {
          image: {
          connectOrCreate: {
            where: { url: image },
            create: { url: image, type: 'IMAGE' },
          },
          },
        }
        : {}),
      ...restDto,
      },
      select: {
      email: true,
      fullName: true,
      bio: true,
      username: true,
      phone: true,
      image: { select: { url: true } },
      userType: true,
      passwordVersion: true,
      createdAt: true,
      adresse: true,
      showFullName: true,
      showPhone: true,
      showSendMessages: true,
      showSendEmailMessages: true,
      updatedAt: true,
      authentification2FA: true,
      company: {
        select: {
        siret: true,
        siren: true,
        name: true,
        address: true,
        code_commun: true,
        horaire: true,
        instagram: true,
        facebook: true,
        twitter: true,
        linkedin: true,
        website: true,
        cover: { select: { url: true } },
        createdAt: true,
        updatedAt: true,
        service: { select: { name: true, id: true } },
        gallery: { select: { url: true } },
        },
      },
      },
    });
  }

  async updatePassword(userId: number, data: UpdatePasswordDto) {
    try {
      const email = await this.verifyJwtToken(data.token);
      await this.prisma.user.update({
        where: { id: userId, email: email },
        data: {
          password: await hash(data.newPassword, 10),
          passwordVersion: new Date(),
        },
        select:{
        email:true,
        fullName:true,
        bio:true,
        username:true,
        phone:true,
        image:{select:{url:true}},
        userType:true,
        passwordVersion:true,
        createdAt:true,
        adresse:true,
        showFullName:true,
        showPhone:true,
        showSendMessages:true,
        showSendEmailMessages:true,
        updatedAt:true,
        authentification2FA:true,
        company:{select:{
          siret:true,
          siren:true,
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
          createdAt:true,
          updatedAt:true,
          service:{select:{name:true,id:true}},
          gallery:{select:{url:true}}
        }}
      }
      });
      return { message: 'Paramètres mis à jour avec succès.' };
    } catch (error) {
      console.error('Error updating password:', error);
      throw new InternalServerErrorException('Impossible de mettre à jour le mot de passe.');
    }
  }

  async sendUpdateEmail(email:string,token:string) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email },
      });
      if (existingUser)
        throw new BadRequestException('Cet email est déjà utilisé par un autre utilisateur.');
      
    try {
      await this.verifyJwtToken(token);
      await this.sendAccountChangeCodeByEmail({type:'securiteEmail'},email)
      return { message: 'l’envoi du code de changement de compte succès.' };
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw new InternalServerErrorException('Impossible de mettre à jour les paramètres de sécurité.');
    }
  }

  async sendUpdatePhone(phone:string,token:string) {
    const existingUser = await this.prisma.user.findFirst({
        where: { phone },
      });
      if (existingUser)
        throw new BadRequestException('Cet phone est déjà utilisé par un autre utilisateur.');
    try {
      await this.verifyJwtToken(token);
      const code = this.generateCode();
      await this.storeVerificationCode(phone,code);
      //await this.sendAccountChangeCode({type:'securiteEmail'},userId)
      return { message: 'l’envoi du code de changement de compte succès.' };
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw new InternalServerErrorException('Impossible de mettre à jour les paramètres de sécurité.');
    }
  }

  async updateEmail(userId:number,data:UpdateEmailDto) {
    try {
      const email = await this.prisma.verificationCode.delete({where:{email_type_code:{
        email:data.email,
        code:data.input,
        type:'securite'
      }}});

      await this.prisma.user.update({
        where: { id: userId},
        data:{
          email:email.email 
        },
        select:{
        email:true,
        fullName:true,
        bio:true,
        username:true,
        phone:true,
        image:{select:{url:true}},
        userType:true,
        passwordVersion:true,
        createdAt:true,
        adresse:true,
        showFullName:true,
        showPhone:true,
        showSendMessages:true,
        showSendEmailMessages:true,
        updatedAt:true,
        authentification2FA:true,
        company:{select:{
          siret:true,
          siren:true,
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
          createdAt:true,
          updatedAt:true,
          service:{select:{name:true,id:true}},
          gallery:{select:{url:true}}
        }}
      }
      });
      return { message: 'Paramètres mis à jour avec succès.' };
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw new InternalServerErrorException('Impossible de mettre à jour les paramètres de sécurité.');
    }
  }

  async updatePhone(userId:number,data:UpdatePhoneDto) {
    try {
      const phone = await this.prisma.verificationCode.delete({where:{email_type_code:{
        email:data.phone,
        code:data.input,
        type:'securite'
      }}});

      await this.prisma.user.update({
        where: { id: userId},
        data:{
          phone:phone.email 
        },
        select:{
        email:true,
        fullName:true,
        bio:true,
        username:true,
        phone:true,
        image:{select:{url:true}},
        userType:true,
        passwordVersion:true,
        createdAt:true,
        adresse:true,
        showFullName:true,
        showPhone:true,
        showSendMessages:true,
        showSendEmailMessages:true,
        updatedAt:true,
        authentification2FA:true,
        company:{select:{
          siret:true,
          siren:true,
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
          createdAt:true,
          updatedAt:true,
          service:{select:{name:true,id:true}},
          gallery:{select:{url:true}}
        }}
      }
      });
      return { message: 'Paramètres mis à jour avec succès.' };
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw new InternalServerErrorException('Impossible de mettre à jour les paramètres de sécurité.');
    }
  }

  async update2FA(userId: number, stat:boolean,token:string) {
    try {
      const email = await this.verifyJwtToken(token);
      
      await this.prisma.user.update({
        where: { id: userId, email: email },
        data:{
          authentification2FA:stat
        },
        select:{
        email:true,
        fullName:true,
        bio:true,
        username:true,
        phone:true,
        image:{select:{url:true}},
        userType:true,
        passwordVersion:true,
        createdAt:true,
        adresse:true,
        showFullName:true,
        showPhone:true,
        showSendMessages:true,
        showSendEmailMessages:true,
        updatedAt:true,
        authentification2FA:true,
        company:{select:{
          siret:true,
          siren:true,
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
          createdAt:true,
          updatedAt:true,
          service:{select:{name:true,id:true}},
          gallery:{select:{url:true}}
        }}
      }
      });
      return { message: 'Paramètres mis à jour avec succès.' };
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw new InternalServerErrorException('Impossible de mettre à jour les paramètres de sécurité.');
    }
  }

  async updateNotificationSettings(
    userId: number,
    dto: UpdateNotificationsDto,
  ) {
    try {
      let data=null;
      if(dto.email)data={notifyemail:dto.email}
      if(dto.sms)data={...data,notifysms:dto.sms}
      if(dto.push)data={...data,notifypush:dto.push}
      if(dto.newsletter)data={...data,notifynewsletter:dto.newsletter}
      if(!data)return;
      return await this.prisma.user.update({
        where: { id:userId },
        data,
        select:{
        email:true,
        fullName:true,
        bio:true,
        username:true,
        phone:true,
        image:{select:{url:true}},
        userType:true,
        passwordVersion:true,
        createdAt:true,
        adresse:true,
        showFullName:true,
        showPhone:true,
        showSendMessages:true,
        showSendEmailMessages:true,
        updatedAt:true,
        authentification2FA:true,
        company:{select:{
          siret:true,
          siren:true,
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
          createdAt:true,
          updatedAt:true,
          service:{select:{name:true,id:true}},
          gallery:{select:{url:true}}
        }}
      }
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      throw new InternalServerErrorException('Unable to update notification settings');
    }
  }

async updateCompany(userId: number, dto: UpdateCompanyDto) {
  const { image, services, images, ...restdata } = dto;

  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  });

  if (!user || !user.company) {
    throw new Error('Entreprise non trouvée');
  }

  try {

    return await this.prisma.$transaction(async (prisma) => {
      // Handle gallery images
      let galleryConnect = [];
      if (images && images.length > 0) {
        // Create missing images first
        await Promise.all(
          images.map(url => 
            prisma.adMedia.upsert({
              where: { url },
              update: {},
              create: { url, type: 'IMAGE' }
            })
          )
        );
        
        galleryConnect = images.map(url => ({ url }));
      }

      return prisma.company.update({
        where: { id: user.company.id },
        data: {
          ...(image ? {
            cover: {
              connectOrCreate: {
                where: { url: image },
                create: { url: image, type: 'IMAGE' },
              },
            },
          } : {}),
          ...(services ? {
            service: {
              set: services.map(id => ({ id })),
            },
          } : {}),
          ...(galleryConnect.length > 0 ? {
            gallery: {
              set: galleryConnect,
            },
          } : {}),
          ...restdata,
        },
      select: {
        siret: true,
        siren: true,
        name: true,
        address: true,
        code_commun: true,
        horaire: true,
        instagram: true,
        facebook: true,
        twitter: true,
        linkedin: true,
        website: true,
        cover: { select: { url: true } },
        createdAt: true,
        updatedAt: true,
        service: { select: { name: true, id: true } },
        gallery: { select: { url: true } },
      },
      });
    });
  } catch (error) {
    console.error('Error updating company:', error);
    throw new InternalServerErrorException('Impossible de mettre à jour l\'entreprise.');
  }
}
  
  async getMyProfileSettings(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select:{
        email:true,
        fullName:true,
        bio:true,
        username:true,
        phone:true,
        image:{select:{url:true}},
        userType:true,
        passwordVersion:true,
        createdAt:true,
        adresse:true,
        showFullName:true,
        showPhone:true,
        showSendMessages:true,
        showSendEmailMessages:true,
        updatedAt:true,
        authentification2FA:true,
        company:{select:{
          siret:true,
          siren:true,
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
          createdAt:true,
          updatedAt:true,
          service:{select:{name:true,id:true}},
          gallery:{select:{url:true}}
        }}
      }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
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

  /**
   * 2) Notification : un utilisateur A a envoyé un message à l’utilisateur B.
   * @param recipientEmail Adresse email de l’utilisateur B (qui reçoit le message)
   * @param senderName Nom de l’utilisateur A (expéditeur)
   * @param messageContenu Contenu du message envoyé
   */
  public async sendUserMessageNotification(
    recipientEmail: string,
    senderName: string,
    messageContenu: string,
  ) {
    let htmlTemplate = this.loadTemplate('notify-user-message.html');
    htmlTemplate = htmlTemplate
      .replace(/{{SENDER_NAME}}/g, senderName)
      .replace(/{{MESSAGE_CONTENT}}/g, messageContenu);
    htmlTemplate = htmlTemplate.replace(/{{FRONTEND_LINK}}/g, process.env.FRONT_END_URL);
    const subject = `Vous avez reçu un message de ${senderName}`;
    await this.sendRawEmail(recipientEmail, subject, htmlTemplate);
  }

  public async sendAccountChangeCode(data:ChangeAccountDto,userId:number) {
    try {
      const user =await this.prisma.user.findUnique({where:{id:userId},select:{email:true}})
      await this.sendAccountChangeCodeByEmail(data,user.email)
    } catch (error) {
      console.error('Erreur lors de l’envoi du code de changement de compte :', error);
      throw new ConflictException('Une erreur est survenue lors de l’envoi du code de changement de compte');
    }
  }

  public async sendAccountChangeCodeByEmail(data:ChangeAccountDto,email:string) {
    
    try {
      const code = this.generateCode()
      await this.storeVerificationCode(email,code)
      let htmlTemplate = this.loadTemplate('change-account-code.html');

      // Traduction du type en texte français plus lisible
      const typeMap = {
        securiteEmail: 'changement d’adresse email',
        securitePhone: 'changement de numéro de téléphone',
        securitepassword: 'changement de mot de passe',
        securite2FA: 'activation/désactivation de la 2FA',
      };
      const actionText = typeMap[data.type] || 'modification de votre compte';

      htmlTemplate = htmlTemplate
        .replace(/{{ACTION_TEXT}}/g, actionText)
        .replace(/{{CODE}}/g, code);
      htmlTemplate = htmlTemplate.replace(/{{FRONTEND_LINK}}/g, process.env.FRONT_END_URL);
      const subject = `Code de vérification pour ${actionText}`;
      await this.sendRawEmail(email, subject, htmlTemplate);
    } catch (error) {
      console.error('Erreur lors de l’envoi du code de changement de compte :', error);
      throw new ConflictException('Une erreur est survenue lors de l’envoi du code de changement de compte');
    }
  }
  

  private async storeVerificationCode(email: string, code: string) {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 15); // Code expires after 15 minutes

    await this.prisma.verificationCode.upsert({
      create: {
        email,
        code,
        type:'securite',
        expiresAt: expirationTime,
      },
      update: {
        code,
        expiresAt: expirationTime,
      },
      where: {
        email_type_code:{email,type:'securite',code:code}
      },
    });
  }

  async verifyCode(email: string, inputCode: string) {
      try{
        const verificationRecord = await this.prisma.verificationCode.findFirst({
          where: { email:email ,type:'securite' ,code:inputCode}
        });
        await this.prisma.verificationCode.deleteMany({
          where: { email: email,type:'securite' ,code:inputCode},
        });
  
        if (!verificationRecord) {
          throw new Error();
        }
  
        if (new Date() > new Date(verificationRecord.expiresAt)) {
          throw new Error();
        }
  
        const CodeToken = await this.jwt.signAsync(
          { value:email },
          {
            expiresIn: '30m',
            secret: process.env.JWT_SECRET_SETTING,
          },
        );
  
      return {token:CodeToken};
    }catch(e){
      console.error('Error verifying code:', e);
      throw new BadRequestException('Échec de la vérification du code');
    }
  }

  async getProServices(){
    try{
      return await this.prisma.serviceDeProfessionnel.findMany();
    }catch(e){
      console.error('Error verifying code:', e);
      throw new BadRequestException('Échec de la vérification du code');
    }
  }

  async reqProCompte(userId:number,siretData:string,files: { kbis?: myFile; 
    //id?: myFile; address?: myFile 
  }){
    try{
        const res = await fetch(`https://data.siren-api.fr/v3/etablissements/${siretData}`, {
          headers: {
            'X-Client-Secret': process.env.SIREN_API_KEY,
          },
        });

        if (!res.ok) {
          throw new Error();
        }

        const siret = (await res.json()).etablissement;
       await this.prisma.user.update({where:{id:userId,userType:'INDIVIDUAL'},
        data:{
          userType:'Waiting',
          company:{ create: { siret: siretData,name:siret.unite_legale.denomination,address:`${siret.numero_voie ?? ''} ${siret.type_voie ?? ''} ${siret.libelle_voie ?? ''}, ${siret.code_postal ?? ''} ${siret.libelle_commune ?? ''}`.trim()
                ,code_commun:siret.code_postal,siren:siret.unite_legale.siren } },
          files:{create:{content:files.kbis?.buffer, name:'kbis'}}
        }})
        return;
    }catch(e){
      console.error('Error create req pro:', e);
      throw new BadRequestException('Échec de create req pro');
    }
  }
//?---------------------------filter
private async resolveLocationNames(location:locations[]): Promise<any[]> {
  return Promise.all(location.map(async loc => {
    switch (loc.type) {
      case 'region':
        const region = await this.prisma.region.findUnique({ where: { id: loc.id } });
        return { ...loc, name: region?.name || `Region ${loc.id}` };
      case 'department':
        const dept = await this.prisma.department.findUnique({ where: { id: loc.id } });
        return { ...loc, name: dept?.name || `Department ${loc.id}` };
      case 'city':
        const city = await this.prisma.city.findUnique({ where: { id: loc.id } });
        return { ...loc, name: city?.name || `City ${loc.id}` };
      default:
        return loc;
    }
  }))
}

private async resolveTypeBrands(typeFilter: type): Promise<any> {
  const type = await this.prisma.type?.findUnique({
    where: { id: typeFilter?.id },
    include: { category: true }
  });

  const result: any = {
    id: typeFilter?.id,
    name: type?.name || `Type ${typeFilter?.id}`,
    category: type?.category?.name || ''
  };

  if (typeFilter?.brand?.length) {
    result.brands = await Promise.all(typeFilter?.brand.map(async b => {
      const brand = await this.prisma.brand.findUnique({ where: { id: b.id } });
      const brandData: any = {
        id: b.id,
        name: brand?.name || `Brand ${b.id}`
      };

      if (b.modeles?.length) {
        const models = await this.prisma.model.findMany({
          where: { id: { in: b.modeles } }
        });
        brandData.models = models.map(m => ({
          id: m.id,
          name: m.name
        }));
      }
      return brandData;
    }));
  }
  return result;
}

private async resolveAttributeNames(attributes: AdAttributeFilterDto[]): Promise<any[]> {
  return Promise.all(attributes.map(async attr => {
    const attribute = await this.prisma.attribute.findUnique({
      where: { id: attr.attributeId },
      include: { options: true }
    });

    const attrData: any = {
      id: attr.attributeId,
      name: attribute?.name || `Attribute ${attr.attributeId}`,
      unit: attribute?.unit || null // Include unit for display purposes
    };

    // Handle different value types
    if (Array.isArray(attr.value)) {
      // Handle array of option IDs
      const options = attribute?.options.filter(o => 
        Array.isArray(attr.value) && attr.value.includes(o.id)
      ) || [];
      attrData.value = options.map(o => o.value);
    } else if (attr.value && typeof attr.value === 'object' && 'min' in attr.value && 'max' in attr.value) {
      // Handle min/max range object
      attrData.value = {
        min: attr.value.min,
        max: attr.value.max
      };
    } else {
      // Fallback for unexpected types
      attrData.value = attr.value;
    }

    return attrData;
  }));
}

async saveFilter(userId: number, filter: filterDto, notify: boolean) {
  try {
    // Create human-readable filter
    const filterString: any = {};
    
    if (filter?.search) filterString.search = filter?.search;
    if (filter?.minPrice) filterString.minPrice = filter?.minPrice;
    if (filter?.maxPrice) filterString.maxPrice = filter?.maxPrice;
    if (filter?.typeAd) filterString.typeAd = filter?.typeAd;
    if (filter?.tri) filterString.tri = filter?.tri;

    // Resolve location names
    if (filter?.locationIds?.length) {
      filterString.locations = await this.resolveLocationNames(filter?.locationIds);
    }

    // Resolve type/brand/model names
    if (filter?.type) {
      filterString.type = await this.resolveTypeBrands(filter?.type);
    }

    // Resolve attribute names
    if (filter?.attributes?.length) {
      filterString.attributes = await this.resolveAttributeNames(filter?.attributes);
    }

    return await this.prisma.savedSearch.create({
      data: {
        user: { connect: { id: userId } },
        filter: filter as any,  // Original filter with IDs
        filterString: filterString as any, // Human-readable version
        notify
      }
    });
  } catch (error) {
    console.error('Error saving filter:', error);
    throw new BadRequestException('Failed to save filter');
  }
}

  async getUserFilters(userId: number,skip:number,take:number) {
    try {
      const filters = await this.prisma.savedSearch.findMany({
        where: { userId },
        select: {
          id: true,
          filter: true,
          filterString:true,
          createdAt: true,
          notify: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      });
      const totalCount = await this.prisma.savedSearch.count({
        where: { userId },
      });
      return filters.map(f => ({
        ...f,
        totalCount,
        filter: typeof f.filter === 'string' ? JSON.parse(f.filter) : f.filter,
        filterString:typeof f.filterString === 'string' ? JSON.parse(f.filterString) : f.filterString,
      }));
    } catch (error) {
      console.error('Error fetching user filters:', error);
      throw new BadRequestException('Failed to fetch user filters');
    }
  }

  async updateFilterNotify(userId: number, filterId: number, notify: boolean) {
    try {
      const filter = await this.prisma.savedSearch.findUnique({
        where: { id: filterId },
        select: { userId: true },
      });
      if (!filter || filter?.userId !== userId) {
        throw new NotFoundException('Filter not found');
      }
      return await this.prisma.savedSearch.update({
        where: { id: filterId },
        data: { notify },
        select: {
          id: true,
          filter: true,
          createdAt: true,
          notify: true,
        },
      });
    } catch (error) {
      console.error('Error updating filter notify:', error);
      throw new BadRequestException('Failed to update filter notify');
    }
  }

  async deleteFilter(userId: number, filterId: number) {
    try {
      const filter = await this.prisma.savedSearch.findUnique({
        where: { id: filterId },
        select: { userId: true },
      });
      if (!filter || filter?.userId !== userId) {
        throw new NotFoundException('Filter not found');
      }
      await this.prisma.savedSearch.delete({
        where: { id: filterId },
      });
      return { message: 'Filter deleted successfully' };
    } catch (error) {
      console.error('Error deleting filter:', error);
      throw new BadRequestException('Failed to delete filter');
    }
  }

  async checkNewAdsAgainstSearches(newAd: CreateAdsDto,ad:any) {
    const matchingSearchesEmails = await this.findMatchingSearches(newAd,ad.department.id,ad.region.id);
    
    for (const email of matchingSearchesEmails) {
      await this.sendNewAdNotification(email, ad);
    }
    //console.log(matchingSearchesEmails)
  }

  private async findMatchingSearches(ad: CreateAdsDto,departmentId:number,regionId:number) {
    // Get all active saved searches
    const searches = await this.prisma.savedSearch.findMany({
      where: { notify: true },
      select:{filter:true,user:{select:{email:true}}}
    });

    const uniqueEmails = new Set<string>();
    return searches
      .filter(search => {
      const filterObj = typeof search.filter === 'string' ? JSON.parse(search.filter) : search.filter;
      const email = search.user?.email;
      if (!email || uniqueEmails.has(email)) return false;
      const matches = this.matchesFilter(ad, filterObj,departmentId,regionId);
      if (matches) uniqueEmails.add(email);
      return matches;
      })
      .map(search => search.user.email);
  }

  private matchesFilter(ad: CreateAdsDto, filter: filterDto,departmentId:number,regionId:number): boolean {

    // 2. Check price range
    //console.log('min',ad.price , filter?.minPrice)
    if (filter?.minPrice && ad.price < filter?.minPrice) return false;
    //console.log('max',ad.price , filter?.maxPrice)
    if (filter?.maxPrice && ad.price > filter?.maxPrice) return false;

    // 3. Check location
    if (filter?.locationIds && filter?.locationIds.length > 0) {
      const locationMatch = filter?.locationIds.some(loc => {
        //console.log('location',loc.type , loc.id , ad.locationId,departmentId,regionId)
        if (loc.type === 'city' && loc.id === ad.locationId) return true;
        if (loc.type === 'department' && loc.id === departmentId) return true;
        if (loc.type === 'region' && loc.id === regionId) return true;
        return false;
      });
      
      if (!locationMatch) return false;
    }

    // 4. Check type
    //console.log('type',ad.typeId , filter?.type?.id)
    if (filter?.type?.id && ad.typeId !== filter?.type?.id) return false;

    // 5. Check brand and model
    //console.log('brand',ad.brandId , filter?.type?.brand)
    if (filter?.type?.brand && filter?.type?.brand?.length > 0) {
      //console.log('brand',ad.brandId , filter?.type?.brand)
      if (!ad.brandId) return false;
      
      const brandMatch = filter?.type?.brand.some(b => b.id === ad.brandId);
      //console.log('brandmatch',brandMatch, filter?.type?.brand)
      if (!brandMatch) return false;

      if (ad.modelId) {
        const brandFilter = filter?.type?.brand.find(b => b.id === ad.brandId);
        //console.log('modeles',brandFilter?.modeles,ad.modelId)
        if (brandFilter?.modeles && brandFilter?.modeles.length > 0) {
          if (!brandFilter?.modeles.includes(ad.modelId)) return false;
        }
      }
    }

    // 6. Check attributes (refactored)
  if (filter?.attributes && filter?.attributes?.length > 0 &&ad?.attributes&&ad.attributes.length>0) {
    for (const filterAttr of filter?.attributes) {
      const adAttr = ad.attributes?.find(a => a.attributeId === filterAttr.attributeId);
      
      if (!adAttr) return false;

      if (Array.isArray(filterAttr.value)) {
        const adValues = Array.isArray(adAttr.value) ? adAttr.value : [adAttr.value];
        const hasMatch = filterAttr.value.some(filterVal => 
          adValues.includes(filterVal)
        );
        if (!hasMatch) return false;
        
      } else if (typeof filterAttr.value === 'object' && 'min' in filterAttr.value && 'max' in filterAttr.value) {
        if (typeof adAttr.value !== 'number') return false;
        
        const { min, max } = filterAttr.value;
        if (min !== undefined && adAttr.value < min) return false;
        if (max !== undefined && adAttr.value > max) return false;
      }
    }
  }

    return true;
  }

  private async sendNewAdNotification(email: string, ad: any) {
    try {
        // Load HTML template
        let htmlTemplate = this.loadTemplate('new-ad-notification.html');
        
        // Prepare attributes array
        const attributes = ad.attributes.map(attr => {
            const value = attr.option ? attr.option.value : attr.value;
            return {
                NAME: attr.attribute.name,
                VALUE: value,
                UNIT: attr.attribute.unit ? ` ${attr.attribute.unit}` : ''
            };
        });
        
        // Prepare replacements
        const formatPrice = (price: number) => {
            // Format price with a space every 3 digits (e.g., 1234567 => "1 234 567")
            return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        };

        const replacements = {
            USER_NAME: 'Utilisateur',
            AD_TITLE: ad.title,
            AD_PRICE: formatPrice(ad.price),
            AD_CITY: ad.city.name,
            AD_DEPARTMENT: ad.department.name,
            AD_REGION: ad.region.name,
            AD_CATEGORY: ad.category.name,
            AD_TYPE: ad.type?.name || '',
            AD_BRAND: ad.brand?.name || '',
            AD_MODEL: ad.model?.name || '',
            AD_IMAGE_URL: ad.media[0]?.media.url || 'https://via.placeholder.com/600x400?text=No+Image',
            AD_LINK: `${process.env.FRONT_END_URL}/ad/${ad.id}`,
            UNSUBSCRIBE_LINK: `${process.env.FRONT_END_URL}/compte/saved-filters`
        };
        
        htmlTemplate = htmlTemplate.replace(/{{FRONTEND_LINK}}/g, process.env.FRONT_END_URL);
        
        // Handle conditional brand block
        if (!replacements.AD_BRAND) {
            htmlTemplate = htmlTemplate.replace(/{{#AD_BRAND}}[\s\S]*?{{\/AD_BRAND}}/g, '');
        } else {
            htmlTemplate = htmlTemplate.replace(/{{#AD_BRAND}}/g, '');
            htmlTemplate = htmlTemplate.replace(/{{\/AD_BRAND}}/g, '');
        }
        
        // Handle conditional model block
        if (!replacements.AD_MODEL) {
            htmlTemplate = htmlTemplate.replace(/{{#AD_MODEL}}[\s\S]*?{{\/AD_MODEL}}/g, '');
        } else {
            htmlTemplate = htmlTemplate.replace(/{{#AD_MODEL}}/g, '');
            htmlTemplate = htmlTemplate.replace(/{{\/AD_MODEL}}/g, '');
        }
        
        // Handle dynamic attributes table
        if (attributes.length > 0) {
            const attributesHtml = attributes.map(attr => 
                `<tr>
                    <td class="attribute-name">${attr.NAME}</td>
                    <td class="attribute-value">${attr.VALUE}${attr.UNIT}</td>
                </tr>`
            ).join('');
            
            htmlTemplate = htmlTemplate.replace(
                /{{#AD_ATTRIBUTES}}[\s\S]*?{{\/AD_ATTRIBUTES}}/,
                `<table class="attributes-table">${attributesHtml}</table>`
            );
        } else {
            htmlTemplate = htmlTemplate.replace(/{{#AD_ATTRIBUTES}}[\s\S]*?{{\/AD_ATTRIBUTES}}/g, '');
        }
        
        // Apply simple replacements
        Object.entries(replacements).forEach(([key, value]) => {
            if (typeof value === 'string' || typeof value === 'number') {
                const regex = new RegExp(`{{${key}}}`, 'g');
                htmlTemplate = htmlTemplate.replace(regex, `${value}`);
            }
        });
        
        // Send email
        const subject = `Nouvelle annonce: ${ad.title}`;
        await this.sendRawEmail(email, subject, htmlTemplate);
    } catch (error) {
        console.error('Error sending notification email:', error);
    }
  }
}
