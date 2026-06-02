import { IsString, IsNumber, IsArray, IsOptional,  Min, Max, IsNotEmpty, IsEmail, IsNumberString, Matches, Length, MinLength, IsEnum } from 'class-validator';

class locations{
  @IsNumber()
  @Min(0)
  id?: number;

  @IsNotEmpty()
  type: 'region' | 'city' | 'department' ;
}

export class CreateContactDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @Matches(/^\+\d{11}$/, { message: 'phone must start with + and contain 12 digits' })
  phone: string;

  @IsOptional()
  subject?: string;

  @MinLength(20)
  @IsString()
  message: string;
}

 class AdAttributeDto {
  @IsNotEmpty()
  @IsNumber()
  attributeId           : number
  @IsNotEmpty()
  value                 : number[]|{max:number, min:number}
}

class type {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  id: number;

  @IsOptional()
  brand: brand[];
}

class brand {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  id: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  modeles: number[];
}

export class filterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(["tout","Particuliers","Professionnels"])
  typeAd?:"tout"|"Particuliers"|"Professionnels"

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  locationIds?: locations[];

  @IsOptional()
  type?: type;

  @IsOptional()
  @IsArray()
  attributes?: AdAttributeDto[];
  
  @IsOptional()
  @IsString()
  tri?: 'plus recent' | 'plus cher' | 'moins cher' | 'plus ancien' 

}