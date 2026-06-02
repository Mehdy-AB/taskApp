import { Controller, Post, Param,BadRequestException, NotFoundException, Get, Query, ParseIntPipe, Body } from '@nestjs/common';
import { GhostService } from './ghost.service';
import { CreateContactDto, filterDto } from './dto/ghost.dto';


@Controller('ghost')

export class GhostController {
  constructor(private readonly GhostService: GhostService) {}

  @Get('getAllCategories')
  async getAllCategories() {
    try {
      return await this.GhostService.getAllCategories();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('getCategoryByname/:name')
  async getCategoryByname(@Param('name') name: string) {
    try {
      return await this.GhostService.getCategoryByname(name);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('getCategoryByid/:id')
  async getCategoryById(@Param('id',ParseIntPipe) id: number) {
    try {
      return await this.GhostService.getCategoryId(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('gettypeAndCategoryByName/:name')
  async gettypeAndCategoryByName(@Param('name') name: string) {
    try {
      return await this.GhostService.gettypeAndCategoryByName(name);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('gettypeByName/:name')
  async gettypeByName(@Param('name') name: string) {
    try {
      return await this.GhostService.gettypeByName(name);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('gettypeById/:id')
  async gettypeById(@Param('id',ParseIntPipe) id: number) {
    try {
      return await this.GhostService.gettypeById(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('getBrandByName/:name')
  async getBrandByName(@Param('name') name: string[]) {
    try {
      return await this.GhostService.getBrandByName(name);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('getBrandById/:id')
  async getBrandById(@Param('id') id: string) {
    const ids = id.split(',').map((id) => {
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        throw new BadRequestException(`Invalid ID: ${id}`);
      }
      return parsedId;
    });
    try {
      return await this.GhostService.getBrandById(ids);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('getattributesType/:id')
  async getattributesType(@Param('id',ParseIntPipe) id: number) {
    try {
      return await this.GhostService.getattributesType(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  
  @Get('getLocations/:name')
  async getLocations(@Param('name') name: string) {
    try {
      return await this.GhostService.getLocationbyName(name);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('getregions')
  async getRegions() {
    return await this.GhostService.getRegion();
  }

  @Post('sendContactEmail')
  async sendContactEmail(@Body() body: CreateContactDto,@Query('userId', ParseIntPipe) userId:number) {
    await this.GhostService.sendContactEmail(body,userId);
    return {success: true, message: 'Message envoyé avec succès' };
  }

  @Get('getDepartments/:id')
  async getDepartments(@Param('id',ParseIntPipe) id: number) {
    return await this.GhostService.getDepartment(id);
  }

  @Get('getCities/:id')
  async getCities(@Param('id',ParseIntPipe) id: number) {
    return await this.GhostService.getCity(id);
  }

  @Get('getOneCity/:id')
  async getOneCity(@Param('id',ParseIntPipe) id: number) {
    return await this.GhostService.getOneCity(id);
  }
  
  @Get('user/:id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return await this.GhostService.getUser(id);
  }

  @Get('getUserFollowers/:id')
  async getUserFollowers(@Param('id', ParseIntPipe) id: number,@Query('take',ParseIntPipe) take: number, @Query('skip',ParseIntPipe) skip: number) {
    return await this.GhostService.getFollowers(id,take, skip);
  }

  @Get('getUserFollowing/:id')
  async getUserFollowing(@Param('id', ParseIntPipe) id: number,@Query('take',ParseIntPipe) take: number, @Query('skip',ParseIntPipe) skip: number) {
    return await this.GhostService.getFollowing(id,take, skip);
  }

  @Post('getUserAds/:id')
  async getUserAds(@Body() filter: filterDto,@Param('id', ParseIntPipe) id: number,@Query('take',ParseIntPipe) take: number, @Query('skip',ParseIntPipe) skip: number) {
    return await this.GhostService.getAdsByUserId(filter,id,take, skip);
  }

  @Get('getAds/:id')
  async getAds(@Param('id') id: string) {
    const ids = id.split(',').map((item) => {
      const parsed = parseInt(item, 10);
      if (isNaN(parsed)) {
        throw new BadRequestException(`Invalid ID: ${item}`);
      }
      return parsed;
    });
    return await this.GhostService.getAdsByIds(ids);
  }

  @Get('populaires')
  async populaires(@Query('take',ParseIntPipe) take: number) {
    return await this.GhostService.populaires(take);
  }

  @Get('dernieres')
  async dernieres(@Query('take',ParseIntPipe) take: number) {
    return await this.GhostService.dernieres(take);
  }

  @Get('getimmo')
  async getimmo(@Query('take',ParseIntPipe) take: number) {
    return await this.GhostService.getimmo(take);
  }

  @Get('getvehicules')
  async getvehicules(@Query('take',ParseIntPipe) take: number) {
    return await this.GhostService.getvehicules(take);
  }

  @Get('getAd/:id')
  async getUserAd(@Param('id', ParseIntPipe) id: number) {
    return await this.GhostService.getAdById(id);
  }

  @Post('searchAds')
  async searchAds(@Body() filter: filterDto,@Query('take',ParseIntPipe) take: number, @Query('skip',ParseIntPipe) skip: number) {
    return await this.GhostService.getAdsByFilter(filter,take,skip);
  }
}