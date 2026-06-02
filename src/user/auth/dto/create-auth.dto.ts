import { IsAscii, IsEmail, IsJWT, IsNotEmpty, IsNumberString, IsOptional, IsString, Length, Matches, Max } from "class-validator";

export class PasswordDto {
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,30}$/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
  })
  password: string;
}

export class UsernameDto {
  @Matches(/^[a-zA-Z][a-zA-Z0-9_-]{2,40}$/, {
    message:
      'Le nom d’utilisateur doit commencer par une lettre, contenir entre 3 et 40 caractères, et uniquement des lettres, chiffres, tirets (-) ou underscores (_)',
  })
  identifier: string;
}

export class AuthDtoEmail extends PasswordDto {
    @IsEmail()
    identifier: string;
}
export class AuthDtoPhone extends PasswordDto {
    @Matches(/^\+\d{11}$/, { message: 'phone must start with + and contain 11 digits' })
    identifier: string;
}

export class AuthDto extends PasswordDto {
    @Matches(/^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/, {
      message:
        'Le nom d’utilisateur doit commencer par une lettre, contenir entre 3 et 20 caractères, et uniquement des lettres, chiffres, tirets (-) ou underscores (_)',
    })
    identifier: string;
}

export class companyDto {
    @Length(14)
    @IsNumberString()
    siret: string;
}

export class reqRestPassword {
    @IsEmail()
    email: string;
}

export class restPassword extends PasswordDto{
    @IsJWT()
    token: string;
}

export class UserDto extends PasswordDto {

    @IsOptional()
    company: companyDto;

    @Matches(/^[a-zA-Z][a-zA-Z0-9_-]{2,40}$/, {
      message:
        'Le nom d’utilisateur doit commencer par une lettre, contenir entre 3 et 40 caractères, et uniquement des lettres, chiffres, tirets (-) ou underscores (_)',
    })
    username: string;
    
    @Length(3, 30, {
    message: 'Le nom complet doit contenir entre 7 et 60 caractères',
    })
    @Matches(/^[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)* ?# ?[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*$/, {
        message:
        'Le nom complet doit contenir uniquement des lettres, séparées par un # (ex: Jean # Dupont)',
    })
    fullName :   string
    
    @IsNotEmpty()    
    userType: 'INDIVIDUAL'|'PROFESSIONAL'
 
    @IsJWT()
    emailtoken: string;

    @Matches(/^\+\d{11}$/, { message: 'phone must start with + and contain 11 digits' })
    phone: string;
    
    //@IsJWT()
   // phonetoken: string;
}

export class SendCodeDto {
    @IsEmail()
    email: string;
  }

export class SendCodeDtoPhone {

    @Matches(/^\+\d{11}$/, { message: 'phone must start with + and contain 11 digits' })
    phone: string;
}

export class verifyCodeDto {
    @IsEmail()
    email: string;

    @IsNumberString()
    @Length(6, 6)
    code: string;
  }

export class verifyCodeDtoPhone {
    @Matches(/^\+\d{11}$/, { message: 'phone must start with + and contain 11 digits' })
    phone: string;

    @IsNumberString()
    @Length(6, 6)
    code: string;
  }