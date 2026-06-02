import {  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEmail, IsEnum, IsInt, IsJWT, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, IsUrl, Length, Matches, Max, MaxLength, Min, MinLength } from "class-validator"

export class AdAttributeFilterDto {
  @IsNotEmpty()
  @IsNumber()
  attributeId           : number
  @IsNotEmpty()
  value                 : number[]|{max:number, min:number}
}

export class AdAttributeDto {
  @IsNotEmpty()
  @IsNumber()
  attributeId           : number
  @IsNotEmpty()
  value                 : number[]|number
}

export class RepportDto {
    @IsNotEmpty()
    @IsNumber()
    adId: number;

    @IsNotEmpty()
    @IsString()
    reason: string;

    @IsOptional()
    @IsString()
    message?: string;
}


export class ChangeAccountDto {
  @IsNotEmpty()
  type: 'securiteEmail' | 'securitePhone' | 'securite2FA' | 'securitepassword';
}

export class verifyCode {
  @IsEmail()
  email: string;

  @Length(6)
  @IsNumberString()
  input:string
}


export class CreateAdsDto {
    @IsNotEmpty()
    title       : string

    @IsOptional()
    description : string

    @Matches(/^https:\/\/res\.cloudinary\.com\/du6pu6foq\/image\//, {
      each: true,
      message: 'Chaque URL doit commencer par le lien Cloudinary autorisé',
    })
    @ArrayMinSize(1)
    @ArrayMaxSize(15)
    images: string[]
    
    @IsOptional()
    @Matches(/^https:\/\/res\.cloudinary\.com\/du6pu6foq\/image\//, {
      each: true,
      message: 'Chaque URL doit commencer par le lien Cloudinary autorisé',
    })
    @ArrayMaxSize(3)
    historique: string[]

    @IsOptional()
    @Matches(/^https:\/\/res\.cloudinary\.com\/du6pu6foq\/video\//, {
      each: true,
      message: ' URL doit commencer par le lien Cloudinary autorisé',
    })
    video: string

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    price       : number

    @IsNotEmpty()
    status      : 'Active'| "Brouillon"

    @IsOptional()
    attributes  : AdAttributeDto[]

    @IsNotEmpty()
    @IsNumber()
    categoryId  : number
    @IsNotEmpty()
    @IsNumber()
    typeId      : number  
    @IsOptional()
    @IsNumber()
    brandId     : number
    @IsOptional()
    @IsNumber()
    modelId     : number
    @IsNotEmpty()
    @IsNumber()
    locationId  : number

    @IsOptional()
    @IsBoolean()
    notifications: boolean
    @IsOptional()
    @IsBoolean()
    contactEmail: boolean
    @IsOptional()
    @IsBoolean()
    contactMessage: boolean
    @IsOptional()
    @IsBoolean()
    phoneNumber: boolean
    @IsOptional()
    @IsBoolean()
    fullName: boolean

    @IsOptional()
    @IsBoolean()
    refresh: boolean
}

export class UpdateAdsDto {
  
    @Matches(/^https:\/\/res\.cloudinary\.com\/du6pu6foq\/image\//, {
      each: true,
      message: 'Chaque URL doit commencer par le lien Cloudinary autorisé',
    })
    @ArrayMinSize(1)
    @ArrayMaxSize(15)
    images: string[]
    
    @IsOptional()
    @Matches(/^https:\/\/res\.cloudinary\.com\/du6pu6foq\/image\//, {
      each: true,
      message: 'Chaque URL doit commencer par le lien Cloudinary autorisé',
    })
    @ArrayMaxSize(3)
    historique: string[]

    @IsOptional()
    @Matches(/^https:\/\/res\.cloudinary\.com\/du6pu6foq\/video\//, {
      each: true,
      message: ' URL doit commencer par le lien Cloudinary autorisé',
    })
    video: string
    
    @IsNotEmpty()
    title       : string

    @IsOptional()
    description : string

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    price       : number

    @IsNotEmpty()
    status      : 'Active'| "Brouillon"

    @IsOptional()
    attributes  : AdAttributeDto[]

    @IsNotEmpty()
    @IsNumber()
    categoryId  : number
    @IsNotEmpty()
    @IsNumber()
    typeId      : number  
    @IsOptional()
    @IsNumber()
    brandId  ?   : number
    @IsOptional()
    @IsNumber()
    modelId  ?   : number
    @IsNotEmpty()
    @IsNumber()
    locationId  : number

    @IsOptional()
    @IsBoolean()
    notifications: boolean
    @IsOptional()
    @IsBoolean()
    contactEmail: boolean
    @IsOptional()
    @IsBoolean()
    contactMessage: boolean
    @IsOptional()
    @IsBoolean()
    phoneNumber: boolean
    @IsOptional()
    @IsBoolean()
    fullName: boolean

    @IsOptional()
    @IsBoolean()
    refresh: boolean
}

export class locations{
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  id?: number;

  @IsNotEmpty()
  type: 'region' | 'city' | 'department' ;
}

export class type {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  id: number;

  @IsOptional()
  brand: brand[];
}

export class brand {
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
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsEnum(["tout","Particuliers","Professionnels"])
  typeAd?:"tout"|"Particuliers"|"Professionnels"

  @IsOptional()
  locationIds?: locations[];

  @IsOptional()
  type?: type;

  @IsOptional()
  @IsArray()
  attributes?: AdAttributeFilterDto[];
  
  @IsOptional()
  @IsString()
  tri?: 'plus recent' | 'plus cher' | 'moins cher' | 'plus ancien' 

}

export class messageDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  reciverId: number;

  @IsOptional()
  adId?: number;

  @IsNotEmpty()
  @IsString()
  @Min(1)
  content: string;
}

export class UpdateNotificationsDto {
  @IsOptional() @IsBoolean() email?: boolean;
  @IsOptional() @IsBoolean() sms?: boolean;
  @IsOptional() @IsBoolean() push?: boolean;
  @IsOptional() @IsBoolean() newsletter?: boolean;
}

export class UpdateCompanyDto {

  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() code_commun?: string;
  @IsOptional() @IsString() horaire?: string;
  @IsOptional() @IsUrl() website?: string;

  @IsOptional()
  @Matches(/^https:\/\/res\.cloudinary\.com\/du6pu6foq\/image\//, {
      message: 'Chaque URL doit commencer par le lien Cloudinary autorisé',
  })
  image?: string

  @IsOptional()
  @Matches(/^https:\/\/res\.cloudinary\.com\/du6pu6foq\/image\//, {
      each: true,
      message: 'Chaque URL doit commencer par le lien Cloudinary autorisé',
    })
  @ArrayMaxSize(10)
  images?: string[]

  @IsOptional()
  @IsInt({each:true})
  @Min(0,{each:true})
  services?: number[]
  
  @IsOptional()
  @IsUrl({}, { message: 'URL Instagram invalide' })
  @Matches(/^https?:\/\/(www\.)?instagram\.com\/.+$/, {
    message: 'L’URL doit être une page Instagram valide',
  })
  instagram?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL Facebook invalide' })
  @Matches(/^https?:\/\/(www\.)?facebook\.com\/.+$/, {
    message: 'L’URL doit être une page Facebook valide',
  })
  facebook?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL Twitter invalide' })
  @Matches(/^https?:\/\/(www\.)?twitter\.com\/.+$/, {
    message: 'L’URL doit être une page Twitter valide',
  })
  twitter?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL LinkedIn invalide' })
  @Matches(/^https?:\/\/(www\.)?linkedin\.com\/.+$/, {
    message: 'L’URL doit être une page LinkedIn valide',
  })
  linkedin?: string;
}

export class UpdatePasswordDto {
  @IsJWT()
  token:string

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,30}$/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
  })
  newPassword: string;
}

export class UpdateEmailDto {
  @IsNumberString()
  @Length(6)
  input:string

  @IsEmail()
  email:string
}

export class UpdatePhoneDto {
  @IsNumberString()
  @Length(6)
  input:string

  @Matches(/^\+\d{11}$/, { message: 'phone must start with + and contain 11 digits' })
  phone: string;
}

export class SendUpdateEmailDto {
  @IsNotEmpty()
  @IsJWT()
  token:string

  @IsEmail()
  email:string
}

export class SendUpdatePhoneDto {
  @IsNotEmpty()
  @IsJWT()
  token:string

  @Matches(/^\+\d{11}$/, { message: 'phone must start with + and contain 11 digits' })
  phone:string
}

export class Update2FADto {
  @IsNotEmpty()
  @IsJWT()
  token:string

  @IsBoolean()
  _2fa:boolean
}

export class UpdateUserDto {

  @IsOptional()
  @Length(3, 30, {
    message: 'Le nom complet doit contenir entre 7 et 60 caractères',
  })
  @Matches(/^[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)* ?# ?[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*$/, {
        message:
        'Le nom complet doit contenir uniquement des lettres, séparées par un # (ex: Jean # Dupont)',
  })
  fullName?: string;

  @IsOptional()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_-]{2,40}$/, {
    message:
      'Le nom d’utilisateur doit commencer par une lettre, contenir entre 3 et 40 caractères, et uniquement des lettres, chiffres, tirets (-) ou underscores (_)',
  })
  username?: string;

  @IsOptional()
  @Matches(/^https:\/\/res\.cloudinary\.com\/du6pu6foq\/image\//, {
      message: 'Chaque URL doit commencer par le lien Cloudinary autorisé',
  })
  image?: string

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsBoolean()
  showFullName?: boolean;

  @IsOptional()
  @IsBoolean()
  showPhone?: boolean;

  @IsOptional()
  @IsBoolean()
  showSendMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  showSendEmailMessages?: boolean;
}